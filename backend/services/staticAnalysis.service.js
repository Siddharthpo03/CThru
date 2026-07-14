const SUPPORTED_CATEGORIES = new Set([
  "Code Quality",
  "Security",
  "Complexity",
]);

function createFinding({
  category,
  severity,
  issue,
  explanation,
  suggestedFix,
  lineNumber = null,
}) {
  return {
    category,
    severity,
    issue,
    explanation,
    suggestedFix,
    lineNumber,
  };
}

function getLines(code) {
  return code.split("\n");
}

function countNonEmptyLines(lines) {
  return lines.filter((line) => line.trim().length > 0).length;
}

function isCommentLine(line) {
  const trimmed = line.trim();

  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  );
}

function estimateComplexity(code) {
  const complexityPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\b/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?/g,
  ];

  let complexity = 1;

  for (const pattern of complexityPatterns) {
    const matches = code.match(pattern);

    complexity += matches?.length || 0;
  }

  return complexity;
}

function analyzeLooseEquality(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const hasLooseEquality = /(^|[^=!])==([^=]|$)/.test(line);

    const hasLooseInequality = /(^|[^!])!=([^=]|$)/.test(line);

    if (hasLooseEquality || hasLooseInequality) {
      findings.push(
        createFinding({
          category: "Code Quality",

          severity: "low",

          issue: "Loose equality comparison",

          explanation:
            "Loose equality performs type coercion and can produce unexpected comparisons.",

          suggestedFix:
            "Use strict equality with === or !== unless type coercion is explicitly required.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeConsoleStatements(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(line)) {
      findings.push(
        createFinding({
          category: "Code Quality",

          severity: "low",

          issue: "Console statement detected",

          explanation:
            "Console statements can expose runtime information and create unnecessary production output.",

          suggestedFix:
            "Remove unnecessary console output or replace it with a structured application logger.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeSensitiveLogging(lines, findings) {
  const sensitiveTerms =
    /\b(password|passwd|token|secret|apiKey|api_key|authorization|credential)\b/i;

  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const isConsoleStatement =
      /\bconsole\.(log|debug|info|warn|error)\s*\(/.test(line);

    if (isConsoleStatement && sensitiveTerms.test(line)) {
      findings.push(
        createFinding({
          category: "Security",

          severity: "high",

          issue: "Sensitive credential data may be logged",

          explanation:
            "A logging statement references credential-related data. Logging passwords, tokens, secrets, or authorization data can expose sensitive information through logs.",

          suggestedFix:
            "Remove credential values from the log statement. Log only non-sensitive event metadata such as a user ID or operation name.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzePlainTextPasswords(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const normalized = line.replace(/\s+/g, "");

    const passwordAssignment = /password[:=]/i.test(normalized);

    const hashingPresent =
      /(bcrypt|argon2|scrypt|pbkdf2|hashPassword|passwordHash)/i.test(line);

    if (
      passwordAssignment &&
      !hashingPresent &&
      (/password\s*:\s*["'`]/i.test(line) ||
        /\.password\s*=\s*(newPassword|password|["'`])/i.test(line))
    ) {
      findings.push(
        createFinding({
          category: "Security",

          severity: "high",

          issue: "Password appears to be stored in plain text",

          explanation:
            "The source directly assigns a password value without an identifiable password-hashing operation. Plain-text credential storage exposes user passwords if application data is accessed.",

          suggestedFix:
            "Hash passwords using a password-specific hashing algorithm such as Argon2 or bcrypt before storage and compare password hashes during authentication.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeUnsafeFindIndexSplice(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (/\.splice\s*\(\s*[^,]+,\s*1\s*\)/.test(line)) {
      const previousLines = lines
        .slice(Math.max(0, index - 6), index)
        .join("\n");

      if (
        /findIndex\s*\(/.test(previousLines) &&
        !/!==\s*-1|>=\s*0|>\s*-1/.test(previousLines)
      ) {
        findings.push(
          createFinding({
            category: "Code Quality",

            severity: "medium",

            issue: "Unchecked findIndex result used for array deletion",

            explanation:
              "findIndex returns -1 when no matching element exists. Passing -1 to splice can delete the last array element instead of rejecting the missing target.",

            suggestedFix:
              "Check that the index is not -1 before calling splice. Return a not-found result when the target does not exist.",

            lineNumber: index + 1,
          }),
        );
      }
    }
  });
}

function analyzeNumericValidation(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const functionWindow = lines
      .slice(Math.max(0, index - 8), index + 8)
      .join("\n");

    const mutationPattern =
      /\.(balance|stock|quantity)\s*[+\-]=\s*(amount|quantity)/i.test(line);

    if (!mutationPattern) {
      return;
    }

    const hasFiniteValidation = /Number\.isFinite\s*\(/.test(functionWindow);

    const hasPositiveValidation =
      /(amount|quantity)\s*<=\s*0|(amount|quantity)\s*>\s*0/.test(
        functionWindow,
      );

    if (!hasFiniteValidation || !hasPositiveValidation) {
      findings.push(
        createFinding({
          category: "Code Quality",

          severity: "medium",

          issue:
            "Numeric state mutation lacks strict finite positive validation",

          explanation:
            "A balance, stock, or quantity mutation uses caller-provided numeric data without clearly validating that the value is finite and positive. Negative, NaN, or Infinity values can produce invalid application state.",

          suggestedFix:
            "Before modifying state, reject the value unless Number.isFinite(value) is true and value is greater than zero.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeDirectSensitiveReturns(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (/return\s+.*password/i.test(line)) {
      findings.push(
        createFinding({
          category: "Security",

          severity: "high",

          issue: "Password data returned from application logic",

          explanation:
            "The returned value directly references password data, which can expose credentials to callers or API responses.",

          suggestedFix:
            "Remove password and credential fields from returned objects. Return an explicitly constructed safe user projection.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeMutableObjectReturns(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (
      /^\s*return\s+(user|product|order|foundUser|targetUser)\s*;/.test(line)
    ) {
      findings.push(
        createFinding({
          category: "Code Quality",

          severity: "medium",

          issue: "Internal mutable object reference is returned directly",

          explanation:
            "Returning an internal object reference allows external callers to mutate application state without passing through validation or authorization logic.",

          suggestedFix:
            "Return a copied and explicitly projected object instead of the internal mutable reference.",

          lineNumber: index + 1,
        }),
      );
    }
  });
}

function analyzeComplexity(code, lines, findings) {
  const complexity = estimateComplexity(code);

  if (complexity >= 20) {
    findings.push(
      createFinding({
        category: "Complexity",

        severity: complexity >= 35 ? "high" : "high",

        issue: "High cyclomatic complexity",

        explanation: `The estimated cyclomatic complexity is ${complexity}. Highly complex code is harder to test and maintain.`,

        suggestedFix:
          "Split complex logic into smaller functions and simplify nested conditions.",

        lineNumber: null,
      }),
    );
  }

  if (lines.length >= 400) {
    findings.push(
      createFinding({
        category: "Complexity",

        severity: "medium",

        issue: "Large source submission",

        explanation: `The submitted source contains ${lines.length} lines. Large units of code can become difficult to review and maintain.`,

        suggestedFix:
          "Split the code into smaller modules or focused components.",

        lineNumber: null,
      }),
    );
  }

  return complexity;
}

export function runStaticAnalysis({ code, selectedAnalysis = [] }) {
  const lines = getLines(code);

  const findings = [];

  const enabledCategories = new Set(
    selectedAnalysis.filter((category) => SUPPORTED_CATEGORIES.has(category)),
  );

  if (enabledCategories.has("Code Quality")) {
    analyzeLooseEquality(lines, findings);

    analyzeConsoleStatements(lines, findings);

    analyzeUnsafeFindIndexSplice(lines, findings);

    analyzeNumericValidation(lines, findings);

    analyzeMutableObjectReturns(lines, findings);
  }

  if (enabledCategories.has("Security")) {
    analyzeSensitiveLogging(lines, findings);

    analyzePlainTextPasswords(lines, findings);

    analyzeDirectSensitiveReturns(lines, findings);
  }

  let complexity = 1;

  if (enabledCategories.has("Complexity")) {
    complexity = analyzeComplexity(code, lines, findings);
  }

  return {
    findings,

    metrics: {
      linesOfCode: countNonEmptyLines(lines),

      complexity,
    },
  };
}
