const severityRanks = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const ISSUE_FAMILIES = [
  {
    fingerprint: "authentication-bypass",
    patterns: [
      /authentication.*bypass/i,
      /missing credential validation/i,
      /successful result.*without.*user/i,
      /success.*without.*matched user/i,
      /login.*success.*without/i,
      /missing return.*login/i,
    ],
  },

  {
    fingerprint: "plaintext-password-storage",
    patterns: [
      /plain.?text password/i,
      /password.*without hashing/i,
      /password.*stored.*plain/i,
      /credential.*stored.*plain/i,
      /insecure credential storage/i,
    ],
  },

  {
    fingerprint: "sensitive-credential-logging",
    patterns: [
      /password.*log/i,
      /credential.*log/i,
      /sensitive.*log/i,
      /plain.?text password exposure.*log/i,
    ],
  },

  {
    fingerprint: "password-return-exposure",
    patterns: [
      /password.*returned/i,
      /password data returned/i,
      /credential exposure.*return/i,
      /sensitive credential exposure.*report/i,
      /insecure data export/i,
      /password field.*return/i,
    ],
  },

  {
    fingerprint: "repeated-refund",
    patterns: [
      /repeated refund/i,
      /refund.*inflation/i,
      /refund.*balance.*stock/i,
      /already refunded/i,
    ],
  },

  {
    fingerprint: "refund-unsafe-order-lookup",
    patterns: [
      /unsafe lookup.*refund/i,
      /refund.*missing order/i,
      /unchecked lookup.*order/i,
      /refund.*order.*undefined/i,
    ],
  },

  {
    fingerprint: "refund-status-validation",
    patterns: [
      /refund.*completed order/i,
      /refund.*status check/i,
      /inconsistent order status/i,
      /refund.*invalid.*status/i,
    ],
  },

  {
    fingerprint: "negative-transfer",
    patterns: [
      /negative transfer/i,
      /transfer amount.*positive/i,
      /balance transfer amount.*validation/i,
      /negative amount.*balance/i,
      /balance theft/i,
    ],
  },

  {
    fingerprint: "insufficient-transfer-balance",
    patterns: [
      /transfer.*available funds/i,
      /transfer.*sufficient funds/i,
      /transfer.*exceed.*balance/i,
      /insufficient balance.*transfer/i,
    ],
  },

  {
    fingerprint: "admin-authorization",
    patterns: [
      /unrestricted administrative/i,
      /administrative action bypass/i,
      /missing authorization.*admin/i,
      /admin.*authorization/i,
      /role modification.*authorization/i,
      /privilege escalation/i,
    ],
  },

  {
    fingerprint: "password-reset-authorization",
    patterns: [
      /unrestricted password reset/i,
      /password reset.*authorization/i,
      /missing authorization.*resetuserpassword/i,
    ],
  },

  {
    fingerprint: "loose-equality",
    patterns: [
      /loose equality/i,
      /strict equality/i,
      /type coercion.*comparison/i,
    ],
  },

  {
    fingerprint: "console-statement",
    patterns: [/console statement/i, /console output/i, /debug console/i],
  },

  {
    fingerprint: "mutable-object-return",
    patterns: [
      /mutable object reference/i,
      /internal object reference/i,
      /direct object reference.*return/i,
    ],
  },

  {
    fingerprint: "numeric-validation",
    patterns: [
      /numeric state mutation/i,
      /finite positive validation/i,
      /numeric.*strict validation/i,
    ],
  },

  {
    fingerprint: "division-by-zero",
    patterns: [/division by zero/i, /divide.*zero/i, /average.*nan/i],
  },

  {
    fingerprint: "order-state-consistency",
    patterns: [
      /inconsistent state.*order/i,
      /order creation.*state/i,
      /partial state update/i,
      /rollback.*order/i,
    ],
  },

  {
    fingerprint: "cart-lookup-complexity",
    patterns: [
      /cart.*o\(n\*m\)/i,
      /cart total.*complexity/i,
      /product lookup.*cart/i,
      /cart calculations/i,
    ],
  },

  {
    fingerprint: "stock-lookup-complexity",
    patterns: [
      /stock checking/i,
      /stock validation.*map/i,
      /product lookup.*stock/i,
    ],
  },

  {
    fingerprint: "maximum-product-complexity",
    patterns: [
      /most expensive product/i,
      /finding maximum.*product/i,
      /product search.*o\(n\^2\)/i,
    ],
  },

  {
    fingerprint: "large-source-file",
    patterns: [
      /large source submission/i,
      /large source file/i,
      /large unit.*code/i,
    ],
  },
];

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWords(value = "") {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((word) => word.length > 3),
  );
}

