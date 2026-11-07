import { useState, useEffect, useCallback, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { invoke } from '@tauri-apps/api/core';
import { useAiContext } from '../context/AiContext';

export function HTMLEditor({ tabId }: { tabId: number }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setPendingPrompt } = useAiContext();

  useEffect(() => {
    let ok = true; setLoading(true);
    invoke<string>('get_tab_content', { tabId }).then((h) => { if (ok) setContent(h); }).finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, [tabId]);

  const onChange = useCallback((v: string) => {
    setContent(v);
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => invoke('save_tab_content', { tabId, content: v }), 500);
  }, [tabId]);

  if (loading) return <div style={{ padding: 24, color: '#969696' }}>Р—Р°РіСЂСѓР·РєР°вЂ¦</div>;

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #3c3c3c', background: '#252526' }}>
        <button onClick={() => setPendingPrompt(`РџСЂРѕР°РЅР°Р»РёР·РёСЂСѓР№ HTML Рё РїСЂРµРґР»РѕР¶Рё СѓР»СѓС‡С€РµРЅРёСЏ:\n\n\`\`\`html\n${content}\n\`\`\``)}
          style={{ padding: '6px 12px', background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
          рџ¤– РћС‚РїСЂР°РІРёС‚СЊ РІ AI
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 1, background: '#3c3c3c' }}>
        <div style={{ flex: 1, overflow: 'hidden', background: '#1e1e1e' }}>
          <CodeMirror value={content} height="100%" theme={oneDark}
            extensions={[html()]} onChange={onChange}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: true, autocompletion: true }}
            style={{ height: '100%', fontSize: 13 }} />
        </div>
        <div style={{ flex: 1, background: '#fff' }}>
          <iframe srcDoc={content} sandbox="" title="Preview"
            style={{ width: '100%', height: '100%', border: 'none' }} />
        </div>
      </div>
    </div>
  );
}
