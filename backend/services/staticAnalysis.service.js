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
  confidence = "high",
  fingerprint = null,
}) {
  return {
    category,
    severity,
    issue,
    explanation,
    suggestedFix,
    lineNumber,
    confidence,
    fingerprint,
  };
}

function getLines(code) {
  return String(code || "").split("\n");
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

function stripCommentsAndStrings(code) {
  return String(code || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/`(?:\\.|[^`\\])*`/g, "``");
}

function getFunctionBlocks(lines) {
  const blocks = [];

  const functionPatterns = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/,
    /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/,
    /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>\s*\{/,
  ];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    let functionName = null;

    for (const pattern of functionPatterns) {
      const match = line.match(pattern);

      if (match) {
        functionName = match[1];
        break;
      }
    }

    if (!functionName) {
      continue;
    }

    let braceDepth = 0;
    let hasOpeningBrace = false;
    let endIndex = index;

    for (
      let currentIndex = index;
      currentIndex < lines.length;
      currentIndex += 1
    ) {
      const currentLine = stripCommentsAndStrings(lines[currentIndex]);

      for (const character of currentLine) {
        if (character === "{") {
          braceDepth += 1;
          hasOpeningBrace = true;
        }

        if (character === "}") {
          braceDepth -= 1;
        }
      }

      endIndex = currentIndex;

      if (hasOpeningBrace && braceDepth <= 0) {
        break;
      }
    }

    blocks.push({
      name: functionName,
      startLine: index + 1,
      endLine: endIndex + 1,
      code: lines.slice(index, endIndex + 1).join("\n"),
    });

    index = Math.max(index, endIndex);
  }

  return blocks;
}

function estimateBlockComplexity(code) {
  const sanitizedCode = stripCommentsAndStrings(code);

  const patterns = [
    /\bif\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\b/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?\s*[^:]+:/g,
  ];

  let complexity = 1;

  for (const pattern of patterns) {
    const matches = sanitizedCode.match(pattern);

    complexity += matches?.length || 0;
  }

  return complexity;
}

function estimateComplexity(code, lines) {
  const functionBlocks = getFunctionBlocks(lines);

  if (functionBlocks.length === 0) {
    return estimateBlockComplexity(code);
  }

  const functionComplexities = functionBlocks.map((block) => ({
    ...block,
    complexity: estimateBlockComplexity(block.code),
  }));

  const totalDecisionComplexity = functionComplexities.reduce(
    (total, block) => total + Math.max(0, block.complexity - 1),
    0,
  );

  return {
    total: 1 + totalDecisionComplexity,
    functions: functionComplexities,
  };
}

function analyzeLooseEquality(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const sanitizedLine = stripCommentsAndStrings(line);

    const hasLooseEquality = /(^|[^=!])==([^=]|$)/.test(sanitizedLine);

    const hasLooseInequality = /(^|[^!])!=([^=]|$)/.test(sanitizedLine);

    if (!hasLooseEquality && !hasLooseInequality) {
      return;
    }

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
        fingerprint: "loose-equality",
      }),
    );
  });
}

function analyzeConsoleStatements(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (!/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(line)) {
      return;
    }

    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "low",
        issue: "Console statement detected",
        explanation:
          "Console statements can create unnecessary production output and may expose runtime information.",
        suggestedFix:
          "Remove unnecessary console output or replace it with a structured application logger.",
        lineNumber: index + 1,
        fingerprint: "console-statement",
      }),
    );
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

    if (!isConsoleStatement || !sensitiveTerms.test(line)) {
      return;
    }

    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: "Sensitive credential data may be logged",
        explanation:
          "A logging statement directly references credential-related data and may expose sensitive values through logs.",
        suggestedFix:
          "Remove credential values from the log statement and log only non-sensitive event metadata.",
        lineNumber: index + 1,
        fingerprint: "sensitive-credential-logging",
      }),
    );
  });
}

function hasHashingContext(lines, index) {
  const context = lines
    .slice(Math.max(0, index - 12), Math.min(lines.length, index + 13))
    .join("\n");

  return /(bcrypt|argon2|scrypt|pbkdf2|hashPassword|passwordHash|hash\s*\()/i.test(
    context,
  );
}

function isSeedDataPasswordAssignment(line) {
  return (
    /^\s*\{.*password\s*:\s*["'`][^"'`]+["'`]/i.test(line) ||
    /^\s*password\s*:\s*["'`][^"'`]+["'`]\s*,?\s*$/i.test(line)
  );
}

function analyzePlainTextPasswords(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const directAssignment =
      /\.password\s*=\s*(newPassword|password)\s*;?/i.test(line);

    const literalPassword = isSeedDataPasswordAssignment(line);

    if (!directAssignment && !literalPassword) {
      return;
    }

    if (hasHashingContext(lines, index)) {
      return;
    }

    findings.push(
      createFinding({
        category: "Security",
        severity: literalPassword ? "medium" : "high",
        issue: "Password may be stored without hashing",
        explanation:
          "Password data appears to be assigned or stored without a nearby password-hashing operation.",
        suggestedFix:
          "Hash passwords with Argon2, bcrypt, scrypt, or PBKDF2 before storage and compare hashes during authentication.",
        lineNumber: index + 1,
        confidence: literalPassword ? "medium" : "high",
        fingerprint: "plaintext-password-storage",
      }),
    );
  });
}

function analyzeUnsafeFindIndexSplice(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    if (!/\.splice\s*\(\s*[^,]+,\s*1\s*\)/.test(line)) {
      return;
    }

    const previousLines = lines
      .slice(Math.max(0, index - 10), index + 1)
      .join("\n");

    const hasFindIndex = /findIndex\s*\(/.test(previousLines);

    const hasIndexValidation = /!==\s*-1|===\s*-1|>=\s*0|<\s*0|>\s*-1/.test(
      previousLines,
    );

    if (!hasFindIndex || hasIndexValidation) {
      return;
    }

    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "medium",
        issue: "Unchecked findIndex result used for array deletion",
        explanation:
          "findIndex returns -1 when no matching element exists. Passing -1 to splice can remove the last array element.",
        suggestedFix:
          "Check the index before calling splice and return a not-found result when the target does not exist.",
        lineNumber: index + 1,
        fingerprint: "unchecked-findindex-splice",
      }),
    );
  });
}

function getFunctionContext(lines, index, radius = 20) {
  return lines
    .slice(Math.max(0, index - radius), Math.min(lines.length, index + radius))
    .join("\n");
}

function analyzeNumericValidation(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const mutationMatch = line.match(
      /\.(balance|stock|quantity)\s*([+\-]=)\s*(amount|quantity)\b/i,
    );

    if (!mutationMatch) {
      return;
    }

    const variableName = mutationMatch[3];

    const functionWindow = getFunctionContext(lines, index, 24);

    const escapedVariableName = variableName.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    const finitePattern = new RegExp(
      `Number\\.isFinite\\s*\\(\\s*${escapedVariableName}\\s*\\)`,
    );

    const positivePatterns = [
      new RegExp(`${escapedVariableName}\\s*<=\\s*0`),
      new RegExp(`${escapedVariableName}\\s*<\\s*1`),
      new RegExp(`${escapedVariableName}\\s*>\\s*0`),
      new RegExp(`!\\s*\\(\\s*${escapedVariableName}\\s*>\\s*0\\s*\\)`),
    ];

    const hasFiniteValidation = finitePattern.test(functionWindow);

    const hasPositiveValidation = positivePatterns.some((pattern) =>
      pattern.test(functionWindow),
    );

    if (hasFiniteValidation && hasPositiveValidation) {
      return;
    }

    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "medium",
        issue: "Numeric state mutation lacks strict validation",
        explanation:
          "Caller-provided numeric data modifies application state without clearly proving that the value is finite and positive.",
        suggestedFix: `Validate ${variableName} with Number.isFinite(${variableName}) and require it to be greater than zero before modifying state.`,
        lineNumber: index + 1,
        fingerprint: `numeric-validation-${variableName}`,
      }),
    );
  });
}

function analyzeDirectSensitiveReturns(lines, findings) {
  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const sanitizedLine = stripCommentsAndStrings(line);

    if (!/\breturn\b.*\bpassword\b/i.test(sanitizedLine)) {
      return;
    }

    const isBooleanOrComparison = /return\s+.*password.*(===|!==|==|!=)/i.test(
      sanitizedLine,
    );

    if (isBooleanOrComparison) {
      return;
    }

    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: "Password data returned from application logic",
        explanation:
          "A returned value appears to directly include password data, which can expose credentials to callers or API responses.",
        suggestedFix:
          "Remove password and credential fields from returned objects and return an explicit safe projection.",
        lineNumber: index + 1,
        fingerprint: "password-return-exposure",
      }),
    );
  });
}

function analyzeMutableObjectReturns(lines, findings) {
  const riskyReturnNames = new Set([
    "user",
    "foundUser",
    "targetUser",
    "order",
    "product",
  ]);

  lines.forEach((line, index) => {
    if (isCommentLine(line)) {
      return;
    }

    const match = line.match(/^\s*return\s+([A-Za-z_$][\w$]*)\s*;\s*$/);

    if (!match) {
      return;
    }

    const variableName = match[1];

    if (!riskyReturnNames.has(variableName)) {
      return;
    }

    const context = getFunctionContext(lines, index, 12);

    if (
      /\{\s*\.\.\.(user|foundUser|targetUser|order|product)\s*\}/.test(context)
    ) {
      return;
    }

    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "low",
        issue: "Internal mutable object reference returned directly",
        explanation:
          "Returning an internal mutable object reference may allow callers to modify application state outside normal validation paths.",
        suggestedFix:
          "Return a copied object or an explicitly projected response when callers should not mutate internal state.",
        lineNumber: index + 1,
        confidence: "medium",
        fingerprint: "mutable-object-return",
      }),
    );
  });
}

function analyzeAuthenticationFlow(functionBlocks, findings) {
  const loginBlock = functionBlocks.find((block) =>
    /^(login|authenticate|signIn)$/i.test(block.name),
  );

  if (!loginBlock) {
    return;
  }

  const code = loginBlock.code;

  const usesForEach = /\.forEach\s*\(/.test(code);

  const tracksFoundUser = /\bfoundUser\b/.test(code);

  const validatesFoundUser =
    /if\s*\(\s*!foundUser\s*\)|if\s*\(\s*foundUser\s*\)|success\s*:\s*Boolean\s*\(\s*foundUser\s*\)/.test(
      code,
    );

  const unconditionalSuccess = /success\s*:\s*true/.test(code);

  if (tracksFoundUser && unconditionalSuccess && !validatesFoundUser) {
    findings.push(
      createFinding({
        category: "Security",
        severity: "critical",
        issue: "Authentication success may be returned without a matched user",
        explanation:
          "The authentication flow appears to return a successful result without proving that matching credentials produced a user.",
        suggestedFix:
          "Return a failure result when no matching user exists and only return success after credential validation succeeds.",
        lineNumber: loginBlock.startLine,
        fingerprint: "authentication-bypass",
      }),
    );

    return;
  }

  if (usesForEach && tracksFoundUser) {
    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "low",
        issue: "Authentication lookup uses unnecessary full-array iteration",
        explanation:
          "The authentication lookup scans the full user array even after a matching user is found.",
        suggestedFix:
          "Use Array.prototype.find() for a clearer single-user lookup.",
        lineNumber: loginBlock.startLine,
        fingerprint: "authentication-foreach",
      }),
    );
  }
}

function analyzeRefundFlow(functionBlocks, findings) {
  const refundBlock = functionBlocks.find((block) =>
    /refund/i.test(block.name),
  );

  if (!refundBlock) {
    return;
  }

  const code = refundBlock.code;

  const validatesOrderExistence =
    /if\s*\(\s*!order\s*\)|if\s*\(\s*order\s*===\s*(null|undefined)\s*\)/.test(
      code,
    );

  const checksRefundedStatus =
    /order\.status\s*(===|!==)\s*["'`]refunded["'`]/.test(code);

  const requiresCompletedStatus =
    /order\.status\s*(===|!==)\s*["'`]completed["'`]/.test(code);

  const creditsBalance = /\.balance\s*\+=/.test(code);

  const restoresStock = /\.stock\s*\+=/.test(code);

  if (!validatesOrderExistence) {
    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "medium",
        issue: "Refund flow may access a missing order",
        explanation:
          "The refund operation appears to use an order lookup result without first rejecting a missing order.",
        suggestedFix:
          "Verify that the order exists before accessing order properties.",
        lineNumber: refundBlock.startLine,
        fingerprint: "refund-unsafe-order-lookup",
      }),
    );
  }

  if ((creditsBalance || restoresStock) && !checksRefundedStatus) {
    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: "Repeated refund may inflate balance or stock",
        explanation:
          "The refund flow restores financial or inventory state without clearly rejecting an already refunded order.",
        suggestedFix:
          "Reject already refunded orders and transition the order to refunded exactly once.",
        lineNumber: refundBlock.startLine,
        fingerprint: "repeated-refund",
      }),
    );
  }

  if (!requiresCompletedStatus) {
    findings.push(
      createFinding({
        category: "Code Quality",
        severity: "medium",
        issue: "Refund flow does not require a completed order",
        explanation:
          "The refund operation does not clearly require the order to be completed before restoring balance or inventory.",
        suggestedFix: "Allow refunds only when the order status is completed.",
        lineNumber: refundBlock.startLine,
        fingerprint: "refund-status-validation",
      }),
    );
  }
}

