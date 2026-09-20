import { useMemo, useState } from 'react';
import { BookmarkSimple, Buildings, GraduationCap, MagnifyingGlass, MapPin, PencilSimpleLine, SlidersHorizontal } from '@phosphor-icons/react';
import type { University, UniversityFacts, WorkspaceProps } from '../types';
import { universities } from '../lib/admissions';
import { US_DATA_YEAR, US_STATES, PK_PROVINCES, catalogueCoverage, givesScholarships } from '../lib/catalogue';
import { PROGRAMME_GROUPS } from '../lib/academics';
import { UniversityLogo } from './UniversityBits';

export { UniversityLogo } from './UniversityBits';

type Sort = 'relevance' | 'selective' | 'open' | 'largest' | 'cheapest' | 'name';
const selectivityBands = [
  { id: 'all', label: 'Any admit rate' },
  { id: 'under10', label: 'Under 10% (most selective)', test: (rate: number) => rate < 10 },
  { id: '10-25', label: '10–25%', test: (rate: number) => rate >= 10 && rate < 25 },
  { id: '25-50', label: '25–50%', test: (rate: number) => rate >= 25 && rate < 50 },
  { id: '50-75', label: '50–75%', test: (rate: number) => rate >= 50 && rate < 75 },
  { id: 'over75', label: 'Over 75% (most open)', test: (rate: number) => rate >= 75 },
] as const;

export function testChip(university: University): { label: string; tone: 'good' | 'caution' | 'neutral' } {
  if (university.model === 'nust') return { label: 'NET entry test', tone: 'neutral' };
  if (university.model === 'fast') return { label: 'NU test or SAT', tone: 'neutral' };
  if (university.id === 'lums') return { label: 'SAT, ACT or LCAT', tone: 'neutral' };
  switch (university.facts?.testPolicy) {
    case 'required': return { label: 'SAT/ACT required', tone: 'caution' };
    case 'optional': return { label: 'SAT optional', tone: 'good' };
    case 'blind': return { label: 'No SAT needed', tone: 'good' };
    default: return { label: university.country === 'Pakistan' ? 'Entry test · check' : 'Test policy · check', tone: 'neutral' };
  }
}
export function scholarshipChip(facts?: UniversityFacts): { label: string; tone: 'good' | 'neutral'; known: boolean } {
  const gives = givesScholarships(facts);
  if (gives === undefined) return { label: 'Scholarships · check', tone: 'neutral', known: false };
  if (!gives) return { label: 'No institutional aid reported', tone: 'neutral', known: true };
  return { label: facts?.scholarshipPct !== undefined ? `Scholarships · ${facts.scholarshipPct}% of first-years` : 'Scholarships available', tone: 'good', known: true };
}

