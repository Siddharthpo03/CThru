function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getSourceLines(code) {
  return String(code || "")
    .replace(/\r/g, "")
    .split("\n");
}

function getLine(code, lineNumber) {
  const lines = getSourceLines(code);

  if (
    !Number.isInteger(lineNumber) ||
    lineNumber < 1 ||
    lineNumber > lines.length
  ) {
    return "";
  }

  return lines[lineNumber - 1] || "";
}

function getNearbySource(code, lineNumber, radius = 12) {
  const lines = getSourceLines(code);

  if (
    !Number.isInteger(lineNumber) ||
    lineNumber < 1 ||
    lineNumber > lines.length
  ) {
    return "";
  }

  const start = Math.max(0, lineNumber - 1 - radius);
  const end = Math.min(lines.length, lineNumber + radius);

  return lines.slice(start, end).join("\n");
}

function findOpeningBrace(lines, startIndex) {
  for (let index = startIndex; index < lines.length; index += 1) {
    const braceIndex = lines[index].indexOf("{");

    if (braceIndex !== -1) {
      return {
        lineIndex: index,
        characterIndex: braceIndex,
      };
    }

    if (index - startIndex > 8) {
      break;
    }
  }

  return null;
}

function extractBraceBlock(lines, openingBrace) {
  let depth = 0;
  let started = false;

  const block = [];

  for (
    let lineIndex = openingBrace.lineIndex;
    lineIndex < lines.length;
    lineIndex += 1
  ) {
    const line = lines[lineIndex];

    block.push(line);

    const startCharacter =
      lineIndex === openingBrace.lineIndex ? openingBrace.characterIndex : 0;

    for (
      let characterIndex = startCharacter;
      characterIndex < line.length;
      characterIndex += 1
    ) {
      const character = line[characterIndex];

      if (character === "{") {
        depth += 1;
        started = true;
      }

      if (character === "}") {
        depth -= 1;

        if (started && depth === 0) {
          return {
            source: block.join("\n"),
            startLine: openingBrace.lineIndex + 1,
            endLine: lineIndex + 1,
          };
        }
      }
    }
  }

  return null;
}

function extractFunctionBlocks(code) {
  const lines = getSourceLines(code);

  const blocks = [];

  const functionPatterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/,
    /\basync\s+function\s+([A-Za-z_$][\w$]*)\s*\(/,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    /\blet\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    /\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/,
    /\blet\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/,
    /\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/,
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

    const openingBrace = findOpeningBrace(lines, index);

    if (!openingBrace) {
      continue;
    }

    const block = extractBraceBlock(lines, openingBrace);

    if (!block) {
      continue;
    }

    blocks.push({
      name: functionName,
      source: block.source,
      startLine: index + 1,
      endLine: block.endLine,
    });
  }

  return blocks;
}

function extractReferencedFunctionName(finding, functionBlocks) {
  const text = normalizeText(
    `${finding.issue} ${finding.explanation} ${finding.suggestedFix}`,
  );

  const sortedBlocks = [...functionBlocks].sort(
    (first, second) => second.name.length - first.name.length,
  );

  for (const block of sortedBlocks) {
    if (text.includes(block.name.toLowerCase())) {
      return block.name;
    }
  }

  return null;
}

function getRelevantSource({ code, finding, functionBlocks }) {
  const functionName = extractReferencedFunctionName(finding, functionBlocks);

  if (functionName) {
    const functionBlock = functionBlocks.find(
      (block) => block.name === functionName,
    );

    if (functionBlock) {
      return {
        functionName,
        source: functionBlock.source,
        startLine: functionBlock.startLine,
        endLine: functionBlock.endLine,
      };
    }
  }

  const nearbySource = getNearbySource(code, finding.lineNumber, 15);

  return {
    functionName: null,
    source: nearbySource,
    startLine: finding.lineNumber ? Math.max(1, finding.lineNumber - 15) : null,
    endLine: finding.lineNumber ? finding.lineNumber + 15 : null,
  };
}