function calculateSimilarity(first, second) {
  const firstWords = getWords(first);

  const secondWords = getWords(second);

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

function getSeverityRank(severity) {
  return severityRanks[severity] || 0;
}

function getCombinedFindingText(finding) {
  return [finding.issue, finding.explanation, finding.suggestedFix]
    .filter(Boolean)
    .join(" ");
}

function inferFingerprint(finding) {
  if (finding.fingerprint) {
    return finding.fingerprint;
  }

  const combinedText = getCombinedFindingText(finding);

  for (const family of ISSUE_FAMILIES) {
    const matchesFamily = family.patterns.some((pattern) =>
      pattern.test(combinedText),
    );

    if (matchesFamily) {
      return family.fingerprint;
    }
  }

  return null;
}

function normalizeFingerprint(fingerprint) {
  if (!fingerprint) {
    return null;
  }

  if (
    fingerprint.startsWith("missing-authorization-") ||
    fingerprint === "admin-authorization"
  ) {
    if (fingerprint.includes("resetuserpassword")) {
      return "password-reset-authorization";
    }

    return "admin-authorization";
  }

  if (fingerprint.startsWith("numeric-validation-")) {
    return "numeric-validation";
  }

  return fingerprint;
}

function getFindingFingerprint(finding) {
  return normalizeFingerprint(inferFingerprint(finding));
}

function areLineNumbersClose(existing, incoming) {
  const existingLines = existing.lineNumbers || [];

  const incomingLine = incoming.lineNumber;

  if (existingLines.length === 0 || !Number.isInteger(incomingLine)) {
    return false;
  }

  return existingLines.some(
    (lineNumber) => Math.abs(lineNumber - incomingLine) <= 8,
  );
}

function isSameIssue(existing, incoming) {
  if (existing.category !== incoming.category) {
    return false;
  }

  const existingFingerprint = getFindingFingerprint(existing);

  const incomingFingerprint = getFindingFingerprint(incoming);

  if (
    existingFingerprint &&
    incomingFingerprint &&
    existingFingerprint === incomingFingerprint
  ) {
    return true;
  }

  const normalizedExistingIssue = normalizeText(existing.issue);

  const normalizedIncomingIssue = normalizeText(incoming.issue);

  if (
    normalizedExistingIssue &&
    normalizedExistingIssue === normalizedIncomingIssue
  ) {
    return true;
  }

  const issueSimilarity = calculateSimilarity(existing.issue, incoming.issue);

  const explanationSimilarity = calculateSimilarity(
    existing.explanation,
    incoming.explanation,
  );

  if (issueSimilarity >= 0.62) {
    return true;
  }

  if (
    explanationSimilarity >= 0.72 &&
    areLineNumbersClose(existing, incoming)
  ) {
    return true;
  }

  return false;
}

function createMergedFinding(finding, source) {
  const lineNumbers = [];

  if (Number.isInteger(finding.lineNumber)) {
    lineNumbers.push(finding.lineNumber);
  }

  return {
    ...finding,

    fingerprint: getFindingFingerprint(finding),

    occurrenceCount: 1,

    lineNumbers,

    sources: [source],
  };
}

function selectPreferredFinding(existing, incoming) {
  const existingRank = getSeverityRank(existing.severity);

  const incomingRank = getSeverityRank(incoming.severity);

  if (incomingRank > existingRank) {
    return incoming;
  }

  if (existingRank > incomingRank) {
    return existing;
  }

  const existingSourceCount = existing.sources?.length || 0;

  const incomingHasDetailedExplanation =
    String(incoming.explanation || "").length >
    String(existing.explanation || "").length;

  if (existingSourceCount <= 1 && incomingHasDetailedExplanation) {
    return incoming;
  }

  return existing;
}

function mergeFindingData(existing, incoming, source) {
  const lineNumbers = new Set([...(existing.lineNumbers || [])]);

  if (Number.isInteger(incoming.lineNumber)) {
    lineNumbers.add(incoming.lineNumber);
  }

  const sources = new Set([...(existing.sources || []), source]);

  const preferredFinding = selectPreferredFinding(existing, incoming);

  const fingerprint =
    getFindingFingerprint(existing) || getFindingFingerprint(incoming);

  return {
    ...preferredFinding,

    fingerprint,

    lineNumber: existing.lineNumber ?? incoming.lineNumber ?? null,

    occurrenceCount: (existing.occurrenceCount || 1) + 1,

    lineNumbers: [...lineNumbers].sort((first, second) => first - second),

    sources: [...sources],
  };
}

function sortFindings(findings) {
  return [...findings].sort((first, second) => {
    const severityDifference =
      getSeverityRank(second.severity) - getSeverityRank(first.severity);

    if (severityDifference !== 0) {
      return severityDifference;
    }

    const categoryOrder = {
      Security: 0,
      "Code Quality": 1,
      Complexity: 2,
    };

    const categoryDifference =
      (categoryOrder[first.category] ?? 99) -
      (categoryOrder[second.category] ?? 99);

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    return (
      (first.lineNumber ?? Number.MAX_SAFE_INTEGER) -
      (second.lineNumber ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function mergeFindings(staticFindings = [], aiFindings = []) {
  const merged = [];

  const findingsWithSource = [
    ...staticFindings.map((finding) => ({
      finding,
      source: "static",
    })),

    ...aiFindings.map((finding) => ({
      finding,
      source: "ai",
    })),
  ];

  for (const { finding, source } of findingsWithSource) {
    if (!finding || !finding.issue || !finding.category) {
      continue;
    }

    const duplicateIndex = merged.findIndex((existing) =>
      isSameIssue(existing, finding),
    );

    if (duplicateIndex === -1) {
      merged.push(createMergedFinding(finding, source));

      continue;
    }

    merged[duplicateIndex] = mergeFindingData(
      merged[duplicateIndex],
      finding,
      source,
    );
  }

  return sortFindings(merged);
}

export function getFindingMergeStats({
  staticFindings = [],
  aiFindings = [],
  mergedFindings = [],
}) {
  const rawDetections = staticFindings.length + aiFindings.length;

  const uniqueFindings = mergedFindings.length;

  return {
    rawDetections,

    uniqueFindings,

    mergedDetections: Math.max(0, rawDetections - uniqueFindings),
  };
}