function analyzeTransferFlow(functionBlocks, findings) {
  const transferBlock = functionBlocks.find((block) =>
    /(transferBalance|transferFunds|sendBalance)/i.test(block.name),
  );

  if (!transferBlock) {
    return;
  }

  const code = transferBlock.code;

  const validatesFinite = /Number\.isFinite\s*\(\s*amount\s*\)/.test(code);

  const validatesPositive =
    /amount\s*<=\s*0|amount\s*<\s*1|!\s*\(\s*amount\s*>\s*0\s*\)/.test(code);

  const checksBalance = /balance\s*<\s*amount|amount\s*>\s*.*balance/.test(
    code,
  );

  if (!validatesFinite || !validatesPositive) {
    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: "Balance transfer amount lacks strict positive validation",
        explanation:
          "The transfer flow does not clearly prove that the requested amount is finite and greater than zero.",
        suggestedFix:
          "Reject the transfer unless Number.isFinite(amount) is true and amount is greater than zero.",
        lineNumber: transferBlock.startLine,
        fingerprint: "negative-transfer",
      }),
    );
  }

  if (!checksBalance) {
    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: "Balance transfer may exceed available funds",
        explanation:
          "The transfer flow does not clearly verify that the sender has enough balance before state mutation.",
        suggestedFix:
          "Verify the sender balance before subtracting the transfer amount.",
        lineNumber: transferBlock.startLine,
        fingerprint: "insufficient-transfer-balance",
      }),
    );
  }
}

