import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Modal } from '../../components/UI';
import {
  aiContextApi,
  createRouteApi,
  deleteRouteApi,
  getRoutesApi,
  type AiContextEnvelope,
  updateRouteApi,
} from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type RouteForm = {
  origin: string;
  destination: string;
  distanceKm: string;
  estimatedTime: string;
};

const INITIAL_FORM: RouteForm = {
  origin: '',
  destination: '',
  distanceKm: '',
  estimatedTime: '',
};


export default function OwnerRoutes() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [context, setContext] = useState<AiContextEnvelope['data'] | null>(null);
  const [routes, setRoutes] = useState<Array<{
    id: string;
    origin: string;
    destination: string;
    distanceKm?: number;
    estimatedTime?: number;
  }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RouteForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRoutes = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [routesRes, contextRes] = await Promise.all([getRoutesApi(), aiContextApi()]);
      setRoutes(routesRes.data || []);
      setContext(contextRes.data);
    } catch (error) {
      toast((error as Error).message || 'Unable to fetch route data', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadRoutes();
  }, [toast]);

  const routeUsageMap = useMemo(() => {
    const perf = context?.analytics?.routePerformance || [];
    const m = new Map<string, { trips: number; passengers: number; occupancy: number; avgFare: number }>();

    perf.forEach((row) => {
      m.set(row.id, {
        trips: row.tripCount,
        passengers: row.passengerCount,
        occupancy: row.avgOccupancyRate,
        avgFare: row.avgFare,
      });
    });

    (context?.routes || []).forEach((row) => {
      if (!m.has(row.id)) {
        m.set(row.id, {
          trips: row.tripCount || 0,
          passengers: row.passengerCount || 0,
          occupancy: row.avgOccupancyRate || 0,
          avgFare: row.avgFare || 0,
        });
      }
    });

    return m;
  }, [context]);

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (route: (typeof routes)[number]) => {
    setEditingId(route.id);
    setForm({
      origin: route.origin || '',
      destination: route.destination || '',
      distanceKm: route.distanceKm ? String(route.distanceKm) : '',
      estimatedTime: route.estimatedTime ? String(route.estimatedTime) : '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const origin = form.origin.trim();
    const destination = form.destination.trim();

    if (!origin || !destination) {
      toast('Origin and destination are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        origin,
        destination,
        ...(form.distanceKm ? { distanceKm: Number(form.distanceKm) } : {}),
        ...(form.estimatedTime ? { estimatedTime: Number(form.estimatedTime) } : {}),
      };

      if (editingId) {
        await updateRouteApi(editingId, payload);
        toast('Route updated successfully', 'success');
      } else {
        await createRouteApi(payload);
        toast('Route created successfully', 'success');
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
      await loadRoutes(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to save route', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (route: (typeof routes)[number]) => {
    setDeletingId(route.id);
    try {
      await deleteRouteApi(route.id);
      toast('Route deleted successfully', 'success');
      await loadRoutes(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to delete route', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout title="Routes" subtitle="Manage all service routes"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" disabled={refreshing} onClick={() => void loadRoutes(true)}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add route</button>
        </div>
      }
    >
      <div className="card">
        {loading && <p className="text-muted">Loading routes from backend...</p>}

        {!loading && routes.length === 0 && (
          <p className="text-muted">No routes found.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="td-primary">{route.origin} -&gt; {route.destination}</td>
                    <td>{routeUsageMap.get(route.id)?.trips ?? 0}</td>
                    <td>{routeUsageMap.get(route.id)?.passengers ?? 0}</td>
                    <td>{Math.round((routeUsageMap.get(route.id)?.occupancy || 0) * 100)}%</td>
                    <td>KES {Math.round(routeUsageMap.get(route.id)?.avgFare || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" onClick={() => openEdit(route)}>Edit</button>
                        <button
                          className="btn btn-sm"
                          disabled={deletingId === route.id}
                          onClick={() => void handleDelete(route)}
                        >
                          {deletingId === route.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? 'Edit route' : 'Add route'}
        width={620}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Origin</label>
            <input
              className="input"
              value={form.origin}
              onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input
              className="input"
              value={form.destination}
              onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Distance (km)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.distanceKm}
              onChange={(e) => setForm((p) => ({ ...p, distanceKm: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Estimated time (minutes)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.estimatedTime}
              onChange={(e) => setForm((p) => ({ ...p, estimatedTime: e.target.value }))}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving route...' : editingId ? 'Save route changes ->' : 'Create route ->'}
        </button>
      </Modal>
    </DashboardLayout>
  );
}
