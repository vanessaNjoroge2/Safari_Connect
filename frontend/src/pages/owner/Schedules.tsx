import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Modal } from '../../components/UI';
import {
  createOwnerTripApi,
  deleteOwnerTripApi,
  getOwnerBusesApi,
  getOwnerTripsApi,
  getRoutesApi,
  updateOwnerTripApi,
  updateOwnerTripStatusApi,
} from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type TripForm = {
  busId: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: string;
};

const INITIAL_FORM: TripForm = {
  busId: '',
  routeId: '',
  departureTime: '',
  arrivalTime: '',
  basePrice: '',
};

export default function OwnerSchedules() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(INITIAL_FORM);

  const loadData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const [tripsRes, busesRes, routesRes] = await Promise.all([
        getOwnerTripsApi(),
        getOwnerBusesApi(),
        getRoutesApi(),
      ]);
      setTrips(tripsRes.data || []);
      setBuses(busesRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (error) {
      toast((error as Error).message || 'Failed to load owner schedule data', 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [toast]);

  const routeMap = useMemo(() => {
    const m = new Map<string, string>();
    routes.forEach((r) => m.set(r.id, `${r.origin} -> ${r.destination}`));
    return m;
  }, [routes]);

  const openCreate = () => {
    setForm({
      busId: buses[0]?.id || '',
      routeId: routes[0]?.id || '',
      departureTime: '',
      arrivalTime: '',
      basePrice: '',
    });
    setOpen(true);
  };

  const toInputDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const openEdit = (trip: any) => {
    setEditingTripId(trip.id);
    setForm({
      busId: trip.busId,
      routeId: trip.routeId,
      departureTime: toInputDateTime(trip.departureTime),
      arrivalTime: toInputDateTime(trip.arrivalTime),
      basePrice: String(Number(trip.basePrice) || ''),
    });
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (!form.busId || !form.routeId || !form.departureTime || !form.arrivalTime || !form.basePrice) {
      toast('Complete all trip fields before creating schedule', 'warning');
      return;
    }

    setCreating(true);
    try {
      await createOwnerTripApi({
        busId: form.busId,
        routeId: form.routeId,
        tripType: 'ONE_WAY',
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: new Date(form.arrivalTime).toISOString(),
        basePrice: Number(form.basePrice),
      });
      toast('Trip schedule created successfully', 'success');
      setOpen(false);
      setForm(INITIAL_FORM);
      await loadData(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to create trip schedule', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTripId) return;

    if (!form.busId || !form.routeId || !form.departureTime || !form.arrivalTime || !form.basePrice) {
      toast('Complete all trip fields before saving', 'warning');
      return;
    }

    setSavingEdit(true);
    try {
      await updateOwnerTripApi(editingTripId, {
        busId: form.busId,
        routeId: form.routeId,
        tripType: 'ONE_WAY',
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: new Date(form.arrivalTime).toISOString(),
        basePrice: Number(form.basePrice),
      });

      toast('Trip updated successfully', 'success');
      setEditOpen(false);
      setEditingTripId(null);
      setForm(INITIAL_FORM);
      await loadData(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to update trip', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpdateStatus = async (tripId: string, status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED') => {
    setStatusUpdatingId(tripId);
    try {
      await updateOwnerTripStatusApi(tripId, status);
      toast(`Trip status updated to ${status}`, 'success');
      await loadData(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to update trip status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    setDeletingId(tripId);
    try {
      await deleteOwnerTripApi(tripId);
      toast('Trip deleted successfully', 'success');
      await loadData(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to delete trip', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Schedules / Trips"
      subtitle="Create and manage trip schedules"
      actions={<button className="btn btn-primary btn-sm" onClick={openCreate}>+ Create trip</button>}
    >
      <div className="card">
        {loading && <p className="text-muted">Loading schedules from backend...</p>}

        {!loading && trips.length === 0 && <p className="text-muted">No trips scheduled yet.</p>}

        {!loading && trips.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bus</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Fare</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.slice(0, 50).map((trip) => (
                  <tr key={trip.id}>
                    <td className="td-primary">{trip.route ? `${trip.route.origin} -> ${trip.route.destination}` : routeMap.get(trip.routeId) || '-'}</td>
                    <td>{trip.bus?.plateNumber || '-'}</td>
                    <td>{new Date(trip.departureTime).toLocaleString('en-KE')}</td>
                    <td>{new Date(trip.arrivalTime).toLocaleString('en-KE')}</td>
                    <td>KES {Math.round(Number(trip.basePrice) || 0).toLocaleString()}</td>
                    <td>{trip.bookedSeats}/{(trip.bookedSeats || 0) + (trip.availableSeats || 0)}</td>
                    <td>{trip.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm" onClick={() => openEdit(trip)}>Edit</button>
                        <button
                          className="btn btn-sm"
                          disabled={statusUpdatingId === trip.id}
                          onClick={() => void handleUpdateStatus(trip.id, trip.status === 'SCHEDULED' ? 'CANCELLED' : 'SCHEDULED')}
                        >
                          {statusUpdatingId === trip.id
                            ? 'Updating...'
                            : trip.status === 'SCHEDULED'
                              ? 'Cancel'
                              : 'Mark Scheduled'}
                        </button>
                        <button
                          className="btn btn-sm"
                          disabled={deletingId === trip.id}
                          onClick={() => void handleDeleteTrip(trip.id)}
                        >
                          {deletingId === trip.id ? 'Deleting...' : 'Delete'}
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

      <Modal open={open} onClose={() => !creating && setOpen(false)} title="Create trip schedule" width={640}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="select" value={form.busId} onChange={(e) => setForm((p) => ({ ...p, busId: e.target.value }))}>
              <option value="">Select vehicle</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>{bus.name} - {bus.plateNumber}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Route</label>
            <select className="select" value={form.routeId} onChange={(e) => setForm((p) => ({ ...p, routeId: e.target.value }))}>
              <option value="">Select route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.origin} - {route.destination}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Departure time</label>
            <input className="input" type="datetime-local" value={form.departureTime} onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Arrival time</label>
            <input className="input" type="datetime-local" value={form.arrivalTime} onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Base price (KES)</label>
          <input className="input" type="number" min={1} value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} />
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={creating} onClick={() => void handleCreate()}>
          {creating ? 'Creating schedule...' : 'Create schedule ->'}
        </button>
      </Modal>

      <Modal open={editOpen} onClose={() => !savingEdit && setEditOpen(false)} title="Edit trip schedule" width={640}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="select" value={form.busId} onChange={(e) => setForm((p) => ({ ...p, busId: e.target.value }))}>
              <option value="">Select vehicle</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>{bus.name} - {bus.plateNumber}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Route</label>
            <select className="select" value={form.routeId} onChange={(e) => setForm((p) => ({ ...p, routeId: e.target.value }))}>
              <option value="">Select route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.origin} - {route.destination}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Departure time</label>
            <input className="input" type="datetime-local" value={form.departureTime} onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Arrival time</label>
            <input className="input" type="datetime-local" value={form.arrivalTime} onChange={(e) => setForm((p) => ({ ...p, arrivalTime: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Base price (KES)</label>
          <input className="input" type="number" min={1} value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} />
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={savingEdit} onClick={() => void handleSaveEdit()}>
          {savingEdit ? 'Saving changes...' : 'Save schedule changes ->'}
        </button>
      </Modal>
    </DashboardLayout>
  );
}
