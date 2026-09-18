import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle as CheckCircle2,
  ArrowSquareOut as ExternalLink,
  HandHeart as HeartHandshake,
  Lightbulb,
} from "@phosphor-icons/react";
import type { WorkspaceProps } from "../types";

type GuideTab = "pakistan" | "usa" | "equivalence";
interface GuideStep {
  title: string;
  text: string;
  tip: string;
}
const guides: Record<
  GuideTab,
  { title: string; intro: string; steps: GuideStep[] }
> = {
  pakistan: {
    title: "Your route to a university in Pakistan",
    intro:
      "Start with the programme you want, then work backwards through eligibility, tests, documents, and applications.",
    steps: [
      {
        title: "Choose a programme and campus",
        text: "Compare the degree content, campus, subject requirements, and total cost. Computing, engineering, and business can have different criteria at the same university.",
        tip: "Save a few universities in Explore. Include options you can realistically afford.",
      },
      {
        title: "Check your academic eligibility",
        text: "Use your Matric and FSc marks, or the IBCC equivalence requested for O and A Levels. Check required subjects and the policy for results that are still awaited.",
        tip: "A minimum academic requirement lets you apply; it does not guarantee a place.",
      },
      {
        title: "Plan the right admissions test",
        text: "Confirm the accepted test route for your programme and intake. Use NUST’s official NET information, FAST’s current test options, or the requirements of the relevant LUMS school.",
        tip: "In the Score planner, choose an aggregate target and see what test score it would require.",
      },
      {
        title: "Prepare documents and apply",
        text: "Follow each university’s portal instructions. Gather results, identity documents, required equivalence, test results, and any additional material. Review programme preferences before paying any required fee.",
        tip: "Copy the official deadline into Applications and retain your submission confirmation.",
      },
      {
        title: "Follow your result and funding applications",
        text: "Check the official portal for decisions, document requests, and acceptance instructions. Read the financial-aid process early; it may require a separate form and deadline.",
        tip: "Keep a copy of your offer, fee details, and every document you submit.",
      },
    ],
  },
  usa: {
    title: "A Pakistani student’s guide to the US",
    intro:
      "You do not need to turn yourself into a GPA. Explain your academic record clearly and follow each college’s instructions.",
    steps: [
      {
        title: "Build a list around fit and funding",
        text: "Read each college’s international admissions and aid pages. Compare majors, cost of attendance, international financial-aid eligibility, and application requirements.",
        tip: "Ask EducationUSA Pakistan for free guidance before committing to a costly application list.",
      },
      {
        title: "Prepare your school record",
        text: "Arrange the academic records and any translations each college requests. Share your curriculum, grading scale, and available school context. Do not invent a US GPA.",
        tip: "Ask your school who can send transcripts and complete school forms.",
      },
      {
        title: "Check testing and recommendation requirements",
        text: "Verify the current SAT or ACT policy and any English-language requirement at each college. Ask teachers for recommendations early and provide context about your work.",
        tip: "A higher SAT can strengthen a relevant part of an application; it does not translate into a reliable admission percentage.",
      },
      {
        title: "Tell your story in your own words",
        text: "Develop a specific personal statement, describe activities honestly, and answer each supplement. Show what you did, what you learned, and why the programme interests you.",
        tip: "Use the Essay studio to outline and revise. Your submitted story should reflect your own experiences and voice.",
      },
      {
        title: "Review, submit, and track",
        text: "Complete the application and any separate aid forms through the platforms each college specifies. Review deadlines, fee-waiver options, required materials, and your applicant portal.",
        tip: "Track admissions and aid deadlines separately in your notes, including the stated time zone.",
      },
    ],
  },
  equivalence: {
    title: "O and A Levels, understood in Pakistan",
    intro:
      "IBCC equivalence connects your qualification to SSC or HSSC. Start with the official rules for your subjects and examination location.",
    steps: [
      {
        title: "Check your subject combination",
        text: "IBCC’s British-system rules distinguish study groups and examinations taken in Pakistan or overseas. Review the relevant O Level and A Level subject requirements before applying.",
        tip: "A school’s predicted grade or a simple average is not an IBCC certificate.",
      },
      {
        title: "Gather the required documents",
        text: "Use IBCC’s current document checklist. Keep your certificates, identity documents, and any earlier equivalence ready. Check which originals, copies, or attestations your route requires.",
        tip: "For an HSSC equivalence application, check the requirements relating to your earlier SSC equivalence.",
      },
      {
        title: "Apply through the official IBCC process",
        text: "Use the official equivalence portal and follow its current submission and payment instructions. Keep your reference number and monitor requests for further documents.",
        tip: "IBCC fees are separate from Rasta. Confirm the current amount directly before paying.",
      },
      {
        title: "Use the certified result in Rasta",
        text: "Enter the SSC and HSSC percentages from your equivalence documents in your Profile. Leave an unavailable value blank. Rasta does not convert letter grades into official equivalence.",
        tip: "Keep result status set to awaiting until your final FSc or A Level result is received.",
      },
    ],
  },
};

const sources: Record<
  GuideTab,
  { label: string; detail: string; url: string }[]
