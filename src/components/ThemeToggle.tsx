import { useId } from 'react';
import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import type { Theme } from '../hooks/useTheme';

const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Desktop },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

/** Three-way slider: a radio group styled as a pill with a thumb that glides to the chosen option. */
export default function ThemeToggle({ theme, setTheme, compact = false }: { theme: Theme; setTheme: (theme: Theme) => void; compact?: boolean }) {
  const index = options.findIndex(option => option.value === theme);
  // Each instance needs its own radio group: the onboarding header and the workspace topbar can both be mounted.
  const name = useId();
  return <fieldset className={`theme-toggle ${compact ? 'compact' : ''}`} aria-label="Appearance" style={{ '--thumb-index': index } as React.CSSProperties}>
    <span className="theme-toggle-thumb" aria-hidden="true" />
    {options.map(({ value, label, Icon }) => <label key={value} className={theme === value ? 'selected' : ''} title={`${label} theme`}>
      <input type="radio" name={name} value={value} checked={theme === value} onChange={() => setTheme(value)} />
      <Icon size={15} weight={theme === value ? 'fill' : 'regular'} aria-hidden="true" />
      <span className={compact ? 'visually-hidden' : ''}>{label}</span>
    </label>)}
  </fieldset>;
}
