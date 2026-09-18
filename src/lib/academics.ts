import type { Activity, Major, Profile, SubjectGrade } from '../types';

export interface Programme { id: string; label: string; category: Major | null }
export interface ProgrammeGroup { label: string; programmes: Programme[] }
const group = (label: string, category: Major | null, items: [string, string][]): ProgrammeGroup => ({ label, programmes: items.map(([id, name]) => ({ id, label: name, category })) });
/** Existing ids are stored in saved profiles; never rename them. */
export const PROGRAMME_GROUPS: readonly ProgrammeGroup[] = [
  group('Computing & IT', 'computing', [['computer-science', 'Computer Science'], ['software-engineering', 'Software Engineering'], ['artificial-intelligence', 'Artificial Intelligence'], ['data-science', 'Data Science'], ['cybersecurity', 'Cybersecurity'], ['information-technology', 'Information Technology'], ['computer-games', 'Game Development & Animation'], ['information-systems', 'Information Systems'], ['robotics', 'Robotics & Intelligent Systems']]),
  group('Engineering', 'engineering', [['electrical-engineering', 'Electrical Engineering'], ['mechanical-engineering', 'Mechanical Engineering'], ['civil-engineering', 'Civil Engineering'], ['chemical-engineering', 'Chemical Engineering'], ['computer-engineering', 'Computer Engineering'], ['aerospace-engineering', 'Aerospace / Avionics Engineering'], ['mechatronics', 'Mechatronics Engineering'], ['industrial-engineering', 'Industrial & Manufacturing Engineering'], ['biomedical-engineering', 'Biomedical Engineering'], ['petroleum-engineering', 'Petroleum & Mining Engineering'], ['environmental-engineering', 'Environmental Engineering'], ['materials-engineering', 'Materials & Metallurgical Engineering'], ['telecom-engineering', 'Telecommunication Engineering'], ['textile-engineering', 'Textile Engineering']]),
  group('Business & Finance', 'business', [['business-administration', 'Business Administration (BBA)'], ['accounting-finance', 'Accounting & Finance'], ['management-science', 'Management Science'], ['marketing', 'Marketing'], ['entrepreneurship', 'Entrepreneurship'], ['supply-chain', 'Supply Chain & Logistics'], ['banking-finance', 'Banking & Financial Services'], ['actuarial-science', 'Actuarial Science'], ['hospitality-tourism', 'Hospitality & Tourism Management']]),
  group('Medicine & Health', null, [['medicine', 'Medicine (MBBS)'], ['dentistry', 'Dentistry (BDS)'], ['pharmacy', 'Pharmacy (Pharm-D)'], ['nursing', 'Nursing'], ['physiotherapy', 'Physiotherapy (DPT)'], ['medical-lab', 'Medical Laboratory Sciences'], ['public-health', 'Public Health'], ['nutrition', 'Nutrition & Dietetics'], ['veterinary', 'Veterinary Medicine (DVM)'], ['optometry', 'Optometry & Vision Sciences'], ['radiology', 'Radiology & Imaging Technology']]),
  group('Natural Sciences', null, [['physics', 'Physics'], ['chemistry', 'Chemistry'], ['biology', 'Biology'], ['biotechnology', 'Biotechnology'], ['biochemistry', 'Biochemistry'], ['microbiology', 'Microbiology'], ['environmental-science', 'Environmental Science'], ['geology', 'Geology & Earth Sciences'], ['space-science', 'Space Science & Astronomy'], ['zoology', 'Zoology'], ['botany', 'Botany']]),
  group('Mathematics & Statistics', null, [['mathematics', 'Mathematics'], ['statistics', 'Statistics'], ['applied-mathematics', 'Applied & Computational Mathematics']]),
  group('Social Sciences', null, [['economics', 'Economics'], ['psychology', 'Psychology'], ['international-relations', 'International Relations'], ['political-science', 'Political Science'], ['sociology', 'Sociology'], ['anthropology', 'Anthropology'], ['development-studies', 'Development Studies'], ['public-administration', 'Public Administration'], ['social-work', 'Social Work'], ['gender-studies', 'Gender Studies']]),
  group('Humanities & Languages', null, [['english', 'English & Literature'], ['history', 'History'], ['philosophy', 'Philosophy'], ['islamic-studies', 'Islamic Studies'], ['urdu', 'Urdu'], ['linguistics', 'Linguistics'], ['arabic', 'Arabic'], ['comparative-religion', 'Comparative Religion'], ['liberal-arts', 'Liberal Arts (undecided)']]),
  group('Law & Policy', null, [['law', 'Law (LLB / JD)'], ['public-policy', 'Public Policy'], ['criminology', 'Criminology']]),
  group('Arts, Design & Architecture', null, [['architecture', 'Architecture'], ['design', 'Design & Fine Arts'], ['graphic-design', 'Graphic & Communication Design'], ['fashion-design', 'Fashion & Textile Design'], ['interior-design', 'Interior Design'], ['film', 'Film & Television'], ['music', 'Music'], ['theatre', 'Theatre & Performing Arts'], ['urban-planning', 'City & Regional Planning']]),
  group('Media & Communication', null, [['media-studies', 'Media & Communication'], ['journalism', 'Journalism'], ['advertising-pr', 'Advertising & Public Relations']]),
  group('Education', null, [['education', 'Education (B.Ed)'], ['early-childhood', 'Early Childhood Education'], ['special-education', 'Special Education']]),
  group('Agriculture & Environment', null, [['agriculture', 'Agriculture'], ['food-science', 'Food Science & Technology'], ['forestry', 'Forestry & Wildlife'], ['agri-business', 'Agribusiness']]),
  group('Other', null, [['aviation', 'Aviation & Pilot Training'], ['maritime', 'Maritime Studies'], ['sports-science', 'Sports Science'], ['library-science', 'Library & Information Science'], ['undecided', 'Not sure yet']]),
];
export const PROGRAMMES: readonly Programme[] = PROGRAMME_GROUPS.flatMap(item => item.programmes);
export const programmeCategory = (id?: string): Major | null => PROGRAMMES.find(programme => programme.id === id)?.category ?? null;
export const SUBJECTS = ['English', 'Mathematics', 'Urdu', 'Islamiyat', 'Pakistan Studies', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Information Technology', 'ICT', 'Additional Mathematics', 'Economics', 'Business', 'Accounting', 'Further Mathematics', 'Statistics', 'Psychology', 'Sociology', 'History', 'Geography', 'Literature', 'Art & Design', 'Law', 'Environmental Management'] as const;
export const ACTIVITY_TYPES = ['Community service', 'Academic', 'Arts & culture', 'Sports', 'Work', 'Family responsibilities', 'Leadership', 'Research', 'Technology', 'Other'] as const;
export const IBCC_SOURCES = [
  { label: 'IBCC grade conversion', url: 'https://ibcc.edu.pk/conversion-for-equivalence/' },
  { label: 'IBCC subject requirements', url: 'https://ibcc.edu.pk/equivalence-intro/british-system/' },
  { label: '2026 science-equivalence notice', url: 'https://ibcc.edu.pk/notification-for-calculation-of-a-level-equivalent-qualification-based-on-compulsory-subjects-of-o-level/' },
  { label: 'NUST subject routes', url: 'https://nust.edu.pk/admissions/undergraduates/eligibility-criteria-for-ug-programmes/' },
];

export function newActivity(id: string = crypto.randomUUID()): Activity {
  return { id, title: '', type: 'Other', role: '', organization: '', description: '', startDate: '', endDate: '', ongoing: false, hoursPerWeek: '', weeksPerYear: '' };
}

/** Adds editable structure without deleting the original text, marks, or budget. */
export function migrateProfile(profile: Profile): Profile {
  const migrated = { ...profile, secondary: profile.secondary ?? (profile.curriculum === 'alevel' ? 'olevel' : 'matric'), higherSecondary: profile.higherSecondary ?? profile.curriculum };
  if (profile.activityEntries === undefined) {
    migrated.activityEntries = profile.activities.trim() ? [{ ...newActivity('legacy-activity'), title: 'My previous activity notes', description: profile.activities }] : [];
  }
  return migrated;
}

const validPercent = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
export const normalizeSubject = (subject: string) => {
  const name = subject.trim().toLowerCase().replace(/\s+/g, ' ');
  return ({ maths: 'mathematics', math: 'mathematics', 'english language': 'english', islamiat: 'islamiyat', 'pak studies': 'pakistan studies', 'computer studies': 'computer science' } as Record<string, string>)[name] ?? name;
};
const gradeMark = (grade: SubjectGrade['grade']): number | null => {
  const mark = ({ 'A*': 90, A: 85, B: 75, C: 65, D: 55, E: 45 } as Partial<Record<SubjectGrade['grade'], number>>)[grade];
  return typeof mark === 'number' ? mark : null;
};
const compulsory = ['english', 'mathematics', 'urdu', 'islamiyat', 'pakistan studies'];
type MarkedSubject = { subject: string; mark: number; predicted: boolean };

function usableSubjects(entries: SubjectGrade[]): MarkedSubject[] | null {
  const names = entries.filter(entry => entry.subject.trim()).map(entry => normalizeSubject(entry.subject));
  if (new Set(names).size !== names.length) return null;
  return entries.flatMap(entry => {
    const mark = gradeMark(entry.grade);
    return entry.subject.trim() && mark !== null ? [{ subject: normalizeSubject(entry.subject), mark, predicted: entry.predicted }] : [];
  });
}

export interface AcademicSummary { ssc: number | null; hssc: number | null; isEstimate: boolean; notes: string[]; math: boolean }
/** Unofficial planning only. Assumes examinations in Pakistan without exemptions. */
export function academicSummary(profile: Profile): AcademicSummary {
  const secondary = profile.secondary ?? (profile.curriculum === 'alevel' ? 'olevel' : 'matric');
  const higher = profile.higherSecondary ?? profile.curriculum;
  const notes: string[] = [];
  let ssc: number | null = null; let hssc: number | null = null;
  let isEstimate = false;
  const category = profile.programme ? programmeCategory(profile.programme) : profile.major;
  const medical = ['medicine', 'dentistry'].includes(profile.programme ?? '');
  const science = category === 'computing' || category === 'engineering' || medical;
  const oEntries = profile.oLevels ?? [];
  const aEntries = profile.aLevels ?? [];
  const oSubjects = usableSubjects(oEntries);
  const aSubjects = usableSubjects(aEntries);
  let selectedO: MarkedSubject[] = [];

  if (secondary === 'matric') ssc = validPercent(profile.ssc);
  else if (profile.oLevels === undefined && oEntries.length === 0) {
    ssc = validPercent(profile.ssc);
    if (ssc !== null) notes.push('Using the previously entered SSC certificate percentage.');
  } else {
    isEstimate = true;
    const actual = oSubjects?.filter(subject => !subject.predicted) ?? [];
    const required = compulsory.map(name => actual.find(subject => subject.subject === name));
    const electives = actual.filter(subject => !compulsory.includes(subject.subject));
    let selectedElectives = electives.sort((a, b) => b.mark - a.mark).slice(0, 3);
    if (science) {
      const third = electives.filter(subject => ['biology', 'computer science', 'information technology', 'ict', 'additional mathematics'].includes(subject.subject) && (!medical || subject.subject === 'biology')).sort((a, b) => b.mark - a.mark)[0];
      selectedElectives = [electives.find(subject => subject.subject === 'physics'), electives.find(subject => subject.subject === 'chemistry'), third].filter((subject): subject is MarkedSubject => !!subject);
    }
    if (oSubjects && required.every(Boolean) && selectedElectives.length === 3) {
      selectedO = [...required as MarkedSubject[], ...selectedElectives];
      ssc = selectedO.reduce((sum, subject) => sum + subject.mark, 0) / 8;
    } else notes.push('SSC estimate needs five compulsory O Level subjects and three passing electives; science routes need their science subjects. Predicted O Level grades are excluded.');
  }

  if (higher === 'fsc') {
    if (profile.stage === 'awaiting' && validPercent(profile.predictedHssc) !== null) {
      hssc = validPercent(profile.predictedHssc); isEstimate = true;
      notes.push('HSSC uses your predicted final FSc percentage. Your actual Part I result remains saved separately.');
    } else {
      hssc = validPercent(profile.hssc);
      if (profile.stage === 'awaiting') { isEstimate = true; notes.push('Final FSc result is pending; the saved Part I result is provisional.'); }
    }
  } else if (profile.aLevels === undefined && aEntries.length === 0 && profile.stage === 'completed') {
    hssc = validPercent(profile.hssc);
    if (hssc !== null) notes.push('Using the previously entered HSSC certificate percentage.');
  } else {
    isEstimate = true;
    let chosen = aSubjects?.filter(subject => profile.stage === 'awaiting' || !subject.predicted).sort((a, b) => b.mark - a.mark).slice(0, 3) ?? [];
    const allowed = aSubjects?.filter(subject => profile.stage === 'awaiting' || !subject.predicted) ?? [];
    const needed = medical ? ['physics', 'chemistry', 'biology'] : category === 'engineering' ? ['physics', 'chemistry', 'mathematics'] : category === 'computing' ? ['physics', 'mathematics'] : null;
    if (needed) chosen = needed.map(name => allowed.find(subject => subject.subject === name)).filter((subject): subject is MarkedSubject => !!subject);
    if (category === 'computing') {
      // Computing admissions can use either the Pre-Engineering (PCM) or
      // Computer Science (PMCS) group. Chemistry is not a missing CS grade.
      const third = allowed.filter(subject => ['chemistry', 'computer science'].includes(subject.subject)).sort((a, b) => a.mark - b.mark)[0];
      if (third) chosen.push(third);
      if (chosen.length === 3 && third) notes.push(`Computing planning uses Physics, Mathematics and ${third.subject === 'chemistry' ? 'Chemistry (Pre-Engineering)' : 'Computer Science'}. If both third-subject routes are present, this conservative estimate uses the lower mark. Other permitted university routes require individual review.`);
    }
    if (secondary !== 'olevel' || selectedO.length !== 8) notes.push('HSSC grade planning needs a complete O Level subject record. Mixed Matric → A Level or certificate-only routes need IBCC review.');
    else if (!aSubjects || chosen.length !== 3) notes.push(`This planning model needs three passing full A Level subjects${needed ? `: ${needed.join(', ')}${category === 'computing' ? ', and Chemistry or Computer Science' : ''}` : ''}. Other subject combinations may be eligible and need individual review.`);
    else if (science && profile.examYear === undefined) notes.push('Add your O Level completion year so the appropriate HSSC science planning formula can be selected.');
    else {
      // The Feb 2026 notice applies to O Level completers in 2026, then A Levels
      // thereafter. It is not a switch based on the year A Levels are completed.
      const base = science && (profile.examYear ?? 0) >= 2026 ? selectedO.filter(subject => compulsory.includes(subject.subject)) : selectedO;
      hssc = [...base, ...chosen].reduce((sum, subject) => sum + subject.mark, 0) / (base.length + 3);
      notes.push(`HSSC planning uses ${base.length === 5 ? 'five compulsory' : 'eight'} O Level subjects and three A Level subjects. ${chosen.some(subject => subject.predicted) ? 'Predicted A Level grades are included.' : ''}`.trim());
    }
  }
  if (oEntries.length || aEntries.length) {
    notes.push('Unofficial grade-based planning, for the Pakistan examination route without exemptions. Only IBCC can issue equivalence.');
    if ([...oEntries, ...aEntries].some(entry => entry.grade === 'A*')) notes.push('A* is conservatively modelled as 90; official marks vary by subject and examination session and are above 90.');
    if ([...oEntries, ...aEntries].some(entry => ['F', 'G', 'U'].includes(entry.grade))) notes.push('F, G and U do not provide passing equivalence marks and are excluded.');
  }
  const math = higher === 'alevel' && aEntries.length > 0 ? !!aSubjects?.some(subject => subject.subject === 'mathematics' && (profile.stage === 'awaiting' || !subject.predicted)) : profile.mathematics;
  return { ssc, hssc, isEstimate, notes, math };
}
