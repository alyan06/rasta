import { useState } from "react";
import {
  ArrowRight,
  Check,
  CaretDown as ChevronDown,
  ClipboardText as ClipboardList,
  ArrowSquareOut as ExternalLink,
  Plus,
  Trash as Trash2,
} from "@phosphor-icons/react";
import { universities } from "../lib/admissions";
import type { Application, WorkspaceProps } from "../types";

function deadlineLabel(value: string) {
  if (!value) return "Add your deadline";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationsPage({
  data,
  update,
  navigate,
  notify,
}: WorkspaceProps) {
  const [selected, setSelected] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const available = universities.filter(
    (university) =>
      !data.applications.some(
        (application) => application.universityId === university.id,
      ),
  );
  const shortlisted = available.filter((university) =>
    data.saved.includes(university.id),
  );
  const remaining = available.filter(
    (university) => !data.saved.includes(university.id),
  );
  const choice = available.some((university) => university.id === selected)
    ? selected
    : (shortlisted[0]?.id ?? available[0]?.id ?? "");
  const submitted = data.applications.filter(
    (application) => application.status === "Submitted",
  ).length;
  const saveApplication = (
    universityId: string,
    patch: Partial<Application>,
  ) => {
    update({
      applications: data.applications.map((application) =>
        application.universityId === universityId
          ? { ...application, ...patch }
          : application,
      ),
    });
  };
  const add = () => {
    if (
      !choice ||
      data.applications.some(
        (application) => application.universityId === choice,
      )
    )
      return;
    update({
      applications: [
        ...data.applications,
        {
          universityId: choice,
          status: "Researching",
          deadline: "",
          completedSteps: [],
          notes: "",
        },
      ],
    });
    setSelected("");
    notify("Application added. Your next steps are ready.");
  };

  return (
    <div className="stack applications-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ONE STEP AT A TIME</span>
          <h1>Your applications</h1>
          <p>
            Turn your shortlist into a plan, with every next step in one place.
          </p>
        </div>
        <span className="badge">
          {submitted} of {data.applications.length} submitted
        </span>
      </header>
      <section className="panel application-add">
        <div className="panel-header">
          <div>
            <h2>Where are you applying?</h2>
            <p className="muted">
              Add a university and start its application checklist.
            </p>
          </div>
          <button
            className="button ghost"
            type="button"
            onClick={() => navigate("universities")}
          >
            Explore universities <ArrowRight size={16} />
          </button>
        </div>
        {available.length ? (
          <div className="application-add-row">
            <label className="field">
              <span>Choose a university</span>
              <select
                value={choice}
                onChange={(event) => setSelected(event.target.value)}
              >
                {shortlisted.length > 0 && (
                  <optgroup label="Your shortlist">
                    {shortlisted.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {remaining.length > 0 && (
                  <optgroup label="All other universities">
                    {remaining.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
            <button type="button" className="button" onClick={add}>
              <Plus size={18} /> Add application
            </button>
          </div>
        ) : (
          <p className="muted">
            You’re tracking every university currently in Rasta.
          </p>
        )}
        <p className="muted application-save-note">
          Changes save in this browser. You enter deadlines from the
          university’s current admissions page. Rasta does not submit
          applications or send reminders.
        </p>
      </section>
      {!data.applications.length && (
        <section className="panel empty-state">
          <ClipboardList size={36} aria-hidden="true" />
          <h2>No applications yet</h2>
          <p>
            Add your first university above. We’ll break the application into
            smaller, manageable tasks.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate("guide")}
          >
            Read the application guide <ArrowRight size={17} />
          </button>
        </section>
      )}
      <div className="stack application-list">
        {data.applications.map((application, applicationIndex) => {
          const university = universities.find(
            (candidate) => candidate.id === application.universityId,
          );
          if (!university) return null;
          const count = university.applicationSteps.filter((step) =>
            application.completedSteps.includes(step),
          ).length;
          const total = university.applicationSteps.length;
          return (
            <details
              className="panel application-card"
              key={application.universityId}
              open={applicationIndex === 0 ? true : undefined}
            >
              <summary className="application-summary">
                <div
                  className="university-monogram"
                  style={
                    {
                      "--university-color": university.color,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                >
                  {university.shortName.slice(0, 2)}
                </div>
                <div className="application-summary-title">
                  <h2>{university.shortName}</h2>
                  <p className="muted">
                    {university.city} · {university.country}
                  </p>
                </div>
                <span
                  className={`badge ${application.status === "Submitted" ? "good" : ""}`}
                >
                  {application.status}
                </span>
                <span className="muted application-summary-progress">
                  {count}/{total} steps
                </span>
                <ChevronDown
                  className="application-chevron"
                  size={18}
                  aria-hidden="true"
                />
              </summary>
              <div className="application-body stack">
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${university.shortName} checklist completion`}
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={total}
                >
                  <span
                    style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                  />
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Application status</span>
                    <select
                      value={application.status}
                      onChange={(event) =>
                        saveApplication(application.universityId, {
                          status: event.target.value as Application["status"],
                        })
                      }
                    >
                      <option>Researching</option>
                      <option>Preparing</option>
                      <option>Submitted</option>
                    </select>
                    <small className="muted">
                      Mark submitted after submitting through the official
                      portal.
                    </small>
                  </label>
                  <label className="field">
                    <span>Your verified deadline</span>
                    <input
                      type="date"
                      min="2000-01-01"
                      max="2100-12-31"
                      value={application.deadline}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          !value ||
                          (event.target.validity.valid &&
                            /^\d{4}-\d{2}-\d{2}$/.test(value))
                        )
                          saveApplication(application.universityId, {
                            deadline: value,
                          });
                      }}
                    />
                    <small className="muted">
                      {deadlineLabel(application.deadline)} · Confirm the year,
                      time, and time zone on the official site.
                    </small>
                  </label>
                </div>
                <div className="application-checklist">
                  <h3>Your next steps</h3>
                  {university.applicationSteps.map((step) => (
                    <label className="check-row" key={step}>
                      <input
                        type="checkbox"
                        checked={application.completedSteps.includes(step)}
                        onChange={(event) =>
                          saveApplication(application.universityId, {
                            completedSteps: event.target.checked
                              ? [...application.completedSteps, step]
                              : application.completedSteps.filter(
                                  (completed) => completed !== step,
                                ),
                          })
                        }
                      />
                      <span>{step}</span>
                    </label>
                  ))}
                </div>
                <label className="field">
                  <span>Your notes</span>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={application.notes}
                    onChange={(event) =>
                      saveApplication(application.universityId, {
                        notes: event.target.value,
                      })
                    }
                    placeholder="Programme preferences, fee-waiver questions, documents to collect…"
                  />
                  <small className="muted">
                    Saved as you type ·{" "}
                    {application.notes.length.toLocaleString()} / 3,000
                    characters
                  </small>
                </label>
                <div className="panel-header application-footer">
                  <a
                    className="button secondary"
                    href={university.sources[0]?.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official admissions information <ExternalLink size={15} />
                  </a>
                  {removing === application.universityId ? (
                    <div className="button-row">
                      <span className="muted">
                        Remove this checklist and notes?
                      </span>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => setRemoving(null)}
                      >
                        Keep it
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => {
                          update({
                            applications: data.applications.filter(
                              (item) =>
                                item.universityId !== application.universityId,
                            ),
                          });
                          setRemoving(null);
                          notify(
                            `${university.shortName} application removed.`,
                          );
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => setRemoving(application.universityId)}
                    >
                      <Trash2 size={16} /> Remove application
                    </button>
                  )}
                </div>
                {count === total && total > 0 && (
                  <p className="inline-note">
                    <Check size={19} aria-hidden="true" /> Checklist complete.
                    Review the official portal for any programme-specific items
                    before submitting.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
