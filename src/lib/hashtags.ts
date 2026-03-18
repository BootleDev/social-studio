/**
 * Hashtag rotation sets — source of truth for Social Studio.
 * Sets A–E are fixed content pillars.
 * Set F is dynamic: resolves to the active season or campaign based on today's date.
 * Updated: 2026-03-18
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

// ---------------------------------------------------------------------------
// Fixed pillar sets (A–E)
// ---------------------------------------------------------------------------

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
    useFor: "Recipe posts, ingredient pairings, drink-of-the-day content",
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
    useFor: "Materials close-ups, sustainability messaging, zero-plastic content",
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
    useFor: "UGC reposts, customer stories, partnerships, behind-the-scenes",
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
  // Set F is a placeholder — always resolved dynamically via getSeasonalTags()
  F: {
    pillar: "Seasonal",
    tags: [],
    useFor: "Auto-resolves to the active season or campaign based on today's date",
  },
};

// ---------------------------------------------------------------------------
// Base seasons (meteorological, Northern Hemisphere)
// Mar 1–May 31 = Spring | Jun 1–Aug 31 = Summer
// Sep 1–Nov 30 = Autumn | Dec 1–Feb 28 = Winter
// ---------------------------------------------------------------------------

const BASE_SEASONS: Record<
  string,
  { label: string; tags: string[]; useFor: string }
> = {
  spring: {
    label: "Spring",
    tags: [
      "#springhydration",
      "#springwellness",
      "#outdoorseason",
      "#springvibes",
      "#freshstart",
      "#newseason",
      "#sustainablespring",
      "#drinkbetter",
      "#springmorning",
      "#outsidetime",
    ],
    useFor: "Outdoor content, fresh-start messaging, spring product launches",
  },
  summer: {
    label: "Summer",
    tags: [
      "#summerhydration",
      "#stayhydrated",
      "#summervibes",
      "#hotdays",
      "#beachday",
      "#outdoorsummer",
      "#summerdays",
      "#hydrateyourself",
      "#summeroutdoors",
      "#drinkmore",
    ],
    useFor: "Outdoor adventures, active summer lifestyle, heat/hydration messaging",
  },
  autumn: {
    label: "Autumn",
    tags: [
      "#autumnvibes",
      "#autumnwellness",
      "#cozyseason",
      "#autumndrinks",
      "#fallhydration",
      "#seasonalchange",
      "#hygge",
      "#autumnroutine",
      "#slowliving",
      "#warmdrinks",
    ],
    useFor: "Cosy content, Brew Inner, warm drink recipes, slow-living messaging",
  },
  winter: {
    label: "Winter",
    tags: [
      "#winterwellness",
      "#winterhydration",
      "#hotdrinks",
      "#cozydrinks",
      "#winterroutine",
      "#warmdrinks",
      "#hyggelife",
      "#indoorwellness",
      "#coldweather",
      "#drinkwarm",
    ],
    useFor: "Indoor wellness, warm drink recipes, gifting, Brew/Infuse Inners",
  },
};

// ---------------------------------------------------------------------------
// Campaign overlays — take priority over base season when active
// Priority order (if windows overlap): campaign wins over base season.
// Campaigns listed top-to-bottom; first match wins.
// ---------------------------------------------------------------------------

type CampaignWindow = {
  label: string;
  // [month (1-12), day] — inclusive on both ends
  start: [number, number];
  end: [number, number];
  tags: string[];
  useFor: string;
};

const CAMPAIGNS: CampaignWindow[] = [
  {
    label: "New Year",
    start: [12, 26],
    end: [1, 5],
    tags: [
      "#newyear",
      "#newyearnewyou",
      "#healthynewyear",
      "#newstart",
      "#wellnessgoals",
      "#hydrationgoals",
      "#healthgoals",
      "#freshstart",
      "#resolutions",
      "#drinkbetter",
    ],
    useFor: "New year reset messaging, health goals, fresh-start campaigns",
  },
  {
    label: "Valentine's Day",
    start: [2, 7],
    end: [2, 14],
    tags: [
      "#valentinesday",
      "#valentinesgift",
      "#giftsforher",
      "#giftsforhim",
      "#consciousgifting",
      "#sustainablegifts",
      "#giftideas",
      "#loveyourself",
      "#drinkwithlove",
      "#giftguide",
    ],
    useFor: "Gift messaging, couples content, self-love, gifting campaigns",
  },
  {
    label: "Easter",
    // Mar 21–Apr 20 covers Easter Sunday for virtually all years
    start: [3, 21],
    end: [4, 20],
    tags: [
      "#easter",
      "#eastergifts",
      "#springgift",
      "#easterweekend",
      "#bankholiday",
      "#giftideas",
      "#hydrationgift",
      "#springgifting",
      "#familytime",
      "#sustainablegifts",
    ],
    useFor: "Easter gifting, long weekend content, spring gift guides",
  },
  {
    label: "Back to School",
    start: [8, 20],
    end: [9, 10],
    tags: [
      "#backtoschool",
      "#newterm",
      "#backtouni",
      "#studentlife",
      "#campuslife",
      "#freshstart",
      "#schoolessentials",
      "#hydrationessentials",
      "#studentsofinstagram",
      "#organiselife",
    ],
    useFor: "Student audience, term-start messaging, daily essentials angle",
  },
  {
    label: "Black Friday",
    start: [11, 20],
    end: [11, 30],
    tags: [
      "#blackfriday",
      "#blackfridaydeal",
      "#consciousblackfriday",
      "#shopconsciously",
      "#sustainableshopping",
      "#giftideas",
      "#christmasgifts",
      "#shopsmarter",
      "#giftguide",
      "#ecogifts",
    ],
    useFor: "Promotional content, gift guide push, conscious-shopping angle",
  },
  {
    label: "Christmas",
    start: [12, 1],
    end: [12, 24],
    tags: [
      "#christmasgift",
      "#giftsforher",
      "#giftsforhim",
      "#christmasshopping",
      "#sustainablechristmas",
      "#consciousgifting",
      "#secretsanta",
      "#christmasideas",
      "#giftguide",
      "#ecochristmas",
    ],
    useFor: "Christmas gifting, festive campaigns, sustainable gift angle",
  },
];

// ---------------------------------------------------------------------------
// Resolution logic
// ---------------------------------------------------------------------------

function getBaseSeason(month: number): string {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function isInCampaignWindow(
  campaign: CampaignWindow,
  month: number,
  day: number,
): boolean {
  const [sm, sd] = campaign.start;
  const [em, ed] = campaign.end;

  // Handle year-wrap (e.g. New Year: Dec 26 – Jan 5)
  if (sm > em) {
    return (
      month > sm ||
      (month === sm && day >= sd) ||
      month < em ||
      (month === em && day <= ed)
    );
  }

  return (
    (month > sm || (month === sm && day >= sd)) &&
    (month < em || (month === em && day <= ed))
  );
}

export type SeasonalContext = {
  label: string;
  tags: string[];
  useFor: string;
  isCampaign: boolean;
};

export function getSeasonalContext(date: Date = new Date()): SeasonalContext {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Campaign takes priority — first match wins
  for (const campaign of CAMPAIGNS) {
    if (isInCampaignWindow(campaign, month, day)) {
      return {
        label: campaign.label,
        tags: campaign.tags,
        useFor: campaign.useFor,
        isCampaign: true,
      };
    }
  }

  // Fall back to base season
  const seasonKey = getBaseSeason(month);
  const season = BASE_SEASONS[seasonKey];
  return {
    label: season.label,
    tags: season.tags,
    useFor: season.useFor,
    isCampaign: false,
  };
}

// ---------------------------------------------------------------------------
// Map content pillars to their primary hashtag set
// ---------------------------------------------------------------------------

export const PILLAR_TO_SET: Record<string, HashtagSet> = {
  "Creative Drinking": "A",
  "Modular Living": "B",
  "Material Truth": "C",
  "Community & Culture": "D",
  "Lifestyle & Wellness": "E",
  Seasonal: "F",
};

// ---------------------------------------------------------------------------
// Platform rules
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// selectHashtags — main entry point used by AI and HashtagPicker
// ---------------------------------------------------------------------------

export function selectHashtags(options: {
  pillar: ContentPillar;
  platform: "instagram" | "facebook";
  postType: "image" | "carousel" | "reel";
  lastUsedSet?: HashtagSet;
}): { set: HashtagSet; hashtags: string[] } {
  const { pillar, platform, postType, lastUsedSet } = options;

  // Determine target set from pillar
  let targetSet = PILLAR_TO_SET[pillar] ?? "A";

  // Rotation rule: if same as last used, shift to next set
  if (targetSet === lastUsedSet) {
    const sets: HashtagSet[] = ["A", "B", "C", "D", "E", "F"];
    const idx = sets.indexOf(targetSet);
    targetSet = sets[(idx + 1) % sets.length];
  }

  // Resolve tags — Set F is dynamic
  const tags =
    targetSet === "F"
      ? getSeasonalContext().tags
      : ROTATION_SETS[targetSet].tags;

  // Platform rules
  const ruleKey =
    platform === "facebook"
      ? "facebook"
      : postType === "reel"
        ? "instagram_reel"
        : "instagram_post";
  const rules = PLATFORM_RULES[ruleKey];

  if (platform === "facebook") {
    return {
      set: targetSet,
      hashtags: [...BRANDED_TAGS, tags[0]].slice(0, rules.max),
    };
  }

  const count = Math.min(rules.max - BRANDED_TAGS.length, tags.length);
  return {
    set: targetSet,
    hashtags: [...BRANDED_TAGS, ...tags.slice(0, count)],
  };
}
