import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';
import { Board } from './components/Board';
import { HTMLEditor } from './components/HTMLEditor';
import { Viewer3D } from './components/Viewer3D';
import { AiPanel } from './components/AiPanel';
import { ContextMenu } from './components/ContextMenu';
import { setAppDataDir, appData } from './constants';

type Project = { id: number; name: string };
type Tab = { id: number; project_id: number; title: string; kind: string; position: number };

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    invoke<string>('get_app_data_dir').then(setAppDataDir);
    invoke<Project[]>('get_projects').then((ps) => {
      setProjects(ps);
      if (ps.length) setActiveProject(ps[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeProject) { setTabs([]); setActiveTab(null); return; }
    invoke<Tab[]>('get_tabs', { projectId: activeProject.id }).then((ts) => {
      setTabs(ts);
      setActiveTab(ts[0] || null);
    });
  }, [activeProject]);

  const createProject = async () => {
    const name = prompt('РќР°Р·РІР°РЅРёРµ РїСЂРѕРµРєС‚Р°:');
    if (!name) return;
    await invoke('create_project', { name });
    const ps = await invoke<Project[]>('get_projects');
    setProjects(ps);
    setActiveProject(ps.find((p) => p.name === name) || ps[0]);
  };

  const createTab = async (kind: 'board' | 'editor' | 'viewer3d') => {
    if (!activeProject) return;
    const title = kind === 'board' ? 'Р”РѕСЃРєР°' : kind === 'editor' ? 'Р РµРґР°РєС‚РѕСЂ' : '3D';
    await invoke('create_tab', { tab: { project_id: activeProject.id, title, kind, position: tabs.length } });
    const ts = await invoke<Tab[]>('get_tabs', { projectId: activeProject.id });
    setTabs(ts); setActiveTab(ts[ts.length - 1]);
  };

  return (
    <div className="app-container">
      <aside className="sidebar" onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2>РџСЂРѕРµРєС‚С‹</h2>
          <button onClick={createProject} style={{ background: '#007acc', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>+</button>
        </div>
        <ul>
          {projects.map((p) => (
            <li key={p.id} className={activeProject?.id === p.id ? 'active' : ''} onClick={() => setActiveProject(p)}>{p.name}</li>
          ))}
        </ul>
        {ctxMenu && (
          <ContextMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)}
            items={[
              { label: 'Р”РѕР±Р°РІРёС‚СЊ РґРѕСЃРєСѓ', onClick: () => createTab('board') },
              { label: 'Р”РѕР±Р°РІРёС‚СЊ СЂРµРґР°РєС‚РѕСЂ', onClick: () => createTab('editor') },
              { label: 'Р”РѕР±Р°РІРёС‚СЊ 3D', onClick: () => createTab('viewer3d') },
            ]} />
        )}
      </aside>

      <main className="main-content">
        <div className="tab-bar">
          {tabs.map((t) => (
            <button key={t.id} className={`tab ${activeTab?.id === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t.title}</button>
          ))}
        </div>
        <div className="content-area">
          {activeTab?.kind === 'board' && activeProject && <Board tabId={activeTab.id} projectId={activeProject.id} />}
          {activeTab?.kind === 'editor' && <HTMLEditor tabId={activeTab.id} />}
          {activeTab?.kind === 'viewer3d' && <div style={{ height: '100%' }}><Viewer3D modelPath="" /></div>}
        </div>
      </main>

      {activeTab && (
        <aside style={{ width: 360, borderLeft: '1px solid #3c3c3c' }}>
          <AiPanel tabId={activeTab.id} />
        </aside>
      )}
    </div>
  );
}
