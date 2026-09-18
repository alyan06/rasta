import { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  DownloadSimple,
  FileText,
  Lightbulb,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import type { EssayDraft, WorkspaceProps } from "../types";
import {
  buildOutline,
  countWords,
  EMPTY_STORY,
  getWritingChecks,
  PRACTICE_PROMPTS,
  type StoryDetails,
} from "../lib/essay";

const STORY_FIELDS: {
  key: keyof StoryDetails;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "moment",
    label: "A moment that stayed with you",
    placeholder:
      "Where were you? What happened? An ordinary moment can tell a meaningful story.",
  },
  {
    key: "action",
    label: "What you actually did",
    placeholder:
      "Describe your decisions and actions. Be specific about your own contribution.",
  },
  {
    key: "learning",
    label: "What changed in you",
    placeholder:
      "What did you notice, question, or understand differently afterwards?",
  },
  {
    key: "future",
    label: "Where it takes you next",
    placeholder:
      "What question, interest, or contribution do you want to explore next?",
  },
];

export default function EssaysPage({
  data,
  update,
  notify,
  storageAvailable = true,
}: WorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    data.essays[0]?.id ?? null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [outlineFor, setOutlineFor] = useState<string | null>(null);
  const draft =
    data.essays.find((essay) => essay.id === selectedId) ?? data.essays[0];
  const story = { ...EMPTY_STORY, ...draft?.story };
  const wordLimit = draft?.wordLimit ?? 650;
  const wordCount = countWords(draft?.content ?? "");
  const checks = getWritingChecks(draft?.content ?? "", wordLimit);
  const hasStory = Object.values(story).some((value) => value.trim());

  function changeDraft(patch: Partial<EssayDraft>) {
    if (!draft) return;
    update({
      essays: data.essays.map((essay) =>
        essay.id === draft.id
          ? { ...essay, ...patch, updatedAt: new Date().toISOString() }
          : essay,
      ),
    });
  }

  function createDraft() {
    const next: EssayDraft = {
      id: crypto.randomUUID(),
      title: `My story${data.essays.length ? ` ${data.essays.length + 1}` : ""}`,
      prompt: PRACTICE_PROMPTS[0].prompt,
      content: "",
      updatedAt: new Date().toISOString(),
      wordLimit: 650,
      story: { ...EMPTY_STORY },
    };
    update({ essays: [next, ...data.essays] });
    setSelectedId(next.id);
    setDeleteId(null);
    setOutlineFor(null);
  }

  function removeDraft(id: string) {
    const remaining = data.essays.filter((essay) => essay.id !== id);
    update({ essays: remaining });
    if (draft?.id === id) setSelectedId(remaining[0]?.id ?? null);
    setDeleteId(null);
    notify("Draft deleted.");
  }

  function exportDraft() {
    if (!draft) return;
    const content = `${draft.title.trim() || "Untitled draft"}\n\nPrompt\n${draft.prompt}\n\n${draft.content}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(draft.title.trim() || "rasta-essay").replace(/[^\p{L}\p{N}\-_ ]/gu, "").slice(0, 80) || "rasta-essay"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Your draft has been exported as a text file.");
  }

  return (
    <div className="essays-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR STORY, IN YOUR WORDS</span>
          <h1>
            Essay studio<span className="heading-dot">.</span>
          </h1>
          <p>Find the story only you can tell. Give it space to grow.</p>
        </div>
        <button className="button" onClick={createDraft}>
          <Plus size={18} /> New draft
        </button>
      </div>

      <div className="essay-layout">
        <aside
          className="essay-sidebar stack"
          aria-label="Drafts and story planning"
        >
          <section className="panel">
            <div className="panel-header">
              <h2>Your drafts</h2>
              <span className="badge">{data.essays.length}</span>
            </div>
            {data.essays.length ? (
              <div className="essay-draft-list">
                {data.essays.map((essay) => (
                  <div
                    className={`essay-draft-row ${draft?.id === essay.id ? "active" : ""}`}
                    key={essay.id}
                  >
                    <button
                      className="essay-draft-button"
                      onClick={() => {
                        setSelectedId(essay.id);
                        setDeleteId(null);
                      }}
                      aria-pressed={draft?.id === essay.id}
                    >
                      <FileText size={20} />
                      <span>
                        <strong>
                          {essay.title.trim() || "Untitled draft"}
                        </strong>
                        <small>{countWords(essay.content)} words</small>
                      </span>
                    </button>
                    <button
                      className="button ghost icon-button"
                      aria-label={`Delete ${essay.title.trim() || "untitled draft"}`}
                      onClick={() =>
                        setDeleteId(deleteId === essay.id ? null : essay.id)
                      }
                    >
                      <Trash size={17} />
                    </button>
                    {deleteId === essay.id && (
                      <div className="essay-delete-confirm">
                        <p>Delete this draft and its story notes?</p>
                        <button
                          className="button secondary small"
                          onClick={() => removeDraft(essay.id)}
                        >
                          Delete draft
                        </button>
                        <button
                          className="button ghost small"
                          onClick={() => setDeleteId(null)}
                        >
                          Keep it
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                Your first draft starts with a real experience.
              </p>
            )}
          </section>

          {draft && (
            <section className="panel essay-story">
              <div className="panel-header">
                <h2>
                  <Lightbulb size={20} /> Find your story
                </h2>
                <span className="badge">Guided</span>
              </div>
              <p className="muted">
                Use rough notes. Family responsibilities, a small project, or a
                difficult decision all count as experiences.
              </p>
              <div className="stack">
                {STORY_FIELDS.map((field) => (
                  <label className="field" key={field.key}>
                    <span>{field.label}</span>
                    <textarea
                      rows={3}
                      value={story[field.key]}
                      onChange={(event) =>
                        changeDraft({
                          story: { ...story, [field.key]: event.target.value },
                        })
                      }
                      placeholder={field.placeholder}
                    />
                  </label>
                ))}
              </div>
              <button
                className="button secondary essay-outline-button"
                disabled={!hasStory}
                onClick={() => setOutlineFor(draft.id)}
              >
                Build my outline <ArrowRight size={17} />
              </button>
              <p className="inline-note">
                Your notes become an outline. You write the story.
              </p>
            </section>
          )}
        </aside>

        {draft ? (
          <div className="essay-workspace stack" key={draft.id}>
            <section className="panel essay-editor-panel">
              <div className="essay-toolbar">
                <span className="badge">
                  <span className="status-dot" />{" "}
                  {storageAvailable
                    ? "Autosaved on this device"
                    : "In memory · export a backup"}
                </span>
                <button className="button ghost small" onClick={exportDraft}>
                  <DownloadSimple size={18} /> Export .txt
                </button>
              </div>
              <label className="field essay-title-field">
                <span>Draft title</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    changeDraft({ title: event.target.value })
                  }
                  maxLength={120}
                  placeholder="Give your story a title"
                />
              </label>
              <div className="form-grid essay-prompt-controls">
                <label className="field">
                  <span>Practice prompt</span>
                  <select
                    value={
                      PRACTICE_PROMPTS.find(
                        (prompt) => prompt.prompt === draft.prompt,
                      )?.id ?? "custom"
                    }
                    onChange={(event) => {
                      const next = PRACTICE_PROMPTS.find(
                        (prompt) => prompt.id === event.target.value,
                      );
                      if (next) changeDraft({ prompt: next.prompt });
                      else changeDraft({ prompt: "" });
                    }}
                  >
                    {PRACTICE_PROMPTS.map((prompt) => (
                      <option value={prompt.id} key={prompt.id}>
                        {prompt.label}
                      </option>
                    ))}
                    <option value="custom">My own prompt</option>
                  </select>
                </label>
                <label className="field">
                  <span>Word target</span>
                  <select
                    value={wordLimit}
                    onChange={(event) =>
                      changeDraft({ wordLimit: Number(event.target.value) })
                    }
                  >
                    <option value={250}>250 words</option>
                    <option value={500}>500 words</option>
                    <option value={650}>650 words</option>
                  </select>
                </label>
              </div>
              <label className="field essay-prompt">
                <span>Prompt to work with</span>
                <textarea
                  rows={2}
                  value={draft.prompt}
                  onChange={(event) =>
                    changeDraft({ prompt: event.target.value })
                  }
                  placeholder="Paste the prompt from your application, or write your own."
                />
              </label>
              <p className="inline-note">
                The examples are practice prompts. Confirm the current prompt,
                length, and writing rules in your university’s application.
              </p>

              {outlineFor === draft.id && (
                <div className="essay-outline">
                  <div className="panel-header">
                    <h3>Your story outline</h3>
                    <button
                      className="button ghost small"
                      onClick={() => setOutlineFor(null)}
                    >
                      Close
                    </button>
                  </div>
                  <p className="muted">
                    Built from your notes. Brackets mark details for you to fill
                    in.
                  </p>
                  <pre>{buildOutline(story)}</pre>
                  <button
                    className="button secondary small"
                    onClick={() => {
                      changeDraft({
                        content: `${draft.content.trimEnd()}${draft.content.trim() ? "\n\n" : ""}${buildOutline(story)}`,
                      });
                      setOutlineFor(null);
                      notify(
                        "Outline added. Replace the structure and notes with your own prose.",
                      );
                    }}
                  >
                    {draft.content.trim()
                      ? "Append outline to draft"
                      : "Use outline in draft"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              <label className="field essay-content-field">
                <span>Your draft</span>
                <textarea
                  className="essay-editor"
                  rows={17}
                  value={draft.content}
                  onChange={(event) =>
                    changeDraft({ content: event.target.value })
                  }
                  placeholder={
                    "Start with a moment. Where were you? What did you notice? What did you decide to do?\n\nIt does not have to sound perfect yet."
                  }
                  spellCheck
                />
              </label>
              <div className="essay-stats">
                <span
                  className={wordCount > wordLimit ? "text-warning" : "muted"}
                >
                  <strong>{wordCount}</strong> / {wordLimit} words
                </span>
                <span className="muted">
                  {Math.max(1, Math.ceil(wordCount / 200))} min read
                </span>
              </div>
            </section>

            <section className="panel essay-checks">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">A SECOND LOOK</span>
                  <h2>Writing checks</h2>
                </div>
                <span className="badge">Local tools</span>
              </div>
              <p className="muted">
                Simple checks for clarity, length, and reflection. These are
                writing cues, not AI review or an admissions score.
              </p>
              <div className="essay-feedback-list">
                {checks.map((check) => (
                  <div className={`essay-check ${check.tone}`} key={check.id}>
                    {check.tone === "good" ? (
                      <CheckCircle size={21} />
                    ) : check.tone === "caution" ? (
                      <WarningCircle size={21} />
                    ) : (
                      <Lightbulb size={21} />
                    )}
                    <div>
                      <h3>{check.title}</h3>
                      <p>{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="inline-note">
                Keep the final work accurate and in your voice. Ask someone who
                knows you whether the essay sounds like you.
              </p>
            </section>
          </div>
        ) : (
          <section className="panel empty-state essay-empty">
            <div className="empty-state-icon">
              <FileText size={32} />
            </div>
            <span className="eyebrow">A BLANK PAGE. A REAL BEGINNING.</span>
            <h2>Start your first essay</h2>
            <p>
              Turn a lived experience into a thoughtful essay with story
              questions, an outline, and a quiet place to write.
            </p>
            <button className="button" onClick={createDraft}>
              Start your first draft <ArrowRight size={18} />
            </button>
            <p className="inline-note">
              Free to use. Your writing stays on this device until you export
              it.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
