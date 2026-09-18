import { useEffect, useState } from 'react';
export type Theme = 'system' | 'light' | 'dark';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => { try { const stored = localStorage.getItem('rasta.theme'); return stored === 'light' || stored === 'dark' ? stored : 'system'; } catch { return 'system'; } });
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => { const resolved = theme === 'system' ? media.matches ? 'dark' : 'light' : theme; document.documentElement.dataset.theme = resolved; document.documentElement.style.colorScheme = resolved; };
    apply(); try { localStorage.setItem('rasta.theme', theme); } catch { /* Theme remains available for this session. */ }
    media.addEventListener('change', apply); return () => media.removeEventListener('change', apply);
  }, [theme]);
  return { theme, setTheme };
}
