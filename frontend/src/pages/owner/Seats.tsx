import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { createOwnerBusSeatsApi, getOwnerBusSeatsApi, getOwnerBusesApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

function buildSeatPayload(capacity: number) {
  const perRow = 4;
  const rows = Math.ceil(capacity / perRow);
  const seats: Array<{ seatNumber: string; seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS'; price: number }> = [];
  let current = 0;

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    for (let col = 1; col <= perRow; col += 1) {
      current += 1;
      if (current > capacity) break;
      const seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS' =
        rowIndex === 0 ? 'VIP' : rowIndex <= 2 ? 'FIRST_CLASS' : 'BUSINESS';
      const price = seatClass === 'VIP' ? 2500 : seatClass === 'FIRST_CLASS' ? 2000 : 1500;
      seats.push({ seatNumber: `${rowLetter}${col}`, seatClass, price });
    }
  }

  return seats;
}

export default function OwnerSeats() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buses, setBuses] = useState<any[]>([]);
  const [busSeatMap, setBusSeatMap] = useState<Record<string, any[]>>({});
  const [settingBusId, setSettingBusId] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const busesRes = await getOwnerBusesApi();
      const allBuses = busesRes.data || [];
      setBuses(allBuses);

      const entries = await Promise.all(
        allBuses.map(async (bus: any) => {
          try {
            const seatsRes = await getOwnerBusSeatsApi(bus.id);
            return [bus.id, seatsRes.data || []] as const;
          } catch {
            return [bus.id, []] as const;
          }
        })
      );

      setBusSeatMap(Object.fromEntries(entries));
    } catch (error) {
      toast((error as Error).message || 'Failed to load seat configuration data', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [toast]);

  const totals = useMemo(() => {
    const allSeats = Object.values(busSeatMap).flat();
    const vip = allSeats.filter((s: any) => s.seatClass === 'VIP').length;
    const firstClass = allSeats.filter((s: any) => s.seatClass === 'FIRST_CLASS').length;
    const business = allSeats.filter((s: any) => s.seatClass === 'BUSINESS').length;
    return { vip, firstClass, business, total: allSeats.length };
  }, [busSeatMap]);

  const setupSeats = async (bus: any) => {
    setSettingBusId(bus.id);
    try {
      const seats = buildSeatPayload(bus.seatCapacity);
      await createOwnerBusSeatsApi(bus.id, seats);
      toast(`Seat layout configured for ${bus.plateNumber}`, 'success');
      await loadData(true);
    } catch (error) {
      toast((error as Error).message || 'Failed to configure seats', 'error');
    } finally {
      setSettingBusId(null);
    }
  };

  return (
    <DashboardLayout
      title="Seat Layout & Pricing"
      subtitle="Configure seats per vehicle"
      actions={
        <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={() => void loadData(true)}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="stat-grid mb-6">
        <div className="stat-tile"><div className="stat-label">Total seats</div><div className="stat-value">{totals.total}</div></div>
        <div className="stat-tile"><div className="stat-label">VIP seats</div><div className="stat-value">{totals.vip}</div></div>
        <div className="stat-tile"><div className="stat-label">First class seats</div><div className="stat-value">{totals.firstClass}</div></div>
        <div className="stat-tile"><div className="stat-label">Business seats</div><div className="stat-value">{totals.business}</div></div>
      </div>

      <div className="card">
        {loading && <p className="text-muted">Loading seat layouts from backend...</p>}

        {!loading && buses.length === 0 && <p className="text-muted">No buses found for this owner account.</p>}

        {!loading && buses.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th>Capacity</th>
                  <th>Seats configured</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => {
                  const seats = busSeatMap[bus.id] || [];
                  return (
                    <tr key={bus.id}>
                      <td className="td-primary">{bus.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{bus.plateNumber}</td>
                      <td>{bus.seatCapacity}</td>
                      <td>{seats.length}</td>
                      <td>
                        {seats.length > 0 ? (
                          <span className="text-xs text-muted">Configured</span>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={settingBusId === bus.id}
                            onClick={() => void setupSeats(bus)}
                          >
                            {settingBusId === bus.id ? 'Configuring...' : 'Configure seats'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
