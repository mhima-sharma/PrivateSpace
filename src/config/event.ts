/**
 * Event content configuration.
 *
 * Everything that personalises the post-login "Birthday Memories" experience
 * lives here so the rest of the app stays generic. Edit freely — none of this
 * is ever exposed before authentication.
 */
export const eventConfig = {
  celebrant: "Alex",
  // ISO date of the birthday. Also overridable via NEXT_PUBLIC_BIRTHDAY_DATE.
  birthdayDate:
    process.env.NEXT_PUBLIC_BIRTHDAY_DATE ?? "2026-08-15T00:00:00.000Z",
  heroTagline: "A celebration of you",
  heroSubtitle:
    "Welcome to a private space made for memories — moments, messages and milestones, all in one place.",

  wishes: [
    {
      from: "The whole family",
      message:
        "Another year wiser, kinder and more wonderful. Here's to celebrating you today and always.",
    },
    {
      from: "Your closest friends",
      message:
        "Thank you for every laugh, every adventure and every late-night talk. Happy birthday!",
    },
    {
      from: "Work crew",
      message:
        "The best teammate and an even better person. Wishing you a day as brilliant as you are.",
    },
  ],

  timeline: [
    { year: "The early years", title: "Where it all began", body: "First steps, first words, and a smile that never faded." },
    { year: "Growing up", title: "Dreams taking shape", body: "School days, big ideas, and friendships that still last." },
    { year: "Today", title: "Living it fully", body: "Surrounded by people who love you — exactly where you belong." },
  ],
} as const;