export default function UniversitiesPage({ data, update, navigate, notify }: WorkspaceProps) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [region, setRegion] = useState('all');
  const [selectivity, setSelectivity] = useState<(typeof selectivityBands)[number]['id']>('all');
  const [testPolicy, setTestPolicy] = useState('all');
  const [scholarships, setScholarships] = useState('all');
  const [control, setControl] = useState('all');
  const [programme, setProgramme] = useState('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('relevance');
  const [moreFilters, setMoreFilters] = useState(false);
  const [limit, setLimit] = useState(24);
  const reset = () => setLimit(24);
  const regions = country === 'Pakistan' ? PK_PROVINCES.map(name => [name, name]) : country === 'USA' ? Object.entries(US_STATES).sort((a, b) => a[1].localeCompare(b[1])) : [];

  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const band = selectivityBands.find(item => item.id === selectivity);
    const list = universities.filter(university => {
      const facts = university.facts;
      if (country !== 'all' && university.country !== country) return false;
      if (region !== 'all' && facts?.state !== region) return false;
      if (savedOnly && !data.saved.includes(university.id)) return false;
      if (band && 'test' in band && (facts?.acceptanceRate === undefined || !band.test(facts.acceptanceRate))) return false;
      if (testPolicy !== 'all' && facts?.testPolicy !== testPolicy) return false;
      if (scholarships === 'yes' && givesScholarships(facts) !== true) return false;
      if (scholarships === 'generous' && !(facts?.scholarshipPct !== undefined && facts.scholarshipPct >= 50)) return false;
      if (control !== 'all' && facts?.control !== control) return false;
      if (programme !== 'all' && university.coverage === 'verified' && !university.programmes?.includes(programme)) return false;
      if (needle && !`${university.name} ${university.shortName} ${university.city} ${facts?.state ?? ''} ${US_STATES[facts?.state ?? ''] ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    // Reviewed entries first; then everything with facts (all Pakistani entries carry HEC facts); identity-only US rows last.
    const rank = (university: University) => (university.coverage === 'verified' ? 0 : university.coverage === 'data' || university.country === 'Pakistan' ? 1 : 2);
    const rate = (university: University) => university.facts?.acceptanceRate ?? 101;
    return list.sort((a, b) => {
      if (sort === 'selective') return rate(a) - rate(b) || a.name.localeCompare(b.name);
      if (sort === 'open') return (b.facts?.acceptanceRate ?? -1) - (a.facts?.acceptanceRate ?? -1) || a.name.localeCompare(b.name);
      if (sort === 'largest') return (b.facts?.undergraduates ?? -1) - (a.facts?.undergraduates ?? -1) || a.name.localeCompare(b.name);
      if (sort === 'cheapest') return (a.facts?.tuitionInternational ?? Infinity) - (b.facts?.tuitionInternational ?? Infinity) || a.name.localeCompare(b.name);
      if (sort === 'name') return a.name.localeCompare(b.name);
      const exact = (university: University) => needle && (university.shortName.toLowerCase() === needle || university.name.toLowerCase().startsWith(needle)) ? -1 : 0;
      return exact(a) - exact(b) || rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
  }, [query, country, region, selectivity, testPolicy, scholarships, control, programme, savedOnly, sort, data.saved]);

  const toggleSave = (university: University) => {
    const saved = data.saved.includes(university.id);
    update({ saved: saved ? data.saved.filter(id => id !== university.id) : [...data.saved, university.id] });
    notify(saved ? `${university.shortName} removed from your wishlist.` : `${university.shortName} added to your wishlist.`);
  };
  const clearAll = () => { setQuery(''); setCountry('all'); setRegion('all'); setSelectivity('all'); setTestPolicy('all'); setScholarships('all'); setControl('all'); setProgramme('all'); setSavedOnly(false); setSort('relevance'); reset(); };
  const activeFilters = [region !== 'all', selectivity !== 'all', testPolicy !== 'all', scholarships !== 'all', control !== 'all', programme !== 'all'].filter(Boolean).length;

  return <div className="universities-page stack">
    <header className="page-heading"><span className="page-kicker">Find your next chapter</span><h1>Explore universities</h1><p>Every HEC-recognised university in Pakistan and every four-year US university. Open one to see its numbers and check your chances.</p></header>
    <div className="catalogue-summary"><span><strong>{catalogueCoverage.Pakistan.toLocaleString()}</strong> in Pakistan</span><span><strong>{catalogueCoverage.USA.toLocaleString()}</strong> in the USA</span><span><strong>{catalogueCoverage.withAdmissionsData.toLocaleString()}</strong> with admit rates &amp; scores</span></div>
    <div className="filter-toolbar" data-tour="explore">
      <label className="search-field"><MagnifyingGlass size={20} /><input aria-label="Search universities" placeholder="Search by university, city or state" value={query} onChange={event => { setQuery(event.target.value); reset(); }} /></label>
      <select className="filter-select" aria-label="Destination" value={country} onChange={event => { setCountry(event.target.value); setRegion('all'); reset(); }}><option value="all">Pakistan &amp; USA</option><option>Pakistan</option><option>USA</option></select>
      <select className="filter-select" aria-label="Sort" value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="relevance">Best match first</option><option value="selective">Most selective first</option><option value="open">Easiest to get into first</option><option value="largest">Largest first</option><option value="cheapest">Lowest tuition first</option><option value="name">A to Z</option></select>
      <button className={`button secondary ${savedOnly ? 'selected' : ''}`} aria-pressed={savedOnly} onClick={() => { setSavedOnly(!savedOnly); reset(); }}><BookmarkSimple size={18} weight={savedOnly ? 'fill' : 'regular'} /> Wishlist ({data.saved.length})</button>
      <button className={`button secondary ${moreFilters ? 'selected' : ''}`} aria-expanded={moreFilters} onClick={() => setMoreFilters(!moreFilters)}><SlidersHorizontal size={18} /> Filters{activeFilters ? ` (${activeFilters})` : ''}</button>
    </div>
    {moreFilters && <div className="catalogue-filters">
      {country !== 'all' && <label>{country === 'Pakistan' ? 'Province' : 'State'}<select value={region} onChange={event => { setRegion(event.target.value); reset(); }}><option value="all">Anywhere in {country === 'Pakistan' ? 'Pakistan' : 'the USA'}</option>{regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>}
      <label>SAT / ACT<select value={testPolicy} onChange={event => { setTestPolicy(event.target.value); reset(); }}><option value="all">Any test policy</option><option value="required">Required</option><option value="optional">Optional</option><option value="blind">Not considered</option></select></label>
      <label>Scholarships<select value={scholarships} onChange={event => { setScholarships(event.target.value); reset(); }}><option value="all">Any</option><option value="yes">Gives scholarships</option><option value="generous">Half or more of first-years get aid</option></select></label>
      <label>Admit rate<select value={selectivity} onChange={event => { setSelectivity(event.target.value as typeof selectivity); reset(); }}>{selectivityBands.map(band => <option key={band.id} value={band.id}>{band.label}</option>)}</select></label>
      <label>Type<select value={control} onChange={event => { setControl(event.target.value); reset(); }}><option value="all">Public or private</option><option value="public">Public</option><option value="private">Private</option></select></label>
      <label>Programme<select value={programme} onChange={event => { setProgramme(event.target.value); reset(); }}><option value="all">All programmes</option>{PROGRAMME_GROUPS.map(group => <optgroup key={group.label} label={group.label}>{group.programmes.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
      {activeFilters > 0 && <button className="text-button" onClick={clearAll}>Clear filters</button>}
      {programme !== 'all' && <p className="muted">Programme lists are only verified for the six reviewed universities; other entries stay included so you can check their catalogues.</p>}
    </div>}
    <div className="results-heading"><p><strong>{results.length.toLocaleString()}</strong> {results.length === 1 ? 'university' : 'universities'}{savedOnly ? ' on your wishlist' : ''}</p><span className="muted">Showing {Math.min(limit, results.length).toLocaleString()}</span></div>
    <div className="university-grid">{results.slice(0, limit).map(university => {
      const saved = data.saved.includes(university.id);
      const test = testChip(university);
      const aid = scholarshipChip(university.facts);
      const facts = university.facts;
      return <article className="university-card university-card-link" key={university.id}>
        <div className="uni-card-top"><UniversityLogo university={university} /><button className={`save-button ${saved ? 'saved' : ''}`} aria-label={`${saved ? 'Remove' : 'Add'} ${university.shortName} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={() => toggleSave(university)}><BookmarkSimple size={21} weight={saved ? 'fill' : 'regular'} /></button></div>
        <h2><a className="card-stretch" href={`#university/${university.id}`} onClick={event => { event.preventDefault(); navigate(`university/${university.id}`); }}>{university.shortName}</a></h2>
        {university.shortName !== university.name && <p className="university-fullname">{university.name}</p>}
        <p className="location"><MapPin size={14} /> {university.city}{university.country === 'Pakistan' && facts?.state ? `, ${facts.state.replace('Islamabad Capital Territory', 'ICT').replace('Khyber Pakhtunkhwa', 'KP')}` : ''} · {university.country}</p>
        <div className="uni-chips"><span className={`badge ${test.tone}`}><PencilSimpleLine size={13} /> {test.label}</span><span className={`badge ${aid.tone}`}><GraduationCap size={13} /> {aid.label}</span></div>
      </article>;
    })}</div>
    {results.length === 0 && <section className="panel empty-state"><Buildings size={32} /><h2>No universities found</h2><p>Try another name or clear your filters.</p><button className="button secondary" onClick={clearAll}>Clear filters</button></section>}
    {limit < results.length && <div className="catalogue-load-more"><button className="button secondary" onClick={() => setLimit(limit + 24)}>Show 24 more universities</button></div>}
    <p className="muted">Sources: HEC recognised-institution registry (checked September 2026) and NCES IPEDS {US_DATA_YEAR} admissions, enrolment, cost and financial-aid files for active four-year US institutions. “Scholarships” means the share of full-time first-year students awarded the institution’s own grant aid ({US_DATA_YEAR}); international eligibility varies, so check each aid page. Six universities have hand-reviewed requirements.</p>
  </div>;
}
