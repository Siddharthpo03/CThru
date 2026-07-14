const CATEGORY_CONFIG = {
  Security: {
    weight: 0.45,

    penalties: {
      critical: 55,
      high: 22,
      medium: 10,
      low: 3,
    },
  },

  "Code Quality": {
    weight: 0.35,

    penalties: {
      critical: 40,
      high: 18,
      medium: 9,
      low: 2,
    },
  },

  Complexity: {
    weight: 0.2,

    penalties: {
      critical: 35,
      high: 20,
      medium: 9,
      low: 3,
    },
  },
};

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getOccurrenceMultiplier(finding) {
  const occurrenceCount = finding.occurrenceCount || 1;

  if (occurrenceCount <= 1) {
    return 1;
  }

  if (occurrenceCount <= 3) {
    return 1.1;
  }

  if (occurrenceCount <= 10) {
    return 1.2;
  }

  return 1.3;
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

  let penalty = 0;

  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of categoryFindings) {
    const severity = finding.severity;

    severityCounts[severity] = (severityCounts[severity] || 0) + 1;

    const basePenalty = config.penalties[severity] || 0;

    const occurrenceMultiplier = getOccurrenceMultiplier(finding);

    penalty += basePenalty * occurrenceMultiplier;
  }

  let score = 100 - penalty;

  if (category === "Security") {
    if (severityCounts.critical >= 1) {
      score = Math.min(score, 35);
    }

    if (severityCounts.critical >= 2) {
      score = Math.min(score, 15);
    }

    if (severityCounts.high >= 3) {
      score = Math.min(score, 45);
    }

    if (severityCounts.high >= 5) {
      score = Math.min(score, 25);
    }
  }

  if (category === "Code Quality") {
    if (severityCounts.critical >= 1) {
      score = Math.min(score, 45);
    }

    if (severityCounts.high >= 3) {
      score = Math.min(score, 55);
    }
  }

  if (category === "Complexity") {
    if (severityCounts.high >= 1 && severityCounts.medium >= 2) {
      score = Math.min(score, 55);
    }

    if (severityCounts.high >= 2) {
      score = Math.min(score, 45);
    }
  }

  return clampScore(score);
}

function getSelectedCategories(selectedAnalysis) {
  return Object.keys(CATEGORY_CONFIG).filter((category) =>
    selectedAnalysis.includes(category),
  );
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

  const totalConfiguredWeight = selectedCategories.reduce(
    (total, category) => total + CATEGORY_CONFIG[category].weight,

    0,
  );

  const weightedScore = selectedCategories.reduce(
    (total, category) => {
      const normalizedWeight =
        CATEGORY_CONFIG[category].weight / totalConfiguredWeight;

      return total + categoryScores[category] * normalizedWeight;
    },

    0,
  );

  let overallScore = clampScore(weightedScore);

  const securityScore = categoryScores.Security;

  if (securityScore !== null && securityScore <= 15) {
    overallScore = Math.min(overallScore, 39);
  }

  if (securityScore !== null && securityScore <= 5) {
    overallScore = Math.min(overallScore, 29);
  }

  return {
    overallScore,

    categoryScores,
  };
}
