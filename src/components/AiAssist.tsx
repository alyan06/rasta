import { useEffect, useState } from 'react';
import { ArrowCounterClockwise, Check, Sparkle } from '@phosphor-icons/react';
import { AI_LIMITS, aiStatus, type AiRemaining } from '../lib/ai';
import { cloudConfigured } from '../lib/cloud';

/** Remaining uses for the "N left today" labels; null until known or when AI help is unavailable. */
export function useAiRemaining(signedIn: boolean | undefined, refreshKey = 0): [AiRemaining | null, (next: Partial<AiRemaining>) => void] {
  const [remaining, setRemaining] = useState<AiRemaining | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!signedIn || !cloudConfigured) { setRemaining(null); return; }
    aiStatus().then(result => { if (!cancelled) setRemaining(result); }).catch(() => { if (!cancelled) setRemaining(null); });
    return () => { cancelled = true; };
  }, [signedIn, refreshKey]);
  return [remaining, next => setRemaining(previous => ({ ...(previous ?? { activity: AI_LIMITS.activity.perDay, essay: AI_LIMITS.essay.perDay }), ...next }))];
}

interface ButtonProps { label: string; busy: boolean; disabledReason?: string; remaining?: number; onClick: () => void; signedIn?: boolean; openAccount?: () => void }
/** The only way to invoke AI help: a fixed action, never a prompt box. */
export function AiAssistButton({ label, busy, disabledReason, remaining, onClick, signedIn, openAccount }: ButtonProps) {
  if (!cloudConfigured) return null;
  if (!signedIn) return <div className="ai-assist"><button type="button" className="button secondary ai-button" onClick={openAccount}><Sparkle size={16} /> {label}</button><span className="ai-assist-note">Sign in with Google to use AI help.</span></div>;
  return <div className="ai-assist">
    <button type="button" className="button secondary ai-button" disabled={busy || !!disabledReason || remaining === 0} onClick={onClick} aria-busy={busy} title={disabledReason}>
      <Sparkle size={16} weight={busy ? 'fill' : 'regular'} /> {busy ? 'Working…' : label}
    </button>
    <span className="ai-assist-note">{disabledReason ?? (remaining === undefined ? 'Free, a few times a day.' : remaining === 0 ? 'No uses left today.' : `${remaining} left today`)}</span>
  </div>;
}

interface SuggestionProps { title: string; text: string; notes?: string[]; meta?: string; onKeep: () => void; onRevert: () => void }
/** The AI's suggestion, shown apart from the student's own text until they choose. */
export function AiSuggestion({ title, text, notes, meta, onKeep, onRevert }: SuggestionProps) {
  return <div className="ai-suggestion" role="region" aria-label={title}>
    <div className="ai-suggestion-header"><span className="ai-suggestion-title"><Sparkle size={15} weight="fill" /> {title}</span>{meta && <span className="ai-suggestion-meta">{meta}</span>}</div>
    <p className="ai-suggestion-text">{text}</p>
    {notes && notes.length > 0 && <ul className="ai-suggestion-notes">{notes.map(note => <li key={note}>{note}</li>)}</ul>}
    <div className="button-row">
      <button type="button" className="button ai-keep" onClick={onKeep}><Check size={16} /> Keep</button>
      <button type="button" className="button secondary" onClick={onRevert}><ArrowCounterClockwise size={16} /> Revert</button>
    </div>
    <p className="ai-suggestion-footnote">Keep replaces your text with this version; Revert leaves it as you wrote it. Check that every detail is true before you submit it anywhere.</p>
  </div>;
}
