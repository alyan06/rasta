import type { University, UniversityFacts } from '../types';
import catalogue from '../data/catalogue.json' with { type: 'json' };

/** Built by scripts/build-catalogue.mjs from the HEC registry (checked 2026-09-15, page facts scraped 2026-09-17)
 * and NCES IPEDS HD2024 + ADM2023 + DRVEF2023 + IC2023_AY. Directory records identify institutions and carry
 * their published statistics; they do not verify current programmes or eligibility rules. */
export const DIRECTORY_SOURCES = { Pakistan: catalogue.sources.pakistan, USA: catalogue.sources.usa };
export const US_DATA_YEAR = catalogue.sources.usaYear;

export const US_STATES: Record<string, string> = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', PR: 'Puerto Rico', GU: 'Guam', VI: 'U.S. Virgin Islands', AS: 'American Samoa', MP: 'Northern Mariana Islands', FM: 'Micronesia', MH: 'Marshall Islands', PW: 'Palau' };
export const PK_PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad Capital Territory', 'Azad Jammu & Kashmir', 'Gilgit Baltistan'];

type PkRow = [string, string, string, string, string, string, string, string, string, string];
type UsRow = [string, string, string, string, string, number, number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null, string, number, number | null];
const pkRows = catalogue.pakistan as PkRow[];
const usRows = catalogue.usa as UsRow[];
const testPolicies: Record<number, UniversityFacts['testPolicy']> = { 1: 'required', 5: 'optional', 3: 'blind' };
const controls: Record<number, UniversityFacts['control']> = { 1: 'public', 2: 'private', 3: 'for-profit' };
const round = (value: number, places = 1) => Math.round(value * 10 ** places) / 10 ** places;
export const compactNumber = (value: number) => value >= 1000 ? `${round(value / 1000, value >= 10000 ? 0 : 1)}k` : String(value);

export function usFacts(row: UsRow): UniversityFacts {
  const [, , , state, , control, undergraduates, applicants, admitted, enrolled, sat25, sat75, satSubmitters, act25, act75, policy, tuition, roomAndBoard, locale, hbcu] = row;
  const facts: UniversityFacts = { year: US_DATA_YEAR, source: DIRECTORY_SOURCES.USA, state, control: controls[control] };
  if (undergraduates !== null) facts.undergraduates = undergraduates;
  if (applicants !== null && admitted !== null && applicants > 0) { facts.applicants = applicants; facts.admitted = admitted; facts.acceptanceRate = round(Math.min(100, admitted / applicants * 100)); }
  if (enrolled !== null) facts.enrolled = enrolled;
  if (sat25 !== null && sat75 !== null) { facts.sat25 = sat25; facts.sat75 = sat75; }
  if (satSubmitters !== null) facts.satSubmitters = satSubmitters;
  if (act25 !== null && act75 !== null) { facts.act25 = act25; facts.act75 = act75; }
  if (policy !== null && testPolicies[policy]) facts.testPolicy = testPolicies[policy];
  if (tuition !== null) facts.tuitionInternational = tuition;
  if (roomAndBoard !== null) facts.roomAndBoard = roomAndBoard;
  if (locale) facts.locale = locale as UniversityFacts['locale'];
  if (hbcu) facts.hbcu = true;
  return facts;
}
export function pkFacts(row: PkRow): UniversityFacts {
  const [, , , province, , sector, category, campuses, established] = row;
  const facts: UniversityFacts = { year: '2026', source: DIRECTORY_SOURCES.Pakistan };
  if (province) facts.state = province;
  if (sector) facts.control = sector === 'Public' ? 'public' : 'private';
  if (category) facts.category = category;
  if (campuses) facts.campuses = campuses;
  if (established) facts.established = established;
  return facts;
}

const usIndex = new Map(usRows.map(row => [row[0], row]));
/** Facts for the six hand-researched entries, keyed by their short ids. */
export const coreFacts: Record<string, UniversityFacts | undefined> = {
  mit: usIndex.has('us-166683') ? usFacts(usIndex.get('us-166683')!) : undefined,
  amherst: usIndex.has('us-164465') ? usFacts(usIndex.get('us-164465')!) : undefined,
  asu: usIndex.has('us-104151') ? usFacts(usIndex.get('us-104151')!) : undefined,
  nust: { year: '2026', source: DIRECTORY_SOURCES.Pakistan, state: 'Islamabad Capital Territory', control: 'public', category: 'Engineering & Technology', campuses: 'Islamabad; Rawalpindi; Karachi; Risalpur; Quetta', established: '1991' },
  fast: { year: '2026', source: DIRECTORY_SOURCES.Pakistan, state: 'Punjab', control: 'private', category: 'General', campuses: 'Islamabad; Lahore; Karachi; Peshawar; Chiniot-Faisalabad', established: '2000' },
  lums: { year: '2026', source: DIRECTORY_SOURCES.Pakistan, state: 'Punjab', control: 'private', category: 'General', campuses: 'Lahore', established: '1985' },
};
const coreUsIds = new Set(['us-166683', 'us-164465', 'us-104151']);

