import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, Modal } from '../../components/UI';
import { aiAssistApi, createAdminHelpApi, deleteAdminHelpApi, getAdminHelpApi, updateAdminHelpApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type HelpArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
};

type HelpForm = {
  title: string;
  category: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isAiGenerated: boolean;
};

const EMPTY_FORM: HelpForm = {
  title: '',
  category: 'General',
  content: '',
  status: 'PUBLISHED',
  isAiGenerated: false,
};

export default function AdminHelp() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<HelpArticle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<HelpArticle | null>(null);
  const [form, setForm] = useState<HelpForm>(EMPTY_FORM);
  const [aiPrompt, setAiPrompt] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getAdminHelpApi({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: search.trim() || undefined,
        limit: 200,
      });
      setRows(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load help articles';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, statusFilter]);

  const visible = useMemo(() => rows, [rows]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setAiPrompt('');
    setCreateOpen(true);
  };

  const openEdit = (article: HelpArticle) => {
    setActive(article);
    setForm({
      title: article.title,
      category: article.category,
      content: article.content,
      status: article.status,
      isAiGenerated: article.isAiGenerated,
    });
    setAiPrompt('');
    setEditOpen(true);
  };

  const openDelete = (article: HelpArticle) => {
    setActive(article);
    setDeleteOpen(true);
  };

  const generateWithAi = async () => {
    if (!aiPrompt.trim()) {
      toast('Enter a prompt first', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await aiAssistApi({
        prompt: `Write concise admin help content for: ${aiPrompt}. Return practical bullet-style guidance for operations teams.`,
        language: 'en',
      });
      setForm((prev) => ({
        ...prev,
        content: response.data.summary.passengerMessage || response.data.modules.chat.message,
        isAiGenerated: true,
      }));
      toast('AI draft generated', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate AI help draft';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveCreate = async () => {
    setSaving(true);
    try {
      await createAdminHelpApi(form);
      toast('Help article created', 'success');
      setCreateOpen(false);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create help article';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await updateAdminHelpApi(active.id, form);
      toast('Help article updated', 'success');
      setEditOpen(false);
      setActive(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update help article';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await deleteAdminHelpApi(active.id);
      toast('Help article deleted', 'success');
      setDeleteOpen(false);
      setActive(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete help article';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Help Center"
      subtitle="Manage admin help content and generate AI-assisted drafts"
      actions={<button className="btn btn-primary btn-sm" onClick={openCreate}>New article</button>}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 280, fontSize: 13 }}
          placeholder="Search title, category, content"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(status as 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Source</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{item.slug}</div>
                </td>
                <td><Badge variant="gray">{item.category}</Badge></td>
                <td><Badge variant={item.status === 'PUBLISHED' ? 'green' : item.status === 'ARCHIVED' ? 'red' : 'amber'}>{item.status}</Badge></td>
                <td><Badge variant={item.isAiGenerated ? 'blue' : 'gray'}>{item.isAiGenerated ? 'AI' : 'Manual'}</Badge></td>
                <td style={{ fontSize: 12 }}>{new Date(item.updatedAt).toLocaleDateString('en-KE')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => openDelete(item)}>Delete</button>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Loading help articles...</td></tr>}
            {!loading && visible.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No help articles found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create help article" width={760}>
        <HelpFormBlock
          form={form}
          setForm={setForm}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          generateWithAi={generateWithAi}
          saving={saving}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveCreate} disabled={saving || !form.title.trim() || !form.category.trim() || !form.content.trim()}>{saving ? 'Saving...' : 'Create'}</button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit help article" width={760}>
        <HelpFormBlock
          form={form}
          setForm={setForm}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          generateWithAi={generateWithAi}
          saving={saving}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit} disabled={saving || !form.title.trim() || !form.category.trim() || !form.content.trim()}>{saving ? 'Saving...' : 'Update'}</button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete help article" width={500}>
        <div style={{ display: 'grid', gap: 14 }}>
          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Delete this help article? This cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn" style={{ color: 'var(--danger)' }} onClick={confirmDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function HelpFormBlock({
  form,
  setForm,
  aiPrompt,
  setAiPrompt,
  generateWithAi,
  saving,
}: {
  form: HelpForm;
  setForm: Dispatch<SetStateAction<HelpForm>>;
  aiPrompt: string;
  setAiPrompt: Dispatch<SetStateAction<string>>;
  generateWithAi: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px', gap: 10 }}>
        <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
        <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as HelpForm['status'] }))}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select className="input" value={form.isAiGenerated ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, isAiGenerated: e.target.value === 'true' }))}>
          <option value="false">Manual</option>
          <option value="true">AI generated</option>
        </select>
      </div>
      <textarea className="input" rows={7} placeholder="Content" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />

      <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 10, display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>AI draft assistant</div>
        <input className="input" placeholder="Describe article goal, tone, and audience" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
        <div>
          <button className="btn btn-sm" onClick={() => void generateWithAi()} disabled={saving || !aiPrompt.trim()}>{saving ? 'Generating...' : 'Generate with AI'}</button>
        </div>
      </div>
    </div>
  );
}
