export interface StoryDetails {
  moment: string;
  action: string;
  learning: string;
  future: string;
}

export interface WritingCheck {
  id: string;
  title: string;
  detail: string;
  tone: "good" | "caution" | "neutral";
}

export const EMPTY_STORY: StoryDetails = {
  moment: "",
  action: "",
  learning: "",
  future: "",
};

export const PRACTICE_PROMPTS = [
  {
    id: "personal",
    label: "Personal statement · Common App practice",
    prompt:
      "Tell a story about an experience that shaped how you see yourself or the world. What changed, and what did you learn?",
  },
  {
    id: "lums",
    label: "Academic interests · LUMS practice",
    prompt:
      "What led you to your intended area of study? Connect a real experience with what you hope to explore at university.",
  },
  {
    id: "why",
    label: "Why this university? · Practice",
    prompt:
      "Connect your academic interests and goals to specific opportunities at a university you are considering. Explain how you would contribute.",
  },
  {
    id: "scholarship",
    label: "Community & contribution · Practice",
    prompt:
      "Describe a meaningful contribution you made at home, school, work, or in your community. What did you do, and how has it influenced your next steps?",
  },
] as const;

export function countWords(text: string): number {
  return (text.trim().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [])
    .length;
}

function excerpt(text: string, length = 135): string {
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

export function buildOutline(story: StoryDetails): string {
  const sections: [string, string, string][] = [
    [
      "1. Open with one real moment",
      story.moment,
      "Describe where you were and what happened. Choose one detail a reader can picture.",
    ],
    [
      "2. Show what you did",
      story.action,
      "Explain your own actions and decisions. Make your contribution clear without overstating it.",
    ],
    [
      "3. Reflect on what changed",
      story.learning,
      "What surprised you? Explain how your thinking or behaviour changed.",
    ],
    [
      "4. Look ahead",
      story.future,
      "Connect this experience to a question, interest, or contribution you want to pursue.",
    ],
  ];
  return sections
    .map(
      ([heading, response, hint]) =>
        `${heading}\n${response.trim() || `[${hint}]`}`,
    )
    .join("\n\n");
}

export function getWritingChecks(
  content: string,
  limit: number,
): WritingCheck[] {
  const words = countWords(content);
  if (!words) {
    return [
      {
        id: "start",
        title: "Start with a moment",
        detail:
          "Write a few sentences about something that actually happened to you. These checks will respond to your draft as you write.",
        tone: "neutral",
      },
    ];
  }

  const checks: WritingCheck[] = [];
  checks.push(
    words > limit
      ? {
          id: "length",
          title: `${words - limit} words over your target`,
          detail: `Your draft has ${words} words against a ${limit}-word target. Cut repeated context before cutting the moments that show your choices.`,
          tone: "caution",
        }
      : {
          id: "length",
          title: `${limit - words} words available`,
          detail: `Your draft is ${words} of your selected ${limit} words. Use the space you need; filling every word is not a goal. Check the actual application limit before submitting.`,
          tone: "good",
        },
  );

  const sentences = content
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const longest = sentences.reduce(
    (current, sentence) =>
      countWords(sentence) > countWords(current) ? sentence : current,
    "",
  );
  if (countWords(longest) > 32) {
    checks.push({
      id: "sentences",
      title: "Give this sentence room to breathe",
      detail: `One sentence is ${countWords(longest)} words: “${excerpt(longest)}” Try separating the action from what it meant to you.`,
      tone: "caution",
    });
  } else if (words >= 70) {
    checks.push({
      id: "sentences",
      title: "Your sentences are manageable",
      detail:
        "No sentence exceeds 32 words. Read your draft aloud to hear where the rhythm feels rushed or repetitive.",
      tone: "good",
    });
  }

  const vaguePhrases = [
    "made a difference",
    "changed my life",
    "passionate about",
    "hard-working",
    "hardworking",
    "helping others",
    "many things",
    "various activities",
    "learned a lot",
    "ever since i was young",
  ];
  const presentPhrases = vaguePhrases.filter((phrase) =>
    content.toLowerCase().includes(phrase),
  );
  if (presentPhrases.length) {
    checks.push({
      id: "specificity",
      title: "Trade a broad claim for evidence",
      detail: `You use ${presentPhrases
        .slice(0, 3)
        .map((phrase) => `“${phrase}”`)
        .join(
          ", ",
        )}. What specific choice, task, conversation, or result could show the reader what you mean?`,
      tone: "caution",
    });
  } else if (words >= 50) {
    checks.push({
      id: "specificity",
      title: "Make one detail unmistakably yours",
      detail:
        "Find a sentence another applicant could also write. Add a real place, action, observation, or conversation that belongs to your experience. Include numbers only when they are accurate and useful.",
      tone: "neutral",
    });
  }

  const reflection =
    /\b(learn(?:ed|t)?|reali[sz](?:e|ed|ation)|underst(?:and|ood)|discover(?:ed)?|question(?:ed)?|rethink|changed my|taught me|I now|I used to|I began to|looking back)\b/iu.test(
      content,
    );
  if (words >= 50) {
    checks.push(
      reflection
        ? {
            id: "reflection",
            title: "Take your reflection one step further",
            detail:
              "Your draft includes language about learning or changing. Does it explain what you do or think differently now? A keyword alone cannot show depth.",
            tone: "neutral",
          }
        : {
            id: "reflection",
            title: "Move from “what happened” to “why it matters”",
            detail:
              "The draft has few explicit signals of reflection. Ask: What assumption did this challenge? What would I do differently now? There are many valid ways to express this.",
            tone: "neutral",
          },
    );
  }

  const stopWords = new Set([
    "about",
    "after",
    "again",
    "because",
    "before",
    "being",
    "between",
    "could",
    "during",
    "every",
    "first",
    "found",
    "from",
    "have",
    "into",
    "itself",
    "myself",
    "other",
    "our",
    "over",
    "should",
    "some",
    "that",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "under",
    "until",
    "very",
    "want",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "will",
    "with",
    "would",
    "your",
  ]);
  const frequencies = new Map<string, number>();
  for (const word of content.toLowerCase().match(/[\p{L}]+/gu) ?? []) {
    if (word.length > 4 && !stopWords.has(word))
      frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }
  const repeated = [...frequencies]
    .filter(([, count]) => count >= 4 && (count >= 6 || count / words >= 0.025))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (repeated.length) {
    checks.push({
      id: "repetition",
      title: "Check recurring words",
      detail: `${repeated.map(([word, count]) => `“${word}” appears ${count} times`).join("; ")}. Keep intentional repetition, but check whether you are making the same point more than once.`,
      tone: "caution",
    });
  }

  if (/\[[^\]]+\]/u.test(content)) {
    checks.push({
      id: "placeholders",
      title: "An outline note is still in the draft",
      detail:
        "There is text in square brackets. Replace any planning instructions with your own words before exporting a submission draft.",
      tone: "caution",
    });
  }

  return checks;
}
