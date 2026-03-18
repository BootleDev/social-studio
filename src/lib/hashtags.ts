/**
 * Hashtag rotation sets from bootle-vault/marketing/hashtags.md
 * Source of truth: updated 2026-03-12
 */

export type HashtagSet = "A" | "B" | "C" | "D" | "E" | "F";

export type ContentPillar =
  | "Creative Drinking"
  | "Modular Living"
  | "Material Truth"
  | "Community & Culture"
  | "Lifestyle & Wellness"
  | "Seasonal";

export const BRANDED_TAGS = ["#bootle", "#bootleofficial"] as const;

export const ROTATION_SETS: Record<
  HashtagSet,
  { pillar: ContentPillar; tags: string[]; useFor: string }
> = {
  A: {
    pillar: "Creative Drinking",
    tags: [
      "#creativedrinking",
      "#infusedwater",
      "#fruitwater",
      "#herbalinfusion",
      "#healthydrinks",
      "#drinkrecipe",
      "#wellnessdrink",
      "#hydrationgoals",
      "#drinkmore",
      "#dailyhydration",
    ],
    useFor:
      "Recipe posts, ingredient pairings, drink-of-the-day content",
  },
  B: {
    pillar: "Modular Living",
    tags: [
      "#modularbottle",
      "#buildyourown",
      "#customisable",
      "#adaptivedesign",
      "#reusablebottle",
      "#waterbottle",
      "#drinkwaredesign",
      "#onebottleforall",
      "#sustainabledesign",
      "#smartdesign",
    ],
    useFor: "BYO/Studio posts, mix-and-match, size switching, inner modules",
  },
  C: {
    pillar: "Material Truth",
    tags: [
      "#plasticfree",
      "#zerowaste",
      "#nontoxic",
      "#cleandrinking",
      "#sustainableliving",
      "#ecofriendly",
      "#consciousliving",
      "#borosilicateglass",
      "#surgicalsteel",
      "#naturalmaterials",
    ],
    useFor:
      "Materials close-ups, sustainability messaging, zero-plastic content",
  },
  D: {
    pillar: "Community & Culture",
    tags: [
      "#bootlecommunity",
      "#ugc",
      "#customerreview",
      "#realpeople",
      "#scandinaviandesign",
      "#madeinsweden",
      "#nordicdesign",
      "#outdoorlife",
      "#activelifestyle",
      "#wellnessjourney",
    ],
    useFor:
      "UGC reposts, customer stories, partnerships, behind-the-scenes",
  },
  E: {
    pillar: "Lifestyle & Wellness",
    tags: [
      "#hydration",
      "#healthylifestyle",
      "#fitnessmotivation",
      "#gymessentials",
      "#morningroutine",
      "#selfcare",
      "#mindfuldrinking",
      "#onthego",
      "#dailyroutine",
      "#activelife",
    ],
    useFor: "Gym content, yoga/fitness collabs, daily routine posts",
  },
  F: {
    pillar: "Seasonal",
    tags: [
      "#springhydration",
      "#outdoorseason",
      "#newseason",
      "#sustainablespring",
      "#ecofriendlylifestyle",
      "#drinkbetter",
      "#hydrateyourself",
      "#waterintake",
    ],
    useFor:
      "Seasonal hooks, trend-jacking, timely content. Update monthly.",
  },
};

/** Map content pillars to their primary hashtag set. */
export const PILLAR_TO_SET: Record<string, HashtagSet> = {
  "Creative Drinking": "A",
  "Modular Living": "B",
  "Material Truth": "C",
  "Community & Culture": "D",
  "Lifestyle & Wellness": "E",
  Seasonal: "F",
};

export interface PlatformHashtagRules {
  min: number;
  max: number;
  placement: string;
}

export const PLATFORM_RULES: Record<string, PlatformHashtagRules> = {
  instagram_post: {
    min: 8,
    max: 12,
    placement: "First comment or end of caption",
  },
  instagram_reel: {
    min: 5,
    max: 8,
    placement: "End of caption",
  },
  facebook: {
    min: 1,
    max: 3,
    placement: "End of post (branded only)",
  },
};

/**
 * Select hashtags for a post based on pillar, platform, and post type.
 * Respects rotation rule: avoids the lastUsedSet if possible.
 */
export function selectHashtags(options: {
  pillar: ContentPillar;
  platform: "instagram" | "facebook";
  postType: "image" | "carousel" | "reel";
  lastUsedSet?: HashtagSet;
}): { set: HashtagSet; hashtags: string[] } {
  const { pillar, platform, postType, lastUsedSet } = options;

  // Determine target set from pillar
  let targetSet = PILLAR_TO_SET[pillar] ?? "A";

  // Rotation rule: if same as last used, shift to next
  if (targetSet === lastUsedSet) {
    const sets: HashtagSet[] = ["A", "B", "C", "D", "E", "F"];
    const idx = sets.indexOf(targetSet);
    targetSet = sets[(idx + 1) % sets.length];
  }

  // Get platform rules
  const ruleKey =
    platform === "facebook"
      ? "facebook"
      : postType === "reel"
        ? "instagram_reel"
        : "instagram_post";
  const rules = PLATFORM_RULES[ruleKey];

  // Build hashtag list
  const setTags = ROTATION_SETS[targetSet].tags;

  if (platform === "facebook") {
    // Facebook: branded only + 1 topical
    return {
      set: targetSet,
      hashtags: [...BRANDED_TAGS, setTags[0]].slice(0, rules.max),
    };
  }

  // Instagram: branded + selection from set
  const availableTags = [...setTags];
  const count = Math.min(rules.max - BRANDED_TAGS.length, availableTags.length);
  const selected = availableTags.slice(0, count);

  return {
    set: targetSet,
    hashtags: [...BRANDED_TAGS, ...selected],
  };
}
