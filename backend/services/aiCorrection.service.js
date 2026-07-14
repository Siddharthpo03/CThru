import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CORRECTION_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest"];

const MAX_ATTEMPTS_PER_MODEL = 2;

const MIN_LINE_RATIO = 0.75;
const MIN_CHARACTER_RATIO = 0.7;
const MIN_SYMBOL_RATIO = 0.85;

const MAX_PATCH_ORIGINAL_LINES = 80;
const MAX_PATCH_SHRINK_RATIO = 0.45;
const MAX_PATCH_GROWTH_RATIO = 4;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function normalizeNewlines(value = "") {
  return String(value).replace(/\r\n?/g, "\n");
}

function getErrorStatus(error) {
  const directStatus = Number(error?.status);

  if (Number.isFinite(directStatus)) {
    return directStatus;
  }

  const code = Number(error?.code);

  if (Number.isFinite(code)) {
    return code;
  }

  const message = String(error?.message || "");

  const statusMatch = message.match(
    /(?:status|code)["']?\s*[:=]\s*["']?(\d{3})/i,
  );

  if (statusMatch) {
    return Number(statusMatch[1]);
  }

  return null;
}

function getErrorMessage(error) {
  return String(error?.message || error || "Unknown Gemini correction error");
}

function stripMarkdownCodeFence(value = "") {
  let text = String(value).trim();

  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/\s*```$/i, "");

  return text.trim();
}

function extractJsonObject(value = "") {
  const text = stripMarkdownCodeFence(value);

  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Gemini correction response did not contain JSON.");
    }

    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }
}

function countLines(code) {
  return normalizeNewlines(code).split("\n").length;
}

function countNonWhitespaceCharacters(code) {
  return normalizeNewlines(code).replace(/\s/g, "").length;
}

function normalizeLanguage(language = "") {
  return String(language).trim().toLowerCase();
}

function isJavaScriptLike(language) {
  const normalized = normalizeLanguage(language);

  return [
    "javascript",
    "js",
    "typescript",
    "ts",
    "jsx",
    "tsx",
    "node",
    "nodejs",
  ].includes(normalized);
}

function extractJavaScriptSymbols(code) {
  const source = normalizeNewlines(code);

  const symbols = new Set();

  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bclass\s+([A-Za-z_$][\w$]*)\b/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(source)) !== null) {
      symbols.add(match[1]);
    }
  }

  return [...symbols];
}

function extractGenericSymbols(code) {
  const source = normalizeNewlines(code);

  const symbols = new Set();

  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bclass\s+([A-Za-z_$][\w$]*)\b/g,
    /\bdef\s+([A-Za-z_][\w]*)\s*\(/g,
    /\b(?:public|private|protected|static|final|async|export|\s)+\s*[\w<>\[\],.?]+\s+([A-Za-z_][\w]*)\s*\([^;{}]*\)\s*\{/g,
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(source)) !== null) {
      symbols.add(match[1]);
    }
  }

  return [...symbols];
}

function extractSymbols(code, language) {
  if (isJavaScriptLike(language)) {
    return extractJavaScriptSymbols(code);
  }

  return extractGenericSymbols(code);
}

function calculateSymbolPreservation(originalCode, correctedCode, language) {
  const originalSymbols = extractSymbols(originalCode, language);

  if (originalSymbols.length === 0) {
    return {
      ratio: 1,
      originalSymbols: [],
      preservedSymbols: [],
      missingSymbols: [],
    };
  }

  const correctedSymbols = new Set(extractSymbols(correctedCode, language));

  const preservedSymbols = originalSymbols.filter((symbol) =>
    correctedSymbols.has(symbol),
  );

  const missingSymbols = originalSymbols.filter(
    (symbol) => !correctedSymbols.has(symbol),
  );

  return {
    ratio: preservedSymbols.length / originalSymbols.length,
    originalSymbols,
    preservedSymbols,
    missingSymbols,
  };
}

function getBraceBalance(code) {
  const source = normalizeNewlines(code);

  let curly = 0;
  let round = 0;
  let square = 0;

  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (lineComment) {
      if (character === "\n") {
        lineComment = false;
      }

      continue;
    }

    if (blockComment) {
      if (character === "*" && nextCharacter === "/") {
        blockComment = false;
        index += 1;
      }

      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") {
      curly += 1;
    } else if (character === "}") {
      curly -= 1;
    } else if (character === "(") {
      round += 1;
    } else if (character === ")") {
      round -= 1;
    } else if (character === "[") {
      square += 1;
    } else if (character === "]") {
      square -= 1;
    }

    if (curly < 0 || round < 0 || square < 0) {
      return {
        valid: false,
        curly,
        round,
        square,
      };
    }
  }

  return {
    valid: curly === 0 && round === 0 && square === 0 && !blockComment,
    curly,
    round,
    square,
  };
}

function validateSourceIntegrity({
  originalCode,
  candidateCode,
  language,
  checkGlobalSize = true,
}) {
  const original = normalizeNewlines(originalCode);
  const candidate = normalizeNewlines(candidateCode);

  if (!candidate.trim()) {
    return {
      valid: false,
      reason: "Corrected source is empty.",
    };
  }

  const originalLines = countLines(original);
  const candidateLines = countLines(candidate);

  const originalCharacters = countNonWhitespaceCharacters(original);
  const candidateCharacters = countNonWhitespaceCharacters(candidate);

  const lineRatio = originalLines === 0 ? 1 : candidateLines / originalLines;

  const characterRatio =
    originalCharacters === 0 ? 1 : candidateCharacters / originalCharacters;

  if (checkGlobalSize && lineRatio < MIN_LINE_RATIO) {
    return {
      valid: false,
      reason: `Line integrity failed: ${candidateLines}/${originalLines} lines preserved.`,
      lineRatio,
      characterRatio,
    };
  }

  if (checkGlobalSize && characterRatio < MIN_CHARACTER_RATIO) {
    return {
      valid: false,
      reason: `Character integrity failed: ${candidateCharacters}/${originalCharacters} non-whitespace characters preserved.`,
      lineRatio,
      characterRatio,
    };
  }

  const braceBalance = getBraceBalance(candidate);

  if (!braceBalance.valid) {
    return {
      valid: false,
      reason: `Structural balance failed: curly=${braceBalance.curly}, round=${braceBalance.round}, square=${braceBalance.square}.`,
      lineRatio,
      characterRatio,
      braceBalance,
    };
  }

  const symbolPreservation = calculateSymbolPreservation(
    original,
    candidate,
    language,
  );

  if (checkGlobalSize && symbolPreservation.ratio < MIN_SYMBOL_RATIO) {
    return {
      valid: false,
      reason: `Symbol preservation failed: ${symbolPreservation.preservedSymbols.length}/${symbolPreservation.originalSymbols.length} symbols preserved.`,
      lineRatio,
      characterRatio,
      symbolPreservation,
    };
  }

  return {
    valid: true,
    lineRatio,
    characterRatio,
    braceBalance,
    symbolPreservation,
  };
}

function normalizePatch(rawPatch, index, sourceLineCount) {
  const startLine = Number(rawPatch?.startLine);
  const endLine = Number(rawPatch?.endLine);

  if (!Number.isInteger(startLine) || !Number.isInteger(endLine)) {
    return null;
  }

  if (startLine < 1 || endLine < startLine) {
    return null;
  }

  if (startLine > sourceLineCount || endLine > sourceLineCount) {
    return null;
  }

  const replacementCode = normalizeNewlines(rawPatch?.replacementCode ?? "");

  if (!replacementCode.trim()) {
    return null;
  }

  return {
    id:
      typeof rawPatch?.id === "string" && rawPatch.id.trim()
        ? rawPatch.id.trim()
        : `patch-${index + 1}`,
    findingIndex: Number.isInteger(Number(rawPatch?.findingIndex))
      ? Number(rawPatch.findingIndex)
      : null,
    startLine,
    endLine,
    replacementCode,
    reason:
      typeof rawPatch?.reason === "string"
        ? rawPatch.reason.trim()
        : "AI correction",
  };
}

function patchesOverlap(firstPatch, secondPatch) {
  return !(
    firstPatch.endLine < secondPatch.startLine ||
    secondPatch.endLine < firstPatch.startLine
  );
}

function removeOverlappingPatches(patches) {
  const sorted = [...patches].sort((first, second) => {
    if (first.startLine !== second.startLine) {
      return first.startLine - second.startLine;
    }

    return first.endLine - second.endLine;
  });

  const accepted = [];
  const rejected = [];

  for (const patch of sorted) {
    const overlappingPatch = accepted.find((acceptedPatch) =>
      patchesOverlap(acceptedPatch, patch),
    );

    if (overlappingPatch) {
      rejected.push({
        ...patch,
        rejectionReason: `Overlaps with ${overlappingPatch.id}.`,
      });

      continue;
    }

    accepted.push(patch);
  }

  return {
    accepted,
    rejected,
  };
}

function validatePatchSize(patch) {
  const originalLineCount = patch.endLine - patch.startLine + 1;

  const replacementLineCount = countLines(patch.replacementCode);

  if (originalLineCount > MAX_PATCH_ORIGINAL_LINES) {
    return {
      valid: false,
      reason: `Patch targets ${originalLineCount} lines. Maximum safe patch range is ${MAX_PATCH_ORIGINAL_LINES} lines.`,
    };
  }

  const shrinkRatio =
    originalLineCount === 0 ? 1 : replacementLineCount / originalLineCount;

  if (originalLineCount >= 8 && shrinkRatio < MAX_PATCH_SHRINK_RATIO) {
    return {
      valid: false,
      reason: `Patch shrinks ${originalLineCount} lines to ${replacementLineCount} lines.`,
    };
  }

  const growthRatio =
    originalLineCount === 0
      ? replacementLineCount
      : replacementLineCount / originalLineCount;

  if (originalLineCount >= 4 && growthRatio > MAX_PATCH_GROWTH_RATIO) {
    return {
      valid: false,
      reason: `Patch expands ${originalLineCount} lines to ${replacementLineCount} lines.`,
    };
  }

  return {
    valid: true,
    originalLineCount,
    replacementLineCount,
  };
}

function applyPatchToOriginalCoordinates(
  originalCode,
  acceptedPatches,
  candidatePatch,
) {
  const originalLines = normalizeNewlines(originalCode).split("\n");

  const allPatches = [...acceptedPatches, candidatePatch].sort(
    (first, second) => second.startLine - first.startLine,
  );

  const outputLines = [...originalLines];

  for (const patch of allPatches) {
    const replacementLines = patch.replacementCode.split("\n");

    outputLines.splice(
      patch.startLine - 1,
      patch.endLine - patch.startLine + 1,
      ...replacementLines,
    );
  }

  return outputLines.join("\n");
}

function normalizeFindings(findings = []) {
  if (!Array.isArray(findings)) {
    return [];
  }

  return findings.map((finding, index) => ({
    findingIndex: index,
    category: String(finding?.category || "Code Quality"),
    severity: String(finding?.severity || "medium"),
    issue: String(finding?.issue || "Unspecified issue"),
    explanation: String(finding?.explanation || ""),
    suggestedFix: String(finding?.suggestedFix || ""),
    lineNumber:
      Number.isInteger(Number(finding?.lineNumber)) &&
      Number(finding.lineNumber) > 0
        ? Number(finding.lineNumber)
        : null,
    occurrenceCount:
      Number.isInteger(Number(finding?.occurrenceCount)) &&
      Number(finding.occurrenceCount) > 0
        ? Number(finding.occurrenceCount)
        : 1,
    lineNumbers: Array.isArray(finding?.lineNumbers)
      ? finding.lineNumbers
          .map(Number)
          .filter(
            (lineNumber) => Number.isInteger(lineNumber) && lineNumber > 0,
          )
      : [],
  }));
}

function applyDeterministicJavaScriptCorrections(code, findings) {
  if (!findings.length) {
    return {
      code,
      changes: [],
    };
  }

  const lines = normalizeNewlines(code).split("\n");
  const changes = [];

  const looseEqualityFinding = findings.find((finding) =>
    finding.issue.toLowerCase().includes("loose equality"),
  );

  if (looseEqualityFinding) {
    const targetLines = new Set([
      looseEqualityFinding.lineNumber,
      ...looseEqualityFinding.lineNumbers,
    ]);

    targetLines.delete(null);

    for (const lineNumber of targetLines) {
      const index = lineNumber - 1;

      if (index < 0 || index >= lines.length) {
        continue;
      }

      const originalLine = lines[index];

      let correctedLine = originalLine
        .replace(/(^|[^=!])==(?!=)/g, "$1===")
        .replace(/(^|[^!])!=(?!=)/g, "$1!==");

      if (correctedLine !== originalLine) {
        lines[index] = correctedLine;

        changes.push({
          type: "deterministic",
          findingIndex: looseEqualityFinding.findingIndex,
          lineNumber,
          reason: "Replaced loose equality with strict equality.",
        });
      }
    }
  }

  return {
    code: lines.join("\n"),
    changes,
  };
}

function createLineNumberedSource(code) {
  return normalizeNewlines(code)
    .split("\n")
    .map((line, index) => `${String(index + 1).padStart(5, " ")} | ${line}`)
    .join("\n");
}

function buildCorrectionPrompt({ code, language, findings }) {
  const numberedSource = createLineNumberedSource(code);

  return `
You are the correction engine for CThru, an AI-assisted code review platform.

Your job is to propose SMALL, TARGETED, NON-OVERLAPPING source patches.

LANGUAGE:
${language}

REVIEW FINDINGS:
${JSON.stringify(findings, null, 2)}

SOURCE CODE WITH ORIGINAL LINE NUMBERS:
${numberedSource}

STRICT CORRECTION RULES:

1. Return ONLY valid JSON.
2. Do not return Markdown.
3. Do not return the full corrected source.
4. Do not rewrite the entire application.
5. Preserve all unrelated code.
6. Preserve existing functions, classes, features, data, and application behavior unless a review finding explicitly requires a change.
7. Every patch must use the ORIGINAL line numbers shown above.
8. Patches must not overlap.
9. Prefer the smallest safe source range.
10. Do not use a 100-line replacement to fix a 3-line problem.
11. replacementCode must contain the COMPLETE replacement for startLine through endLine.
12. Do not use placeholders.
13. Do not use comments such as "rest of code unchanged".
14. Do not omit functions.
15. Do not truncate code.
16. Do not generate duplicate patches for the same exact source range.
17. Each patch must include findingIndex linking it to the supplied findings array.
18. If a finding is incorrect or already fixed, do not generate a patch for it.
19. Read the actual source before correcting a finding. Do not trust the finding blindly.
20. A correction must not introduce a new security issue.
21. For authorization findings, preserve existing valid authorization checks.
22. For numeric validation, Number.isFinite(value) && value > 0 is valid positive finite validation.
23. Do not claim that a negative value is allowed when the source explicitly rejects values <= 0.
24. For refund logic, inspect the actual order status checks before proposing a correction.
25. For sensitive data exposure, remove credential fields from returned or serialized data without deleting unrelated user fields.
26. For complexity findings, make a local refactor only when it can be safely represented as a focused patch.
27. Maximum recommended patch range is 40 original lines.
28. Never intentionally reduce the overall source by more than 25%.

Return exactly this JSON shape:

{
  "summary": "Short explanation of the correction work.",
  "changes": [
    "Human-readable correction 1",
    "Human-readable correction 2"
  ],
  "patches": [
    {
      "id": "patch-1",
      "findingIndex": 0,
      "startLine": 10,
      "endLine": 15,
      "replacementCode": "complete replacement code",
      "reason": "Why this patch fixes the linked finding"
    }
  ]
}

If no safe correction can be proposed:

{
  "summary": "No safe automatic corrections were available.",
  "changes": [],
  "patches": []
}
`.trim();
}

function normalizeCorrectionResponse(rawResponse, sourceLineCount) {
  const parsed = extractJsonObject(rawResponse);

  const rawPatches = Array.isArray(parsed?.patches) ? parsed.patches : [];

  const normalizedPatches = rawPatches
    .map((patch, index) => normalizePatch(patch, index, sourceLineCount))
    .filter(Boolean);

  const changes = Array.isArray(parsed?.changes)
    ? parsed.changes
        .filter((change) => typeof change === "string")
        .map((change) => change.trim())
        .filter(Boolean)
    : [];

  return {
    summary:
      typeof parsed?.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "CThru generated targeted source corrections.",
    changes,
    patches: normalizedPatches,
  };
}

async function generateCorrectionWithModel({ model, prompt }) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
    try {
      console.log(
        `Gemini correction: using ${model}, attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL}`,
      );

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const text = response?.text;

      if (!text || !String(text).trim()) {
        throw new Error(
          `Gemini correction model ${model} returned an empty response.`,
        );
      }

      return String(text);
    } catch (error) {
      lastError = error;

      const status = getErrorStatus(error);
      const message = getErrorMessage(error);

      console.error(
        `Gemini correction model ${model} failed on attempt ${attempt} [${status ?? "unknown"}]: ${message}`,
      );

      if (status === 401 || status === 403 || status === 404) {
        break;
      }

      const retryable = status === null || RETRYABLE_STATUSES.has(status);

      if (!retryable || attempt === MAX_ATTEMPTS_PER_MODEL) {
        break;
      }

      const delay = attempt * 1000;

      console.log(`Retrying Gemini correction model ${model} in ${delay}ms.`);

      await sleep(delay);
    }
  }

  throw lastError || new Error(`Gemini correction failed for ${model}.`);
}

async function generateCorrectionWithFallback(prompt) {
  console.log(`Gemini correction pipeline: ${CORRECTION_MODELS.join(" -> ")}`);

  let lastError = null;

  for (const model of CORRECTION_MODELS) {
    try {
      const rawResponse = await generateCorrectionWithModel({
        model,
        prompt,
      });

      return {
        model,
        rawResponse,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini correction: ${model} unavailable. Trying next model...`,
      );
    }
  }

  throw lastError || new Error("All Gemini correction models failed.");
}

