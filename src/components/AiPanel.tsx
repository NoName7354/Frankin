import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAiChat } from '../hooks/useAiChat';
import { useAiContext } from '../context/AiContext';

export function AiPanel({ tabId }: { tabId: number }) {
  const { messages, isStreaming, send } = useAiChat(tabId);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pendingPrompt, setPendingPrompt } = useAiContext();

  useEffect(() => {
    invoke<string>('get_api_key').then((k) => { setApiKey(k); setKeyLoaded(true); }).catch(() => setKeyLoaded(true));
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  useEffect(() => {
    if (pendingPrompt && apiKey && !isStreaming) {
      send(pendingPrompt, apiKey);
      setPendingPrompt(null);
    }
  }, [pendingPrompt, apiKey, isStreaming, send, setPendingPrompt]);

  const handleSend = async () => {
    if (!apiKey.trim()) { alert('Р’РІРµРґРёС‚Рµ API-РєР»СЋС‡ OpenRouter'); return; }
    const p = prompt; setPrompt('');
    await send(p, apiKey);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#252526' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #3c3c3c', fontSize: 13, color: '#969696' }}>
        рџ¤– AI (DeepSeek R1)
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8,
            background: m.role === 'user' ? '#094771' : '#2d2d30',
            color: '#ddd', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <strong style={{ fontSize: 11, opacity: 0.7, display: 'block', marginBottom: 4 }}>
              {m.role === 'user' ? 'Р’С‹' : 'AI'}
            </strong>
            {m.content || (isStreaming && i === messages.length - 1 ? 'вЂ¦' : '')}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #3c3c3c' }}>
        {keyLoaded && !apiKey && (
          <input type="password" placeholder="OpenRouter API Key" value={apiKey}
            onChange={(e) => setApiKey(e.target.value)} style={inputStyle} />
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="РЎРїСЂРѕСЃРёС‚РµвЂ¦ (Enter вЂ” РѕС‚РїСЂР°РІРёС‚СЊ)" rows={2}
            style={{ ...inputStyle, flex: 1, resize: 'none', marginBottom: 0 }} />
          <button onClick={handleSend} disabled={isStreaming || !prompt.trim()}
            style={{ padding: '0 16px', background: isStreaming ? '#444' : '#007acc',
              color: '#fff', border: 'none', borderRadius: 4,
              cursor: isStreaming ? 'not-allowed' : 'pointer' }}>
            {isStreaming ? 'вЂ¦' : 'в†’'}
          </button>
        </div>
      </div>
    </div>
  );
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', marginBottom: 8,
  background: '#1e1e1e', color: '#ddd', border: '1px solid #3c3c3c',
  borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'inherit'
};
