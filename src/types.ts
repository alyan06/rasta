export type Page =
  | "dashboard"
  | "profile"
  | "universities"
  | "planner"
  | "essays"
  | "applications"
  | "guide"
  | "privacy"
  | "terms"
  | "contact"
  | `university/${string}`;
export type Major = "computing" | "engineering" | "business";
export type Curriculum = "fsc" | "alevel";
export type LetterGrade = 'A*' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'U';
export interface SubjectGrade { id: string; subject: string; grade: LetterGrade | ''; predicted: boolean }
export interface Activity { id: string; title: string; type: string; role: string; organization: string; description: string; startDate: string; endDate: string; ongoing: boolean; hoursPerWeek: number | ''; weeksPerYear: number | '' }
export interface Profile {
  name: string;
  city: string;
  curriculum: Curriculum;
  stage: "completed" | "awaiting";
  major: Major;
  ssc: number | "";
  hssc: number | "";
  net: number | "";
  nu: number | "";
  sat: number | "";
  mathematics: boolean;
  budget: number | "";
  activities: string;
  isDemo: boolean;
  secondary?: 'matric' | 'olevel';
  higherSecondary?: 'fsc' | 'alevel';
  oLevels?: SubjectGrade[];
  aLevels?: SubjectGrade[];
  predictedHssc?: number | '';
  programme?: string;
  activityEntries?: Activity[];
  familyIncome?: number | '';
  onboardingCompleted?: boolean;
  examYear?: number;
}
export interface UniversityFacts {
  /** Data year label, e.g. "2023-24" for IPEDS. */
  year: string;
  source: string;
  /** US state abbreviation or Pakistani province. */
  state?: string;
  control?: 'public' | 'private' | 'for-profit';
  category?: string;
  campuses?: string;
  established?: string;
  undergraduates?: number;
  applicants?: number;
  admitted?: number;
  enrolled?: number;
  /** Percent of first-year applicants admitted. */
  acceptanceRate?: number;
  /** Combined SAT percentiles (reading & writing + mathematics). */
  sat25?: number;
  sat75?: number;
  satSubmitters?: number;
  act25?: number;
  act75?: number;
  testPolicy?: 'required' | 'optional' | 'blind';
  /** Published out-of-state tuition and fees in USD. */
  tuitionInternational?: number;
  roomAndBoard?: number;
  locale?: 'city' | 'suburb' | 'town' | 'rural';
  hbcu?: boolean;
  /** Percent of full-time first-year students awarded institutional grant aid, and the average award (USD). */
  scholarshipPct?: number;
  scholarshipAvg?: number;
  /** Hand-checked: the institution offers merit or need-based scholarships. */
  scholarships?: boolean;
}
export interface Source {
  label: string;
  url: string;
  checked: string;
}
export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: "Pakistan" | "USA";
  description: string;
  majors: Major[];
  model: "nust" | "fast" | "holistic";
  testLabel: string;
  sources: Source[];
  requirements: string[];
  applicationSteps: string[];
  aid: string;
  color: string;
  logo?: string;
  website?: string;
  programmes?: string[];
  satStats?: { low?: number; high?: number; average?: number; label: string; cohort: string; source: string };
  stats?: { label: string; value: string; source: string }[];
  /** verified = hand-researched requirements; data = published statistics only; directory = identity only. */
  coverage?: 'verified' | 'data' | 'directory';
  facts?: UniversityFacts;
}
export interface Assessment {
  label: string;
  tone: "good" | "caution" | "neutral";
  aggregate?: number;
  detail: string;
  missing: string[];
}
export interface Application {
  universityId: string;
  status: "Researching" | "Preparing" | "Submitted";
  deadline: string;
  completedSteps: string[];
  notes: string;
}
export interface EssayDraft {
  id: string;
  title: string;
  prompt: string;
  content: string;
  updatedAt: string;
  wordLimit?: number;
  story?: { moment: string; action: string; learning: string; future: string };
}
export interface AppData {
  version: 1;
  profile: Profile;
  saved: string[];
  applications: Application[];
  essays: EssayDraft[];
  onboardingCompleted?: boolean;
  /** The guided tour has been seen (or skipped). Saved with the account so it shows once, on any device. */
  tourCompleted?: boolean;
}
export interface WorkspaceProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  navigate: (page: Page) => void;
  notify: (message: string) => void;
  storageAvailable?: boolean;
  /** True when a Google account session is active (AI help needs one). */
  signedIn?: boolean;
  /** Opens the account dialog so a page can offer sign-in in context. */
  openAccount?: () => void;
  /** Replays the guided tour of the workspace. */
  startTour?: () => void;
}