function applySafePatches({ originalCode, patches, language }) {
  const overlapResult = removeOverlappingPatches(patches);

  const acceptedPatches = [];
  const rejectedPatches = [...overlapResult.rejected];

  for (const patch of overlapResult.accepted) {
    const sizeValidation = validatePatchSize(patch);

    if (!sizeValidation.valid) {
      rejectedPatches.push({
        ...patch,
        rejectionReason: sizeValidation.reason,
      });

      console.warn(
        `Correction patch ${patch.id} rejected: ${sizeValidation.reason}`,
      );

      continue;
    }

    const candidateCode = applyPatchToOriginalCoordinates(
      originalCode,
      acceptedPatches,
      patch,
    );

    const candidateValidation = validateSourceIntegrity({
      originalCode,
      candidateCode,
      language,
      checkGlobalSize: true,
    });

    if (!candidateValidation.valid) {
      rejectedPatches.push({
        ...patch,
        rejectionReason: candidateValidation.reason,
      });

      console.warn(
        `Correction patch ${patch.id} rolled back: ${candidateValidation.reason}`,
      );

      continue;
    }

    acceptedPatches.push(patch);

    console.log(
      `Correction patch ${patch.id} accepted: lines ${patch.startLine}-${patch.endLine}.`,
    );
  }

  const correctedCode = applyPatchToOriginalCoordinates(originalCode, [], {
    id: "__final-placeholder__",
    startLine: 1,
    endLine: 1,
    replacementCode: normalizeNewlines(originalCode).split("\n")[0],
    reason: "",
  });

  const finalCode =
    acceptedPatches.length > 0
      ? acceptedPatches
          .sort((first, second) => second.startLine - first.startLine)
          .reduce((currentCode, patch) => {
            const currentLines = currentCode.split("\n");

            currentLines.splice(
              patch.startLine - 1,
              patch.endLine - patch.startLine + 1,
              ...patch.replacementCode.split("\n"),
            );

            return currentLines.join("\n");
          }, normalizeNewlines(originalCode))
      : normalizeNewlines(originalCode);

  const finalValidation = validateSourceIntegrity({
    originalCode,
    candidateCode: finalCode,
    language,
    checkGlobalSize: true,
  });

  if (!finalValidation.valid) {
    console.error(
      `Final correction integrity failed: ${finalValidation.reason}`,
    );

    return {
      correctedCode: normalizeNewlines(originalCode),
      acceptedPatches: [],
      rejectedPatches: [
        ...rejectedPatches,
        ...acceptedPatches.map((patch) => ({
          ...patch,
          rejectionReason: `Final correction rollback: ${finalValidation.reason}`,
        })),
      ],
      validation: finalValidation,
      rolledBack: true,
    };
  }

  return {
    correctedCode: finalCode,
    acceptedPatches,
    rejectedPatches,
    validation: finalValidation,
    rolledBack: false,
  };
}

