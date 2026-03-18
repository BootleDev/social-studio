/**
 * Bootle voice engine rules as constants.
 * Source: bootle-copywriter/references/voice-engine.md
 */

export const BANNED_PHRASES = [
  "elevate your",
  "join the",
  "experience the",
  "discover the",
  "transform your",
  "take the first step",
  "start your journey",
  "in a world where",
  "imagine",
  "what if",
  "picture this",
  "the most",
  "the best",
  "the only",
  "truly",
  "ultimate",
  "revolutionary",
  "marine-grade",
  "silicone",
  "kits",
  "shaker",
  "tea strainer",
  "infuser",
  "filter",
  "accessories",
  "attachments",
  "100% plastic-free",
  "free from toxins",
  "buy now",
  "limited time",
  "don't miss out",
] as const;

export const AI_TELL_CHECKLIST = [
  "Em-dash (—) used more than once per piece",
  "Abstract noun trio (three abstract nouns in sequence)",
  "Generic closer phrase (elevate your, join the, etc.)",
  "Superlative without proof (best, most, ultimate)",
  "Filler opener (In a world where, Imagine, Picture this)",
  "Sentence over 20 words",
  "Uses 'we/us/our' without B2B context",
  "Exclamation mark (max 1 per piece for social)",
  "Could Hydro Flask, Stanley, or Chilly's use this exact line? If yes, rewrite.",
  "Wrong material vocabulary (silicone, marine-grade, accessories, attachments)",
  "Emoji wall (more than 2 emoji in the piece)",
] as const;

export const CONTENT_PILLARS = {
  "Creative Drinking":
    "Recipe posts, ingredient pairings, Inners in action (Shake, Brew, Infuse)",
  "Modular Living":
    "BYO/Studio, mix-and-match, size switching, inner module swaps",
  "Material Truth":
    "Materials close-ups, sustainability messaging, zero-plastic, glass clarity",
  "Community & Culture":
    "UGC, customer stories, Scandinavian design, behind-the-scenes",
  "Lifestyle & Wellness":
    "Gym content, yoga/fitness, daily routine, morning rituals, on-the-go",
  Seasonal:
    "Seasonal hooks, trend-jacking, timely content (update monthly)",
} as const;

export const EMOTIONAL_PILLARS = [
  "Health",
  "Wealth",
  "Relationships",
  "Convenience",
] as const;

export const CONTENT_THEMES = [
  "Ritual moments — morning brew, post-workout shake, afternoon infusion. Inners in action.",
  "Material close-ups — glass clarity, steel texture, rubber seal. Honest about what's inside.",
  "Modular swaps — satisfying click of changing Inners. Twist-open reveal. Visual ASMR.",
  "User stories — how real people use their Bootle. Gym, office, travel, outdoor.",
  "Seasonal hooks — summer hydration, winter hot drinks, spring detox.",
  "Behind the design — Scandinavian design decisions. Why glass. Why modular. Why no plastic.",
] as const;

export const CLAIMS_RULES = {
  doSay: [
    "Free from microplastics",
    "Free from BPA, BPS, lead, and other harmful toxins",
    "Built to last. Sustainable by design.",
    "A bottle designed for every part of your day.",
    "A new generation of bottle.",
    "The leakproof inner design...",
  ],
  dontSay: [
    "100% plastic-free",
    "Free from toxins",
    "Truly sustainable, the most sustainable",
    "A modular hydration system engineered to integrate seamlessly",
    "We've created a new generation of bottle.",
    "Our inner design is leakproof...",
  ],
} as const;

export interface ValidationResult {
  score: number;
  issues: string[];
}

/** Client-side pre-check of caption against voice rules. */
export function validateCaption(text: string): ValidationResult {
  const issues: string[] = [];

  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push(`Contains banned phrase: "${phrase}"`);
    }
  }

  // Em-dash: max 1 per piece (OK where it adds flow, not overused)
  const emDashCount = (text.match(/—/g) || []).length;
  if (emDashCount > 1) {
    issues.push(`${emDashCount} em-dashes found (max 1 per piece)`);
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  for (const sentence of sentences) {
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount > 20) {
      issues.push(
        `Sentence with ${wordCount} words (max 20): "${sentence.trim().slice(0, 50)}..."`,
      );
    }
  }

  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    issues.push(`${exclamationCount} exclamation marks (max 1 for social)`);
  }

  // Emoji count
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 2) {
    issues.push(`${emojiCount} emoji (max 2)`);
  }

  if (/\bmarine[- ]grade\b/i.test(text)) {
    issues.push('Uses "marine-grade" (should be "surgical steel")');
  }
  if (/\bsilicone\b/i.test(text)) {
    issues.push('Uses "silicone" (should be "natural rubber")');
  }
  if (/\baccessories\b/i.test(text)) {
    issues.push('Uses "accessories" (should be "Inners")');
  }
  if (/\battachments\b/i.test(text)) {
    issues.push('Uses "attachments" (should be "Inners")');
  }

  const score = Math.max(0, 10 - issues.length);
  return { score, issues };
}
