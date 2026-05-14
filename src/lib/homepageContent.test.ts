import { describe, expect, it } from "vitest";
import {
  defaultHomepageContent,
  normalizeHomepageContent,
  validateHomepageContent,
} from "./homepageContent";

describe("homepage content helpers", () => {
  it("merges missing fields from defaults", () => {
    const content = normalizeHomepageContent({
      cards: {
        talent: {
          title: "New Talent Title",
          primaryCta: { label: "Join now" },
        },
      },
    });

    expect(content.cards.talent.title).toBe("New Talent Title");
    expect(content.cards.talent.body).toBe(defaultHomepageContent.cards.talent.body);
    expect(content.cards.talent.primaryCta.label).toBe("Join now");
    expect(content.cards.talent.primaryCta.href).toBe(defaultHomepageContent.cards.talent.primaryCta.href);
    expect(content.cards.business.title).toBe(defaultHomepageContent.cards.business.title);
  });

  it("normalizes malformed arrays and objects safely", () => {
    const content = normalizeHomepageContent({
      announcement: "nope",
      marqueeSlides: [null, { title: "Slide" }],
      cards: [],
      authenticatedHeroes: null,
      featuredJobs: "bad",
    });

    expect(content.announcement.text).toBe(defaultHomepageContent.announcement.text);
    expect(content.marqueeSlides).toHaveLength(2);
    expect(content.marqueeSlides[0].title).toBe(defaultHomepageContent.marqueeSlides[0].title);
    expect(content.marqueeSlides[1].title).toBe("Slide");
    expect(content.cards.agency.title).toBe(defaultHomepageContent.cards.agency.title);
    expect(content.featuredJobs.headline).toBe(defaultHomepageContent.featuredJobs.headline);
  });

  it("rejects missing required publish fields", () => {
    const content = normalizeHomepageContent(defaultHomepageContent);
    content.cards.talent.body = "";
    content.cards.business.primaryCta.href = "jobs";
    content.marqueeSlides[0].accent = "green";

    expect(validateHomepageContent(content)).toEqual(expect.arrayContaining([
      "talent card body is required.",
      "business card primary CTA href must start with /, http://, or https://.",
      "Marquee slide 1 accent must be a hex color.",
    ]));
  });

  it("preserves section enabled flags", () => {
    const content = normalizeHomepageContent({
      cards: {
        agency: { enabled: false },
      },
      featuredJobs: { enabled: false },
      announcement: { enabled: true },
    });

    expect(content.cards.agency.enabled).toBe(false);
    expect(content.featuredJobs.enabled).toBe(false);
    expect(content.announcement.enabled).toBe(true);
  });
});
