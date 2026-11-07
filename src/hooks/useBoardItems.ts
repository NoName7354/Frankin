import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export type ItemType = 'photo' | 'note' | 'file' | 'embed' | 'viewer3d';

export interface BoardItem {
  id: number;
  tab_id: number;
  type: ItemType;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  z_index: number;
  payload: string;
}

export function useBoardItems(tabId: number | null) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const load = useCallback(async () => {
    if (tabId == null) return setItems([]);
    setItems(await invoke<BoardItem[]>('get_board_items', { tabId }));
  }, [tabId]);
  useEffect(() => { load(); }, [load]);

  const add = async (item: Omit<BoardItem, 'id'>) => {
    const id = await invoke<number>('create_board_item', { item });
    setItems((prev) => [...prev, { ...item, id }]);
  };
  const move = async (id: number, x: number, y: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, x, y } : i)));
    await invoke('update_board_item_position', { id, x, y });
  };
  const remove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await invoke('delete_board_item', { id });
  };
  return { items, add, move, remove, reload: load };
}
