import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke, Channel } from '@tauri-apps/api/core';

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
type StreamEvent = { kind: 'Chunk'; data: string } | { kind: 'Done' } | { kind: 'Error'; data: string };

export function useAiChat(tabId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const bufferRef = useRef('');

  useEffect(() => {
    if (tabId == null) return setMessages([]);
    invoke<ChatMessage[]>('get_ai_history', { tabId }).then(setMessages);
  }, [tabId]);

  const send = useCallback(async (prompt: string, apiKey: string) => {
    if (!prompt.trim() || isStreaming || tabId == null) return;
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    await invoke('save_ai_message', { tabId, role: 'user', content: prompt });
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    setIsStreaming(true);
    bufferRef.current = '';

    const channel = new Channel<StreamEvent>();
    channel.onmessage = (event) => {
      if (event.kind === 'Chunk') {
        bufferRef.current += event.data;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: bufferRef.current };
          return copy;
        });
      } else if (event.kind === 'Done') {
        setIsStreaming(false);
        invoke('save_ai_message', { tabId, role: 'assistant', content: bufferRef.current });
      } else if (event.kind === 'Error') {
        setIsStreaming(false);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: `РћС€РёР±РєР°: ${event.data}` };
          return copy;
        });
      }
    };
    try { await invoke('ask_ai_stream', { prompt, apiKey, onEvent: channel }); }
    catch { setIsStreaming(false); }
  }, [tabId, isStreaming]);

  return { messages, isStreaming, send };
}
