import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { AiBanner, StatTile, ChartBar, Badge, AiAgentPanel } from '../../components/UI';
import { aiContextApi, type AiContextEnvelope } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function OwnerDashboard() {
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AiContextEnvelope['data'] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await aiContextApi();
        setContext(result.data);
      } catch (error) {
        toast((error as Error).message || 'Unable to load owner dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const routePerf = context?.analytics?.routePerformance || [];
  const upcomingTrips = context?.trips || [];

  const todayTrips = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return upcomingTrips.filter((t) => String(t.departureTime).slice(0, 10) === today).slice(0, 6);
  }, [upcomingTrips]);

  const occupancyPct = Math.round((context?.operations.overallOccupancyRate || 0) * 100);
  const revenue7d = Math.round((context?.analytics?.revenueTrend || []).reduce((sum, row) => sum + row.amount, 0));
  const primaryRoute = routePerf[0];
  const activeVehicles = context?.operations.activeVehicles ?? 0;
  const totalVehicles = context?.operations.totalVehicles ?? 0;
  const topRouteLabel = primaryRoute?.route || context?.routes[0]?.route || 'No active route data';

  const aiCards = [
    {
      type: 'Dispatch Planner',
      icon: '🚌',
      result: primaryRoute
        ? `Prioritize ${primaryRoute.route}`
        : 'Waiting for route demand data',
      detail: primaryRoute
        ? `${primaryRoute.passengerCount} passengers across ${primaryRoute.tripCount} trips. Consider extra deployment on peak slots.`
        : 'No route-performance records available from backend yet.',
      confidence: primaryRoute ? Math.min(95, Math.max(45, Math.round(primaryRoute.avgOccupancyRate * 100))) : 0,
      actionLabel: 'Open fleet',
      onAction: () => nav('/owner/fleet'),
      accentColor: 'var(--brand)',
    },
    {
      type: 'Occupancy Monitor',
      icon: '📊',
      result: `${occupancyPct}% overall occupancy`,
      detail: `${context?.operations.totalUpcomingTrips ?? 0} upcoming trips currently tracked from live DB inventory.`,
      confidence: loading ? 0 : Math.min(90, Math.max(35, occupancyPct)),
      actionLabel: 'Open analytics',
      onAction: () => nav('/owner/analytics'),
      accentColor: '#3b82f6',
    },
    {
      type: 'Revenue Tracker',
      icon: '💰',
      result: `KES ${revenue7d.toLocaleString()} (7d)`,
      detail: 'Revenue computed from backend booking amounts in the last 7 days.',
      confidence: loading ? 0 : 80,
      actionLabel: 'Open payments',
      onAction: () => nav('/owner/payments'),
      accentColor: '#f59e0b',
    },
  ];

  const bannerText = primaryRoute
    ? `<strong>Top route right now: ${primaryRoute.route}.</strong> Occupancy at ${Math.round(primaryRoute.avgOccupancyRate * 100)}% across ${primaryRoute.tripCount} trips from live backend data.`
    : '<strong>Owner dashboard is connected.</strong> Waiting for trips/bookings from backend to generate richer route intelligence.';

  return (
    <DashboardLayout title="Dashboard" subtitle={context?.nextTrip?.saccoName || 'Owner operations overview'}
      actions={<button className="btn btn-primary btn-sm" onClick={() => nav('/owner/schedules')}>+ Create trip</button>}>
      <AiBanner text={bannerText}
        action={<button className="btn btn-primary btn-sm" onClick={() => nav('/owner/fleet')}>Add vehicle</button>} />
      <div className="stat-grid mb-6">
        <StatTile label="Trips today" value={loading ? '...' : todayTrips.length} sub="Based on departure date" />
        <StatTile label="Upcoming trips" value={loading ? '...' : context?.operations.totalUpcomingTrips ?? 0} sub="Scheduled in DB" />
        <StatTile label="Revenue (7d)" value={loading ? '...' : `KES ${revenue7d.toLocaleString()}`} sub="From booking amounts" />
        <StatTile label="Occupancy" value={loading ? '...' : `${occupancyPct}%`} sub="Across upcoming trips" />
      </div>
      <div className="stat-grid mb-6">
        <StatTile label="Total routes" value={loading ? '...' : context?.operations.totalRoutes ?? 0} sub="Routes with active trips" />
        <StatTile label="Active vehicles" value={loading ? '...' : `${activeVehicles}/${totalVehicles}`} sub="Operational / total" />
        <StatTile label="Top route" value={loading ? '...' : topRouteLabel} sub="Highest recent usage" />
        <StatTile label="Sacco" value={loading ? '...' : context?.nextTrip?.saccoName || '—'} sub="From owner profile" />
      </div>

      <AiAgentPanel
        title="AI Operations Agent"
        subtitle="Backend-derived dispatch and revenue insights"
        cols={3}
        cards={aiCards}
      />

      <h4 className="mb-3">Quick actions</h4>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {[['🚌 Add vehicle', '/owner/fleet'], ['📅 Schedule', '/owner/schedules'], ['🗺️ Routes', '/owner/routes'], ['🎫 Bookings', '/owner/bookings'], ['📈 Analytics', '/owner/analytics']].map(([l, p]) => (
          <button key={l as string} className="btn" style={{ fontSize: 13 }} onClick={() => nav(p as string)}>{l}</button>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Today's trips</div>
          {!loading && todayTrips.length === 0 && <p className="text-sm text-muted">No trips scheduled for today.</p>}
          {todayTrips.map((trip) => (
            <div key={trip.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13.5 }}>
              <span>{trip.route} · {new Date(trip.departureTime).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
              <Badge variant={trip.occupancyRate > 0.7 ? 'green' : trip.occupancyRate > 0.4 ? 'amber' : 'blue'}>
                {trip.occupancyRate > 0.7 ? 'High demand' : trip.occupancyRate > 0.4 ? 'Moderate' : 'Low demand'}
              </Badge>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">Route occupancy</div>
          <div className="chart-wrap mt-2">
            {!loading && routePerf.length === 0 && <p className="text-sm text-muted">No route occupancy data available yet.</p>}
            {routePerf.slice(0, 5).map((row) => (
              <ChartBar
                key={row.id}
                label={row.route}
                pct={Math.max(1, Math.min(100, Math.round(row.avgOccupancyRate * 100)))}
                display={`${Math.round(row.avgOccupancyRate * 100)}%`}
                val={`${row.passengerCount} pax`}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
