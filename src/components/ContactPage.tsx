import { useState } from "react";
import {
  ChatCircleText,
  DownloadSimple,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { WorkspaceProps } from "../types";
import {
  cloudConfigured,
  getCloudClient,
  sendFeedback,
  validateFeedback,
  type FeedbackDraft,
} from "../lib/cloud";
import { downloadFile } from "../lib/storage";

export default function ContactPage({ data, notify }: WorkspaceProps) {
  const [draft, setDraft] = useState<FeedbackDraft>({
    category: "idea",
    name: data.profile.isDemo ? "" : data.profile.name,
    email: "",
    message: "",
    consent: false,
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = <K extends keyof FeedbackDraft>(
    key: K,
    value: FeedbackDraft[K],
  ) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setSent(false);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const problem = validateFeedback(draft);
    if (problem) {
      setError(problem);
      return;
    }
    const connection = getCloudClient();
    if (!connection) {
      setError(
        "Delivery is not connected yet. Download your draft to keep it for later.",
      );
      return;
    }
    setError("");
    setSending(true);
    try {
      await sendFeedback(connection, draft);
      setSent(true);
      setDraft((previous) => ({ ...previous, message: "", consent: false }));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Your message was not sent. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="stack contact-page">
      <header className="page-heading">
        <div>
          <h1>Contact &amp; feedback</h1>
          <p>
            A missing university, a confusing step, or a good idea? Tell us how
            Rasta could help you better.
          </p>
        </div>
      </header>
      {!cloudConfigured && (
        <div className="inline-note">
          <ChatCircleText size={24} aria-hidden="true" />
          <div>
            <strong>Message delivery is not connected yet.</strong>
            <p>
              You can write and download a draft. Nothing will be sent or added
              to a mailbox until delivery is connected.
            </p>
          </div>
        </div>
      )}
      <form
        className="panel stack contact-form"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <div className="form-grid">
          <label className="field">
            <span>What is it about?</span>
            <select
              value={draft.category}
              onChange={(event) =>
                set("category", event.target.value as FeedbackDraft["category"])
              }
            >
              <option value="idea">An idea or improvement</option>
              <option value="problem">Something is not working</option>
              <option value="question">A question</option>
              <option value="other">Something else</option>
            </select>
          </label>
          <label className="field">
            <span>
              Your name <small>(optional)</small>
            </span>
            <input
              autoComplete="name"
              value={draft.name}
              maxLength={80}
              onChange={(event) => set("name", event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>
            Email for a reply <small>(optional)</small>
          </span>
          <input
            type="email"
            autoComplete="email"
            value={draft.email}
            maxLength={254}
            placeholder="Only if you would like a reply"
            onChange={(event) => set("email", event.target.value)}
          />
          <small>Your email will not be shown publicly.</small>
        </label>
        <label className="field">
          <span>Your message</span>
          <textarea
            rows={7}
            maxLength={5000}
            minLength={10}
            value={draft.message}
            required
            placeholder="Tell us what happened, or what would make Rasta more useful for you."
            onChange={(event) => set("message", event.target.value)}
          />
          <small>
            {draft.message.length.toLocaleString()} / 5,000 characters. Please
            leave out passwords, CNIC numbers, and private documents.
          </small>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.consent}
            onChange={(event) => set("consent", event.target.checked)}
          />
          <span>
            I agree to share this message and the contact details I entered with
            Rasta. <a href="#privacy">Privacy policy</a>
          </span>
        </label>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        {sent && (
          <div className="inline-note" role="status">
            <div>
              <strong>Thank you. Your message was received.</strong>
              <p>
                It is saved for the Rasta team to review. Your university
                profile and essays were not attached.
              </p>
            </div>
          </div>
        )}
        <div className="button-row">
          <button
            className="button"
            type="submit"
            disabled={!cloudConfigured || sending}
          >
            <PaperPlaneTilt size={18} aria-hidden="true" />
            {sending ? "Sending…" : "Send message"}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={!draft.message.trim()}
            onClick={() => {
              downloadFile(
                "rasta-feedback-draft.txt",
                `Rasta feedback draft — not sent\n\nTopic: ${draft.category}\nName: ${draft.name || "Not provided"}\nReply email: ${draft.email || "Not provided"}\n\n${draft.message}`,
                "text/plain;charset=utf-8",
              );
              notify("Feedback draft downloaded. It has not been sent.");
            }}
          >
            <DownloadSimple size={18} aria-hidden="true" /> Download draft
          </button>
        </div>
        <p className="muted">
          {cloudConfigured
            ? "Sign in with Google before sending. Only this form is shared when you press Send message."
            : "Your draft stays on this page while it is open. Download it before leaving to keep a copy."}
        </p>
      </form>
    </div>
  );
}
