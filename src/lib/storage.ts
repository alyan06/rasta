import type { AppData, Application, Activity, EssayDraft, Profile, SubjectGrade } from "../types";
import { universities } from "./admissions";
import { ACTIVITY_TYPES, PROGRAMMES, academicSummary, migrateProfile, normalizeSubject } from './academics';

export const STORAGE_KEY = "rasta.workspace.v1";
export const demoProfile: Profile = {
  name: "Ayesha",
  city: "Lahore",
  curriculum: "fsc",
  stage: "completed",
  major: "computing",
  ssc: 92,
  hssc: 86,
  net: 140,
  nu: 72,
  sat: 1350,
  mathematics: true,
  budget: 600000,
  activities:
    "I help younger students in my neighbourhood with maths, and built a website for our school science club.",
  isDemo: true,
};
export const initialData: AppData = {
  version: 1,
  profile: demoProfile,
  saved: ["nust", "fast", "lums"],
  applications: [],
  essays: [],
};
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = Infinity): value is string =>
  typeof value === "string" && value.length <= max;
const score = (value: unknown, max: number, min = 0) =>
  value === "" ||
  (typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max);
const option = (value: unknown, allowed: readonly string[]) =>
  typeof value === "string" && allowed.includes(value);
const knownUniversities = new Map(
  universities.map((university) => [university.id, university]),
);

function validProfile(value: unknown): value is Profile {
  if (!object(value)) return false;
  if (
    !text(value.name, 60) ||
    !text(value.city, 80) ||
    !text(value.activities, 5000) ||
    !option(value.curriculum, ["fsc", "alevel"]) ||
    !option(value.stage, ["completed", "awaiting"]) ||
    !option(value.major, ["computing", "engineering", "business"]) ||
    typeof value.mathematics !== "boolean" ||
    typeof value.isDemo !== "boolean"
  )
    return false;
  if (value.secondary !== undefined && !option(value.secondary, ['matric', 'olevel'])) return false;
  if (value.higherSecondary !== undefined && !option(value.higherSecondary, ['fsc', 'alevel'])) return false;
  if (value.predictedHssc !== undefined && !score(value.predictedHssc, 100)) return false;
  if (value.familyIncome !== undefined && !score(value.familyIncome, 100_000_000)) return false;
  if (value.onboardingCompleted !== undefined && typeof value.onboardingCompleted !== 'boolean') return false;
  if (value.examYear !== undefined && (typeof value.examYear !== 'number' || !Number.isInteger(value.examYear) || value.examYear < 2000 || value.examYear > 2100)) return false;
  if (value.programme !== undefined && (!text(value.programme) || !PROGRAMMES.some(programme => programme.id === value.programme))) return false;
  for (const field of ['oLevels', 'aLevels']) {
    if (value[field] !== undefined) {
      if (!uniqueArray(value[field], validSubject, entry => entry.id) || value[field].length > 12) return false;
      const names = value[field].filter(entry => entry.subject.trim()).map(entry => normalizeSubject(entry.subject));
      if (new Set(names).size !== names.length) return false;
    }
  }
  if (value.activityEntries !== undefined && (!uniqueArray(value.activityEntries, validActivity, activity => activity.id) || value.activityEntries.length > 10)) return false;
  if (
    !score(value.ssc, 100) ||
    !score(value.hssc, 100) ||
    !score(value.net, 200) ||
    !score(value.nu, 100) ||
    !score(value.sat, 1600, 400) ||
    !score(value.budget, 100_000_000)
  )
    return false;
  return (
    !(typeof value.net === "number" && !Number.isInteger(value.net)) &&
    !(typeof value.sat === "number" && value.sat % 10 !== 0)
  );
}
export const isProfile = validProfile;

