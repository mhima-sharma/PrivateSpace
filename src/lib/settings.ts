import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { eventConfig } from "@/config/event";

/**
 * Admin-editable event settings, persisted in the `settings` table as
 * key/value rows. Anything not set falls back to `config/event.ts`, so the app
 * always renders sensible defaults out of the box.
 *
 * "occasion" and "note" are the two headline editable fields surfaced in the
 * admin console; celebrant + date round out the hero/countdown.
 */
export const EDITABLE_KEYS = [
  "celebrant",
  "occasion",
  "note",
  "birthdayDate",
] as const;
export type SettingKey = (typeof EDITABLE_KEYS)[number];

// Stored separately (boolean, not a text field). When "false" the Updates page
// is hidden from everyone — an unpublish/"delete" that keeps the data intact.
export const PUBLISHED_KEY = "updatesPublished";

export interface EventSettings {
  celebrant: string;
  occasion: string; // shown as the hero tagline / occasion label
  note: string; // hero message / personal note
  birthdayDate: string; // ISO date driving the countdown
  published: boolean; // false → hidden from all viewers
}

export function defaultSettings(): EventSettings {
  return {
    celebrant: eventConfig.celebrant,
    occasion: eventConfig.heroTagline,
    note: eventConfig.heroSubtitle,
    birthdayDate: eventConfig.birthdayDate,
    published: true,
  };
}

/** Read the merged settings (DB over defaults). Safe to call in RSC. */
export async function getEventSettings(): Promise<EventSettings> {
  const base = defaultSettings();
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...EDITABLE_KEYS, PUBLISHED_KEY] } },
    });
    for (const row of rows) {
      if (row.key === PUBLISHED_KEY) {
        base.published = row.value !== "false";
      } else if (
        (EDITABLE_KEYS as readonly string[]).includes(row.key) &&
        row.value
      ) {
        base[row.key as SettingKey] = row.value;
      }
    }
  } catch {
    // If the DB/table isn't reachable yet, fall back to defaults gracefully.
  }
  return base;
}

export const updateSettingsSchema = z.object({
  celebrant: z.string().trim().min(1, "Required").max(80).optional(),
  occasion: z.string().trim().min(1, "Required").max(120).optional(),
  note: z.string().trim().max(600).optional(),
  birthdayDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Use a YYYY-MM-DD date")
    .optional(),
  published: z.boolean().optional(), // publish / unpublish (hide) the page
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/** Upsert the provided keys. Only known keys are written. */
export async function updateEventSettings(
  patch: UpdateSettingsInput,
): Promise<EventSettings> {
  const ops: { key: string; value: string }[] = [];

  for (const [k, v] of Object.entries(patch)) {
    if (k === "published" && typeof v === "boolean") {
      ops.push({ key: PUBLISHED_KEY, value: v ? "true" : "false" });
    } else if ((EDITABLE_KEYS as readonly string[]).includes(k) && v != null) {
      ops.push({ key: k, value: String(v) });
    }
  }

  await prisma.$transaction(
    ops.map(({ key, value }) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );

  return getEventSettings();
}
