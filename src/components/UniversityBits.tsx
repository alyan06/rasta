import { useState } from 'react';
import type { University } from '../types';
import { BANDS, type Band } from '../lib/chancing';
import { logoCandidates, monogram } from '../lib/logos';

export function UniversityLogo({ university, size = 'default' }: { university: University; size?: 'default' | 'large' | 'small' }) {
  const candidates = logoCandidates(university);
  const [index, setIndex] = useState(0);
  const source = candidates[index];
  return <span className={`university-logo university-logo-${university.id} ${size}`} aria-hidden="true" data-monogram={monogram(university)}>
    {source ? <img src={source} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setIndex(index + 1)} /> : <span className="university-monogram-text">{monogram(university)}</span>}
  </span>;
}

export function ChanceBadge({ probability, band, label }: { probability: number | null; band: Band | null; label?: string }) {
  if (probability === null || band === null) return <span className="badge neutral">{label ?? 'No estimate yet'}</span>;
  return <span className={`badge chance-badge chance-${band}`}><strong>{probability}%</strong> {BANDS[band].label}</span>;
}

/** A five-band meter with the estimate marked on it. */
export function ChanceMeter({ probability }: { probability: number }) {
  const bands: Band[] = ['far-reach', 'reach', 'target', 'likely', 'safety'];
  return <div className="chance-meter" role="img" aria-label={`${probability}% estimated chance`}>
    <div className="chance-meter-track">{bands.map(band => <span key={band} className={`chance-meter-band chance-${band}`} title={`${BANDS[band].label} · ${BANDS[band].range}`} />)}<i className="chance-meter-marker" style={{ left: `${Math.min(100, Math.max(0, probability))}%` }} /></div>
    <div className="chance-meter-labels">{bands.map(band => <span key={band}>{BANDS[band].label}</span>)}</div>
  </div>;
}