function analyzeAdminAuthorization(functionBlocks, findings) {
  const sensitiveAdminNames =
    /(updateUserRole|executeAdminAction|deleteUser|resetUserPassword)/i;

  for (const block of functionBlocks) {
    if (!sensitiveAdminNames.test(block.name)) {
      continue;
    }

    const code = block.code;

    const checksAdminRole =
      /\.role\s*(===|!==)\s*["'`]admin["'`]/.test(code) ||
      /isAdmin\s*\(/.test(code) ||
      /requireAdmin\s*\(/.test(code);

    const allowsOwner =
      /requestingUserId\s*(===|!==)\s*(targetUserId|userId)/.test(code);

    if (
      checksAdminRole ||
      (block.name === "resetUserPassword" && allowsOwner)
    ) {
      continue;
    }

    findings.push(
      createFinding({
        category: "Security",
        severity: "high",
        issue: `Missing authorization check in ${block.name}`,
        explanation: `${block.name} performs a sensitive operation without a clearly identifiable administrator or owner authorization check.`,
        suggestedFix:
          "Verify the requesting user's privileges before performing the sensitive state change.",
        lineNumber: block.startLine,
        fingerprint: `missing-authorization-${block.name.toLowerCase()}`,
      }),
    );
  }
}

function analyzeFunctionComplexity(functionBlocks, findings) {
  const complexFunctions = functionBlocks
    .filter((block) => block.complexity >= 10)
    .sort((first, second) => second.complexity - first.complexity);

  for (const block of complexFunctions.slice(0, 5)) {
    findings.push(
      createFinding({
        category: "Complexity",
        severity: block.complexity >= 16 ? "high" : "medium",
        issue: `High complexity in ${block.name}`,
        explanation: `${block.name} has an estimated cyclomatic complexity of ${block.complexity}. Complex functions are harder to test and maintain.`,
        suggestedFix:
          "Split the function into smaller focused helpers and simplify nested conditional logic.",
        lineNumber: block.startLine,
        fingerprint: `function-complexity-${block.name.toLowerCase()}`,
      }),
    );
  }
}

function analyzeLargeSource(lines, findings) {
  const nonEmptyLines = countNonEmptyLines(lines);

  if (nonEmptyLines < 500) {
    return;
  }

  findings.push(
    createFinding({
      category: "Complexity",
      severity: "low",
      issue: "Large source submission",
      explanation: `The submitted source contains ${nonEmptyLines} non-empty lines. Large files can become harder to review and maintain.`,
      suggestedFix:
        "Consider splitting unrelated responsibilities into focused modules.",
      lineNumber: null,
      confidence: "medium",
      fingerprint: "large-source-file",
    }),
  );
}

export function runStaticAnalysis({ code, selectedAnalysis = [] }) {
  const normalizedCode = String(code || "");

  const lines = getLines(normalizedCode);

  const findings = [];

  const enabledCategories = new Set(
    selectedAnalysis.filter((category) => SUPPORTED_CATEGORIES.has(category)),
  );

  const functionBlocks = getFunctionBlocks(lines);

  if (enabledCategories.has("Code Quality")) {
    analyzeLooseEquality(lines, findings);
    analyzeConsoleStatements(lines, findings);
    analyzeUnsafeFindIndexSplice(lines, findings);
    analyzeNumericValidation(lines, findings);
    analyzeMutableObjectReturns(lines, findings);
    analyzeAuthenticationFlow(functionBlocks, findings);
    analyzeRefundFlow(functionBlocks, findings);
  }

  if (enabledCategories.has("Security")) {
    analyzeSensitiveLogging(lines, findings);
    analyzePlainTextPasswords(lines, findings);
    analyzeDirectSensitiveReturns(lines, findings);
    analyzeAuthenticationFlow(functionBlocks, findings);
    analyzeRefundFlow(functionBlocks, findings);
    analyzeTransferFlow(functionBlocks, findings);
    analyzeAdminAuthorization(functionBlocks, findings);
  }

  let complexity = 1;

  if (enabledCategories.has("Complexity")) {
    const complexityResult = estimateComplexity(normalizedCode, lines);

    if (typeof complexityResult === "number") {
      complexity = complexityResult;
    } else {
      complexity = complexityResult.total;

      analyzeFunctionComplexity(complexityResult.functions, findings);
    }

    analyzeLargeSource(lines, findings);
  }

  return {
    findings,

    metrics: {
      linesOfCode: countNonEmptyLines(lines),
      complexity,
    },
  };
}
