import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import { aiAssistApi, getPortalHelpApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function PassengerHelp() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    isAiGenerated: boolean;
    updatedAt: string;
  }>>([]);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await getPortalHelpApi({ q: search.trim() || undefined, limit: 200 });
        const data = response.data || [];
        setRows(data);
        if (!activeId && data.length > 0) {
          setActiveId(data[0].id);
        }
      } catch (error) {
        toast((error as Error).message || 'Failed to load help articles', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, toast]);

  const active = useMemo(() => rows.find((row) => row.id === activeId) || null, [rows, activeId]);

  const runAi = async () => {
    if (!prompt.trim()) {
      toast('Enter your question first', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const response = await aiAssistApi({
        prompt: `Passenger support request: ${prompt}. Context article title: ${active?.title || 'none'}. Context article body: ${active?.content || 'none'}. Return concise practical guidance.`,
        language: 'en',
      });
      const message = response.data.summary.passengerMessage || response.data.modules.chat.message;
      setAiAnswer(message);
      toast('AI response ready', 'success');
    } catch (error) {
      toast((error as Error).message || 'Failed to generate AI help answer', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout title="Help Center" subtitle="Get self-service support and AI guidance">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card" style={{ maxHeight: '72vh', overflow: 'auto' }}>
          <input
            className="input"
            style={{ marginBottom: 10, fontSize: 13 }}
            placeholder="Search help"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {rows.map((item) => (
            <button
              key={item.id}
              className="btn btn-ghost btn-full"
              style={{ justifyContent: 'space-between', marginBottom: 8, border: item.id === activeId ? '1px solid var(--brand-mid)' : undefined }}
              onClick={() => setActiveId(item.id)}
            >
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{item.title}</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.category}</span>
              </span>
              <Badge variant={item.isAiGenerated ? 'blue' : 'gray'}>{item.isAiGenerated ? 'AI' : 'Manual'}</Badge>
            </button>
          ))}

          {loading && <p className="text-sm text-muted">Loading help content...</p>}
          {!loading && rows.length === 0 && <p className="text-sm text-muted">No help articles found.</p>}
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <div className="card-title">{active?.title || 'Select an article'}</div>
            <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
              {active ? `${active.category} · Updated ${new Date(active.updatedAt).toLocaleDateString('en-KE')}` : 'Choose an article from the list'}
            </p>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 14, color: 'var(--gray-700)' }}>
              {active?.content || 'No article selected.'}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Ask AI for help</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <textarea
                className="input"
                rows={4}
                placeholder="Describe your issue, for example: I paid but I cannot see my ticket"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div>
                <button className="btn btn-primary btn-sm" onClick={() => void runAi()} disabled={generating || !prompt.trim()}>
                  {generating ? 'Generating...' : 'Generate answer'}
                </button>
              </div>
              {aiAnswer && (
                <div style={{ border: '1px solid var(--gray-100)', borderRadius: 10, padding: 12, whiteSpace: 'pre-wrap' }}>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
