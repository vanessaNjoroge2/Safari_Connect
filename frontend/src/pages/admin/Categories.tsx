import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import { createCategoryApi, deleteCategoryApi, getCategoriesApi, updateCategoryApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export default function AdminCategories() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const response = await getCategoriesApi();
      const mapped = response.data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        createdAt: c.createdAt,
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async () => {
    if (!form.name.trim()) {
      toast('Category name is required', 'error');
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || undefined,
    };

    setCreating(true);
    try {
      await createCategoryApi(payload);
      setForm({ name: '', slug: '', description: '' });
      await load();
      toast('Category created', 'success');
    } catch (error) {
      toast((error as Error).message || 'Failed to create category', 'error');
    } finally {
      setCreating(false);
    }
  };

  const onStartEdit = (row: CategoryRow) => {
    setEditingId(row.id);
    setEditForm({ name: row.name, slug: row.slug, description: row.description });
  };

  const onSaveEdit = async (row: CategoryRow) => {
    const payload = {
      name: editForm.name.trim() || row.name,
      slug: editForm.slug.trim() || row.slug,
      description: editForm.description.trim(),
    };
    try {
      await updateCategoryApi(row.id, payload);
      setEditingId(null);
      await load();
      toast('Category updated', 'success');
    } catch (error) {
      toast((error as Error).message || 'Failed to update category', 'error');
    }
  };

  const onDelete = async (row: CategoryRow) => {
    const ok = window.confirm(`Delete category ${row.name}?`);
    if (!ok) return;
    try {
      await deleteCategoryApi(row.id);
      await load();
      toast('Category deleted', 'success');
    } catch (error) {
      toast((error as Error).message || 'Failed to delete category', 'error');
    }
  };

  const displayRows = useMemo(() => rows, [rows]);

  return (
    <DashboardLayout
      title="Category Management"
      subtitle="Transport and carrier service categories available on the platform"
      actions={<span className="text-muted" style={{ fontSize: 12 }}>{loading ? 'Loading...' : `${rows.length} categories`}</span>}
    >
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Add category</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.5fr auto', gap: 10 }}>
          <input
            className="input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Slug (optional)"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <button className="btn btn-primary" onClick={onCreate} disabled={creating}>
            {creating ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: 20 }}>
        {displayRows.map(c => (
          <div key={c.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>/{c.slug}</div>
              <Badge variant={'green'}>Active</Badge>
            </div>
            {editingId === c.id ? (
              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                <input className="input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                <input className="input" value={editForm.slug} onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))} />
                <textarea className="input" rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16, lineHeight: 1.5 }}>{c.description || '—'}</div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Created', val: new Date(c.createdAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) },
                  { label: 'Slug', val: `/${c.slug}` },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{s.val}</div>
                  </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {editingId === c.id ? (
                <>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => setEditingId(null)}>Cancel</button>
                  <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => onSaveEdit(c)}>Save</button>
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-ghost" style={{ flex: 1 }} onClick={() => onStartEdit(c)}>Edit</button>
                  <button className="btn btn-sm" style={{ flex: 1, color: 'var(--danger)' }} onClick={() => onDelete(c)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && displayRows.length === 0 && (
          <div className="card" style={{ padding: 24, gridColumn: '1 / -1', textAlign: 'center', color: 'var(--gray-400)' }}>
            No categories yet.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
