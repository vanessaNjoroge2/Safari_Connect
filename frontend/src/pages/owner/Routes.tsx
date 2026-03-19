import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { aiContextApi, type AiContextEnvelope } from '../../lib/api';
import { useToast } from '../../hooks/useToast';


export default function OwnerRoutes() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AiContextEnvelope['data'] | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const result = await aiContextApi();
        setContext(result.data);
      } catch (error) {
        toast((error as Error).message || 'Unable to fetch route data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const routes = useMemo(() => {
    const perf = context?.analytics?.routePerformance || [];
    if (perf.length > 0) return perf;
    return (context?.routes || []).map((route) => ({
      id: route.id,
      route: route.route,
      origin: route.origin,
      destination: route.destination,
      tripCount: route.tripCount,
      passengerCount: route.passengerCount || 0,
      avgFare: route.avgFare,
      avgOccupancyRate: route.avgOccupancyRate || 0,
    }));
  }, [context]);

  return (
    <DashboardLayout title="Routes" subtitle="Manage all service routes"
      actions={<button className="btn btn-primary btn-sm" onClick={()=>toast('Routes action done!')}>Primary action</button>}>
      <div className="card">
        {loading && <p className="text-muted">Loading routes from backend...</p>}

        {!loading && routes.length === 0 && (
          <p className="text-muted">No route usage data found for your owner account.</p>
        )}

        {!loading && routes.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Trips</th>
                  <th>Passengers</th>
                  <th>Avg occupancy</th>
                  <th>Avg fare</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="td-primary">{route.route}</td>
                    <td>{route.tripCount}</td>
                    <td>{route.passengerCount}</td>
                    <td>{Math.round((route.avgOccupancyRate || 0) * 100)}%</td>
                    <td>KES {Math.round(route.avgFare || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
