import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { ContextMenu, type MenuItem } from './ContextMenu';
import { BoardItemView } from './BoardItemView';
import { useBoardItems } from '../hooks/useBoardItems';

export function Board({ tabId, projectId }: { tabId: number; projectId: number }) {
  const { items, add, move, remove } = useBoardItems(tabId);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => { invoke<string>('get_app_data_dir').then(() => {}); }, []);

  const addPhoto = async () => {
    const p = await open({ multiple: false, filters: [{ name: 'Images', extensions: ['png','jpg','jpeg','webp','gif'] }] });
    if (!p || Array.isArray(p)) return;
    const rel = await invoke<string>('import_file', { projectId, sourcePath: p });
    await add({ tab_id: tabId, type: 'photo', x: 100, y: 100, width: 300, height: 200, z_index: Date.now(), payload: JSON.stringify({ path: rel }) });
  };
  const addNote = async () => {
    await add({ tab_id: tabId, type: 'note', x: 120, y: 120, width: 220, height: 140, z_index: Date.now(), payload: JSON.stringify({ text: 'Р—Р°РјРµС‚РєР°' }) });
  };
  const addFile = async () => {
    const p = await open({ multiple: false });
    if (!p || Array.isArray(p)) return;
    const rel = await invoke<string>('import_file', { projectId, sourcePath: p });
    await add({ tab_id: tabId, type: 'file', x: 140, y: 140, width: 200, height: 40, z_index: Date.now(), payload: JSON.stringify({ path: rel }) });
  };
  const add3D = async () => {
    const p = await open({ multiple: false, filters: [{ name: '3D', extensions: ['glb','gltf'] }] });
    if (!p || Array.isArray(p)) return;
    const rel = await invoke<string>('import_file', { projectId, sourcePath: p });
    await add({ tab_id: tabId, type: 'viewer3d', x: 100, y: 100, width: 480, height: 360, z_index: Date.now(), payload: JSON.stringify({ path: rel }) });
  };
  const items2: MenuItem[] = [
    { label: 'рџ“· Р”РѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ', onClick: addPhoto },
    { label: 'рџ“ќ Р”РѕР±Р°РІРёС‚СЊ Р·Р°РјРµС‚РєСѓ', onClick: addNote },
    { label: 'рџ“Ћ Р”РѕР±Р°РІРёС‚СЊ С„Р°Р№Р»', onClick: addFile },
    { label: 'рџ§Љ Р”РѕР±Р°РІРёС‚СЊ 3D', onClick: add3D },
  ];

  return (
    <div onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto',
        background: '#1e1e1e',
        backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
        backgroundSize: '20px 20px' }}>
      {items.map((i) => (
        <BoardItemView key={i.id} item={i} onMove={move} onDelete={remove}
          onOpenFile={(p) => invoke('open_file_external', { relPath: p })} />
      ))}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={items2} onClose={() => setMenu(null)} />}
    </div>
  );
}
