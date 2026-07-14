import prisma from "../utils/prisma.js";

import { runAIAnalysis } from "../services/aiAnalysis.service.js";

import { runAICorrection } from "../services/aiCorrection.service.js";

import { mergeFindings } from "../services/findingMerger.service.js";

import { calculateReviewScores } from "../services/scoring.service.js";

import { runStaticAnalysis } from "../services/staticAnalysis.service.js";

function createFindingMetadata(findings) {
  return findings.map((finding) => ({
    occurrenceCount: finding.occurrenceCount || 1,

    lineNumbers: finding.lineNumbers || [],

    sources: finding.sources || [],
  }));
}

function attachFindingMetadata(findings, metadata = []) {
  return findings.map((finding, index) => ({
    ...finding,

    occurrenceCount: metadata[index]?.occurrenceCount || 1,

    lineNumbers:
      metadata[index]?.lineNumbers ||
      (finding.lineNumber ? [finding.lineNumber] : []),

    sources: metadata[index]?.sources || [],
  }));
}

function parseReviewMetadata(review) {
  try {
    return JSON.parse(review.summary || "{}");
  } catch {
    return {};
  }
}

function createMetrics({
  code,
  staticAnalysis,
  aiAnalysis,
  findings,
  categoryScores,
}) {
  const physicalLines = code.split("\n").length;

  const codeLines = staticAnalysis.metrics.linesOfCode || 0;

  const blankLines = Math.max(0, physicalLines - codeLines);

  const rawDetectionCount =
    staticAnalysis.findings.length + aiAnalysis.findings.length;

  const uniqueIssueCount = findings.length;

  const mergedDetectionCount = Math.max(
    0,
    rawDetectionCount - uniqueIssueCount,
  );

  return {
    ...staticAnalysis.metrics,

    physicalLines,

    codeLines,

    blankLines,

    issueCount: uniqueIssueCount,

    uniqueIssueCount,

    rawDetectionCount,

    mergedDetectionCount,

    staticIssueCount: staticAnalysis.findings.length,

    aiIssueCount: aiAnalysis.findings.length,

    aiRejectedFindingCount: aiAnalysis.rejectedFindingCount || 0,

    categoryScores,
  };
}

function formatReview(review) {
  const metadata = parseReviewMetadata(review);

  return {
    ...review,

    findings: attachFindingMetadata(
      review.findings,
      metadata.findingMetadata || [],
    ),

    aiSummary: metadata.aiSummary || null,

    aiStatus: metadata.aiStatus || "unknown",

    aiModel: metadata.aiModel || null,

    analysisStrategy: metadata.analysisStrategy || null,

    selectedAnalysis:
      metadata.selectedAnalysis ||
      review.reviewType?.split(",").filter(Boolean) ||
      [],

    metrics: metadata.metrics || null,
  };
}

export async function createReview(req, res) {
  try {
    const { title, language, code, fileName, selectedAnalysis } = req.body;

    if (typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({
        success: false,

        message: "Source code is required.",
      });
    }

    if (!Array.isArray(selectedAnalysis) || selectedAnalysis.length === 0) {
      return res.status(400).json({
        success: false,

        message: "Select at least one analysis category.",
      });
    }

    console.log("\n========== CTHRU REVIEW ==========");

    console.log("Title:", title);

    console.log("Language:", language);

    console.log("Physical lines:", code.split("\n").length);

    console.log("Characters:", code.length);

    console.log("==================================\n");

    const staticAnalysis = runStaticAnalysis({
      code,

      language,

      selectedAnalysis,
    });

    let aiAnalysis = {
      summary: "AI analysis was unavailable for this review.",

      findings: [],

      model: null,

      analysisStrategy: null,

      rejectedFindingCount: 0,

      rejectedFindings: [],
    };

    let aiStatus = "completed";

    try {
      aiAnalysis = await runAIAnalysis({
        code,

        language,

        selectedAnalysis,

        staticFindings: staticAnalysis.findings,
      });
    } catch (error) {
      aiStatus = "failed";

      console.error("Gemini AI analysis failed:", error);
    }

    const findings = mergeFindings(
      staticAnalysis.findings,

      aiAnalysis.findings,
    );

    const { overallScore, categoryScores } = calculateReviewScores({
      findings,

      selectedAnalysis,
    });

    const metrics = createMetrics({
      code,

      staticAnalysis,

      aiAnalysis,

      findings,

      categoryScores,
    });

    const findingMetadata = createFindingMetadata(findings);

    console.log("\n========== ANALYSIS RESULT ==========");

    console.log("Static detections:", metrics.staticIssueCount);

    console.log("Verified AI detections:", metrics.aiIssueCount);

    console.log("Rejected AI hallucinations:", metrics.aiRejectedFindingCount);

    console.log("Raw accepted detections:", metrics.rawDetectionCount);

    console.log("Unique findings:", metrics.uniqueIssueCount);

    console.log("Merged detections:", metrics.mergedDetectionCount);

    console.log("Security score:", categoryScores.Security);

    console.log("Code Quality score:", categoryScores["Code Quality"]);

    console.log("Complexity score:", categoryScores.Complexity);

    console.log("Overall score:", overallScore);

    console.log("=====================================\n");

    const review = await prisma.review.create({
      data: {
        userId: req.userId,

        title,

        language,

        sourceCode: code,

        reviewType: selectedAnalysis.join(","),

        overallScore,

        summary: JSON.stringify({
          aiSummary: aiAnalysis.summary,

          aiStatus,

          aiModel: aiAnalysis.model || null,

          analysisStrategy: aiAnalysis.analysisStrategy || null,

          selectedAnalysis,

          metrics,

          findingMetadata,
        }),

        findings: {
          create: findings.map((finding) => ({
            category: finding.category,

            severity: finding.severity,

            issue: finding.issue,

            explanation: finding.explanation,

            suggestedFix: finding.suggestedFix || null,

            fileName: fileName || null,

            lineNumber: finding.lineNumber ?? null,
          })),
        },
      },

      include: {
        findings: true,
      },
    });

    return res.status(201).json({
      success: true,

      message:
        aiStatus === "completed"
          ? "Static and source-verified AI analysis completed successfully."
          : "Static analysis completed. Gemini AI analysis was unavailable.",

      review: {
        ...review,

        findings: attachFindingMetadata(
          review.findings,

          findingMetadata,
        ),

        aiSummary: aiAnalysis.summary,

        aiStatus,

        aiModel: aiAnalysis.model || null,

        analysisStrategy: aiAnalysis.analysisStrategy || null,

        selectedAnalysis,

        metrics,
      },
    });
  } catch (error) {
    console.error("Create review failed:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to create review.",
    });
  }
}

