"use client";

import { useState } from "react";

const sections = [
  {
    title: "Getting Started",
    content: `1. Choose your post type (Image, Carousel, or Reel)
2. Select which platforms to publish to (Instagram, Facebook, or both)
3. Upload your media (drag-drop or click the upload area)
4. Describe what the media shows — this helps the AI write better captions
5. Click "AI Enhance" to generate captions, hashtags, and a brand score
6. Review, edit, and publish`,
  },
  {
    title: "Post Types",
    content: `**Image** — a single photo post. Works on both IG and FB.
**Carousel** — 2-10 images in a swipeable gallery. Upload multiple images.
**Reel** — a short video (MP4 or MOV, max 500MB). Reels take 30-90 seconds to process after upload — the app will show a progress indicator.`,
  },
  {
    title: "AI Enhance",
    content: `The AI writes captions using Bootle's brand voice, pulling intelligence from:
- This week's trend report (what hooks and formats are working)
- Your recent post performance (what worked, what didn't)
- Top creative briefs
- Competitor content patterns

It also scores your caption 0-10 for brand compliance, flags any "AI tells" (phrases that sound robotic), and suggests an alternative hook.

You can start with your own draft and click AI Enhance to improve it, or leave the caption blank and let the AI generate from scratch.`,
  },
  {
    title: "Hashtags",
    content: `The AI auto-selects from 6 rotation sets (A-F), each aligned to a content pillar:
- **Set A** — Creative Drinking (recipes, drink-of-the-day)
- **Set B** — Modular Living (BYO, mix-and-match)
- **Set C** — Material Truth (sustainability, zero-plastic)
- **Set D** — Community & Culture (UGC, behind-the-scenes)
- **Set E** — Lifestyle & Wellness (gym, routine)
- **Set F** — Seasonal (update monthly)

Instagram posts get 8-12 hashtags. Reels get 5-8. Facebook gets 1-3 (branded only). #bootle and #bootleofficial are always included.

You can swap individual tags, pick a different set, or add custom tags before publishing.`,
  },
  {
    title: "Brand Score",
    content: `After AI Enhance, your caption gets a score from 0-10:
- **8-10 (green)** — reads naturally, no AI tells
- **5-7 (amber)** — some issues to fix
- **0-4 (red)** — needs a rewrite

Common AI tells the scorer checks for:
- Em-dashes used more than once
- Abstract noun trios ("simplicity, elegance, purpose")
- Generic closers ("elevate your", "join the")
- Superlatives without proof ("the best", "ultimate")
- Sentences over 20 words
- Could a competitor use this exact line?`,
  },
  {
    title: "Publishing",
    content: `**Publish Now** sends the post immediately to the selected platforms.

For Instagram images and carousels, publishing is instant. For Reels, the app will show "Processing..." while Instagram processes the video (typically 30-90 seconds).

Facebook posts go out instantly for all types.

After publishing, the Social Data Refresher workflow will automatically pick up the post and add it to the Social Dashboard within 6 hours.`,
  },
  {
    title: "Tips for Best Results",
    content: `- Always describe the media — "Glass Bootle with Brew Inner, morning light on kitchen counter" gives much better captions than leaving it blank
- Use the preview toggle to see how your post will look before publishing
- Check the Intelligence panel on the right — it shows what hooks are trending and what your top posts looked like
- Edit the AI output — it's a starting point, not the final word
- The AI follows Bootle's voice: confident like Apple, honest like Patagonia, warm like Allbirds
- Material vocabulary matters: "surgical steel" not "stainless", "natural rubber" not "silicone", always capitalise Shake, Brew, Infuse`,
  },
];

export function Instructions() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<number | null>(null);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        style={{ color: "var(--text-primary)" }}
      >
        <span>How to use Social Studio</span>
        <span
          className="transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          v
        </span>
      </button>

      {isOpen && (
        <div
          className="px-4 pb-4 space-y-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {sections.map((section, i) => (
            <div key={i}>
              <button
                onClick={() =>
                  setOpenSection(openSection === i ? null : i)
                }
                className="w-full flex items-center justify-between py-2 text-sm text-left"
                style={{
                  color:
                    openSection === i
                      ? "var(--accent-blue)"
                      : "var(--text-secondary)",
                }}
              >
                <span>{section.title}</span>
                <span className="text-xs">
                  {openSection === i ? "-" : "+"}
                </span>
              </button>

              {openSection === i && (
                <div
                  className="pb-3 pl-2 text-xs leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {section.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <span
                        key={j}
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {part.slice(2, -2)}
                      </span>
                    ) : (
                      <span key={j}>{part}</span>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
