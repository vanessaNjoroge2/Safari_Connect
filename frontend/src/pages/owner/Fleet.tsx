import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Modal } from '../../components/UI';
import {
  createOwnerBusApi,
  createOwnerBusSeatsApi,
  deleteOwnerBusApi,
  getOwnerBusesApi,
  updateOwnerBusApi,
} from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type VehicleForm = {
  name: string;
  plateNumber: string;
  seatCapacity: string;
};

const INITIAL_FORM: VehicleForm = {
  name: '',
  plateNumber: '',
  seatCapacity: '',
};

export default function OwnerFleet() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Array<{
    id: string;
    name: string;
    plateNumber: string;
    seatCapacity: number;
    isActive: boolean;
  }>>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>(INITIAL_FORM);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [seatSetupOpen, setSeatSetupOpen] = useState(false);
  const [seatSetupBus, setSeatSetupBus] = useState<null | {
    id: string;
    name: string;
    plateNumber: string;
    seatCapacity: number;
  }>(null);
  const [seatPricing, setSeatPricing] = useState({
    vip: '2500',
    firstClass: '2000',
    business: '1500',
  });
  const [settingUpSeats, setSettingUpSeats] = useState(false);

  const loadFleet = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const result = await getOwnerBusesApi();
      setVehicles(result.data || []);
    } catch (error) {
      toast((error as Error).message || 'Unable to fetch fleet data', 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadFleet();
  }, [toast]);

  const openCreateModal = () => {
    setForm(INITIAL_FORM);
    setCreateOpen(true);
  };

  const openEditModal = (vehicle: {
    id: string;
    name: string;
    plateNumber: string;
    seatCapacity: number;
  }) => {
    setEditingBusId(vehicle.id);
    setForm({
      name: vehicle.name,
      plateNumber: vehicle.plateNumber,
      seatCapacity: String(vehicle.seatCapacity),
    });
    setEditOpen(true);
  };

  const handleCreateVehicle = async () => {
    const name = form.name.trim();
    const plateNumber = form.plateNumber.trim().toUpperCase();
    const seatCapacity = Number(form.seatCapacity);

    if (!name || !plateNumber || !seatCapacity || !Number.isInteger(seatCapacity) || seatCapacity < 1) {
      toast('Provide vehicle name, plate number, and valid seat capacity', 'warning');
      return;
    }

    setCreating(true);
    try {
      const created = await createOwnerBusApi({
        name,
        plateNumber,
        seatCapacity,
      });

      toast('Vehicle added successfully', 'success');
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      await loadFleet(true);
      setSeatSetupBus({
        id: created.data.id,
        name: created.data.name,
        plateNumber: created.data.plateNumber,
        seatCapacity: created.data.seatCapacity,
      });
      setSeatSetupOpen(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to add vehicle', 'error');
    } finally {
      setCreating(false);
    }
  };

  const buildSeatPayload = (capacity: number) => {
    const perRow = 4;
    const rows = Math.ceil(capacity / perRow);
    const seats: Array<{ seatNumber: string; seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS'; price: number }> = [];

    const vipPrice = Number(seatPricing.vip) || 2500;
    const firstClassPrice = Number(seatPricing.firstClass) || 2000;
    const businessPrice = Number(seatPricing.business) || 1500;

    let current = 0;
    for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
      const rowLetter = String.fromCharCode(65 + rowIndex);
      for (let col = 1; col <= perRow; col += 1) {
        current += 1;
        if (current > capacity) break;

        const seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS' =
          rowIndex === 0 ? 'VIP' : rowIndex <= 2 ? 'FIRST_CLASS' : 'BUSINESS';

        const price = seatClass === 'VIP' ? vipPrice : seatClass === 'FIRST_CLASS' ? firstClassPrice : businessPrice;

        seats.push({
          seatNumber: `${rowLetter}${col}`,
          seatClass,
          price,
        });
      }
    }

    return seats;
  };

  const handleSaveEdit = async () => {
    if (!editingBusId) return;

    const name = form.name.trim();
    const plateNumber = form.plateNumber.trim().toUpperCase();
    const seatCapacity = Number(form.seatCapacity);

    if (!name || !plateNumber || !seatCapacity || !Number.isInteger(seatCapacity) || seatCapacity < 1) {
      toast('Provide vehicle name, plate number, and valid seat capacity', 'warning');
      return;
    }

    setSavingEdit(true);
    try {
      await updateOwnerBusApi(editingBusId, {
        name,
        plateNumber,
        seatCapacity,
      });

      toast('Vehicle updated successfully', 'success');
      setEditOpen(false);
      setEditingBusId(null);
      setForm(INITIAL_FORM);
      await loadFleet(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to update vehicle', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: {
    id: string;
    name: string;
  }) => {
    setDeletingId(vehicle.id);
    try {
      await deleteOwnerBusApi(vehicle.id);
      toast(`Vehicle ${vehicle.name} deleted`, 'success');
      await loadFleet(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to delete vehicle', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetupSeats = async () => {
    if (!seatSetupBus) return;
    setSettingUpSeats(true);
    try {
      const seats = buildSeatPayload(seatSetupBus.seatCapacity);
      await createOwnerBusSeatsApi(seatSetupBus.id, seats);
      toast('Seat layout configured successfully', 'success');
      setSeatSetupOpen(false);
      setSeatSetupBus(null);
    } catch (error) {
      toast((error as Error).message || 'Failed to configure seats', 'error');
    } finally {
      setSettingUpSeats(false);
    }
  };

  return (
    <DashboardLayout title="Fleet / Vehicles" subtitle="Manage all registered vehicles"
      actions={<button className="btn btn-primary btn-sm" onClick={openCreateModal}>+ Add vehicle</button>}>
      <div className="card">
        {loading && <p className="text-muted">Loading vehicles from backend...</p>}

        {!loading && vehicles.length === 0 && (
          <p className="text-muted">No vehicles found in your owner fleet yet.</p>
        )}

        {!loading && vehicles.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th>Seat capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="td-primary">{vehicle.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{vehicle.plateNumber}</td>
                    <td>{vehicle.seatCapacity}</td>
                    <td>{vehicle.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" onClick={() => openEditModal(vehicle)}>Edit</button>
                        <button
                          className="btn btn-sm"
                          disabled={deletingId === vehicle.id}
                          onClick={() => void handleDeleteVehicle(vehicle)}
                        >
                          {deletingId === vehicle.id ? 'Deleting...' : 'Delete'}
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

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Add vehicle" width={560}>
        <div className="form-group">
          <label className="form-label">Vehicle name</label>
          <input
            className="input"
            placeholder="Safari Express Executive Coach"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Plate number</label>
            <input
              className="input"
              placeholder="KSA 105J"
              value={form.plateNumber}
              onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Seat capacity</label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="33"
              value={form.seatCapacity}
              onChange={(e) => setForm((p) => ({ ...p, seatCapacity: e.target.value }))}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={creating} onClick={() => void handleCreateVehicle()}>
          {creating ? 'Adding vehicle...' : 'Add vehicle ->'}
        </button>
      </Modal>

      <Modal
        open={seatSetupOpen}
        onClose={() => !settingUpSeats && setSeatSetupOpen(false)}
        title={`Configure seats - ${seatSetupBus?.plateNumber || ''}`}
        width={560}
      >
        <p className="text-sm text-muted" style={{ marginBottom: 14 }}>
          Vehicle {seatSetupBus?.name || '-'} has been created. Configure prices and generate seats now.
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">VIP price (KES)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={seatPricing.vip}
              onChange={(e) => setSeatPricing((p) => ({ ...p, vip: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">First class price (KES)</label>
            <input
              className="input"
              type="number"
              min={1}
              value={seatPricing.firstClass}
              onChange={(e) => setSeatPricing((p) => ({ ...p, firstClass: e.target.value }))}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Business/Economy price (KES)</label>
          <input
            className="input"
            type="number"
            min={1}
            value={seatPricing.business}
            onChange={(e) => setSeatPricing((p) => ({ ...p, business: e.target.value }))}
          />
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={settingUpSeats} onClick={() => void handleSetupSeats()}>
          {settingUpSeats ? 'Configuring seats...' : 'Generate seat layout ->'}
        </button>
      </Modal>

      <Modal open={editOpen} onClose={() => !savingEdit && setEditOpen(false)} title="Edit vehicle" width={560}>
        <div className="form-group">
          <label className="form-label">Vehicle name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Plate number</label>
            <input
              className="input"
              value={form.plateNumber}
              onChange={(e) => setForm((p) => ({ ...p, plateNumber: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Seat capacity</label>
            <input
              className="input"
              type="number"
              min={1}
              value={form.seatCapacity}
              onChange={(e) => setForm((p) => ({ ...p, seatCapacity: e.target.value }))}
            />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={savingEdit} onClick={() => void handleSaveEdit()}>
          {savingEdit ? 'Saving changes...' : 'Save vehicle changes ->'}
        </button>
      </Modal>
    </DashboardLayout>
  );
}