export async function getReviews(req, res) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        userId: req.userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        findings: true,
      },
    });

    return res.status(200).json({
      success: true,

      reviews: reviews.map(formatReview),
    });
  } catch (error) {
    console.error("Get reviews failed:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load reviews.",
    });
  }
}

export async function getReview(req, res) {
  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,

        userId: req.userId,
      },

      include: {
        findings: true,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,

        message: "Review not found.",
      });
    }

    return res.status(200).json({
      success: true,

      review: formatReview(review),
    });
  } catch (error) {
    console.error("Get review failed:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load review.",
    });
  }
}

export async function autoCorrectReview(req, res) {
  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,

        userId: req.userId,
      },

      include: {
        findings: true,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,

        message: "Review not found.",
      });
    }

    if (review.findings.length === 0) {
      return res.status(400).json({
        success: false,

        message: "No detected findings are available to correct.",
      });
    }

    const metadata = parseReviewMetadata(review);

    const findings = attachFindingMetadata(
      review.findings,

      metadata.findingMetadata || [],
    );

    const correction = await runAICorrection({
      code: review.sourceCode,

      language: review.language,

      findings: findings.map((finding) => ({
        category: finding.category,

        severity: finding.severity,

        issue: finding.issue,

        explanation: finding.explanation,

        suggestedFix: finding.suggestedFix,

        lineNumber: finding.lineNumber,

        lineNumbers: finding.lineNumbers,

        occurrenceCount: finding.occurrenceCount,
      })),
    });

    return res.status(200).json({
      success: true,

      message: "AI correction completed successfully.",

      correction,
    });
  } catch (error) {
    console.error("Gemini auto correction failed:", error);

    return res.status(503).json({
      success: false,

      message: "AI correction is temporarily unavailable. Please try again.",
    });
  }
}

export async function deleteReview(req, res) {
  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,

        userId: req.userId,
      },

      select: {
        id: true,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,

        message: "Review not found.",
      });
    }

    await prisma.review.delete({
      where: {
        id: review.id,
      },
    });

    return res.status(200).json({
      success: true,

      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete review failed:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to delete review.",
    });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        userId: req.userId,
      },

      select: {
        overallScore: true,

        createdAt: true,

        findings: {
          select: {
            severity: true,

            category: true,
          },
        },
      },
    });

    const totalReviews = reviews.length;

    const passedReviews = reviews.filter(
      (review) => (review.overallScore || 0) >= 80,
    ).length;

    const issuesFound = reviews.reduce(
      (total, review) => total + review.findings.length,

      0,
    );

    const securityWarnings = reviews.reduce(
      (total, review) =>
        total +
        review.findings.filter((finding) => finding.category === "Security")
          .length,

      0,
    );

    const sevenDaysAgo = new Date();

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reviewsThisWeek = reviews.filter(
      (review) => review.createdAt >= sevenDaysAgo,
    ).length;

    return res.status(200).json({
      success: true,

      stats: {
        totalReviews,

        passedReviews,

        issuesFound,

        securityWarnings,

        reviewsThisWeek,

        successRate:
          totalReviews === 0
            ? 0
            : Math.round((passedReviews / totalReviews) * 100),
      },
    });
  } catch (error) {
    console.error("Dashboard stats failed:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to load dashboard statistics.",
    });
  }
}