export async function runAICorrection({ code, language, findings = [] }) {
  const originalCode = normalizeNewlines(code);

  if (!originalCode.trim()) {
    throw new Error("Source code is required for AI correction.");
  }

  const normalizedFindings = normalizeFindings(findings);

  console.log("\n========== CTHRU AUTO CORRECT ==========");
  console.log(`Language: ${language}`);
  console.log(`Original lines: ${countLines(originalCode)}`);
  console.log(`Original characters: ${originalCode.length}`);
  console.log(`Findings supplied: ${normalizedFindings.length}`);
  console.log("========================================\n");

  let workingCode = originalCode;

  const deterministicChanges = [];

  if (isJavaScriptLike(language)) {
    const deterministicResult = applyDeterministicJavaScriptCorrections(
      workingCode,
      normalizedFindings,
    );

    workingCode = deterministicResult.code;

    deterministicChanges.push(...deterministicResult.changes);
  }

  console.log(
    `Deterministic corrections applied: ${deterministicChanges.length}`,
  );

  const deterministicValidation = validateSourceIntegrity({
    originalCode,
    candidateCode: workingCode,
    language,
    checkGlobalSize: true,
  });

  if (!deterministicValidation.valid) {
    console.warn(
      `Deterministic correction rollback: ${deterministicValidation.reason}`,
    );

    workingCode = originalCode;
    deterministicChanges.length = 0;
  }

  const prompt = buildCorrectionPrompt({
    code: workingCode,
    language,
    findings: normalizedFindings,
  });

  console.log(`Gemini correction prompt characters: ${prompt.length}`);

  const { model, rawResponse } = await generateCorrectionWithFallback(prompt);

  const correctionResponse = normalizeCorrectionResponse(
    rawResponse,
    countLines(workingCode),
  );

  console.log(
    `Gemini proposed correction patches: ${correctionResponse.patches.length}`,
  );

  const patchResult = applySafePatches({
    originalCode: workingCode,
    patches: correctionResponse.patches,
    language,
  });

  const correctedCode = patchResult.correctedCode;

  const finalValidation = validateSourceIntegrity({
    originalCode,
    candidateCode: correctedCode,
    language,
    checkGlobalSize: true,
  });

  if (!finalValidation.valid) {
    console.error(
      `CThru correction rejected completely: ${finalValidation.reason}`,
    );

    return {
      correctedCode: originalCode,
      summary:
        "CThru rejected the generated corrections because the corrected source failed integrity validation. The original source was preserved.",
      changes: [],
      patches: [],
      model,
    };
  }

  const deterministicChangeMessages = deterministicChanges.map(
    (change) => `${change.reason} Line ${change.lineNumber}.`,
  );

  const acceptedPatchChanges = patchResult.acceptedPatches.map(
    (patch) => patch.reason,
  );

  const changes = [
    ...deterministicChangeMessages,
    ...correctionResponse.changes,
    ...acceptedPatchChanges,
  ]
    .filter(Boolean)
    .filter((change, index, array) => array.indexOf(change) === index);

  console.log("\n========== CTHRU CORRECTION RESULT ==========");
  console.log(`Model: ${model}`);
  console.log(`Original lines: ${countLines(originalCode)}`);
  console.log(`Corrected lines: ${countLines(correctedCode)}`);
  console.log(`Original characters: ${originalCode.length}`);
  console.log(`Corrected characters: ${correctedCode.length}`);
  console.log(`Deterministic changes: ${deterministicChanges.length}`);
  console.log(`Gemini patches proposed: ${correctionResponse.patches.length}`);
  console.log(`Gemini patches accepted: ${patchResult.acceptedPatches.length}`);
  console.log(`Gemini patches rejected: ${patchResult.rejectedPatches.length}`);
  console.log(
    `Symbol preservation: ${Math.round(
      finalValidation.symbolPreservation.ratio * 100,
    )}%`,
  );

  if (finalValidation.symbolPreservation.missingSymbols.length > 0) {
    console.log(
      "Missing symbols:",
      finalValidation.symbolPreservation.missingSymbols,
    );
  }

  if (patchResult.rejectedPatches.length > 0) {
    console.log("\nRejected correction patches:");

    for (const patch of patchResult.rejectedPatches) {
      console.log(`- ${patch.id}: ${patch.rejectionReason}`);
    }
  }

  console.log("=============================================\n");

  return {
    correctedCode,
    summary:
      patchResult.acceptedPatches.length === 0 &&
      deterministicChanges.length === 0
        ? "CThru reviewed the findings but did not apply any correction that passed source-integrity validation."
        : correctionResponse.summary,
    changes,
    patches: patchResult.acceptedPatches,
    model,
  };
}
