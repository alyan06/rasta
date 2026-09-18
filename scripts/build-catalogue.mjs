// Builds src/data/catalogue.json from public registries.
//   Pakistan: HEC recognised-institution list (scripts/data/pakistan-hec.json)
//             + facts scraped from each HEC page (scripts/data/pakistan-hec-details.json, see scrape-hec.mjs)
//   USA:      NCES IPEDS — HD2024 (directory), ADM2023 (admissions & test scores),
//             DRVEF2023 (enrolment), IC2023_AY (published charges 2023-24),
//             SFA2223 (institutional grant aid to first-year students).
//             Download the five zips from https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx
//             and unzip the CSVs into scripts/data/ipeds/ (ignored by git; ~10 MB).
// Run: node scripts/build-catalogue.mjs
import fs from "node:fs";
import path from "node:path";

const dir = "scripts/data";
const ipeds = name => path.join(dir, "ipeds", name);
function parseCsv(file) {
  const text = fs.readFileSync(file, "latin1").replace(/^\uFEFF|^ï»¿/, "");
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; }
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i += 1; row.push(field); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map(h => h.trim().toUpperCase());
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}
const num = value => { const n = Number(value); return value !== "" && Number.isFinite(n) && n >= 0 ? n : null; };
const cleanUrl = raw => {
  let url = raw.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try { const parsed = new URL(url); return `${parsed.protocol}//${parsed.host}${parsed.pathname === "/" ? "/" : parsed.pathname}`; } catch { return ""; }
};

// ---------- Pakistan ----------
const hec = JSON.parse(fs.readFileSync(path.join(dir, "pakistan-hec.json"), "utf8"));
const hecDetails = JSON.parse(fs.readFileSync(path.join(dir, "pakistan-hec-details.json"), "utf8"));
const pakistan = hec.map(entry => {
  const d = hecDetails[entry.id] ?? {};
  return [entry.id, entry.name, d.city || entry.city, d.province || "", cleanUrl(d.website || ""), d.sector || "", d.category || "", d.campuses || "", d.established || "", entry.hec];
});

// ---------- USA ----------
const hd = parseCsv(ipeds("HD2024.csv"));
const adm = new Map(parseCsv(ipeds("adm2023.csv")).map(r => [r.UNITID, r]));
const ef = new Map(parseCsv(ipeds("drvef2023.csv")).map(r => [r.UNITID, r]));
const ic = new Map(parseCsv(ipeds("ic2023_ay.csv")).map(r => [r.UNITID, r]));
const sfa = new Map(parseCsv(ipeds("sfa2223.csv")).map(r => [r.UNITID, r]));
const localeGroup = code => { const n = Number(code); return n >= 11 && n <= 13 ? "city" : n >= 21 && n <= 23 ? "suburb" : n >= 31 && n <= 33 ? "town" : n >= 41 && n <= 43 ? "rural" : ""; };
const usa = hd
  .filter(r => r.CYACTIVE === "1" && r.OPENPUBL === "1" && r.DEGGRANT === "1" && r.ICLEVEL === "1" && r.UGOFFER === "1" && ["1", "2", "3"].includes(r.CONTROL))
  .map(r => {
    const a = adm.get(r.UNITID) ?? {}, e = ef.get(r.UNITID) ?? {}, c = ic.get(r.UNITID) ?? {}, f = sfa.get(r.UNITID) ?? {};
    const sat = (v, m) => (num(a[v]) !== null && num(a[m]) !== null ? num(a[v]) + num(a[m]) : null);
    return [
      `us-${r.UNITID}`, r.INSTNM, r.CITY, r.STABBR, cleanUrl(r.WEBADDR), Number(r.CONTROL),
      num(e.EFUG), num(a.APPLCN), num(a.ADMSSN), num(a.ENRLT),
      sat("SATVR25", "SATMT25"), sat("SATVR75", "SATMT75"), num(a.SATPCT), num(a.ACTCM25), num(a.ACTCM75),
      a.ADMCON7 ? Number(a.ADMCON7) : null, num(c.CHG3AY3), num(c.CHG5AY3), localeGroup(r.LOCALE), r.HBCU === "1" ? 1 : 0, num(r.INSTSIZE),
      num(f.IGRNT_P), num(f.IGRNT_A),
    ];
  })
  .sort((x, y) => x[1].localeCompare(y[1]));

const output = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    pakistan: "https://www.hec.gov.pk/english/universities/pages/recognised.aspx",
    usa: "https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx",
    usaYear: "2023-24",
  },
  pakistanColumns: ["id", "name", "city", "province", "website", "sector", "category", "campuses", "established", "hecUrl"],
  usaColumns: ["id", "name", "city", "state", "website", "control", "undergraduates", "applicants", "admitted", "enrolled", "sat25", "sat75", "satSubmitters", "act25", "act75", "testPolicy", "tuitionOutOfState", "roomAndBoard", "locale", "hbcu", "sizeBand", "institutionalGrantPct", "institutionalGrantAvg"],
  pakistan, usa,
};
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/catalogue.json", JSON.stringify(output));
const withSat = usa.filter(r => r[10] !== null).length, withRate = usa.filter(r => r[7] && r[8] !== null).length;
console.log(`pakistan ${pakistan.length} (websites ${pakistan.filter(r => r[4]).length}) · usa ${usa.length} (acceptance data ${withRate}, SAT ranges ${withSat}, tuition ${usa.filter(r => r[16] !== null).length}, grant aid ${usa.filter(r => r[21] !== null).length})`);
console.log(`written src/data/catalogue.json ${(fs.statSync("src/data/catalogue.json").size / 1024).toFixed(0)} KB`);
