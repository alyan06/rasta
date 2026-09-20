import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  ChartLineUp,
  Check,
  Checks,
  GraduationCap,
  NotePencil,
  Target,
} from "@phosphor-icons/react";
import type { WorkspaceProps } from "../types";
import {
  universities,
  assessUniversity,
  calculateAggregate,
} from "../lib/admissions";
import { profileCompletion } from "../lib/storage";
import { UniversityLogo } from "./UniversityBits";

export default function Dashboard({ data, navigate }: WorkspaceProps) {
  const { profile } = data;
  const completion = profileCompletion(profile);
  const targetNet = Math.min(
    200,
    (profile.net === "" ? 140 : profile.net) + 20,
  );
  const targetAggregate = calculateAggregate("nust", profile, targetNet);
  const wishlist = universities.filter((u) => data.saved.includes(u.id));
  const selected = wishlist.slice(0, 3);
  const aggregate =
    profile.net === ""
      ? null
      : calculateAggregate("nust", profile, profile.net);
  const steps = [
    {
      title: "Build your profile",
      note: "Your grades, goals & story",
      done: !profile.isDemo && completion >= 85,
      page: "profile" as const,
    },
    {
      title: "Find your universities",
      note: `${data.saved.length} on your wishlist`,
      done: data.saved.length > 0,
      page: "universities" as const,
    },
    {
      title: "Prepare your application",
      note: "One step at a time",
      done: data.applications.some((a) => a.status === "Submitted"),
      page: "applications" as const,
    },
  ];
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <div className="greeting">
            {profile.isDemo
              ? "Sample student profile"
              : `Assalamualaikum${profile.name ? `, ${profile.name.split(" ")[0]}` : ""}`}
          </div>
          <h1>
            Your dashboard
          </h1>
          <p>Your profile, university wishlist, and next steps.</p>
        </div>
        <button
          className="button secondary"
          onClick={() => navigate("profile")}
        >
          My profile <ArrowUpRight size={17} />
        </button>
      </div>
      <section className="journey-strip" aria-label="Your university journey" data-tour="journey">
        {steps.map((step, i) => (
          <button
            key={step.title}
            onClick={() => navigate(step.page)}
            className="journey-step"
          >
            <span className={`step-number ${step.done ? "done" : ""}`}>
              {step.done ? <Check size={16} weight="bold" /> : `0${i + 1}`}
            </span>
            <span>
              <strong>{step.title}</strong>
              <small>{step.note}</small>
            </span>
            {i < 2 && <span className="step-connector" />}
          </button>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="next-step-panel">
          <div className="panel-kicker">
            <span className="small-icon">
              <GraduationCap size={20} />
            </span>
            NEXT STEP
          </div>
          <h2>
            {profile.isDemo || completion < 85
              ? "Complete your profile"
              : "Plan your test scores"}
          </h2>
          <p>
            {profile.isDemo || completion < 85
              ? "Add your grades, interests and activities for a more useful university assessment."
              : "Choose a university from your wishlist and see which scores to work towards."}
          </p>
          <button
            className="button"
            onClick={() =>
              navigate(
                profile.isDemo || completion < 85 ? "profile" : "planner",
              )
            }
          >
            {profile.isDemo
              ? "Build my profile"
              : completion < 85
                ? "Complete my profile"
                : "Plan my target score"}
            <ArrowRight size={18} />
          </button>
          <div className="hero-footnote">
            <Check size={15} /> Matric, FSc, O Levels and A Levels supported.
          </div>
        </section>
        <section className="panel score-preview">
          <div className="panel-header">
            <div className="icon-title">
              <ChartLineUp size={20} />
              <h2>
                {profile.net === 200
                  ? "Your strongest test score"
                  : "Your NET target"}
              </h2>
            </div>
            <span className="badge neutral">NUST · NET</span>
          </div>
          <p>
            {profile.net === 200
              ? "You’ve reached the maximum NET score. Review your next application steps."
              : "See what a few more marks could change."}
          </p>
          <div className="score-comparison">
            <div>
              <span>Your {profile.isDemo ? "sample " : ""}score</span>
              <strong>
                {profile.net === "" ? "—" : profile.net}
                <small> / 200</small>
              </strong>
            </div>
            <ArrowRight size={24} className="muted" />
            <div>
              <span>Explore a target</span>
              <strong className="brand-ink">
                {targetNet}
                <small> / 200</small>
              </strong>
            </div>
          </div>
          <div className="mini-chart" aria-label="NET score comparison">
            <div className="chart-line">
              <span>Now</span>
              <div>
                <i style={{ width: `${(Number(profile.net) || 0) / 2}%` }} />
              </div>
              <strong>
                {aggregate === null ? "—" : `${aggregate.toFixed(1)}%`}
              </strong>
            </div>
            <div className="chart-line target">
              <span>At {targetNet}</span>
              <div>
                <i style={{ width: `${targetNet / 2}%` }} />
              </div>
              <strong>
                {targetAggregate === null
                  ? "—"
                  : `${targetAggregate.toFixed(1)}%`}
              </strong>
            </div>
            <div className="chart-caption">
              Calculated aggregate · Admission depends on merit
            </div>
          </div>
          <button className="text-button" onClick={() => navigate("planner")}>
            Explore your score possibilities <ArrowRight size={17} />
          </button>
        </section>
      </div>
      <section className="shortlist-section">
        <div className="section-heading">
          <div>
            <h2>Your university wishlist</h2>
            <p>Open a university to see its numbers and check your chances.</p>
          </div>
          <button
            className="text-button"
            onClick={() => navigate("universities")}
          >
            Explore all universities <ArrowRight size={17} />
          </button>
        </div>
        {selected.length ? (
          <div className="university-mini-grid">
            {selected.map((u) => {
              const a = assessUniversity(u, profile);
              return (
                <button
                  key={u.id}
                  className="university-mini"
                  onClick={() => navigate(`university/${u.id}`)}
                >
                  <div className="university-mini-top">
                    <UniversityLogo university={u} size="small" />
                    <BookmarkSimple weight="fill" size={19} />
                  </div>
                  <h3>{u.shortName}</h3>
                  <span className="muted">
                    {u.city}, {u.country}
                  </span>
                  <div className="uni-card-bottom">
                    <span className={`badge ${a.tone}`}>{a.label}</span>
                    <ArrowUpRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <BookmarkSimple size={28} />
            <h3>Your wishlist is empty</h3>
            <p>
              Explore a university and save the ones you want to know better.
            </p>
            <button
              className="button secondary"
              onClick={() => navigate("universities")}
            >
              Find universities
            </button>
          </div>
        )}
      </section>
      <div className="dashboard-bottom">
        <section className="essay-invitation">
          <span className="feature-icon">
            <NotePencil size={25} />
          </span>
          <div>
            <h2>Your essays</h2>
            <p>Find your angle. Shape your draft. Keep your voice.</p>
            <button className="text-button" onClick={() => navigate("essays")}>
              Step into the essay studio <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <section className="checklist-teaser">
          <div className="icon-title">
            <Checks size={22} />
            <h2>Your next steps</h2>
          </div>
          <button onClick={() => navigate("guide")}>
            <span className="task-square" />
            <span>Understand your application route</span>
            <ArrowUpRight size={16} />
          </button>
          <button onClick={() => navigate("applications")}>
            <span className="task-square" />
            <span>Add your first application deadline</span>
            <ArrowUpRight size={16} />
          </button>
        </section>
      </div>
      <div className="trust-note">
        <Target size={18} />
        <span>
          Clarity over certainty. Every chance Rasta shows is built from
          published admission data with the working shown, never a black box.
        </span>
      </div>
    </>
  );
}
