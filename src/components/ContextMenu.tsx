import { useEffect, useRef } from 'react';
export type MenuItem = { label: string; onClick: () => void; danger?: boolean };
type Props = { x: number; y: number; items: MenuItem[]; onClose: () => void };

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'fixed', top: y, left: x, background: '#2d2d30',
      border: '1px solid #454545', borderRadius: 6, padding: '4px 0',
      zIndex: 1000, minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
    }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => { item.onClick(); onClose(); }}
          style={{ padding: '6px 16px', cursor: 'pointer',
            color: item.danger ? '#f48771' : '#cccccc', fontSize: 13 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#094771')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
