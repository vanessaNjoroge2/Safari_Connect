import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { aiContextApi, updateMeApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function OwnerSettings() {
  const toast = useToast();
  const { user, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sacco, setSacco] = useState<{ id: string; name: string; categoryId: string } | null>(null);
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] ?? '',
    lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const loadSettings = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await aiContextApi();
      setSacco((result.data as any).sacco || null);
    } catch (error) {
      toast((error as Error).message || 'Failed to load owner settings data', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadSettings();
  }, [toast]);

  useEffect(() => {
    setForm({
      firstName: user?.name?.split(' ')[0] ?? '',
      lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast('You must be logged in to update settings', 'error');
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!firstName || !lastName || !email) {
      toast('First name, last name, and email are required', 'warning');
      return;
    }

    setSaving(true);
    try {
      const result = await updateMeApi({ firstName, lastName, email, phone });
      const updatedName = `${result.data.firstName} ${result.data.lastName}`.trim();
      const initials = updatedName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      setUserProfile({
        ...user,
        name: updatedName || result.data.email,
        email: result.data.email,
        phone: result.data.phone || '',
        initials: initials || user.initials || 'SC',
      });

      toast('Owner account updated successfully', 'success');
    } catch (error) {
      toast((error as Error).message || 'Failed to update owner account', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Settings"
      subtitle="SACCO profile and preferences"
      actions={
        <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={() => void loadSettings(true)}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Owner account</div>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div className="form-row">
              <input
                className="input"
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary btn-full" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving...' : 'Save account changes'}
          </button>
        </div>

        <div className="card">
          <div className="card-title">SACCO profile</div>
          {loading && <p className="text-muted">Loading SACCO profile from backend...</p>}
          {!loading && (
            <>
              <div className="form-group">
                <label className="form-label">SACCO name</label>
                <input className="input" value={sacco?.name || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">SACCO ID</label>
                <input className="input" value={sacco?.id || ''} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Category ID</label>
                <input className="input" value={sacco?.categoryId || ''} readOnly />
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
