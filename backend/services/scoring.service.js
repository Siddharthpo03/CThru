const CATEGORY_CONFIG = {
  Security: {
    weight: 0.45,

    penalties: {
      critical: 42,
      high: 16,
      medium: 7,
      low: 2,
    },
  },

  "Code Quality": {
    weight: 0.35,

    penalties: {
      critical: 30,
      high: 14,
      medium: 6,
      low: 1.5,
    },
  },

  Complexity: {
    weight: 0.2,

    penalties: {
      critical: 28,
      high: 14,
      medium: 6,
      low: 2,
    },
  },
};

const severityRanks = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getSelectedCategories(selectedAnalysis = []) {
  return Object.keys(CATEGORY_CONFIG).filter((category) =>
    selectedAnalysis.includes(category),
  );
}

function getConfidenceMultiplier(finding) {
  const confidence = String(finding.confidence || "high").toLowerCase();

  if (confidence === "low") {
    return 0.55;
  }

  if (confidence === "medium") {
    return 0.75;
  }

  return 1;
}

function getSourceMultiplier(finding) {
  const sources = new Set(finding.sources || []);

  const hasStatic = sources.has("static");

  const hasAI = sources.has("ai");

  if (hasStatic && hasAI) {
    return 1;
  }

  if (hasStatic) {
    return 0.9;
  }

  if (hasAI) {
    return 0.85;
  }

  return 0.8;
}

function getOccurrenceMultiplier(finding) {
  const occurrenceCount = Math.max(1, Number(finding.occurrenceCount) || 1);

  if (occurrenceCount === 1) {
    return 1;
  }

  if (occurrenceCount <= 3) {
    return 1.04;
  }

  if (occurrenceCount <= 10) {
    return 1.08;
  }

  return 1.12;
}

function calculateFindingPenalty(finding, categoryConfig) {
  const basePenalty = categoryConfig.penalties[finding.severity] || 0;

  const confidenceMultiplier = getConfidenceMultiplier(finding);

  const sourceMultiplier = getSourceMultiplier(finding);

  const occurrenceMultiplier = getOccurrenceMultiplier(finding);

  return (
    basePenalty * confidenceMultiplier * sourceMultiplier * occurrenceMultiplier
  );
}

function getSeverityCounts(findings) {
  return findings.reduce(
    (counts, finding) => {
      const severity = finding.severity;

      if (Object.hasOwn(counts, severity)) {
        counts[severity] += 1;
      }

      return counts;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  );
}

function calculateCategoryScore(category, findings) {
  const config = CATEGORY_CONFIG[category];

  if (!config) {
    return 100;
  }

  const categoryFindings = findings.filter(
    (finding) => finding.category === category,
  );

  if (categoryFindings.length === 0) {
    return 100;
  }

  const severityCounts = getSeverityCounts(categoryFindings);

  let penalty = categoryFindings.reduce(
    (total, finding) => total + calculateFindingPenalty(finding, config),
    0,
  );

  const mediumOverflow = Math.max(0, severityCounts.medium - 4);

  const lowOverflow = Math.max(0, severityCounts.low - 5);

  penalty -= mediumOverflow * 1.5;

  penalty -= lowOverflow * 0.75;

  penalty = Math.max(0, penalty);

  let score = 100 - penalty;

  if (category === "Security") {
    if (severityCounts.critical >= 1) {
      score = Math.min(score, 58);
    }

    if (severityCounts.critical >= 2) {
      score = Math.min(score, 38);
    }

    if (severityCounts.critical === 0 && severityCounts.high >= 3) {
      score = Math.min(score, 62);
    }

    if (severityCounts.critical === 0 && severityCounts.high >= 5) {
      score = Math.min(score, 48);
    }
  }

  if (category === "Code Quality") {
    if (severityCounts.critical >= 1) {
      score = Math.min(score, 55);
    }

    if (severityCounts.high >= 4) {
      score = Math.min(score, 65);
    }
  }

  if (category === "Complexity") {
    if (severityCounts.critical >= 1) {
      score = Math.min(score, 55);
    }

    if (severityCounts.high >= 3) {
      score = Math.min(score, 60);
    }
  }

  return clampScore(score);
}

function calculateWeightedScore(categoryScores, selectedCategories) {
  const totalConfiguredWeight = selectedCategories.reduce(
    (total, category) => total + CATEGORY_CONFIG[category].weight,
    0,
  );

  if (totalConfiguredWeight <= 0) {
    return 100;
  }

  return selectedCategories.reduce((total, category) => {
    const normalizedWeight =
      CATEGORY_CONFIG[category].weight / totalConfiguredWeight;

    return total + categoryScores[category] * normalizedWeight;
  }, 0);
}

function getConfirmedCriticalFindings(findings) {
  return findings.filter((finding) => {
    if (finding.severity !== "critical") {
      return false;
    }

    const confidence = finding.confidence || "high";

    const sources = new Set(finding.sources || []);

    const confirmedByBoth = sources.has("static") && sources.has("ai");

    return confidence === "high" || confirmedByBoth;
  });
}

function applyOverallRiskAdjustment(score, findings) {
  const confirmedCriticalFindings = getConfirmedCriticalFindings(findings);

  const highSecurityFindings = findings.filter(
    (finding) => finding.category === "Security" && finding.severity === "high",
  );

  let adjustedScore = score;

  if (confirmedCriticalFindings.length >= 1) {
    adjustedScore = Math.min(adjustedScore, 64);
  }

  if (confirmedCriticalFindings.length >= 2) {
    adjustedScore = Math.min(adjustedScore, 44);
  }

  if (
    confirmedCriticalFindings.length === 0 &&
    highSecurityFindings.length >= 5
  ) {
    adjustedScore = Math.min(adjustedScore, 59);
  }

  return adjustedScore;
}

export function calculateReviewScores({
  findings = [],
  selectedAnalysis = [],
}) {
  const selectedCategories = getSelectedCategories(selectedAnalysis);

  const categoryScores = {
    Security: null,
    "Code Quality": null,
    Complexity: null,
  };

  for (const category of selectedCategories) {
    categoryScores[category] = calculateCategoryScore(category, findings);
  }

  if (selectedCategories.length === 0) {
    return {
      overallScore: 100,

      categoryScores,
    };
  }

  const weightedScore = calculateWeightedScore(
    categoryScores,
    selectedCategories,
  );

  let overallScore = clampScore(weightedScore);

  overallScore = applyOverallRiskAdjustment(overallScore, findings);

  return {
    overallScore: clampScore(overallScore),

    categoryScores,
  };
}

export function getScoreBreakdown({ findings = [], selectedAnalysis = [] }) {
  const selectedCategories = getSelectedCategories(selectedAnalysis);

  return selectedCategories.map((category) => {
    const categoryFindings = findings.filter(
      (finding) => finding.category === category,
    );

    const severityCounts = getSeverityCounts(categoryFindings);

    return {
      category,

      weight: CATEGORY_CONFIG[category].weight,

      findingCount: categoryFindings.length,

      severityCounts,

      score: calculateCategoryScore(category, findings),
    };
  });
}

export function compareFindingSeverity(first, second) {
  return (
    (severityRanks[second?.severity] || 0) -
    (severityRanks[first?.severity] || 0)
  );
}
