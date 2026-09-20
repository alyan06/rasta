import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Info,
  Target,
} from "@phosphor-icons/react";
import type { WorkspaceProps } from "../types";
import {
  calculateAggregate,
  requiredTestScore,
  universities,
} from "../lib/admissions";
import { academicSummary, programmeCategory } from '../lib/academics';
import { wishlistTestPlan } from '../lib/chancing';

export default function PlannerPage({ data, navigate }: WorkspaceProps) {
  const [mode, setMode] = useState<"nust" | "fast" | "sat">("nust");
  const [target, setTarget] = useState<number | "">('');
  const [scenario, setScenario] = useState(150);
  const savedUniversities = universities.filter(item => data.saved.includes(item.id));
  const plans = wishlistTestPlan(savedUniversities, data.profile, target === '' ? undefined : target);
  const [satTarget, setSatTarget] = useState(() => plans.find(item => item.route === 'sat')?.target ?? (data.profile.sat || 1200));
  const [selectedId, setSelectedId] = useState('');
  const p = data.profile;
  const academic = academicSummary(p);
  const major = programmeCategory(p.programme) ?? p.major;
  const higher = p.higherSecondary ?? p.curriculum;
  const secondary = p.secondary ?? (p.curriculum === 'alevel' ? 'olevel' : 'matric');
  const score = mode === "fast" ? p.nu : p.net;
  const maximum = mode === "fast" ? 100 : 200;
  const formulaMode = mode === "sat" ? "nust" : mode;
  const current =
    score === "" ? null : calculateAggregate(formulaMode, p, score);
  const hypothetical = calculateAggregate(formulaMode, p, scenario);
  const required =
    target === "" ? null : requiredTestScore(formulaMode, p, target);
  const university = universities.find((u) => u.id === formulaMode);
  const awaiting = higher === "alevel" && p.stage === "awaiting";
  const testWeight = mode === "nust" ? 75 : major === "engineering" ? 33 : 50;
  const sscWeight =
    mode === "nust"
      ? awaiting
        ? 25
        : 10
      : awaiting
        ? 100 - testWeight
        : major === "engineering"
          ? 17
          : 10;
  const hsscWeight = 100 - testWeight - sscWeight;
  const bars = Array.from({ length: 6 }, (_, i) => {
    const test = mode === "fast" ? 50 + i * 10 : 100 + i * 20;
    return { test, aggregate: calculateAggregate(formulaMode, p, test) };
  });
  return (
    <>
      <div className="page-heading">
        <span className="page-kicker">Turn a goal into a plan</span>
        <h1>Plan your tests</h1>
        <p>
          Move the score. See the impact. Work backwards from where you want to
          be.
        </p>
      </div>
      <section className="panel wishlist-plan">
        <div className="panel-header"><div><h2>Your wishlist, your test plan</h2><p className="muted">Choose a university to explore its test route and a sourced benchmark.</p></div><button className="text-button" onClick={() => navigate('universities')}>Edit wishlist <ArrowUpRight size={16} /></button></div>
        {plans.length ? <><label className="field"><span>University from your wishlist</span><select value={selectedId} onChange={event => { const plan = plans.find(item => item.universityId === event.target.value); setSelectedId(event.target.value); if (!plan || plan.route === 'review') return; setMode(plan.route === 'net' ? 'nust' : plan.route === 'nu' ? 'fast' : 'sat'); setScenario(plan.route === 'nu' ? 80 : 150); if (plan.route === 'sat' && plan.target !== null) setSatTarget(plan.target); }}><option value="">Choose a university</option>{plans.map(plan => <option key={plan.universityId} value={plan.universityId}>{plan.name}</option>)}</select></label><div className="wishlist-test-routes">{plans.filter(plan => !selectedId || plan.universityId === selectedId).map(plan => <div key={plan.universityId} className="wishlist-test-route"><h3>{plan.name}</h3><strong>{plan.target === null ? plan.route === 'net' ? 'NET / 200' : plan.route === 'nu' ? 'NU test %' : 'Review test policy' : `${plan.target} ${plan.unit}`}</strong><p>{plan.reason}</p><button className="text-button" onClick={() => navigate(`university/${plan.universityId}`)}>View requirements <ArrowUpRight size={14} /></button>{plan.source && <a className="text-button" href={plan.source} target="_blank" rel="noreferrer">Official source <ArrowUpRight size={14} /></a>}</div>)}</div></> : <p>Add universities to your wishlist to collect their test routes here.</p>}
      </section>
      <div className="segmented-control" aria-label="Admission test" data-tour="planner">
        {(
          [
            { id: "nust", label: "NUST NET" },
            { id: "fast", label: "FAST NU test" },
            { id: "sat", label: "SAT explorer" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            aria-pressed={mode === t.id}
            className={mode === t.id ? "selected" : ""}
            onClick={() => {
              setMode(t.id);
              setScenario(t.id === "fast" ? 80 : 150);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {mode === "sat" ? (
        <div className="planner-grid">
          <section className="panel planner-input">
            <div className="icon-title">
              <Target size={23} />
              <h2>Your SAT, with a direction</h2>
            </div>
            <p>
              A stronger SAT can strengthen academic evidence. There is no
              reliable conversion from SAT points to an individual admission
              probability.
            </p>
            <div className="score-comparison">
              <div>
                <span>Current score</span>
                <strong>{p.sat || "—"}</strong>
              </div>
              <ArrowRight size={25} />
              <div>
                <span>Your target</span>
                <strong className="brand-ink">{satTarget}</strong>
              </div>
            </div>
            <label className="field">
              <span>Explore a target SAT score</span>
              <input
                type="range"
                min={400}
                max={1600}
                step={10}
                value={satTarget}
                onChange={(e) => setSatTarget(Number(e.target.value))}
              />
            </label>
            <div className="range-labels">
              <span>400</span>
              <span>1600</span>
            </div>
            <div className="inline-note">
              <strong>
                {p.sat === ""
                  ? "Start with a practice test"
                  : satTarget > p.sat
                    ? `${satTarget - p.sat} points to work towards`
                    : "This target is within your current score"}
              </strong>
              <p>
                Review your section breakdown, practise your weakest skills, and
                take timed full-length tests to track progress.
              </p>
            </div>
            <a
              className="button secondary"
              href="https://satsuite.collegeboard.org/practice"
              target="_blank"
              rel="noreferrer"
            >
              Free official SAT practice <ArrowUpRight size={17} />
            </a>
          </section>
          <section className="panel">
            <h2>Put the score in context</h2>
            <div className="sat-context">
              <h3>LUMS</h3>
              <p>
                LUMS publishes no minimum SAT score. Academic results, admission
                tests and the rest of your application are reviewed together.
              </p>
              <h3>US universities</h3>
              <p>
                Check each college’s current testing policy and published class
                statistics. A class average or score range describes enrolled
                students; it does not predict your outcome.
              </p>
              <h3>Funding is part of fit</h3>
              <p>
                For an international applicant, required aid and the college’s
                funding policy matter. Build your shortlist around affordability
                as well as academics.
              </p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("universities")}
            >
              Read the university requirements <ArrowRight size={17} />
            </button>
          </section>
        </div>
      ) : (
        <>
          <div className="planner-grid">
            <section className="panel planner-input">
              <div className="panel-header">
                <div className="icon-title">
                  <Calculator size={23} />
                  <h2>Your score sandbox</h2>
                </div>
                <span className="badge neutral">
                  {mode === "nust" ? "NET / 200" : "NU test %"}
                </span>
              </div>
              <div className="academic-summary">
                <div>
                  <span>
                  {secondary === 'olevel' ? "SSC planning equivalent" : "Matric"}
                  </span>
                  <strong>{academic.ssc === null ? "Add result" : `${academic.ssc.toFixed(1)}%`}</strong>
                </div>
                <div>
                  <span>
                    {higher === "alevel" ? "HSSC planning equivalent" : p.stage === 'awaiting' && p.predictedHssc !== undefined && p.predictedHssc !== '' ? 'Predicted final FSc' : "FSc / Part I"}
                  </span>
                  <strong>
                    {awaiting
                      ? "Awaiting result"
                      : academic.hssc === null
                        ? "Add result"
                        : `${academic.hssc.toFixed(1)}%`}
                  </strong>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("profile")}
                >
                  Edit <ArrowUpRight size={15} />
                </button>
              </div>
              {academic.isEstimate && <p className="inline-note">This scenario uses unofficial or predicted academic marks. It is a forecast, not the aggregate confirmed by an admissions office.</p>}
              <label className="field score-slider">
                <span>
                  What if you scored…{" "}
                  <output>
                    {scenario}
                    <small> / {maximum}</small>
                  </output>
                </span>
                <input
                  type="range"
                  min={0}
                  max={maximum}
                  step={1}
                  value={scenario}
                  onChange={(e) => setScenario(Number(e.target.value))}
                />
              </label>
              <div className="range-labels">
                <span>0</span>
                <span>{maximum}</span>
              </div>
              <div className="aggregate-result">
                <span>Your calculated aggregate</span>
                <strong>
                  {hypothetical === null ? "—" : hypothetical.toFixed(2)}
                  <small>{hypothetical === null ? "" : "%"}</small>
                </strong>
                <span>
                  {current !== null && hypothetical !== null
                    ? `${hypothetical >= current ? "+" : ""}${(hypothetical - current).toFixed(2)} points from your current ${current.toFixed(2)}%`
                    : hypothetical === null
                      ? "Add your academic results to see a calculation."
                      : "Add your actual test result to compare the difference."}
                </span>
              </div>
              <button
                className="button secondary full-width"
                onClick={() => navigate("profile")}
              >
                Update my actual test results <CheckMark />
              </button>
            </section>
            <section className="panel target-panel">
              <div className="icon-title">
                <Target size={23} />
                <h2>Work backwards from a target</h2>
              </div>
              <p>
                Set your own planning aggregate. This is your scenario, not an
                official closing merit.
              </p>
              <label className="field">
                <span>Target aggregate (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={target}
                  onChange={(e) =>
                    setTarget(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </label>
              <div className="required-score">
                <span>You would need approximately</span>
                <strong>
                  {required === null ? "—" : required}
                  <small>{required === null ? "" : ` / ${maximum}`}</small>
                </strong>
                <span>
                  {mode === "nust" ? "NET marks" : "NU test percentage"}
                </span>
              </div>
              <div className="inline-note">
                <Info size={18} />
                <p>
                  {hypothetical === null
                    ? "Add valid academic results in your profile first."
                    : target === "" || target < 0 || target > 100
                      ? "Enter a target aggregate between 0 and 100."
                      : required === null
                        ? "This target is not reachable from these academic marks, even with a perfect test. Try a lower target."
                        : `Calculated using your grades and the published ${mode === "nust" ? "NUST NET" : "FAST"} formula. Programme, subject and campus eligibility still apply.`}
                </p>
              </div>
            </section>
          </div>
          <section className="panel score-chart-panel">
            <div className="panel-header">
              <div>
                <h2>Every mark moves you forward</h2>
                <p className="muted">Test score → calculated aggregate</p>
              </div>
                <span className="badge neutral">{major}</span>
            </div>
            <div className="score-chart">
              {bars.map((b) => (
                <button
                  key={b.test}
                  onClick={() => setScenario(b.test)}
                  aria-label={`Try score ${b.test}, aggregate ${b.aggregate?.toFixed(2) ?? "unavailable"}`}
                >
                  <span className="bar-value">
                    {b.aggregate === null ? "—" : `${b.aggregate.toFixed(1)}%`}
                  </span>
                  <div
                    className={`chart-column ${scenario === b.test ? "highlighted" : ""}`}
                    style={{
                      height: `${b.aggregate === null ? 6 : Math.max(10, b.aggregate * 1.6)}px`,
                    }}
                  />
                  <span className="bar-label">{b.test}</span>
                </button>
              ))}
            </div>
          </section>
          <div className="formula-note">
            <div>
              <h3>Here’s the maths behind it.</h3>
              <p>
                {testWeight}% {mode === "nust" ? "NET score" : "NU test"} +{" "}
                {sscWeight}%{" "}
                {secondary === 'olevel' ? "SSC equivalent" : "Matric"}
                {hsscWeight
                  ? ` + ${hsscWeight}% ${higher === "alevel" ? "HSSC equivalent" : academic.isEstimate ? "predicted FSc" : "FSc / Part I"}`
                  : ""}
                .{" "}
                {awaiting
                  ? "Awaiting A Level results: the SSC-only academic weighting is used."
                  : ""}{" "}
                {mode === "fast"
                  ? "Applies to the NU-test route only; SAT/NTS routes need separate review."
                  : "NET is normalised from 200 marks to a percentage."}
              </p>
              <p>
                Targets are not admission probabilities. Closing merit changes
                by programme, campus and intake.
              </p>
            </div>
            <a
              className="text-button"
              href={university?.sources[0]?.url}
              target="_blank"
              rel="noreferrer"
            >
              Official formula <ArrowUpRight size={17} />
            </a>
          </div>
        </>
      )}
    </>
  );
}
function CheckMark() {
  return <ArrowRight size={16} />;
}
