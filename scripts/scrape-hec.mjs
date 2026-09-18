// Enriches scripts/data/pakistan-hec.json with public facts from each HEC
// institution page (website, sector, province, category, campuses, year).
// Run: node scripts/scrape-hec.mjs   (network; ~2 minutes; polite concurrency)
import fs from "node:fs";
const input = JSON.parse(fs.readFileSync("scripts/data/pakistan-hec.json", "utf8"));
const outPath = "scripts/data/pakistan-hec-details.json";
const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
const field = (lines, label) => { const i = lines.findIndex(l => l.toLowerCase() === label.toLowerCase()); return i >= 0 && lines[i + 1] && !lines[i + 1].endsWith(":") ? lines[i + 1] : ""; };
async function scrape(entry) {
  const response = await fetch(entry.hec, { headers: { "user-agent": "Mozilla/5.0 (rasta catalogue builder)" } });
  if (!response.ok) throw new Error(`${response.status}`);
  let html = await response.text();
  html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const text = html.replace(/<[^>]+>/g, "\n").replace(/&amp;/g, "&").replace(/&nbsp;|\u200b/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const website = (lines[lines.findIndex(l => l === "Visit Website") + 1] ?? "").match(/^https?:\/\/\S+/)?.[0] ?? "";
  const number = label => { const v = field(lines, label).replace(/,/g, ""); return /^\d+$/.test(v) ? Number(v) : undefined; };
  return {
    website, sector: field(lines, "Sector:"), province: field(lines, "Province:"), city: field(lines, "City:"),
    category: field(lines, "University Category"), campuses: field(lines, "Campuses"), established: field(lines, "Established Since:").match(/\d{4}/)?.[0] ?? "",
    charteredBy: field(lines, "Chartered By:"), distance: field(lines, "Distance Education:"),
    enrollment: number("Total Enrollment:"), bachelors: number("Bachelor/Master(16 yrs) Students:"), faculty: number("Full time Faculty:"),
  };
}
let done = 0, failed = 0;
const queue = input.filter(e => !existing[e.id]);
async function worker() {
  while (queue.length) {
    const entry = queue.shift();
    try { existing[entry.id] = await scrape(entry); done += 1; }
    catch (error) { failed += 1; existing[entry.id] = { error: String(error.message ?? error) }; }
    if ((done + failed) % 25 === 0) { console.log(`${done} ok, ${failed} failed, ${queue.length} left`); fs.writeFileSync(outPath, JSON.stringify(existing, null, 1)); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync(outPath, JSON.stringify(existing, null, 1));
console.log(`finished: ${done} ok, ${failed} failed`);