function hasAdminAuthorization(source) {
  const normalized = normalizeText(source);

  const patterns = [
    /role\s*!==\s*["']admin["']/,
    /role\s*===\s*["']admin["']/,
    /role\s*!=\s*["']admin["']/,
    /role\s*==\s*["']admin["']/,
    /isadmin\s*\(/,
    /requireadmin\s*\(/,
    /checkadmin\s*\(/,
    /authorizeadmin\s*\(/,
    /adminonly\s*\(/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

function hasExistenceValidation(source, identifiers = []) {
  const normalized = normalizeText(source);

  for (const identifier of identifiers) {
    const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const patterns = [
      new RegExp(`if\\s*\\(\\s*!${escaped}\\s*\\)`),
      new RegExp(`if\\s*\\(\\s*${escaped}\\s*===\\s*(?:undefined|null)\\s*\\)`),
      new RegExp(`if\\s*\\(\\s*${escaped}\\s*==\\s*(?:undefined|null)\\s*\\)`),
      new RegExp(`${escaped}\\?\\.`),
    ];

    if (patterns.some((pattern) => pattern.test(normalized))) {
      return true;
    }
  }

  return false;
}

function hasPositiveFiniteValidation(source) {
  const normalized = normalizeText(source);

  const hasFiniteCheck =
    /number\.isfinite\s*\(/.test(normalized) ||
    /isfinite\s*\(/.test(normalized);

  const hasPositiveCheck =
    /amount\s*<=\s*0/.test(normalized) ||
    /amount\s*>\s*0/.test(normalized) ||
    /amount\s*<\s*1/.test(normalized) ||
    /quantity\s*<=\s*0/.test(normalized) ||
    /quantity\s*>\s*0/.test(normalized) ||
    /quantity\s*<\s*1/.test(normalized);

  return hasFiniteCheck && hasPositiveCheck;
}

function hasRefundStateValidation(source) {
  const normalized = normalizeText(source);

  const checksRefunded =
    /status\s*===\s*["']refunded["']/.test(normalized) ||
    /status\s*!==\s*["']completed["']/.test(normalized) ||
    /status\s*!=\s*["']completed["']/.test(normalized);

  const setsRefunded = /status\s*=\s*["']refunded["']/.test(normalized);

  return checksRefunded && setsRefunded;
}

function hasCompletedOrderValidation(source) {
  const normalized = normalizeText(source);

  return (
    /status\s*!==\s*["']completed["']/.test(normalized) ||
    /status\s*!=\s*["']completed["']/.test(normalized) ||
    /status\s*===\s*["']completed["']/.test(normalized)
  );
}

function hasSafeAverageCalculation(source) {
  const normalized = normalizeText(source);

  const patterns = [
    /completedorders\s*>\s*0\s*\?/,
    /completedorders\s*===\s*0/,
    /completedorders\s*==\s*0/,
    /if\s*\(\s*completedorders\s*>\s*0\s*\)/,
    /if\s*\(\s*!completedorders\s*\)/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

function hasFindLookup(source) {
  const normalized = normalizeText(source);

  return /\.find\s*\(/.test(normalized);
}

function hasMapLookup(source) {
  const normalized = normalizeText(source);

  return /new\s+map\s*\(/.test(normalized) || /\.get\s*\(/.test(normalized);
}

function hasSinglePassMaximum(source) {
  const normalized = normalizeText(source);

  const loopCount =
    (normalized.match(/\bfor\s*\(/g) || []).length +
    (normalized.match(/\bfor\s+of\b/g) || []).length +
    (normalized.match(/\.foreach\s*\(/g) || []).length;

  return loopCount <= 1;
}

function containsPasswordProjection(source) {
  const normalized = normalizeText(source);

  const passwordReturnPatterns = [
    /return\s+user\s*;/,
    /return\s+users\s*;/,
    /json\.stringify\s*\(\s*users\s*\)/,
    /password\s*:\s*user\.password/,
    /password\s*:\s*[a-z_$][\w$]*\.password/,
  ];

  return passwordReturnPatterns.some((pattern) => pattern.test(normalized));
}

function hasPasswordExclusion(source) {
  const normalized = normalizeText(source);

  const patterns = [
    /\{\s*password\s*,\s*\.\.\./,
    /\{\s*password\s*:\s*[_a-z]/,
    /delete\s+[a-z_$][\w$]*\.password/,
    /password\s*:\s*undefined/,
  ];

  return patterns.some((pattern) => pattern.test(normalized));
}

function logsPassword(source) {
  const normalized = normalizeText(source);

  return (
    /console\.(log|info|warn|error)\s*\([^)]*password/.test(normalized) ||
    /console\.(log|info|warn|error)\s*\([^)]*newpassword/.test(normalized)
  );
}

function usesPlainTextPasswordStorage(source) {
  const normalized = normalizeText(source);

  const assignsPassword =
    /password\s*:\s*["'][^"']+["']/.test(normalized) ||
    /\.password\s*=\s*newpassword/.test(normalized) ||
    /password\s*:\s*password/.test(normalized);

  const hashesPassword =
    /bcrypt/.test(normalized) ||
    /argon2/.test(normalized) ||
    /scrypt/.test(normalized) ||
    /pbkdf2/.test(normalized) ||
    /hashpassword\s*\(/.test(normalized);

  return assignsPassword && !hashesPassword;
}

function hasAuthenticationFailureValidation(source) {
  const normalized = normalizeText(source);

  const hasLookup =
    /\.find\s*\(/.test(normalized) || /founduser/.test(normalized);

  const hasMissingUserCheck =
    /if\s*\(\s*!founduser\s*\)/.test(normalized) ||
    /if\s*\(\s*!user\s*\)/.test(normalized) ||
    /founduser\s*\?\s*\{/.test(normalized);

  const successDependsOnUser =
    /success\s*:\s*!!founduser/.test(normalized) ||
    /success\s*:\s*boolean\s*\(\s*founduser\s*\)/.test(normalized);

  return hasLookup && (hasMissingUserCheck || successDependsOnUser);
}

function hasTransferFundsValidation(source) {
  const normalized = normalizeText(source);

  const validatesAmount = hasPositiveFiniteValidation(source);

  const validatesSender =
    /if\s*\(\s*!sender\s*\)/.test(normalized) ||
    /if\s*\(\s*!fromuser\s*\)/.test(normalized);

  const validatesReceiver =
    /if\s*\(\s*!receiver\s*\)/.test(normalized) ||
    /if\s*\(\s*!touser\s*\)/.test(normalized);

  const validatesBalance =
    /balance\s*<\s*amount/.test(normalized) ||
    /amount\s*>\s*[a-z_$][\w$]*\.balance/.test(normalized);

  return (
    validatesAmount && validatesSender && validatesReceiver && validatesBalance
  );
}

function findingClaimsMissingAuthorization(text) {
  return (
    text.includes("missing authorization") ||
    text.includes("unrestricted administrative") ||
    text.includes("unrestricted role") ||
    text.includes("administrative action bypass") ||
    text.includes("authorization bypass") ||
    (text.includes("does not verify if") && text.includes("admin"))
  );
}

function findingClaimsRepeatedRefund(text) {
  return (
    text.includes("repeated refund") ||
    text.includes("refund allows stock") ||
    text.includes("refund allows balance") ||
    text.includes("already been refunded") ||
    text.includes("refund abuse")
  );
}

function findingClaimsNegativeTransfer(text) {
  return (
    text.includes("negative transfer") ||
    (text.includes("negative amount") && text.includes("balance"))
  );
}

function findingClaimsUnsafeLookup(text) {
  return (
    text.includes("unsafe lookup") ||
    text.includes("unchecked lookup") ||
    text.includes("missing user") ||
    text.includes("order exists") ||
    text.includes("lookup returns") ||
    (text.includes("undefined") && text.includes("crash"))
  );
}

function findingClaimsDivisionByZero(text) {
  return (
    text.includes("division by zero") ||
    text.includes("results in nan") ||
    text.includes("zero denominator")
  );
}

function findingClaimsNestedLookupComplexity(text) {
  return (
    text.includes("o(n*m)") ||
    text.includes("o(n^2)") ||
    text.includes("nested loop") ||
    text.includes("nested scan") ||
    text.includes("repeated full-array scan")
  );
}

function findingClaimsPasswordExposure(text) {
  return (
    text.includes("password exposure") ||
    text.includes("credential exposure") ||
    text.includes("password data returned") ||
    text.includes("sensitive credential exposure") ||
    text.includes("includes the plain-text password") ||
    text.includes("returns the entire users array")
  );
}

function findingClaimsPasswordLogging(text) {
  return (
    text.includes("password") &&
    (text.includes("logged") ||
      text.includes("logs") ||
      text.includes("console"))
  );
}

function findingClaimsPlainTextPasswordStorage(text) {
  return (
    text.includes("plain-text password") ||
    text.includes("plaintext password") ||
    text.includes("password appears to be stored") ||
    text.includes("password stored in plain text")
  );
}

function findingClaimsAuthenticationBypass(text) {
  return (
    text.includes("authentication bypass") ||
    text.includes("invalid credentials") ||
    text.includes("login returns success") ||
    text.includes("authentication reports success")
  );
}

function findingClaimsInefficientMaximum(text) {
  return (
    text.includes("most expensive product") ||
    text.includes("finding maximum") ||
    text.includes("maximum price")
  );
}

function findingClaimsInefficientProductLookup(text) {
  return (
    text.includes("cart total") ||
    text.includes("product lookup") ||
    text.includes("stock checking") ||
    text.includes("order processing")
  );
}

function verifyFindingAgainstSource({ finding, relevantSource, fullCode }) {
  const text = normalizeText(
    `${finding.issue} ${finding.explanation} ${finding.suggestedFix}`,
  );

  const source = relevantSource.source || "";

  if (findingClaimsAuthenticationBypass(text)) {
    if (hasAuthenticationFailureValidation(source)) {
      return {
        accepted: false,
        reason:
          "Authentication failure is already explicitly validated in the referenced function.",
      };
    }
  }

  if (findingClaimsMissingAuthorization(text)) {
    if (hasAdminAuthorization(source)) {
      return {
        accepted: false,
        reason:
          "The referenced function contains an explicit administrator authorization check.",
      };
    }
  }

  if (findingClaimsRepeatedRefund(text)) {
    if (
      hasRefundStateValidation(source) &&
      hasCompletedOrderValidation(source)
    ) {
      return {
        accepted: false,
        reason:
          "The refund function validates order state and prevents repeated refund processing.",
      };
    }
  }

  if (findingClaimsNegativeTransfer(text)) {
    if (hasTransferFundsValidation(source)) {
      return {
        accepted: false,
        reason:
          "The transfer function validates positive finite amounts, users, and available balance.",
      };
    }

    if (hasPositiveFiniteValidation(source)) {
      return {
        accepted: false,
        reason:
          "The referenced function explicitly rejects non-finite and non-positive amounts.",
      };
    }
  }

  if (findingClaimsDivisionByZero(text)) {
    if (hasSafeAverageCalculation(source)) {
      return {
        accepted: false,
        reason:
          "The referenced calculation explicitly handles a zero denominator.",
      };
    }
  }

  if (findingClaimsInefficientMaximum(text)) {
    if (hasSinglePassMaximum(source)) {
      return {
        accepted: false,
        reason: "The referenced maximum search uses at most one traversal.",
      };
    }
  }

  if (findingClaimsInefficientProductLookup(text)) {
    if (hasMapLookup(source)) {
      return {
        accepted: false,
        reason:
          "The referenced function uses Map-based lookup instead of repeated product scans.",
      };
    }
  }

  if (findingClaimsPasswordLogging(text)) {
    if (!logsPassword(source)) {
      return {
        accepted: false,
        reason: "The referenced source does not log password data.",
      };
    }
  }

  if (findingClaimsPasswordExposure(text)) {
    if (hasPasswordExclusion(source) || !containsPasswordProjection(source)) {
      return {
        accepted: false,
        reason:
          "The referenced function does not directly expose password data.",
      };
    }
  }

  if (findingClaimsPlainTextPasswordStorage(text)) {
    if (!usesPlainTextPasswordStorage(fullCode)) {
      return {
        accepted: false,
        reason:
          "The submitted source does not demonstrate plain-text password storage.",
      };
    }
  }

  if (findingClaimsUnsafeLookup(text)) {
    const normalizedSource = normalizeText(source);

    const identifiers = [
      "user",
      "order",
      "product",
      "sender",
      "receiver",
      "targetUser",
      "requestingUser",
      "foundUser",
    ].filter((identifier) =>
      normalizedSource.includes(identifier.toLowerCase()),
    );

    if (identifiers.length > 0 && hasExistenceValidation(source, identifiers)) {
      return {
        accepted: false,
        reason:
          "The referenced lookup result is explicitly checked before dependent access.",
      };
    }
  }

  return {
    accepted: true,
    reason: null,
  };
}

export function verifyAIFindings({ findings, code }) {
  if (!Array.isArray(findings)) {
    return {
      findings: [],
      rejectedFindings: [],
    };
  }

  const functionBlocks = extractFunctionBlocks(code);

  const acceptedFindings = [];

  const rejectedFindings = [];

  for (const finding of findings) {
    const relevantSource = getRelevantSource({
      code,
      finding,
      functionBlocks,
    });

    const verification = verifyFindingAgainstSource({
      finding,
      relevantSource,
      fullCode: code,
    });

    if (!verification.accepted) {
      rejectedFindings.push({
        ...finding,
        verificationReason: verification.reason,
        referencedFunction: relevantSource.functionName,
      });

      console.warn(`CThru verifier rejected AI finding: ${finding.issue}`);

      console.warn(`Reason: ${verification.reason}`);

      if (relevantSource.functionName) {
        console.warn(`Referenced function: ${relevantSource.functionName}`);
      }

      continue;
    }

    acceptedFindings.push(finding);
  }

  return {
    findings: acceptedFindings,
    rejectedFindings,
  };
}
