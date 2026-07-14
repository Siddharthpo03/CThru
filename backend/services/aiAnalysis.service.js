import gemini from "../utils/gemini.js";
import { verifyAIFindings } from "./aiFindingVerifier.service.js";

const MAX_FINDINGS = 20;

const MODEL_COOLDOWN_MS = 10 * 60 * 1000;

const modelCooldowns = new Map();

const responseSchema = {
  type: "object",

  properties: {
    summary: {
      type: "string",
    },

    findings: {
      type: "array",

      items: {
        type: "object",

        properties: {
          category: {
            type: "string",

            enum: ["Code Quality", "Security", "Complexity"],
          },

          severity: {
            type: "string",

            enum: ["critical", "high", "medium", "low"],
          },

          issue: {
            type: "string",
          },

          explanation: {
            type: "string",
          },

          suggestedFix: {
            type: "string",
          },

          lineNumber: {
            anyOf: [
              {
                type: "integer",
              },

              {
                type: "null",
              },
            ],
          },
        },

        required: [
          "category",
          "severity",
          "issue",
          "explanation",
          "suggestedFix",
          "lineNumber",
        ],
      },
    },
  },

  required: ["summary", "findings"],
};

const AI_MODELS = [
  process.env.GEMINI_MODEL,

  "gemini-3.1-flash-lite",

  "gemini-flash-lite-latest",

  "gemini-flash-latest",
].filter((model, index, models) => model && models.indexOf(model) === index);

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function addLineNumbers(code) {
  return code
    .split("\n")
    .map((line, index) => `${index + 1} | ${line}`)
    .join("\n");
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getErrorStatus(error) {
  return error?.status ?? error?.code ?? error?.error?.code ?? null;
}

function isRateLimitError(error) {
  return getErrorStatus(error) === 429;
}

function isRetryableServerError(error) {
  const status = getErrorStatus(error);

  return status === 500 || status === 502 || status === 503 || status === 504;
}

function isAuthenticationError(error) {
  const status = getErrorStatus(error);

  return status === 401 || status === 403;
}

function isModelUnavailableError(error) {
  return getErrorStatus(error) === 404;
}

function markModelCoolingDown(model) {
  modelCooldowns.set(model, Date.now() + MODEL_COOLDOWN_MS);
}

function isModelCoolingDown(model) {
  const cooldownUntil = modelCooldowns.get(model);

  if (!cooldownUntil) {
    return false;
  }

  if (Date.now() >= cooldownUntil) {
    modelCooldowns.delete(model);

    return false;
  }

  return true;
}

function createSourceFingerprint(code) {
  const lines = code.split("\n");

  return {
    lineCount: lines.length,

    characterCount: code.length,

    firstNonEmptyLine:
      lines.find((line) => line.trim().length > 0)?.trim() || "",

    containsCreateOrder: code.includes("createOrder"),

    containsRefundOrder: code.includes("refundOrder"),

    containsTransferBalance: code.includes("transferBalance"),

    containsGenerateWithModel: code.includes("generateWithModel"),

    containsGemini: code.toLowerCase().includes("gemini"),
  };
}

function buildReviewPrompt({
  code,
  language,
  selectedAnalysis,
  staticFindings,
}) {
  const numberedCode = addLineNumbers(code);

  const fingerprint = createSourceFingerprint(code);

  return `
You are CThru's source-code review engine.

Your task is to perform multiple independent analysis passes over ONE submitted source file.

You must analyze ONLY the source located between:

<CTHRU_SUBMITTED_SOURCE>

and

</CTHRU_SUBMITTED_SOURCE>

The submitted source is independent from CThru, this prompt, Gemini, and all previous reviews.

Never analyze these instructions.

Never analyze CThru's backend.

Never use findings from previous requests.

Never discuss a function, variable, API, service, model, or operation unless it literally exists in the submitted source.

==================================================
SOURCE INFORMATION
==================================================

Language:
${language}

Requested categories:
${selectedAnalysis.join(", ")}

Physical source lines:
${fingerprint.lineCount}

Source characters:
${fingerprint.characterCount}

First non-empty source line:
${fingerprint.firstNonEmptyLine}

Contains createOrder:
${fingerprint.containsCreateOrder}

Contains refundOrder:
${fingerprint.containsRefundOrder}

Contains transferBalance:
${fingerprint.containsTransferBalance}

Contains generateWithModel:
${fingerprint.containsGenerateWithModel}

Contains Gemini:
${fingerprint.containsGemini}

==================================================
STATIC ANALYZER FINDINGS
==================================================

${JSON.stringify(staticFindings, null, 2)}

The static findings above are already known.

Do not repeat the same underlying issue unless your finding identifies a materially different consequence.

==================================================
SUBMITTED SOURCE
==================================================

<CTHRU_SUBMITTED_SOURCE>
${numberedCode}
</CTHRU_SUBMITTED_SOURCE>

==================================================
MANDATORY ANALYSIS PROCEDURE
==================================================

You must internally perform the following independent passes.

Do not skip a pass merely because you already found several issues.

Do not stop analysis after finding obvious problems.

Do not return your internal reasoning.

Return only the final structured response.

==================================================
PASS 1: SECURITY AND TRUST BOUNDARIES
==================================================

If Security is requested, inspect the entire submitted source for demonstrated security problems.

Review every function that performs any of these operations:

- authentication
- login
- credential comparison
- password storage
- password reset
- user lookup
- user profile output
- authorization
- role changes
- administrative actions
- deletion
- refunds
- financial operations
- balance transfers
- discounts
- inventory mutation
- state mutation
- data export
- logging
- sensitive data output

For every sensitive function, independently ask:

1. Who can call this operation?

2. Does the function verify the caller?

3. Does the function verify the caller's role or ownership?

4. Can one user modify another user's data?

5. Can the operation be repeated for additional benefit?

6. Can negative values reverse the intended operation?

7. Can zero, NaN, Infinity, null, undefined, or unexpected types bypass validation?

8. Can credentials, passwords, tokens, or sensitive data be logged?

9. Can sensitive data be returned or exported?

10. Is sensitive data stored directly in plain text?

11. Can a discount, refund, transfer, or balance operation create money, stock, credit, or value?

12. Can administrative functionality be reached without an explicit authorization check?

13. Does the function trust a requestingUserId, userId, role, discountCode, orderId, or other caller-controlled value without validation?

14. Can internal mutable objects escape to callers?

Specifically trace the complete state transition for:

- balance changes
- stock changes
- refunds
- transfers
- discounts
- role changes
- password changes
- deletions

For each state transition, inspect:

INPUT
↓
VALIDATION
↓
AUTHORIZATION
↓
STATE CHANGE
↓
REPEATABILITY
↓
OUTPUT

Report concrete exploitable or security-relevant failures.

Do not call a problem hypothetical when the source directly allows the invalid operation.

==================================================
PASS 2: CORRECTNESS AND INVALID STATE
==================================================

If Code Quality is requested, inspect executable behavior for correctness failures.

Review every function independently.

For each function, ask:

1. What happens when a lookup returns undefined?

2. What happens when an array is empty?

3. What happens when an ID does not exist?

4. What happens when a string input is null or undefined?

5. What happens with negative numeric input?

6. What happens with zero?

7. What happens with NaN?

8. What happens with Infinity?

9. What happens with an empty collection?

10. What happens when the same operation is executed twice?

11. Does the function always return the correct success state?

12. Can an index become -1?

13. Can array mutation affect the wrong element?

14. Can division use a zero denominator?

15. Can state become negative?

16. Can an object reference be mutated after being stored?

17. Can historical data change because a mutable reference was retained?

18. Can generated identifiers collide?

19. Does one state mutation happen before another operation that may fail?

20. Can partial execution leave inconsistent state?

Trace important functions using:

VALID INPUT
INVALID INPUT
BOUNDARY INPUT
REPEATED EXECUTION
MISSING DATA

Pay special attention to:

- success flags
- lookup functions
- array indexes
- quantity validation
- cart validation
- stock validation
- order creation
- order refund
- financial arithmetic
- statistics
- object references
- exported data

Report actual behavioral defects.

Do not report formatting or personal style preferences.

==================================================
PASS 3: COMPLEXITY AND SCALABILITY
==================================================

If Complexity is requested, inspect the complete submitted source for:

- nested loops
- nested array traversals
- repeated full-array scans
- repeated lookups inside loops
- O(n squared) behavior
- O(a times b) behavior
- unnecessary repeated computation
- functions that can use a single traversal
- functions that can use find
- functions that can use Map
- functions that repeatedly scan the same collection
- large functions with excessive branching

For each complexity finding:

1. Identify the exact function.

2. State the current complexity when reasonably identifiable.

3. Explain what input growth causes the cost.

4. Recommend the concrete replacement algorithm or data structure.

Do not report a complexity issue merely because the complete file is large if the static analyzer already reported source size.

Do not duplicate the static analyzer's cyclomatic-complexity finding.

==================================================
PASS 4: CROSS-PASS VERIFICATION
==================================================

After completing all requested passes, verify the entire source again.

Create an internal checklist of every sensitive or state-changing function.

For each such function, verify whether at least one of these is true:

A. The function is safe.

B. A relevant static finding already covers the problem.

C. You produced a finding for the demonstrated defect.

Do not stop because ${MAX_FINDINGS} findings have not been reached.

Do not create findings merely to reach a number.

Prioritize findings using this order:

1. authorization bypass
2. authentication failure
3. credential or sensitive data exposure
4. financial or state manipulation
5. repeatable abuse
6. data corruption
7. invalid-state crashes
8. incorrect success behavior
9. boundary-value defects
10. algorithmic complexity
11. maintainability defects

If more than ${MAX_FINDINGS} valid findings exist, keep the ${MAX_FINDINGS} highest-impact unique findings.

==================================================
DUPLICATE RULES
==================================================

Do not repeat static findings such as:

- loose equality comparison
- console statement detected
- high cyclomatic complexity
- large source submission

when those issues already exist in STATIC ANALYZER FINDINGS.

However, a concrete security consequence is NOT a duplicate of a generic static finding.

Example:

Static finding:
"Console statement detected"

AI finding:
"Plain-text password is logged during authentication"

These are materially different.

The AI finding must be reported because it identifies credential exposure.

Another example:

Static finding:
"Loose equality comparison"

AI finding:
"login returns success true when authentication fails"

These are unrelated and both may exist.

==================================================
SEVERITY CLASSIFICATION
==================================================

critical:

Use only for demonstrated severe and directly exploitable failures such as:

- authentication bypass providing privileged access
- remote code execution
- catastrophic destructive data loss
- unrestricted catastrophic privilege compromise

high:

Use for:

- demonstrated authorization bypass
- unrestricted role modification
- unrestricted password reset
- plain-text credential exposure
- sensitive credential logging
- repeated refund abuse
- financial value creation
- negative transfer manipulation
- unrestricted administrative actions
- major state corruption
- serious sensitive-data exposure

medium:

Use for:

- realistic crashes
- invalid state handling
- missing existence checks
- negative quantity handling
- empty input bugs
- duplicate identifiers
- mutable historical data
- division by zero
- moderate algorithmic inefficiency
- partial state consistency risks

low:

Use for:

- limited maintainability problems
- minor defensive coding improvements
- small inefficiencies
- low-impact correctness concerns

Do not inflate severity.

Do not lower a demonstrated authorization or financial manipulation problem to low merely because the source is a small example.

==================================================
CATEGORY CLASSIFICATION
==================================================

Security:

Use when the demonstrated defect affects:

- authentication
- authorization
- credentials
- sensitive data
- privilege
- financial abuse
- caller trust
- administrative access

Code Quality:

Use for:

- correctness
- invalid state
- crashes
- incorrect return behavior
- unsafe assumptions
- mutation bugs
- boundary cases

Complexity:

Use only for:

- algorithmic inefficiency
- repeated traversal
- nested scans
- scalability
- unnecessary repeated computation

==================================================
LINE NUMBER RULES
==================================================

The numeric value before "|" is the original source line number.

Use the exact source line containing the problematic operation.

Never return a line number below 1.

Never return a line number greater than ${fingerprint.lineCount}.

Use null only for a true source-wide issue.

Do not guess line numbers.

==================================================
FINDING REQUIREMENTS
==================================================

Every finding must:

1. Reference behavior that exists in the submitted source.

2. Identify a concrete defect.

3. Explain the negative consequence.

4. Give a specific correction.

5. Use the most appropriate category.

6. Use a justified severity.

7. Avoid duplicating another AI finding.

8. Avoid duplicating a generic static finding unless there is a materially different consequence.

The issue title should identify the defect and affected operation.

Good:

"Repeated refund allows balance and stock inflation"

Bad:

"Refund issue"

Good:

"Negative transfer amount reverses balance movement"

Bad:

"Validate amount"

Good:

"Authentication reports success for invalid credentials"

Bad:

"Login can be improved"

==================================================
SUGGESTED FIX REQUIREMENTS
==================================================

Every suggested fix must state the implementation change.

Examples:

- Verify requestingUser.role === "admin" before mutating targetUser.role and reject unauthorized callers.

- Reject amounts unless Number.isFinite(amount) and amount > 0 before modifying either account balance.

- Reject already-refunded orders before crediting balance or restoring stock.

- Hash passwords with a password hashing function and compare hashes instead of storing or comparing plain-text credentials.

Do not return vague fixes such as:

- improve validation
- handle errors
- optimize the function
- use best practices

==================================================
SUMMARY REQUIREMENTS
==================================================

The summary must:

1. Describe the actual submitted source.

2. Identify its visible domain.

3. Be concise.

4. Be technical.

5. Not mention Gemini unless Gemini code exists inside the submitted source.

6. Not mention CThru's backend.

7. Not mention the analysis prompt.

==================================================
FINAL SOURCE-GROUNDING CHECK
==================================================

Before returning each finding, internally verify:

A. Does the referenced function or operation literally exist?

B. Does the defect actually occur?

C. Is the consequence supported by the code?

D. Is the line number valid?

E. Is this materially different from static findings?

F. Is this materially different from every other AI finding?

If any answer is NO, remove the finding.

Return at most ${MAX_FINDINGS} highest-impact unique findings.

Return only the required structured JSON response.
`;
}

async function generateWithModel({ model, prompt }) {
  if (isModelCoolingDown(model)) {
    console.log(`Gemini AI: skipping ${model}, model is cooling down.`);

    const error = new Error(`${model} is temporarily cooling down.`);

    error.status = 429;

    throw error;
  }

  const MAX_SERVER_RETRIES = 2;

  let lastError;

  for (let attempt = 1; attempt <= MAX_SERVER_RETRIES; attempt++) {
    try {
      console.log(
        `Gemini AI: using ${model}, attempt ${attempt}/${MAX_SERVER_RETRIES}`,
      );

      const response = await gemini.models.generateContent({
        model,

        contents: prompt,

        config: {
          temperature: 0.05,

          responseMimeType: "application/json",

          responseJsonSchema: responseSchema,
        },
      });

      if (
        typeof response.text !== "string" ||
        response.text.trim().length === 0
      ) {
        throw new Error("Gemini returned an empty analysis response.");
      }

      return response.text;
    } catch (error) {
      lastError = error;

      const status = getErrorStatus(error);

      console.error(
        `Gemini model ${model} failed${status ? ` [${status}]` : ""}:`,
        error?.message || error,
      );

      if (isRateLimitError(error)) {
        markModelCoolingDown(model);

        console.warn(
          `Gemini AI: ${model} hit a rate limit. Switching model immediately.`,
        );

        break;
      }

      if (isAuthenticationError(error)) {
        console.error(`Gemini AI: authentication failed for ${model}.`);

        break;
      }

      if (isModelUnavailableError(error)) {
        console.warn(`Gemini AI: ${model} is unavailable.`);

        break;
      }

      if (!isRetryableServerError(error)) {
        break;
      }

      if (attempt === MAX_SERVER_RETRIES) {
        break;
      }

      const delay = 1000 * Math.pow(2, attempt - 1);

      console.log(
        `Gemini AI: server error. Retrying ${model} in ${delay}ms...`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

async function generateWithFallback(prompt) {
  let lastError;

  console.log(`Gemini AI model pipeline: ${AI_MODELS.join(" -> ")}`);

  for (const model of AI_MODELS) {
    if (isModelCoolingDown(model)) {
      console.log(`Gemini AI: ${model} skipped because it is cooling down.`);

      continue;
    }

    try {
      const text = await generateWithModel({
        model,

        prompt,
      });

      return {
        text,

        model,
      };
    } catch (error) {
      lastError = error;

      console.warn(`Gemini AI: switching from ${model} to fallback model.`);
    }
  }

  if (!lastError) {
    const error = new Error("All Gemini models are temporarily cooling down.");

    error.status = 429;

    throw error;
  }

  throw lastError;
}

function parseAnalysis(text) {
  let analysis;

  try {
    analysis = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  if (typeof analysis.summary !== "string") {
    throw new Error("Gemini response is missing a valid summary.");
  }

  if (!Array.isArray(analysis.findings)) {
    throw new Error("Gemini response is missing a valid findings array.");
  }

  return analysis;
}

function getFindingFingerprint(finding) {
  return [normalizeText(finding.category), normalizeText(finding.issue)].join(
    ":",
  );
}

function getFindingWords(value) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((word) => word.length > 3),
  );
}

function calculateTextSimilarity(first, second) {
  const firstWords = getFindingWords(first);

  const secondWords = getFindingWords(second);

  if (firstWords.size === 0 || secondWords.size === 0) {
    return 0;
  }

  let intersection = 0;

  firstWords.forEach((word) => {
    if (secondWords.has(word)) {
      intersection += 1;
    }
  });

  const union = new Set([...firstWords, ...secondWords]).size;

  return union === 0 ? 0 : intersection / union;
}

function isDuplicateFinding(existing, incoming) {
  if (existing.category !== incoming.category) {
    return false;
  }

  if (getFindingFingerprint(existing) === getFindingFingerprint(incoming)) {
    return true;
  }

  const issueSimilarity = calculateTextSimilarity(
    existing.issue,
    incoming.issue,
  );

  const explanationSimilarity = calculateTextSimilarity(
    existing.explanation,
    incoming.explanation,
  );

  return issueSimilarity >= 0.8 && explanationSimilarity >= 0.7;
}

function findingReferencesMissingSource({ finding, code }) {
  const findingText = [finding.issue, finding.explanation, finding.suggestedFix]
    .join(" ")
    .toLowerCase();

  const sourceText = code.toLowerCase();

  const protectedReferences = [
    {
      reference: "generatewithmodel",

      sourceToken: "generatewithmodel",
    },

    {
      reference: "gemini",

      sourceToken: "gemini",
    },

    {
      reference: "model fallback",

      sourceToken: "fallback",
    },

    {
      reference: "retry logic",

      sourceToken: "retry",
    },
  ];

  return protectedReferences.some(
    ({ reference, sourceToken }) =>
      findingText.includes(reference) && !sourceText.includes(sourceToken),
  );
}

function sanitizeFindings({ findings, selectedAnalysis, code }) {
  const allowedCategories = new Set(selectedAnalysis);

  const allowedSeverities = new Set(["critical", "high", "medium", "low"]);

  const lineCount = code.split("\n").length;

  const validFindings = [];

  for (const finding of findings) {
    if (!finding) {
      continue;
    }

    if (!allowedCategories.has(finding.category)) {
      continue;
    }

    if (!allowedSeverities.has(finding.severity)) {
      continue;
    }

    if (
      typeof finding.issue !== "string" ||
      finding.issue.trim().length === 0
    ) {
      continue;
    }

    if (
      typeof finding.explanation !== "string" ||
      finding.explanation.trim().length === 0
    ) {
      continue;
    }

    if (
      typeof finding.suggestedFix !== "string" ||
      finding.suggestedFix.trim().length === 0
    ) {
      continue;
    }

    if (
      findingReferencesMissingSource({
        finding,

        code,
      })
    ) {
      console.warn(
        `CThru AI validation removed source-drift finding: ${finding.issue}`,
      );

      continue;
    }

    let lineNumber = null;

    if (
      Number.isInteger(finding.lineNumber) &&
      finding.lineNumber >= 1 &&
      finding.lineNumber <= lineCount
    ) {
      lineNumber = finding.lineNumber;
    }

    const sanitizedFinding = {
      category: finding.category,

      severity: finding.severity,

      issue: sanitizeText(finding.issue),

      explanation: sanitizeText(finding.explanation),

      suggestedFix: sanitizeText(finding.suggestedFix),

      lineNumber,
    };

    const duplicate = validFindings.some((existing) =>
      isDuplicateFinding(
        existing,

        sanitizedFinding,
      ),
    );

    if (duplicate) {
      continue;
    }

    validFindings.push(sanitizedFinding);

    if (validFindings.length >= MAX_FINDINGS) {
      break;
    }
  }

  return validFindings;
}

function getFindingStats(findings) {
  return findings.reduce(
    (stats, finding) => {
      stats.total += 1;

      stats.bySeverity[finding.severity] += 1;

      stats.byCategory[finding.category] += 1;

      return stats;
    },
    {
      total: 0,

      bySeverity: {
        critical: 0,

        high: 0,

        medium: 0,

        low: 0,
      },

      byCategory: {
        "Code Quality": 0,

        Security: 0,

        Complexity: 0,
      },
    },
  );
}

export async function runAIAnalysis({
  code,
  language,
  selectedAnalysis,
  staticFindings,
}) {
  if (typeof code !== "string" || code.trim().length === 0) {
    throw new Error("Source code is required for AI analysis.");
  }

  if (!Array.isArray(selectedAnalysis) || selectedAnalysis.length === 0) {
    throw new Error("At least one analysis category is required.");
  }

  const safeStaticFindings = Array.isArray(staticFindings)
    ? staticFindings
    : [];

  console.log("\n========== AI INPUT DEBUG ==========");

  console.log("AI language:", language);

  console.log("AI selected analysis:", selectedAnalysis);

  console.log("AI code characters:", code.length);

  console.log("AI code lines:", code.split("\n").length);

  console.log("AI contains Gemini:", code.toLowerCase().includes("gemini"));

  console.log(
    "AI contains generateWithModel:",
    code.includes("generateWithModel"),
  );

  console.log("AI contains createOrder:", code.includes("createOrder"));

  console.log("AI contains refundOrder:", code.includes("refundOrder"));

  console.log("AI contains transferBalance:", code.includes("transferBalance"));

  console.log("Static findings supplied to AI:", safeStaticFindings.length);

  console.log("====================================\n");

  const prompt = buildReviewPrompt({
    code,
    language,
    selectedAnalysis,
    staticFindings: safeStaticFindings,
  });

  console.log("AI multi-pass prompt characters:", prompt.length);

  const result = await generateWithFallback(prompt);

  const analysis = parseAnalysis(result.text);

  console.log("\n========== RAW GEMINI DEBUG ==========");

  console.log("Gemini model:", result.model);

  console.log("Raw Gemini summary:", analysis.summary);

  console.log("Raw Gemini findings count:", analysis.findings.length);

  console.dir(analysis.findings, {
    depth: null,
  });

  console.log("======================================\n");

  const sanitizedFindings = sanitizeFindings({
    findings: analysis.findings,
    selectedAnalysis,
    code,
  });

  console.log("\n========== AI SOURCE VERIFICATION ==========");

  console.log("Sanitized AI findings:", sanitizedFindings.length);

  const verification = verifyAIFindings({
    findings: sanitizedFindings,
    code,
  });

  const findings = verification.findings;

  console.log("Verified AI findings:", findings.length);

  console.log(
    "Rejected hallucinated findings:",
    verification.rejectedFindings.length,
  );

  if (verification.rejectedFindings.length > 0) {
    console.log("\nRejected findings:");

    for (const rejectedFinding of verification.rejectedFindings) {
      console.log(`- ${rejectedFinding.issue}`);

      console.log(
        `  Function: ${rejectedFinding.referencedFunction || "unknown"}`,
      );

      console.log(`  Reason: ${rejectedFinding.verificationReason}`);
    }
  }

  console.log("============================================\n");

  const findingStats = getFindingStats(findings);

  console.log("\n========== CTHRU AI RESULT ==========");

  console.log(`Model: ${result.model}`);

  console.log(`Raw Gemini findings: ${analysis.findings.length}`);

  console.log(`Sanitized findings: ${sanitizedFindings.length}`);

  console.log(`Source-verified findings: ${findingStats.total}`);

  console.log(
    `Rejected hallucinations: ${verification.rejectedFindings.length}`,
  );

  console.log(`Critical: ${findingStats.bySeverity.critical}`);

  console.log(`High: ${findingStats.bySeverity.high}`);

  console.log(`Medium: ${findingStats.bySeverity.medium}`);

  console.log(`Low: ${findingStats.bySeverity.low}`);

  console.log(`Code Quality: ${findingStats.byCategory["Code Quality"]}`);

  console.log(`Security: ${findingStats.byCategory.Security}`);

  console.log(`Complexity: ${findingStats.byCategory.Complexity}`);

  console.log("=====================================\n");

  return {
    summary: sanitizeText(analysis.summary),

    findings,

    model: result.model,

    findingStats,

    rejectedFindingCount: verification.rejectedFindings.length,

    rejectedFindings: verification.rejectedFindings.map((finding) => ({
      issue: finding.issue,

      reason: finding.verificationReason,

      referencedFunction: finding.referencedFunction || null,
    })),

    analysisStrategy: "multi-pass-source-verified",
  };
}
