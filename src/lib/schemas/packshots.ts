import { z } from 'zod';

export const packshotItemSchema = z.object({
  code: z.string(),
  name: z.string().default(''),
  image: z.string(),
  frameColorName: z.string().default(''),
  frameColorCode: z.string().default(''),
  desktopColorName: z.string().default(''),
  desktopColorCode: z.string().default(''),
  colorName: z.string().default(''),
  colorCode: z.string().default(''),
});

export const packshotGroupSchema = z.object({
  model: z.string(),
  label: z.string().default(''),
  desc: z.string().default(''),
  items: z.array(packshotItemSchema),
});

export const packshotsContentSchema = z.object({
  sectionLabel: z.string().default(''),
  title: z.string().default(''),
  subtitle: z.string().default(''),
  groups: z.array(packshotGroupSchema),
});

export type PackshotsContent = z.infer<typeof packshotsContentSchema>;

export function parsePackshotsContent(input: unknown): PackshotsContent {
  return packshotsContentSchema.parse(input);
}
