const severityWeights = {
  critical: 18,
  high: 10,
  medium: 4,
  low: 1,
};

const categoryWeights = {
  Security: 1.2,
  Complexity: 0.8,
  "Code Quality": 0.7,
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
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
  const ranks = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return ranks[severity] || 0;
}

function isSameIssue(existing, incoming) {
  if (existing.category !== incoming.category) {
    return false;
  }

  const issueSimilarity = calculateSimilarity(existing.issue, incoming.issue);

  const explanationSimilarity = calculateSimilarity(
    existing.explanation,
    incoming.explanation,
  );

  const normalizedExistingIssue = normalizeText(existing.issue);

  const normalizedIncomingIssue = normalizeText(incoming.issue);

  if (normalizedExistingIssue === normalizedIncomingIssue) {
    return true;
  }

  return issueSimilarity >= 0.72 || explanationSimilarity >= 0.82;
}

function createMergedFinding(finding, source) {
  const lineNumbers = [];

  if (Number.isInteger(finding.lineNumber)) {
    lineNumbers.push(finding.lineNumber);
  }

  return {
    ...finding,

    occurrenceCount: 1,

    lineNumbers,

    sources: [source],
  };
}

function mergeFindingData(existing, incoming, source) {
  const existingRank = getSeverityRank(existing.severity);

  const incomingRank = getSeverityRank(incoming.severity);

  const lineNumbers = new Set([...(existing.lineNumbers || [])]);

  if (Number.isInteger(incoming.lineNumber)) {
    lineNumbers.add(incoming.lineNumber);
  }

  const sources = new Set([...(existing.sources || []), source]);

  const preferredFinding = incomingRank > existingRank ? incoming : existing;

  return {
    ...preferredFinding,

    lineNumber: existing.lineNumber ?? incoming.lineNumber ?? null,

    occurrenceCount: (existing.occurrenceCount || 1) + 1,

    lineNumbers: [...lineNumbers].sort((first, second) => first - second),

    sources: [...sources],
  };
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

  return merged;
}

function calculateFindingPenalty(finding) {
  const severityWeight = severityWeights[finding.severity] || 0;

  const categoryWeight = categoryWeights[finding.category] || 1;

  return severityWeight * categoryWeight;
}

export function calculateFinalScore(findings = []) {
  if (findings.length === 0) {
    return 100;
  }

  const criticalFindings = findings.filter(
    (finding) => finding.severity === "critical",
  );

  const highFindings = findings.filter(
    (finding) => finding.severity === "high",
  );

  const mediumFindings = findings.filter(
    (finding) => finding.severity === "medium",
  );

  const lowFindings = findings.filter((finding) => finding.severity === "low");

  let penalty = findings.reduce(
    (total, finding) => total + calculateFindingPenalty(finding),
    0,
  );

  const mediumOverflow = Math.max(0, mediumFindings.length - 5);

  const lowOverflow = Math.max(0, lowFindings.length - 5);

  penalty -= mediumOverflow * 1.5;
  penalty -= lowOverflow * 0.5;

  penalty = Math.max(0, penalty);

  let score = Math.round(100 - penalty);

  if (criticalFindings.length > 0) {
    score = Math.min(score, 59);
  }

  if (criticalFindings.length >= 2) {
    score = Math.min(score, 39);
  }

  if (criticalFindings.length === 0 && highFindings.length >= 3) {
    score = Math.min(score, 69);
  }

  return Math.max(0, Math.min(100, score));
}
