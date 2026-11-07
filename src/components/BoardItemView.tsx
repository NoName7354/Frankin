import { convertFileSrc } from '@tauri-apps/api/core';
import { useRef } from 'react';
import type { BoardItem } from '../hooks/useBoardItems';
import { Viewer3D } from './Viewer3D';
import { appData } from '../constants';

type Props = {
  item: BoardItem;
  onMove: (id: number, x: number, y: number) => void;
  onDelete: (id: number) => void;
  onOpenFile: (p: string) => void;
};

export function BoardItemView({ item, onMove, onDelete, onOpenFile }: Props) {
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  const payload = JSON.parse(item.payload);
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    e.stopPropagation();
    drag.current = { ox: e.clientX - item.x, oy: e.clientY - item.y };
    const mm = (ev: MouseEvent) => {
      if (!drag.current) return;
      onMove(item.id, ev.clientX - drag.current.ox, ev.clientY - drag.current.oy);
    };
    const mu = () => { drag.current = null; window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  };
  const onCtx = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('РЈРґР°Р»РёС‚СЊ СЌР»РµРјРµРЅС‚?')) onDelete(item.id);
  };
  const style: React.CSSProperties = {
    position: 'absolute', left: item.x, top: item.y,
    width: item.width ?? undefined, height: item.height ?? undefined,
    zIndex: item.z_index, cursor: 'grab', userSelect: 'none',
    padding: 8, borderRadius: 8,
    background: item.type === 'note' ? '#fff8c5' : '#2d2d30',
    color: item.type === 'note' ? '#222' : '#ccc',
    border: '1px solid #454545', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  };
  return (
    <div style={style} onMouseDown={onMouseDown} onContextMenu={onCtx}>
      {item.type === 'photo' && payload.path && (
        <img src={convertFileSrc(appData() + '/' + payload.path)} draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
      )}
      {item.type === 'note' && (
        <textarea defaultValue={payload.text ?? ''}
          style={{ width: '100%', height: '100%', minWidth: 180, minHeight: 100,
            background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', fontFamily: 'inherit', fontSize: 14 }} />
      )}
      {item.type === 'file' && payload.path && (
        <div onDoubleClick={() => onOpenFile(payload.path)} style={{ display: 'flex', gap: 8, minWidth: 160 }}>
          <span>рџ“„</span><span>{payload.path.split('/').pop()}</span>
        </div>
      )}
      {item.type === 'viewer3d' && payload.path && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 6 }}>
          <Viewer3D modelPath={appData() + '/' + payload.path} />
        </div>
      )}
    </div>
  );
}