export function describeUniversity(country: University['country'], facts: UniversityFacts, city: string): string {
  if (country === 'Pakistan') {
    const kind = facts.control === 'public' ? 'Public' : facts.control === 'private' ? 'Private' : 'HEC-recognised';
    const category = facts.category && facts.category !== 'General' ? ` ${facts.category.toLowerCase()}` : '';
    const established = facts.established ? `, established ${facts.established}` : '';
    return `${kind}${category} institution in ${city}${facts.state ? `, ${facts.state}` : ''}${established}. Check current programmes, tests and fees on the official website.`;
  }
  const kind = facts.control === 'public' ? 'Public' : facts.control === 'for-profit' ? 'Private for-profit' : 'Private non-profit';
  const size = facts.undergraduates ? ` with about ${compactNumber(facts.undergraduates)} undergraduates` : '';
  const rate = facts.acceptanceRate !== undefined ? ` Admitted ${facts.acceptanceRate}% of first-year applicants in ${US_DATA_YEAR}.` : '';
  const policy = facts.testPolicy === 'required' ? ' SAT/ACT required.' : facts.testPolicy === 'optional' ? ' Test-optional.' : facts.testPolicy === 'blind' ? ' Test scores not considered.' : '';
  return `${kind} university in ${city}${facts.state ? `, ${US_STATES[facts.state] ?? facts.state}` : ''}${size}.${rate}${policy}`;
}

const directoryRequirements = (country: University['country']) => country === 'Pakistan'
  ? ['Rasta has not yet reviewed this institution’s entry test, merit formula or subject rules. Use the official admissions page.', 'Most Pakistani universities need a minimum of 50–60% in Matric and FSc (or IBCC equivalence for O/A Levels) plus their own entry test or a recognised test such as NTS NAT, ECAT, MDCAT or SAT.']
  : ['Rasta has not individually reviewed this institution’s requirements; the statistics shown are its own published IPEDS figures.', 'International first-year applicants typically submit school transcripts, O/A Level or FSc results, English proficiency (TOEFL/IELTS/Duolingo) and, where required, SAT or ACT scores.'];

export const directoryUniversities: University[] = [
  ...pkRows.map(row => {
    const [id, name, city, , website, , , , , hecUrl] = row;
    const facts = pkFacts(row);
    return {
      id, name, shortName: name, city, country: 'Pakistan' as const, website: website || hecUrl, coverage: 'directory' as const, facts,
      description: describeUniversity('Pakistan', facts, city),
      majors: [], model: 'holistic' as const, testLabel: 'Entry test or recognised test · check the current policy', color: '#6e8176',
      requirements: directoryRequirements('Pakistan'),
      applicationSteps: ['Confirm the campus and programme', 'Check the merit formula and minimum marks', 'Register for the entry test or recognised test', 'Apply on the admissions portal before the deadline', 'Follow the merit lists and submit documents'],
      aid: 'Check the institution’s scholarships and need-based aid page directly.',
      sources: [{ label: 'HEC institution record', url: hecUrl, checked: '2026-09-17' }],
    };
  }),
  ...usRows.filter(row => !coreUsIds.has(row[0])).map(row => {
    const [id, name, city, state, website] = row;
    const facts = usFacts(row);
    const hasStats = facts.acceptanceRate !== undefined || facts.sat25 !== undefined;
    return {
      id, name, shortName: name, city: state ? `${city}, ${state}` : city, country: 'USA' as const, website: website || undefined, coverage: hasStats ? 'data' as const : 'directory' as const, facts,
      ...(facts.sat25 !== undefined && facts.sat75 !== undefined ? { satStats: { low: facts.sat25, high: facts.sat75, label: 'SAT middle 50%', cohort: `Fall ${facts.year.slice(0, 4)} first-year students who submitted SAT · IPEDS`, source: facts.source } } : {}),
      description: describeUniversity('USA', facts, city),
      majors: [], model: 'holistic' as const,
      testLabel: facts.testPolicy === 'required' ? 'SAT or ACT required' : facts.testPolicy === 'optional' ? 'SAT / ACT optional' : facts.testPolicy === 'blind' ? 'Test scores not considered' : 'Check current test policy',
      color: '#6e8176',
      requirements: directoryRequirements('USA'),
      applicationSteps: ['Check the international first-year requirements', 'Apply through the Common App or the university portal', 'Send transcripts and examination results', 'Submit English proficiency evidence', 'Apply for financial aid or scholarships if eligible', 'Track documents and the decision'],
      aid: facts.tuitionInternational ? `Published out-of-state tuition and fees are about $${facts.tuitionInternational.toLocaleString()} per year${facts.roomAndBoard ? ` plus $${facts.roomAndBoard.toLocaleString()} for room and board` : ''} (${US_DATA_YEAR}). Check international aid eligibility directly.` : 'Check the institution’s current cost of attendance and international aid policy directly.',
      sources: [{ label: 'NCES IPEDS data files', url: DIRECTORY_SOURCES.USA, checked: '2026-09-17' }],
    };
  }),
];
export const catalogueCoverage = {
  verified: 6,
  Pakistan: pkRows.length + 3,
  USA: usRows.length,
  withAdmissionsData: usRows.filter(row => row[7] !== null && row[8] !== null).length,
  directory: directoryUniversities.length,
  completeAdmissionsCoverage: false,
};
