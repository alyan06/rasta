import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookmarkSimple, Check, Globe, Info, MapPin, Sparkle, TrendUp, TrendDown, Minus } from '@phosphor-icons/react';
import type { University, WorkspaceProps } from '../types';
import { universities } from '../lib/admissions';
import { PROGRAMMES } from '../lib/academics';
import { BANDS, checkChances } from '../lib/chancing';
import { US_DATA_YEAR, US_STATES } from '../lib/catalogue';
import { ChanceMeter, UniversityLogo } from './UniversityBits';

interface Stat { label: string; value: string; note?: string; source?: string }
function universityStats(university: University): Stat[] {
  const facts = university.facts;
  const stats: Stat[] = [];
  const cohort = facts ? `${facts.year} · IPEDS` : '';
  if (facts?.acceptanceRate !== undefined) stats.push({ label: 'Acceptance rate', value: `${facts.acceptanceRate}%`, note: `${facts.admitted?.toLocaleString()} admitted of ${facts.applicants?.toLocaleString()} applicants · ${cohort}`, source: facts.source });
  if (university.satStats) stats.push({ label: university.satStats.label, value: university.satStats.low !== undefined ? `${university.satStats.low}–${university.satStats.high}` : String(university.satStats.average), note: university.satStats.cohort, source: university.satStats.source });
  if (facts?.act25 !== undefined) stats.push({ label: 'ACT middle 50%', value: `${facts.act25}–${facts.act75}`, note: `Enrolled students who submitted ACT · ${cohort}`, source: facts.source });
  if (facts?.undergraduates) stats.push({ label: 'Undergraduates', value: facts.undergraduates.toLocaleString(), note: `Total undergraduate enrolment · ${cohort}`, source: facts.source });
  if (facts?.tuitionInternational) stats.push({ label: 'Tuition & fees (international)', value: `$${facts.tuitionInternational.toLocaleString()}`, note: `Published out-of-state rate per year${facts.roomAndBoard ? ` · room & board about $${facts.roomAndBoard.toLocaleString()}` : ''} · ${cohort}`, source: facts.source });
  if (facts?.testPolicy) stats.push({ label: 'Test policy', value: facts.testPolicy === 'required' ? 'SAT/ACT required' : facts.testPolicy === 'optional' ? 'Test-optional' : 'Test-blind', note: facts.testPolicy === 'optional' ? 'Scores are considered only if you send them.' : facts.testPolicy === 'blind' ? 'Scores are not considered even if sent.' : 'You must submit an SAT or ACT score.' });
  if (facts?.satSubmitters !== undefined && university.country === 'USA') stats.push({ label: 'Submitted SAT', value: `${facts.satSubmitters}%`, note: `Share of first-year students who submitted an SAT score · ${cohort}` });
  for (const stat of university.stats ?? []) if (!(facts?.undergraduates && /undergraduates/i.test(stat.label))) stats.push({ label: stat.label, value: stat.value, source: stat.source });
  if (facts?.control || facts?.locale) stats.push({ label: 'Type & setting', value: [facts.control === 'public' ? 'Public' : facts.control === 'for-profit' ? 'For-profit' : facts.control === 'private' ? 'Private' : null, facts.locale ? facts.locale[0].toUpperCase() + facts.locale.slice(1) : null].filter(Boolean).join(' · '), note: [facts.category && facts.category !== 'General' ? facts.category : null, facts.hbcu ? 'Historically Black college or university' : null].filter(Boolean).join(' · ') || undefined });
  if (facts?.campuses) stats.push({ label: 'Campuses', value: facts.campuses.split(';').length > 3 ? `${facts.campuses.split(';').length} campuses` : facts.campuses.replace(/;\s*/g, ' · '), note: facts.campuses.split(';').length > 3 ? facts.campuses.replace(/;\s*/g, ' · ') : undefined });
  if (facts?.established) stats.push({ label: 'Established', value: facts.established, note: 'From the HEC institution record' });
  if (!stats.length) stats.push({ label: 'Testing route', value: university.testLabel, note: 'Check the current cycle and your degree requirements.' });
  return stats;
}

