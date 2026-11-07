export const APP_DATA = '';
export function setAppDataDir(dir: string) {
  (globalThis as any).__APP_DATA__ = dir;
}
export function appData(): string {
  return (globalThis as any).__APP_DATA__ || '';
}