function calendarDeadline(value: unknown, minYear = 2000): value is string {
  if (value === "") return true;
  if (!text(value, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < minYear || year > 2100 || month < 1 || month > 12 || day < 1)
    return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [
    31,
    leap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= monthDays[month - 1];
}

function validSubject(value: unknown): value is SubjectGrade {
  return object(value) && text(value.id, 100) && !!value.id.trim() && text(value.subject, 100) &&
    option(value.grade, ['', 'A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']) && typeof value.predicted === 'boolean';
}

function validActivity(value: unknown): value is Activity {
  if (!object(value) || !text(value.id, 100) || !value.id.trim() || !text(value.title, 120) ||
    !option(value.type, ACTIVITY_TYPES) || !text(value.role, 100) || !text(value.organization, 140) || !text(value.description, 5000) ||
    !calendarDeadline(value.startDate, 1900) || !calendarDeadline(value.endDate, 1900) || typeof value.ongoing !== 'boolean' ||
    !score(value.hoursPerWeek, 168) || !score(value.weeksPerYear, 52)) return false;
  if (typeof value.weeksPerYear === 'number' && !Number.isInteger(value.weeksPerYear)) return false;
  return !value.startDate || !value.endDate || value.endDate >= value.startDate;
}

function uniqueArray<T>(
  value: unknown,
  validate: (item: unknown) => item is T,
  key: (item: T) => string,
): value is T[] {
  if (!Array.isArray(value)) return false;
  const seen = new Set<string>();
  for (const item of value) {
    if (!validate(item)) return false;
    const id = key(item);
    if (seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

function validApplication(value: unknown): value is Application {
  if (!object(value) || !text(value.universityId)) return false;
  const university = knownUniversities.get(value.universityId);
  return (
    !!university &&
    option(value.status, ["Researching", "Preparing", "Submitted"]) &&
    calendarDeadline(value.deadline) &&
    text(value.notes, 3000) &&
    uniqueArray(
      value.completedSteps,
      (step): step is string =>
        text(step) && university.applicationSteps.includes(step),
      (step) => step,
    )
  );
}

function validEssay(value: unknown): value is EssayDraft {
  if (
    !object(value) ||
    !text(value.id, 100) ||
    !value.id.trim() ||
    !text(value.title, 120) ||
    !text(value.prompt) ||
    !text(value.content) ||
    !text(value.updatedAt, 100)
  )
    return false;
  // Draft timestamps are written by the app as UTC ISO strings. Round-trip comparison
  // rejects impossible dates that Date.parse would otherwise normalize silently.
  const timestamp = new Date(value.updatedAt);
  if (
    !Number.isFinite(timestamp.getTime()) ||
    timestamp.toISOString() !== value.updatedAt
  )
    return false;
  if (
    value.wordLimit !== undefined &&
    (typeof value.wordLimit !== "number" ||
      ![250, 500, 650].includes(value.wordLimit))
  )
    return false;
  if (value.story !== undefined) {
    if (!object(value.story)) return false;
    for (const key of ["moment", "action", "learning", "future"])
      if (!text(value.story[key])) return false;
  }
  // The editor has no character cap on its prompt, draft, or story notes. Preserve
  // everything a student can type instead of making their exported work unimportable.
  return true;
}

export function isAppData(value: unknown): value is AppData {
  if (!object(value) || value.version !== 1 || !validProfile(value.profile))
    return false;
  if (value.onboardingCompleted !== undefined && typeof value.onboardingCompleted !== 'boolean') return false;
  if (value.tourCompleted !== undefined && typeof value.tourCompleted !== 'boolean') return false;
  return (
    uniqueArray(
      value.saved,
      (id): id is string => text(id) && knownUniversities.has(id),
      (id) => id,
    ) &&
    uniqueArray(
      value.applications,
      validApplication,
      (application) => application.universityId,
    ) &&
    uniqueArray(value.essays, validEssay, (essay) => essay.id)
  );
}

export function migrateAppData(data: AppData): AppData {
  return { ...data, profile: migrateProfile(data.profile) };
}

export interface LoadedData {
  data: AppData;
  error: string;
  recoveryRaw: string | null;
}

export function loadData(storageKey = STORAGE_KEY): LoadedData {
  const fallback = (): AppData => migrateAppData({
    ...initialData,
    profile: { ...demoProfile },
    saved: [...initialData.saved],
    applications: [],
    essays: [],
  });
  let raw: string | null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {
    return {
      data: fallback(),
      error: "Browser storage is unavailable. Keep a backup of your work.",
      recoveryRaw: null,
    };
  }
  if (raw === null) return { data: fallback(), error: "", recoveryRaw: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isAppData(parsed))
      return { data: migrateAppData(parsed), error: "", recoveryRaw: null };
  } catch {
    /* Keep the original bytes available for recovery, including malformed JSON. */
  }
  // Loading never writes or clears storage. The caller can offer a recovery export
  // and require an explicit replacement before enabling autosave on this fallback.
  return {
    data: fallback(),
    error:
      "Your saved data could not be read. Export the original saved data before replacing it.",
    recoveryRaw: raw,
  };
}
export function downloadFile(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function profileCompletion(p: Profile): number {
  const academics = academicSummary(p);
  return Math.round(
    ([
      !p.isDemo && !!p.name.trim(),
      !!p.city,
      academics.ssc !== null,
      academics.hssc !== null,
      p.net !== "" || p.nu !== "" || p.sat !== "",
      !!p.activities.trim() || !!p.activityEntries?.some(activity => activity.title.trim() || activity.description.trim()),
      p.familyIncome !== undefined && p.familyIncome !== '',
    ].filter(Boolean).length /
      7) *
      100,
  );
}