export default function UniversityPage({ universityId, data, update, navigate, notify }: WorkspaceProps & { universityId: string }) {
  const university = universities.find(item => item.id === universityId);
  const [reviewed, setReviewed] = useState(false);
  const [meritOverride, setMeritOverride] = useState<number | ''>('');
  const review = useMemo(() => university ? checkChances(university, data.profile, meritOverride === '' ? {} : { meritReference: meritOverride }) : null, [university, data.profile, meritOverride]);
  if (!university || !review) return <section className="panel empty-state"><h1>University not found</h1><button className="button" onClick={() => navigate('universities')}>Explore universities</button></section>;
  const saved = data.saved.includes(university.id);
  const facts = university.facts;
  const stats = universityStats(university);
  const location = `${university.city}${university.country === 'Pakistan' && facts?.state ? `, ${facts.state}` : university.country === 'USA' && facts?.state && !university.city.includes(',') ? `, ${US_STATES[facts.state] ?? facts.state}` : ''} · ${university.country}`;
  const toggleSave = () => { update({ saved: saved ? data.saved.filter(id => id !== university.id) : [...data.saved, university.id] }); notify(saved ? 'Removed from your wishlist.' : 'Added to your wishlist.'); };
  const startApplication = () => {
    update({ saved: saved ? data.saved : [...data.saved, university.id], applications: data.applications.some(item => item.universityId === university.id) ? data.applications : [...data.applications, { universityId: university.id, status: 'Researching', deadline: '', completedSteps: [], notes: '' }] });
    navigate('applications');
  };
  const kicker = university.coverage === 'verified' ? 'Reviewed admissions overview' : university.coverage === 'data' ? `Published statistics · IPEDS ${US_DATA_YEAR}` : university.country === 'Pakistan' ? 'HEC-recognised institution' : 'Institution directory';
  const band = review.band ? BANDS[review.band] : null;

  return <div className="university-detail stack">
    <button className="text-button detail-back" onClick={() => navigate('universities')}><ArrowLeft size={17} /> All universities</button>
    <header className="university-detail-header">
      <div className="university-detail-title"><UniversityLogo university={university} size="large" /><div><span className="page-kicker">{kicker}</span><h1>{university.name}</h1><p className="location"><MapPin size={15} /> {location}</p></div></div>
      <div className="detail-actions"><button className={`button ${saved ? 'secondary' : ''}`} onClick={toggleSave}><BookmarkSimple size={18} weight={saved ? 'fill' : 'regular'} />{saved ? 'On your wishlist' : 'Add to wishlist'}</button>{university.website && !/hec\.gov\.pk/.test(university.website) && <a className="button secondary" href={university.website} target="_blank" rel="noreferrer"><Globe size={18} /> Website</a>}</div>
    </header>
    <p className="detail-intro">{university.description}</p>
    <section className="university-stats" aria-label="University facts">{stats.map(stat => <div className="university-stat" key={stat.label}><span>{stat.label}</span><strong className={stat.value.length > 12 ? 'stat-text' : ''}>{stat.value}</strong>{stat.note && <p>{stat.note}</p>}{stat.source && <a href={stat.source} target="_blank" rel="noreferrer">Source <ArrowUpRight size={14} /></a>}</div>)}</section>
    {university.satStats?.low !== undefined && <p className="muted stat-context-note">Middle 50% is the range between the 25th and 75th percentiles of enrolled students who submitted scores; a quarter scored below it and a quarter above. It is not a cutoff.</p>}

    <section className="panel chance-panel" id="chances">
      <div className="panel-header"><div><span className="page-kicker">Your profile, in context</span><h2>{data.profile.isDemo ? `The sample student’s chances at ${university.shortName}` : `${data.profile.name.split(' ')[0] || 'Your'}${data.profile.name ? '’s' : ''} chances at ${university.shortName}`}</h2><p className="muted">{data.profile.isDemo ? 'You are viewing a sample profile. Set up your own to see where you stand.' : 'An estimate from published data and your profile, with every factor shown. Not a decision, and not a prediction of what an admissions office will do.'}</p></div>
        <div className="button-row">{data.profile.isDemo && <button className="button secondary" onClick={() => navigate('profile')}>Set up my profile <ArrowUpRight size={18} /></button>}<button className="button" onClick={() => setReviewed(true)}><Sparkle size={18} /> {reviewed ? 'Refresh my chances' : 'Check my chances'}</button></div>
      </div>
      {reviewed && <div className="chance-results" aria-live="polite">
        {review.probability !== null && band ? <div className="chance-headline">
          <div className="chance-number"><strong>{review.probability}%</strong><span className={`badge chance-badge chance-${review.band}`}>{band.label}</span></div>
          <div className="chance-copy"><p><strong>{band.label}</strong> · {band.range} band. {review.summary}</p><ChanceMeter probability={review.probability} /></div>
        </div> : <div className="chance-headline"><div className="chance-number"><strong className="stat-text">{review.label}</strong></div><div className="chance-copy"><p>{review.summary}</p></div></div>}
        {review.meritReference && <div className="merit-reference"><label className="field"><span>Closing aggregate to compare with (%)</span><input type="number" min={0} max={100} step={0.1} value={meritOverride === '' ? review.meritReference.value : meritOverride} onChange={event => setMeritOverride(event.target.value === '' ? '' : Number(event.target.value))} /><small className="muted">{review.meritReference.label}. Reported by students, not official — replace it with this year’s merit list for your exact programme and campus. <a href={review.meritReference.source} target="_blank" rel="noreferrer">Where this came from ↗</a></small></label>{meritOverride !== '' && <button className="text-button" onClick={() => setMeritOverride('')}>Use the reported figure</button>}</div>}
        {review.factors.length > 0 && <div className="chance-factors"><h3>How this number was reached</h3><p className="muted">{review.method}</p><ul>{review.factors.map(factor => <li key={factor.label} className={`chance-factor-row ${factor.effect}`}><span className="chance-factor-icon">{factor.effect === 'up' ? <TrendUp size={17} /> : factor.effect === 'down' ? <TrendDown size={17} /> : <Minus size={17} />}</span><div><strong>{factor.label}</strong><p>{factor.detail}</p></div></li>)}</ul></div>}
        {review.improvements.length > 0 && <div className="chance-improvements"><h3>What would move it</h3><ul>{review.improvements.map(item => <li key={item.label}><span>{item.label}</span><strong>{item.from}% → {item.to}%</strong></li>)}</ul><button className="text-button" onClick={() => navigate('planner')}>Plan my test scores <ArrowUpRight size={14} /></button></div>}
        <div className="readiness-signals">{review.signals.map(signal => <div className={`readiness-signal ${signal.status}`} key={signal.title}><h3>{signal.status === 'ready' && <Check size={16} />} {signal.title}</h3><p>{signal.detail}</p>{signal.page && <button className="text-button" onClick={() => navigate(signal.page!)}>Open {signal.page === 'planner' ? 'score planner' : signal.page === 'profile' ? 'my profile' : signal.page} <ArrowUpRight size={14} /></button>}</div>)}</div>
        {review.assessment.missing.length > 0 && <div className="review-checks"><h3>Still to confirm</h3><ul>{review.assessment.missing.map(item => <li key={item}>{item}</li>)}</ul></div>}
        <p className="muted chance-disclaimer"><Info size={14} /> Rasta’s estimate uses public statistics about previous classes and a transparent formula. Real decisions depend on essays, recommendations, the year’s applicant pool and factors no calculator can see.</p>
      </div>}
    </section>

    <div className="university-detail-grid">
      <section className="panel"><h2>Requirements</h2><ul className="requirements-list">{university.requirements.map(item => <li key={item}>{item}</li>)}</ul>{university.coverage === 'verified' && <><h3>Programmes in this overview</h3><p>{university.programmes?.length ? university.programmes.map(id => PROGRAMMES.find(item => item.id === id)?.label ?? id).join(' · ') : 'Programme availability needs review on the institution’s website.'}</p><p className="muted">This overview is not a complete course catalogue. Confirm campus, intake and subject requirements for your chosen degree.</p></>}</section>
      <section className="panel"><h2>Costs and financial aid</h2><p>{university.aid}</p>{facts?.tuitionInternational && <p className="muted">At roughly Rs 280 per US dollar, tuition and fees alone are about Rs {(facts.tuitionInternational * 280 / 1_000_000).toFixed(1)} million a year before aid. Exchange rates change; check the current rate.</p>}<button className="text-button" onClick={() => navigate('profile')}>Review my family’s earnings <ArrowUpRight size={15} /></button><h3>Plan your next test</h3><p>{university.model !== 'holistic' ? `See the ${university.model === 'nust' ? 'NET' : 'NU test'} score you need for a target aggregate.` : university.satStats ? 'Keep this SAT range in your planner alongside your other goals.' : 'Add this university to your wishlist to keep its test route with your other goals.'}</p><button className="button secondary" onClick={() => { if (!saved) update({ saved: [...data.saved, university.id] }); navigate('planner'); }}>Open my score planner <ArrowUpRight size={16} /></button></section>
    </div>
    <section className="panel"><div className="panel-header"><h2>How to apply</h2><button className="button secondary" onClick={startApplication}>Create my checklist <ArrowUpRight size={16} /></button></div><ol className="application-steps">{university.applicationSteps.map(step => <li key={step}>{step}</li>)}</ol></section>
    <section className="panel"><h2>Official sources</h2><div className="source-list">{university.website && <a href={university.website} target="_blank" rel="noreferrer">{/hec\.gov\.pk/.test(university.website) ? 'HEC institution record' : 'University website'} <ArrowUpRight size={16} /></a>}{university.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <span>Checked {source.checked}</span><ArrowUpRight size={16} /></a>)}</div><p className="muted">Rasta is independent. University names and marks identify institutions and do not imply affiliation. Logos are loaded from each institution’s own website.</p></section>
  </div>;
}
