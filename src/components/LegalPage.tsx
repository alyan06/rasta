import type { Page } from "../types";
import { cloudConfigured } from "../lib/cloud";

export default function LegalPage({
  kind,
  navigate,
}: {
  kind: "privacy" | "terms";
  navigate?: (page: Page) => void;
}) {
  const privacy = kind === "privacy";
  return (
    <div className="stack legal-page">
      <header className="page-heading">
        <div>
          <h1>{privacy ? "Privacy policy" : "Terms of use"}</h1>
          <p>Rasta beta · Updated 15 September 2026</p>
        </div>
      </header>
      <article className="panel legal-copy stack">
        {privacy ? (
          <>
            <section>
              <h2>Your information, in plain words</h2>
              <p>
                Rasta is a student admissions planning workspace. You can enter
                your name, education, grades, predicted results, test scores,
                interests, activities, family earnings, university wishlist,
                application notes, and essay drafts. These details help Rasta
                show your plan and compare your profile with the information in
                its university catalogue.
              </p>
            </section>
            <section>
              <h2>Using Rasta on this device</h2>
              <p>
                Your workspace and theme preference are saved in this browser
                when browser storage is available. Other people using the same
                browser may be able to see saved information. Downloaded backups
                stay wherever you choose to save them. Clearing browser data can
                remove local work, so keep a backup if you need it.
              </p>
            </section>
            <section>
              <h2>Google sign-in and account saving</h2>
              <p>
                {cloudConfigured
                  ? "Google sign-in is connected on this installation."
                  : "Google sign-in is not connected on this installation. There is currently no account upload from this installation."}{" "}
                When account saving is connected and you choose to use it,
                Google handles sign-in and Supabase stores the account session
                and the workspace you choose to sync. Rasta receives basic
                account details, including your Google account identifier and
                email; it does not receive your Google password.
              </p>
              <p>
                You choose between the device and account copies before syncing.
                Once enabled, changes to your workspace are uploaded to the
                configured Supabase project. Account sessions are stored in your
                browser. Sign out before leaving a shared device.
              </p>
            </section>
            <section>
              <h2>Contact messages</h2>
              <p>
                The contact form asks for a topic, a message, and optional name
                and reply email. When delivery is connected, pressing Send
                message shares those fields and your signed-in account
                identifier with Rasta for review. Your profile, grades,
                activities, and essays are not attached to feedback. When
                delivery is disconnected, the form provides a draft download and
                does not send the message.
              </p>
            </section>
            <section>
              <h2>Other services</h2>
              <p>
                Google and Supabase process information needed for their
                respective sign-in and storage services. Their own policies
                apply to those services. University links lead to external
                websites. Rasta does not include advertising or analytics
                tracking in this beta, and essay drafts are not sent to an AI
                service.
              </p>
              <p>
                University logos are loaded from each institution’s own website
                through Google’s public favicon service. That request tells
                Google the university domain your browser asked for; it does not
                include your name, grades or profile. Admission statistics come
                from public datasets (the HEC registry and the US IPEDS files)
                and are bundled with the app, so viewing them sends nothing.
              </p>
            </section>
            <section>
              <h2>Keeping and removing your data</h2>
              <p>
                You can edit your workspace and export a backup through Rasta.
                Removing browser data affects local copies; it does not delete
                an account or its cloud copy. The project operator must handle
                account deletion and feedback retention through the configured
                backend. A public data-request contact and retention schedule
                still need to be set before production launch.
              </p>
            </section>
            <section>
              <h2>Before the public launch</h2>
              <p>
                This beta notice describes the implemented data flow. The
                project owner’s identity, a working privacy contact, hosting
                region, retention periods, and a process for student and
                guardian data requests must be published before Rasta opens for
                production use.
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2>What Rasta helps you do</h2>
              <p>
                Rasta helps students plan university applications, compare
                academic requirements, explore test scores, organize activities,
                and draft essays. The beta is free. Paid AI writing features are
                not included in this version.
              </p>
            </section>
            <section>
              <h2>Admissions guidance</h2>
              <p>
                Chance estimates, profile comparisons and score scenarios are
                planning estimates built from published statistics about
                previous classes and the factors shown on the page. They are not
                an admission decision, an official IBCC certificate, or a
                guarantee of an offer or scholarship. Actual
                decisions depend on each university, programme, campus, intake,
                applicant pool, and application. Predicted grades are identified
                as predictions.
              </p>
              <p>
                Always verify requirements, accepted tests, fees, financial aid,
                and deadlines on the university’s official website before
                applying. Data coverage varies between universities. Missing
                information does not mean that a requirement does not exist.
              </p>
            </section>
            <section>
              <h2>Your work and your account</h2>
              <p>
                Use your own details, describe activities honestly, and keep
                your essays in your own voice. You remain responsible for the
                material you submit to a university. Rasta does not submit
                applications or pay fees for you. Keep backups of important
                drafts and protect your account and shared devices.
              </p>
            </section>
            <section>
              <h2>Respectful use</h2>
              <p>
                Do not impersonate another student, upload information you have
                no right to share, send abusive feedback, or interfere with the
                app or other accounts. University names and logos identify their
                institutions; their appearance does not imply endorsement or a
                partnership with Rasta.
              </p>
            </section>
            <section>
              <h2>A beta still being built</h2>
              <p>
                Features, data, and availability may change while Rasta is being
                developed. Account saving and message delivery require the
                project’s backend to be connected. This beta is not ready for a
                public production launch until the published coverage and
                service setup requirements are completed.
              </p>
            </section>
            <section>
              <h2>Questions and improvements</h2>
              <p>
                Use the contact form to share an issue or suggestion. If
                delivery is not connected, download your message draft for
                later. A public support and privacy request process will be
                available before production launch.
              </p>
            </section>
          </>
        )}
        <div className="button-row">
          <a
            className="button secondary"
            href="#contact"
            onClick={
              navigate
                ? (event) => {
                    event.preventDefault();
                    navigate("contact");
                  }
                : undefined
            }
          >
            Contact &amp; feedback
          </a>
          <a href={privacy ? "#terms" : "#privacy"}>
            {privacy ? "Terms of use" : "Privacy policy"}
          </a>
        </div>
      </article>
    </div>
  );
}
