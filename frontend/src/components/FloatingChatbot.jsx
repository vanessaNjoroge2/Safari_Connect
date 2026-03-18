import { useEffect, useRef, useState } from 'react';
import { requestSafe } from '../lib/api';

export default function FloatingChatbot({ role = 'user' }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [unreadCount, setUnreadCount] = useState(0);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      by: 'assistant',
      text: role === 'owner'
        ? 'Hi, I can help with routes, occupancy, and schedule decisions.'
        : role === 'admin'
          ? 'Hi, I can summarize platform risk and operational insights.'
          : 'Hi, I can help you find trips, compare prices, and answer booking questions.'
    }
  ]);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!voiceSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [voiceSupported]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setListening(true);
    recognitionRef.current.start();
  };

  const send = async (presetText) => {
    const raw = typeof presetText === 'string' ? presetText : input;
    const text = raw.trim();
    if (!text || sending) return;

    const userMsg = { id: `u-${Date.now()}`, by: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    const response = await requestSafe('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        text,
        language: 'en'
      })
    });

    const aiText = response?.data?.message
      || response?.message
      || 'AI service is currently offline. Ensure backend (3215) and AI agent (4100) are both running, then try again.';
    const aiMsg = { id: `a-${Date.now()}`, by: 'assistant', text: aiText };
    setMessages((prev) => [...prev, aiMsg]);
    if (!openRef.current) {
      setUnreadCount((prev) => prev + 1);
    }
    setSending(false);
  };

  return (
    <div className="chatbot-root" aria-live="polite">
      <div className={`chatbot-panel ${open ? 'open' : 'closed'}`} role="dialog" aria-label="AI Assistant" aria-hidden={!open}>
          <div className="chatbot-header">
            <div className="chatbot-title-wrap">
              <div className="chatbot-title">AI Assistant</div>
              <div className="chatbot-sub">Safari Connect {listening ? '• Listening' : ''}</div>
            </div>
            <button className="chatbot-icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </div>

          <div className="chatbot-quick-actions">
            <button className="chatbot-chip" onClick={() => send('Find me the cheapest route today under KES 1000.')}>Cheap route</button>
            <button className="chatbot-chip" onClick={() => send('Any delay risk for Nairobi to Nakuru this evening?')}>Delay check</button>
            <button className="chatbot-chip" onClick={() => send('How can I pay safely using M-Pesa?')}>Payment tip</button>
          </div>

          <div className="chatbot-messages" ref={listRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg ${msg.by === 'user' ? 'user' : 'assistant'}`}>
                {msg.text}
              </div>
            ))}
            {sending && <div className="chatbot-msg assistant">Thinking...</div>}
          </div>

          <div className="chatbot-input-wrap">
            <input
              className="chatbot-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') send();
              }}
              placeholder="Ask about trips, prices, risk..."
            />
            {voiceSupported && (
              <button
                className={`chatbot-voice ${listening ? 'active' : ''}`}
                onClick={toggleVoice}
                type="button"
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title={listening ? 'Stop voice input' : 'Speak your message'}
              >
                {listening ? '■' : '🎤'}
              </button>
            )}
            <button className="chatbot-send" onClick={() => send()} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
      </div>

      <button
        className="chatbot-launcher"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) setUnreadCount(0);
            return next;
          });
        }}
        aria-label="Open AI assistant"
      >
        {open ? '×' : 'AI'}
        {unreadCount > 0 && !open && <span className="chatbot-unread">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
    </div>
  );
}
