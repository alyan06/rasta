import type { University } from '../types';

/** Registry hosts are not the institution itself, so they never produce a logo. */
const registryHosts = ['hec.gov.pk', 'nces.ed.gov'];

export function universityDomain(university: University): string | null {
  if (!university.website) return null;
  try {
    const host = new URL(university.website).hostname.replace(/^www\./, '');
    return registryHosts.some(registry => host.endsWith(registry)) ? null : host;
  } catch {
    return null;
  }
}

/** Candidate logo images in order: a bundled logo, then the website's own icon via Google's favicon service. */
export function logoCandidates(university: University): string[] {
  const candidates: string[] = [];
  if (university.logo) candidates.push(university.logo);
  const domain = universityDomain(university);
  if (domain) candidates.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
  return candidates;
}

/** Two-letter monogram used when no image is available. */
export function monogram(university: University): string {
  const words = university.shortName.replace(/[()]/g, '').split(/[\s–-]+/).filter(word => /^[A-Za-z]/.test(word) && !['of', 'the', 'and', '&', 'for', 'at', 'in'].includes(word.toLowerCase()));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return university.shortName.slice(0, 2).toUpperCase();
}