> = {
  pakistan: [
    {
      label: "NUST undergraduate admissions",
      detail: "NET, applications, and current notices",
      url: "https://ugadmissions.nust.edu.pk/",
    },
    {
      label: "FAST application procedure",
      detail: "Official application instructions",
      url: "https://www.nu.edu.pk/Admissions/HowToApply",
    },
    {
      label: "FAST admissions FAQs",
      detail: "Test routes and application questions",
      url: "https://www.nu.edu.pk/Admissions/FAQ",
    },
    {
      label: "LUMS admissions",
      detail: "Programmes and school requirements",
      url: "https://admission.lums.edu.pk/",
    },
    {
      label: "LUMS document checklist",
      detail: "Admission and financial-aid documents",
      url: "https://admission.lums.edu.pk/checklist-admissions",
    },
  ],
  usa: [
    {
      label: "EducationUSA application guide",
      detail: "Official undergraduate application overview",
      url: "https://educationusa.state.gov/your-5-steps-us-study/complete-your-application/undergraduate",
    },
    {
      label: "EducationUSA Pakistan",
      detail: "Free advising through USEFP",
      url: "https://educationusa.pk/how-can-we-help/about-us.cfm",
    },
  ],
  equivalence: [
    {
      label: "IBCC British-system requirements",
      detail: "O Level and A Level subject rules",
      url: "https://ibcc.edu.pk/equivalence-intro/british-system/",
    },
    {
      label: "IBCC equivalence FAQs",
      detail: "Documents and application questions",
      url: "https://ibcc.edu.pk/faqs/equivalence-faqs/",
    },
    {
      label: "IBCC equivalence portal",
      detail: "Official online application",
      url: "https://equivalence.ibcc.edu.pk/?action=login",
    },
  ],
};

export default function GuidePage({ navigate }: WorkspaceProps) {
  const [tab, setTab] = useState<GuideTab>("pakistan");
  const guide = guides[tab];
  return (
    <div className="stack guide-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">YOUR QUESTIONS, UNCOMPLICATED</span>
          <h1>How to apply</h1>
          <p>
            A clear starting point for the things nobody explains at school.
          </p>
        </div>
      </header>
      <div
        className="segmented-control guide-tabs"
        role="group"
        aria-label="Choose an application guide"
      >
        {(
          [
            { key: "pakistan", label: "Applying in Pakistan" },
            { key: "usa", label: "Applying to the US" },
            { key: "equivalence", label: "IBCC equivalence" },
          ] as const
        ).map((item) => (
          <button
            type="button"
            key={item.key}
            className={tab === item.key ? "active" : ""}
            aria-pressed={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="guide-layout">
        <section className="panel guide-main" aria-label={guide.title}>
          <div className="panel-header">
            <div>
              <h2>{guide.title}</h2>
              <p className="muted">{guide.intro}</p>
            </div>
            <BookOpen size={24} aria-hidden="true" />
          </div>
          <ol className="guide-steps">
            {guide.steps.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <p className="guide-tip">
                    <Lightbulb size={16} aria-hidden="true" />
                    <span>{step.tip}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <button
            className="button"
            type="button"
            onClick={() =>
              navigate(tab === "equivalence" ? "profile" : "applications")
            }
          >
            {tab === "equivalence"
              ? "Update my profile"
              : "Build my application plan"}
            <ArrowRight size={17} />
          </button>
        </section>
        <aside className="stack guide-aside">
          <section className="panel">
            <div className="panel-header">
              <h2>Official links</h2>
              <ExternalLink size={19} aria-hidden="true" />
            </div>
            <div className="source-list">
              {sources[tab].map((source) => (
                <a
                  href={source.url}
                  key={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <strong>{source.label}</strong>
                    <small className="muted">{source.detail}</small>
                  </div>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="muted source-check-date">
              Links checked 15 September 2026. Read the current intake
              instructions before applying.
            </p>
          </section>
          <section className="panel aid-panel">
            <HeartHandshake size={27} aria-hidden="true" />
            <h2>Free help and financial aid</h2>
            <p>
              Rasta is free to use. University applications, tests, equivalence,
              and tuition can have their own fees.
            </p>
            <div className="stack">
              <a
                href="https://nop.lums.edu.pk/how-to-apply-nop"
                target="_blank"
                rel="noreferrer"
              >
                <strong>Explore LUMS NOP ↗</strong>
                <small className="muted">
                  An outreach and scholarship pathway. Read the eligibility
                  criteria and application process.
                </small>
              </a>
              <a
                href="https://educationusa.pk/how-can-we-help/about-us.cfm"
                target="_blank"
                rel="noreferrer"
              >
                <strong>Meet EducationUSA Pakistan ↗</strong>
                <small className="muted">
                  Free official guidance for studying in the US, through USEFP.
                </small>
              </a>
            </div>
          </section>
          <div className="inline-note">
            <CheckCircle2 size={21} aria-hidden="true" />
            <div>
              <strong>Plan with evidence.</strong>
              <p>
                Eligibility, merit aggregates, and admission decisions are
                different things. Rasta shows its assumptions; the university
                makes the final decision.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
