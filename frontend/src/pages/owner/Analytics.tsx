import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import { AiAgentPanel, AiBanner, ChartBar, StatTile } from '../../components/UI';
import { aiAssistApi } from '../../lib/api';


export default function OwnerAnalytics() {
  const nav = useNavigate();
  const toast = useToast();

  const [aiSummary, setAiSummary] = useState(
    'AI is compiling route demand, delay risk, and pricing opportunities for your sacco.'
  );
  const [aiCards, setAiCards] = useState([
    {
      type: 'Capacity Forecaster',
      icon: '📦',
      result: 'Demand forecast in progress',
      detail: 'Checking next high-pressure departures and waitlist triggers.',
      confidence: 70,
      actionLabel: 'Refresh',
      onAction: () => nav('/owner/fleet'),
      accentColor: 'var(--brand)',
    },
    {
      type: 'Delay Risk Guard',
      icon: '⏱️',
      result: 'Assessing route risk',
      detail: 'Reviewing weather and traffic risk for upcoming departures.',
      confidence: 68,
      actionLabel: 'Recalculate',
      onAction: () => nav('/owner/bookings'),
      accentColor: '#ef4444',
    },
    {
      type: 'Fare Optimizer',
      icon: '💰',
      result: 'Model warming up',
      detail: 'Preparing autonomous fare adjustment recommendation.',
      confidence: 66,
      actionLabel: 'Re-run model',
      onAction: () => nav('/owner/payments'),
      accentColor: '#f59e0b',
    },
  ]);

  useEffect(() => {
    let alive = true;

    const hydrateAssist = async () => {
      try {
        const response = await aiAssistApi({
          prompt: 'Generate concise owner analytics actions for dispatch, risk, and pricing.',
          language: 'en',
          route: 'Nairobi-Nakuru',
          departureTime: '14:00',
          currentPrice: 900,
          totalSeats: 49,
          bookedSeats: 43,
          noShowRate: 0.1,
          riskFactors: {
            weatherRisk: 0.31,
            trafficRisk: 0.55,
            routeRisk: 0.38,
          },
          fraudSignals: {
            attemptsLast24h: 2,
            cardMismatch: false,
            rapidRetries: 1,
            geoMismatch: false,
          },
          trips: [
            { id: 'nbi-nkr-0800', route: 'Nairobi-Nakuru', price: 850, travelMinutes: 130, reliabilityScore: 0.92 },
            { id: 'nbi-nkr-1400', route: 'Nairobi-Nakuru', price: 900, travelMinutes: 140, reliabilityScore: 0.88 },
            { id: 'nbi-ksm-0900', route: 'Nairobi-Kisumu', price: 1450, travelMinutes: 350, reliabilityScore: 0.81 },
          ],
          intent: {
            maxBudget: 1000,
            maxTravelMinutes: 180,
          },
        });

        if (!alive) return;

        const modules = response.data.modules;
        setAiSummary(response.data.summary.passengerMessage || 'AI owner summary ready.');
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
            result: `KES ${modules.pricing.currentPrice.toFixed(0)} → KES ${modules.pricing.predictedPrice.toFixed(0)}`,
            detail: `Demand ${modules.pricing.demandLevel}. Best window: ${modules.pricing.cheaperWindowSuggestion}.`,
            confidence: Math.round((modules.pricing.confidence || 0) * 100),
            actionLabel: 'Apply pricing change',
            onAction: () => nav('/owner/payments'),
            accentColor: '#f59e0b',
          },
        ]);
      } catch {
        if (!alive) return;
        setAiSummary('Live AI service unavailable. Showing owner fallback analytics from local trend model.');
      }
    };

    void hydrateAssist();
    return () => {
      alive = false;
    };
  }, [nav]);

  return (
    <DashboardLayout title="Analytics" subtitle="Performance insights"
      actions={<button className="btn btn-primary btn-sm" onClick={()=>toast('AI analytics refreshed')}>Refresh AI</button>}>
      <AiBanner text={`<strong>AI Insight:</strong> ${aiSummary}`} />

      <div style={{ margin: '16px 0 24px' }}>
        <AiAgentPanel
          title="Owner Autonomous Analytics"
          subtitle="AI dispatch, delay, and pricing decisions for next departures"
          cards={aiCards}
          cols={3}
        />
      </div>

      <div className="stat-grid mb-6">
        <StatTile label="Trips this week" value="41" sub="+6 vs last week" />
        <StatTile label="Avg occupancy" value="84%" sub="High load factor" />
        <StatTile label="Revenue (7d)" value="KES 386K" sub="Net after commission" />
        <StatTile label="Delay incidents" value="3" sub="-2 vs previous week" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Route performance (last 7 days)</div>
          {[['Nairobi→Nakuru', 92, '1,146 pax'], ['Nairobi→Kisumu', 73, '738 pax'], ['Nairobi→Mombasa', 69, '661 pax'], ['Nairobi→Eldoret', 58, '512 pax']].map(([route, pct, val]) => (
            <ChartBar key={route as string} label={route as string} pct={pct as number} display={`${pct}%`} val={val as string} />
          ))}
        </div>
        <div className="card">
          <div className="card-title">Revenue trend (KES)</div>
          {[['Mon', 54, '42K'], ['Tue', 61, '48K'], ['Wed', 74, '59K'], ['Thu', 80, '64K'], ['Fri', 96, '78K'], ['Sat', 89, '71K'], ['Sun', 67, '52K']].map(([day, pct, val]) => (
            <ChartBar key={day as string} label={day as string} pct={pct as number} display={val as string} val={val as string} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
