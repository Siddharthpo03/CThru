import { z } from "zod";

const supportedLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
];

const supportedAnalysis = ["Code Quality", "Security", "Complexity"];

export const createReviewSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Review title is required.")
    .max(150, "Review title is too long."),

  language: z.enum(supportedLanguages),

  code: z
    .string()
    .min(1, "Source code is required.")
    .max(200000, "Source code is too large."),

  fileName: z.string().trim().max(255).nullable().optional(),

  selectedAnalysis: z
    .array(z.enum(supportedAnalysis))
    .min(1, "Select at least one analysis type."),
});
