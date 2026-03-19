import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import { AiAgentPanel, AiBanner, ChartBar, StatTile } from '../../components/UI';
import { aiAssistApi, aiContextApi, type AiContextEnvelope } from '../../lib/api';

type OwnerAiCard = {
  type: string;
  icon: string;
  result: string;
  detail: string;
  confidence: number;
  actionLabel: string;
  onAction: () => void;
  accentColor: string;
};

export default function OwnerAnalytics() {
  const nav = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState('Loading AI analytics from backend data...');
  const [context, setContext] = useState<AiContextEnvelope['data'] | null>(null);
  const [aiCards, setAiCards] = useState<OwnerAiCard[]>([]);

  const defaultCards = useMemo<OwnerAiCard[]>(
    () => [
      {
        type: 'Capacity Forecaster',
        icon: '📦',
        result: 'Waiting for backend context',
        detail: 'Fetching vehicles, routes, occupancy, and fare baselines from database.',
        confidence: 0,
        actionLabel: 'Open fleet',
        onAction: () => nav('/owner/fleet'),
        accentColor: 'var(--brand)',
      },
      {
        type: 'Delay Risk Guard',
        icon: '⏱️',
        result: 'Waiting for backend context',
        detail: 'Preparing route risk scoring from live operational data.',
        confidence: 0,
        actionLabel: 'Open bookings',
        onAction: () => nav('/owner/bookings'),
        accentColor: '#ef4444',
      },
      {
        type: 'Fare Optimizer',
        icon: '💰',
        result: 'Waiting for backend context',
        detail: 'Computing dynamic pricing recommendation from current trip inventory.',
        confidence: 0,
        actionLabel: 'Open payments',
        onAction: () => nav('/owner/payments'),
        accentColor: '#f59e0b',
      },
    ],
    [nav]
  );

  const hydrateAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const contextResponse = await aiContextApi();
      const ctx = contextResponse.data;
      setContext(ctx);

      const firstRoute = ctx.routes[0];
      const firstTrip = ctx.trips[0];

      const assistResponse = await aiAssistApi({
        prompt:
          'Generate concise owner analytics actions for dispatch, delay risk, and pricing based only on provided backend context.',
        language: 'en',
        route: firstRoute?.route || firstTrip?.route || '',
        departureTime: firstTrip?.departureTime || undefined,
        currentPrice: firstTrip?.price || ctx.pricing.avgFare || 0,
        totalSeats: firstTrip?.seatCapacity || Math.max(1, Math.round((ctx.operations.totalVehicles || 1) * 45)),
        bookedSeats:
          firstTrip?.bookedSeats ||
          Math.round((ctx.operations.overallOccupancyRate || 0) * Math.max(1, Math.round((ctx.operations.totalVehicles || 1) * 45))),
        noShowRate: 0.1,
        riskFactors: {
          weatherRisk: 0.3,
          trafficRisk: 0.45,
          routeRisk: Math.min(0.8, Math.max(0.1, (ctx.operations.overallOccupancyRate || 0.4) * 0.7)),
        },
        fraudSignals: {
          attemptsLast24h: 1,
          cardMismatch: false,
          rapidRetries: 0,
          geoMismatch: false,
        },
        trips: ctx.trips.slice(0, 20).map((trip) => ({
          id: trip.id,
          route: trip.route,
          price: trip.price,
          travelMinutes: trip.travelMinutes,
          reliabilityScore: trip.reliabilityScore,
        })),
        intent: {
          maxBudget: Math.max(ctx.pricing.avgFare || 0, 1000),
          maxTravelMinutes: 300,
        },
      });

      const modules = assistResponse.data.modules;
      setAiSummary(
        `${assistResponse.data.summary.passengerMessage} Source: backend DB (${ctx.operations.totalUpcomingTrips} active trips).`
      );

      setAiCards([
        {
          type: 'Capacity Forecaster',
          icon: '📦',
          result: `Action ${modules.operations.action.replace('_', ' ')} · ${(modules.operations.occupancyRate * 100).toFixed(0)}% occupied`,
          detail: modules.operations.dispatchAdvice,
          confidence: Math.round((modules.operations.confidence || 0) * 100),
          actionLabel: 'Apply dispatch plan',
          onAction: () => nav('/owner/fleet'),
          accentColor: 'var(--brand)',
        },
        {
          type: 'Delay Risk Guard',
          icon: '⏱️',
          result: `${modules.delayRisk.riskLevel.toUpperCase()} risk · score ${(modules.delayRisk.riskScore * 100).toFixed(0)}%`,
          detail: modules.delayRisk.recommendation,
          confidence: Math.round((modules.delayRisk.confidence || 0) * 100),
          actionLabel: 'Notify passengers',
          onAction: () => nav('/owner/bookings'),
          accentColor: '#ef4444',
        },
        {
          type: 'Fare Optimizer',
          icon: '💰',
          result: `KES ${modules.pricing.currentPrice.toFixed(0)} -> KES ${modules.pricing.predictedPrice.toFixed(0)}`,
          detail: `Demand ${modules.pricing.demandLevel}. Best window: ${modules.pricing.cheaperWindowSuggestion}.`,
          confidence: Math.round((modules.pricing.confidence || 0) * 100),
          actionLabel: 'Apply pricing change',
          onAction: () => nav('/owner/payments'),
          accentColor: '#f59e0b',
        },
      ]);
    } catch (error) {
      setAiSummary('Unable to load backend AI context. Please ensure backend and database are online.');
      setAiCards(defaultCards);
      toast((error as Error).message || 'Failed to fetch owner AI analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [defaultCards, nav, toast]);

  useEffect(() => {
    void hydrateAnalytics();
  }, [hydrateAnalytics]);

  const routePerf = context?.analytics?.routePerformance || [];
  const revenueTrend = context?.analytics?.revenueTrend || [];

  const statTrips = context?.operations.totalUpcomingTrips ?? 0;
  const statOccupancy = context?.operations.overallOccupancyRate ?? 0;
  const statRevenue = revenueTrend.reduce((sum, row) => sum + row.amount, 0);
  const statVehicles = `${context?.operations.activeVehicles ?? 0}/${context?.operations.totalVehicles ?? 0}`;

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Performance insights from backend and database"
      actions={
        <button className="btn btn-primary btn-sm" onClick={() => void hydrateAnalytics()}>
          Refresh AI
        </button>
      }
    >
      <AiBanner text={`<strong>AI Insight:</strong> ${aiSummary}`} />

      <div style={{ margin: '16px 0 24px' }}>
        <AiAgentPanel
          title="Owner Autonomous Analytics"
          subtitle="AI dispatch, delay, and pricing decisions from live backend context"
          cards={aiCards.length ? aiCards : defaultCards}
          cols={3}
        />
      </div>

      <div className="stat-grid mb-6">
        <StatTile label="Upcoming trips" value={loading ? '...' : statTrips} sub="From scheduled DB trips" />
        <StatTile
          label="Avg occupancy"
          value={loading ? '...' : `${Math.round(statOccupancy * 100)}%`}
          sub="Across upcoming trips"
        />
        <StatTile
          label="Revenue (7d)"
          value={loading ? '...' : `KES ${Math.round(statRevenue).toLocaleString()}`}
          sub="Pending + confirmed bookings"
        />
        <StatTile label="Active vehicles" value={loading ? '...' : statVehicles} sub="Operational / total" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Route performance (live)</div>
          {routePerf.length === 0 && <p className="text-sm text-muted">No route performance data available.</p>}
          {routePerf.slice(0, 6).map((row) => (
            <ChartBar
              key={row.id}
              label={row.route}
              pct={Math.max(1, Math.min(100, Math.round(row.avgOccupancyRate * 100)))}
              display={`${Math.round(row.avgOccupancyRate * 100)}%`}
              val={`${row.passengerCount} pax`}
            />
          ))}
        </div>

        <div className="card">
          <div className="card-title">Revenue trend (last 7 days)</div>
          {revenueTrend.length === 0 && <p className="text-sm text-muted">No revenue trend data available.</p>}
          {revenueTrend.map((row) => {
            const maxAmount = Math.max(1, ...revenueTrend.map((x) => x.amount));
            const pct = Math.max(1, Math.round((row.amount / maxAmount) * 100));
            return (
              <ChartBar
                key={row.date}
                label={row.day}
                pct={pct}
                display={`KES ${Math.round(row.amount).toLocaleString()}`}
                val={`KES ${Math.round(row.amount).toLocaleString()}`}
              />
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
