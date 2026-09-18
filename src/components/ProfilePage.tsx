import { useEffect, useState } from 'react';
import { ArrowRight, Check, FloppyDisk, Plus, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { Activity, Profile, SubjectGrade, WorkspaceProps } from '../types';
import { ACTIVITY_TYPES, IBCC_SOURCES, PROGRAMME_GROUPS, SUBJECTS, academicSummary, migrateProfile, newActivity, normalizeSubject, programmeCategory } from '../lib/academics';
import { isProfile } from '../lib/storage';

const blank: Profile = { name: '', city: '', curriculum: 'fsc', stage: 'awaiting', major: 'computing', ssc: '', hssc: '', net: '', nu: '', sat: '', mathematics: false, budget: '', activities: '', isDemo: false, secondary: 'matric', higherSecondary: 'fsc', oLevels: [], aLevels: [], predictedHssc: '', activityEntries: [], familyIncome: '' };
type ScoreKey = 'ssc' | 'hssc' | 'predictedHssc' | 'net' | 'nu' | 'sat' | 'familyIncome';

function profileProblems(profile: Profile): string[] {
  const errors: string[] = [];
  const limits: [ScoreKey, string, number, number][] = [['ssc', 'Matric percentage', 0, 100], ['hssc', 'FSc percentage', 0, 100], ['predictedHssc', 'Predicted FSc percentage', 0, 100], ['net', 'NET score', 0, 200], ['nu', 'NU test percentage', 0, 100], ['sat', 'SAT score', 400, 1600], ['familyIncome', 'Family earnings', 0, 100_000_000]];
  for (const [key, label, min, max] of limits) {
    const value = profile[key];
    if (value !== undefined && value !== '' && (!Number.isFinite(value) || value < min || value > max)) errors.push(`${label} must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`);
  }
  if (typeof profile.net === 'number' && !Number.isInteger(profile.net)) errors.push('NET must be a whole-number score.');
  if (typeof profile.sat === 'number' && profile.sat % 10 !== 0) errors.push('SAT scores must be in steps of 10.');
  if (profile.examYear !== undefined && (!Number.isInteger(profile.examYear) || profile.examYear < 2000 || profile.examYear > 2100)) errors.push('The year you finished O Levels must be between 2000 and 2100.');
  for (const [label, entries] of [['O Level', profile.oLevels], ['A Level', profile.aLevels]] as const) {
    const names = entries?.filter(entry => entry.subject.trim()).map(entry => normalizeSubject(entry.subject)) ?? [];
    if (new Set(names).size !== names.length) errors.push(`Each ${label} subject should appear only once.`);
  }
  for (const [index, activity] of (profile.activityEntries ?? []).entries()) {
    if (activity.hoursPerWeek !== '' && (!Number.isFinite(activity.hoursPerWeek) || activity.hoursPerWeek < 0 || activity.hoursPerWeek > 168)) errors.push(`Activity ${index + 1}: weekly hours must be between 0 and 168.`);
    if (activity.weeksPerYear !== '' && (!Number.isInteger(activity.weeksPerYear) || activity.weeksPerYear < 0 || activity.weeksPerYear > 52)) errors.push(`Activity ${index + 1}: weeks per year must be a whole number from 0 to 52.`);
    if (activity.startDate && activity.endDate && activity.endDate < activity.startDate) errors.push(`Activity ${index + 1}: end date must be on or after start date.`);
  }
  if (!errors.length && !isProfile(profile)) errors.push('Check the profile fields, subject records and activity dates before saving.');
  return errors;
}

export default function ProfilePage({ data, update, navigate, notify }: WorkspaceProps) {
  const [draft, setDraft] = useState<Profile>(() => migrateProfile(data.profile));
  const [attempted, setAttempted] = useState(false);
  const [fresh, setFresh] = useState(false);
  useEffect(() => { setDraft(migrateProfile(data.profile)); setFresh(false); setAttempted(false); }, [data.profile]);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const summary = academicSummary(draft);
  const errors = profileProblems(draft);
  const changed = fresh || JSON.stringify(draft) !== JSON.stringify(migrateProfile(data.profile));
  const activityEntries = draft.activityEntries ?? [];
  const editActivity = (id: string, patch: Partial<Activity>) => set('activityEntries', activityEntries.map(activity => activity.id === id ? { ...activity, ...patch } : activity));

  function scoreField(key: ScoreKey, label: string, hint: string, min = 0, max = 100, step = '0.01') {
    return <label className="field"><span>{label}</span><input type="number" value={draft[key] ?? ''} min={min} max={max} step={step} placeholder="Not added yet" onChange={event => set(key, event.target.value === '' ? '' : Number(event.target.value))} /><small className="muted">{hint}</small></label>;
  }

  function subjectEditor(level: 'oLevels' | 'aLevels') {
    const entries = draft[level] ?? [];
    const label = level === 'oLevels' ? 'O Level' : 'A Level';
    const changeSubject = (id: string, patch: Partial<SubjectGrade>) => set(level, entries.map(entry => entry.id === id ? { ...entry, ...patch } : entry));
    return <div className="subject-editor stack"><div className="panel-header"><div><h3>{label} subjects &amp; grades</h3><p className="muted">{level === 'oLevels' ? 'Add each subject with the grade you got, including the five compulsory subjects (English, Maths, Urdu, Islamiyat, Pakistan Studies).' : draft.stage === 'awaiting' ? 'Add each subject with your predicted grade. Untick “Predicted” once a result is confirmed.' : 'Add each full A Level subject with the grade you got.'}</p></div><span className="badge">{entries.length} / 12</span></div>
      {entries.map((entry, index) => <div className="subject-row" key={entry.id}><label className="field"><span>{label} subject {index + 1}</span><input list={`subjects-${level}`} maxLength={100} value={entry.subject} onChange={event => changeSubject(entry.id, { subject: event.target.value })} placeholder="Choose or type a subject" /></label><label className="field"><span>Grade</span><select value={entry.grade} onChange={event => changeSubject(entry.id, { grade: event.target.value as SubjectGrade['grade'] })}><option value="">Select grade</option>{['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'].map(grade => <option key={grade}>{grade}</option>)}</select></label>{level === 'aLevels' && <label className="check-row subject-predicted"><input type="checkbox" checked={entry.predicted} onChange={event => changeSubject(entry.id, { predicted: event.target.checked })} /><span>Predicted</span></label>}<button className="button ghost icon-button" type="button" aria-label={`Remove ${label} subject ${index + 1}`} onClick={() => set(level, entries.filter(item => item.id !== entry.id))}><Trash size={18} /></button></div>)}
      <datalist id={`subjects-${level}`}>{SUBJECTS.map(subject => <option key={subject} value={subject} />)}</datalist>
      <button className="button secondary" type="button" disabled={entries.length >= 12} onClick={() => set(level, [...entries, { id: crypto.randomUUID(), subject: '', grade: '', predicted: level === 'aLevels' && draft.stage === 'awaiting' }])}><Plus size={17} /> Add {label} subject</button>
    </div>;
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAttempted(true);
    if (errors.length) { notify('Check the profile details before saving.'); return; }
    const category = programmeCategory(draft.programme);
    update({ profile: { ...draft, name: draft.name.trim(), city: draft.city.trim(), curriculum: draft.higherSecondary ?? draft.curriculum, major: category ?? draft.major, mathematics: summary.math, isDemo: false } });
    setFresh(false); setAttempted(false); notify('Your profile is saved.');
  }

  return <div className="stack profile-page">
    <header className="page-heading"><div><h1>Your profile</h1><p>Your education, interests and experiences, in one place.</p></div></header>
    {data.profile.isDemo && <div className="inline-note"><div><strong>{fresh ? 'Ready for your details.' : 'You’re viewing a sample profile.'}</strong><p>Save your details below to update your university planning.</p></div><button className="button secondary" type="button" onClick={() => { setDraft({ ...blank, isDemo: data.profile.isDemo }); setFresh(true); setAttempted(false); }}>Use my own details</button></div>}
    <form className="stack" onSubmit={save} noValidate>
      {attempted && errors.length > 0 && <div className="inline-note" role="alert"><div><strong>Please check these details</strong><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div></div>}
      <section className="panel"><div className="panel-header"><h2>About you</h2></div><div className="form-grid">
        <label className="field"><span>Name</span><input autoComplete="given-name" maxLength={60} value={draft.name} onChange={event => set('name', event.target.value)} placeholder="Your name" /></label>
        <label className="field"><span>City</span><input autoComplete="address-level2" maxLength={80} value={draft.city} onChange={event => set('city', event.target.value)} placeholder="e.g. Lahore" /></label>
        <label className="field"><span>What would you like to study?</span><select value={draft.programme ?? ''} onChange={event => { const category = programmeCategory(event.target.value); setDraft(previous => ({ ...previous, programme: event.target.value || undefined, major: category ?? previous.major })); }}><option value="">Choose a subject</option>{PROGRAMME_GROUPS.map(group => <optgroup key={group.label} label={group.label}>{group.programmes.map(programme => <option value={programme.id} key={programme.id}>{programme.label}</option>)}</optgroup>)}</select><small className="muted">{draft.programme && programmeCategory(draft.programme) === null ? 'You can explore this subject anywhere. The NUST/FAST aggregate calculator only covers computing, engineering and business.' : 'You can change this any time. Availability varies by university and campus.'}</small></label>
        {scoreField('familyIncome', 'Family’s earnings per month (PKR)', 'Optional. A rough total for the household. Used only to flag affordability; it never decides an aid award.', 0, 100_000_000, '1')}
      </div>{draft.budget !== '' && <p className="muted">Your earlier yearly budget of PKR {draft.budget.toLocaleString()} is still saved separately.</p>}</section>

      <section className="panel stack"><div className="panel-header"><div><h2>School results</h2><p className="muted">Matric or O Levels.</p></div></div><label className="field"><span>Which one did you do?</span><select value={draft.secondary ?? 'matric'} onChange={event => setDraft(previous => ({ ...previous, secondary: event.target.value as Profile['secondary'], ...(event.target.value === 'olevel' && previous.oLevels === undefined ? { oLevels: [] } : {}) }))}><option value="matric">Matric / SSC</option><option value="olevel">O Levels / IGCSE</option></select></label>
        {draft.secondary === 'olevel' ? <>{subjectEditor('oLevels')}<label className="field"><span>Year you finished O Levels</span><input type="number" min={2000} max={2100} step={1} value={draft.examYear ?? ''} onChange={event => set('examYear', event.target.value === '' ? undefined : Number(event.target.value))} placeholder="e.g. 2026" /><small className="muted">Needed because the equivalence rule for science students changed for students finishing O Levels in 2026 or later.</small></label>{draft.oLevels === undefined && draft.ssc !== '' && <p className="inline-note">Your earlier Matric-equivalent percentage ({draft.ssc}%) stays in use until you add subject grades.</p>}</> : scoreField('ssc', 'Matric percentage', 'Your marks ÷ total marks × 100. For example 950 / 1100 = 86.36%.')}
      </section>

      <section className="panel stack"><div className="panel-header"><div><h2>College results</h2><p className="muted">FSc / Intermediate or A Levels.</p></div></div><div className="form-grid"><label className="field"><span>Which one are you doing?</span><select value={draft.higherSecondary ?? draft.curriculum} onChange={event => setDraft(previous => ({ ...previous, higherSecondary: event.target.value as Profile['higherSecondary'], curriculum: event.target.value as Profile['curriculum'], ...(event.target.value === 'alevel' && previous.aLevels === undefined ? { aLevels: [] } : {}) }))}><option value="fsc">FSc / FA / ICS / Intermediate</option><option value="alevel">A Levels</option></select></label><label className="field"><span>Have you got your final result?</span><select value={draft.stage} onChange={event => set('stage', event.target.value as Profile['stage'])}><option value="awaiting">Not yet — I’ll use predicted grades</option><option value="completed">Yes, I have my final result</option></select></label></div>
        {draft.higherSecondary === 'alevel' ? <>{subjectEditor('aLevels')}{draft.stage === 'completed' && draft.aLevels?.some(entry => entry.predicted) && <p className="inline-note">Some grades are still marked predicted. Untick “Predicted” once you have the actual result; predicted grades are left out of final-result calculations.</p>}{draft.aLevels === undefined && draft.hssc !== '' && <p className="inline-note">Your earlier FSc-equivalent percentage ({draft.hssc}%) is kept.</p>}</> : <><div className="form-grid">{scoreField('hssc', draft.stage === 'awaiting' ? 'FSc Part 1 percentage (actual)' : 'Final FSc percentage', draft.stage === 'awaiting' ? 'Your published Part 1 result. Leave blank if you don’t have it yet.' : 'Your combined final result: marks ÷ total × 100.')}{draft.stage === 'awaiting' && scoreField('predictedHssc', 'Predicted final FSc percentage', 'What you expect to get overall. Kept separate from your actual Part 1 marks.')}</div><label className="check-row"><input type="checkbox" checked={draft.mathematics} onChange={event => set('mathematics', event.target.checked)} /><span>I studied Mathematics in FSc / ICS.</span></label></>}
        <div className="academic-preview"><h3>{summary.isEstimate ? 'Your percentages for planning' : 'Your saved percentages'}</h3><div className="academic-preview-values"><span>Matric-equivalent <strong>{summary.ssc === null ? 'More details needed' : `${summary.ssc.toFixed(2)}%`}</strong></span><span>FSc-equivalent <strong>{summary.hssc === null ? 'More details needed' : `${summary.hssc.toFixed(2)}%`}</strong></span></div>{summary.notes.length > 0 && <details><summary>How these numbers are worked out</summary><ul>{summary.notes.map(note => <li key={note}>{note}</li>)}</ul></details>}{(draft.secondary === 'olevel' || draft.higherSecondary === 'alevel') && <p className="muted">Your grades are converted the way IBCC does it, so you never have to enter an equivalence percentage yourself. Planning only: A* counts as 90 and only IBCC can issue the official certificate. <a href={IBCC_SOURCES[0].url} target="_blank" rel="noreferrer">IBCC rules ↗</a></p>}</div>
      </section>

      <section className="panel"><div className="panel-header"><div><h2>Test scores</h2><p className="muted">Only scores you actually have. Try future scores in the planner.</p></div><button className="button ghost" type="button" onClick={() => navigate('planner')}>Score planner <ArrowRight size={16} /></button></div><div className="form-grid">{scoreField('net', 'NUST NET score', 'Out of 200.', 0, 200, '1')}{scoreField('nu', 'FAST NU test score (%)', 'Your percentage after negative marking.', 0, 100)}{scoreField('sat', 'SAT score', 'Total out of 1600, in steps of 10.', 400, 1600, '10')}</div></section>

      <section className="panel stack"><div className="panel-header"><div><h2>Activities</h2><p className="muted">Up to 10: clubs, projects, work, sports, volunteering, family responsibilities. Each one gets its own description and dates.</p></div><span className="badge">{activityEntries.length} / 10</span></div>
        {activityEntries.length === 0 && <p className="muted">Add your first activity. What you did, your role and how long you did it for matter more than the number of entries.</p>}
        {activityEntries.map((activity, index) => <fieldset className="activity-editor" key={activity.id}><legend>Activity {index + 1}{activity.title ? ` · ${activity.title}` : ''}</legend><div className="form-grid">
          <label className="field"><span>Activity name</span><input maxLength={120} value={activity.title} onChange={event => editActivity(activity.id, { title: event.target.value })} placeholder="e.g. Science club website" /></label>
          <label className="field"><span>Type</span><select value={activity.type} onChange={event => editActivity(activity.id, { type: event.target.value })}>{ACTIVITY_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
          <label className="field"><span>Your role</span><input maxLength={100} value={activity.role} onChange={event => editActivity(activity.id, { role: event.target.value })} placeholder="e.g. Developer and coordinator" /></label>
          <label className="field"><span>Where</span><input maxLength={140} value={activity.organization} onChange={event => editActivity(activity.id, { organization: event.target.value })} placeholder="School, club, workplace, home or on your own" /></label>
        </div><label className="field"><span>Description — what did you do, and what came of it?</span><textarea rows={3} maxLength={5000} value={activity.description} onChange={event => editActivity(activity.id, { description: event.target.value })} placeholder="Your own contribution and any results. Specific and honest beats impressive-sounding." /></label><div className="form-grid">
          <label className="field"><span>Start date</span><input type="date" min="1900-01-01" max="2100-12-31" value={activity.startDate} onChange={event => editActivity(activity.id, { startDate: event.target.value })} /></label>
          <label className="field"><span>End date</span><input type="date" min={activity.startDate || '1900-01-01'} max="2100-12-31" value={activity.endDate} disabled={activity.ongoing} onChange={event => editActivity(activity.id, { endDate: event.target.value })} /></label>
          <label className="field"><span>Hours per week</span><input type="number" min={0} max={168} step="0.5" value={activity.hoursPerWeek} onChange={event => editActivity(activity.id, { hoursPerWeek: event.target.value === '' ? '' : Number(event.target.value) })} /></label>
          <label className="field"><span>Weeks per year</span><input type="number" min={0} max={52} step={1} value={activity.weeksPerYear} onChange={event => editActivity(activity.id, { weeksPerYear: event.target.value === '' ? '' : Number(event.target.value) })} /></label>
        </div><div className="panel-header"><label className="check-row"><input type="checkbox" checked={activity.ongoing} onChange={event => editActivity(activity.id, { ongoing: event.target.checked, ...(event.target.checked ? { endDate: '' } : {}) })} /><span>I’m still doing this</span></label><button type="button" className="button ghost" onClick={() => set('activityEntries', activityEntries.filter(item => item.id !== activity.id))}><Trash size={16} /> Remove activity {index + 1}</button></div></fieldset>)}
        <button type="button" className="button secondary" disabled={activityEntries.length >= 10} onClick={() => set('activityEntries', [...activityEntries, newActivity()])}><Plus size={17} /> Add an activity</button>
        {draft.activities.trim() && <details className="legacy-notes"><summary>Original activity notes (preserved)</summary><p style={{ whiteSpace: 'pre-wrap' }}>{draft.activities}</p><p className="muted">These original notes remain in your backup. Your structured entries can be edited independently.</p></details>}
      </section>
      <div className="panel-header profile-save"><p className="muted">{changed ? 'You have unsaved changes.' : <><Check size={16} /> Your saved profile is up to date.</>}</p><div className="button-row"><button className="button secondary" type="button" disabled={!changed} onClick={() => { setDraft(migrateProfile(data.profile)); setFresh(false); setAttempted(false); }}><ArrowCounterClockwise size={16} /> Undo changes</button><button className="button" type="submit"><FloppyDisk size={17} /> Save profile</button></div></div>
    </form>
  </div>;
}
