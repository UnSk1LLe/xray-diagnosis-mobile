import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatStatusLabel(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(dateString) {
  if (!dateString) {
    return "Unknown date";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function renderTextList(items) {
  const safeItems = normalizeItems(items);
  if (safeItems.length === 0) {
    return "<p class=\"empty\">No items available.</p>";
  }

  return `
    <ul class="list">
      ${safeItems
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}
    </ul>
  `;
}

function renderWarnings(imageQuality) {
  const warnings = normalizeItems(imageQuality?.warnings);
  if (warnings.length === 0) {
    return "<p class=\"empty\">No image quality warnings were reported.</p>";
  }

  return `
    <ul class="list">
      ${warnings
        .map((warning) => `<li>${escapeHtml(warning)}</li>`)
        .join("")}
    </ul>
  `;
}

function renderFindings(report) {
  const structuredFindings =
    normalizeItems(report?.structuredFindings).length > 0
      ? normalizeItems(report.structuredFindings)
      : normalizeItems(report?.topFindings);

  if (structuredFindings.length > 0) {
    return structuredFindings
      .map((finding) => {
        if (typeof finding === "string") {
          return `
            <div class="card-item">
              <p>${escapeHtml(finding)}</p>
            </div>
          `;
        }

        const probability = Math.round((Number(finding?.probability) || 0) * 100);
        return `
          <div class="card-item">
            <h3>${escapeHtml(finding?.findingName || "Finding")}</h3>
            <p><strong>Probability:</strong> ${probability}%</p>
            <p><strong>Risk level:</strong> ${escapeHtml(finding?.riskLevel || "Unknown")}</p>
            <p>${escapeHtml(finding?.interpretation || "")}</p>
          </div>
        `;
      })
      .join("");
  }

  const findings = normalizeItems(report?.findings);
  if (findings.length === 0) {
    return '<p class="empty">No key findings above the current display threshold.</p>';
  }

  return renderTextList(findings);
}

function renderRecommendations(report) {
  const structuredRecommendations = normalizeItems(report?.structuredRecommendations);
  if (structuredRecommendations.length > 0) {
    return structuredRecommendations
      .map((recommendation) => {
        if (typeof recommendation === "string") {
          return `
            <div class="card-item">
              <p>${escapeHtml(recommendation)}</p>
            </div>
          `;
        }

        return `
          <div class="card-item">
            <h3>${escapeHtml(recommendation?.title || "Recommendation")}</h3>
            ${
              recommendation?.urgency
                ? `<p><strong>Urgency:</strong> ${escapeHtml(recommendation.urgency)}</p>`
                : ""
            }
            <p>${escapeHtml(recommendation?.text || "")}</p>
          </div>
        `;
      })
      .join("");
  }

  return renderTextList(report?.recommendations);
}

function buildReportHtml(report) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: #0f172a;
            padding: 32px 28px 40px;
            line-height: 1.5;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          h1 {
            margin: 0 0 8px;
            color: #0f172a;
            font-size: 28px;
          }
          h2 {
            margin: 0 0 12px;
            color: #1d4ed8;
            font-size: 18px;
          }
          h3 {
            margin: 0 0 8px;
            font-size: 15px;
            color: #0f172a;
          }
          p {
            margin: 0 0 8px;
          }
          .section {
            margin-bottom: 20px;
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            background: #f8fafc;
          }
          .meta-grid {
            width: 100%;
            border-collapse: collapse;
          }
          .meta-grid td {
            padding: 8px 0;
            vertical-align: top;
            border-bottom: 1px solid #e2e8f0;
          }
          .meta-grid td:first-child {
            width: 36%;
            color: #475569;
            font-weight: 600;
            padding-right: 16px;
          }
          .meta-grid tr:last-child td {
            border-bottom: 0;
          }
          .card-item {
            border: 1px solid #dbeafe;
            background: #ffffff;
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 10px;
          }
          .card-item:last-child {
            margin-bottom: 0;
          }
          .list {
            margin: 0;
            padding-left: 20px;
          }
          .list li {
            margin-bottom: 8px;
          }
          .empty {
            color: #64748b;
            font-style: italic;
          }
          .footer {
            margin-top: 24px;
            padding: 16px;
            border-radius: 12px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HealthScan X-Ray Report</h1>
          <p>Generated on ${escapeHtml(formatDate(new Date().toISOString()))}</p>
        </div>

        <div class="section">
          <h2>Overview</h2>
          <table class="meta-grid">
            <tr>
              <td>Report ID</td>
              <td>${escapeHtml(report?.id || "")}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>${escapeHtml(formatDate(report?.date))}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>${escapeHtml(formatStatusLabel(report?.status))}</td>
            </tr>
            <tr>
              <td>Confidence</td>
              <td>${report?.confidence ? `${escapeHtml(report.confidence)}%` : "Not available"}</td>
            </tr>
            <tr>
              <td>Review outcome</td>
              <td>${escapeHtml(report?.reviewOutcome || "Pending doctor review")}</td>
            </tr>
            <tr>
              <td>Reviewed at</td>
              <td>${escapeHtml(report?.reviewedAt ? formatDate(report.reviewedAt) : "Not reviewed yet")}</td>
            </tr>
            <tr>
              <td>Model</td>
              <td>${escapeHtml(report?.modelName || "Unknown")}</td>
            </tr>
            <tr>
              <td>Model version</td>
              <td>${escapeHtml(report?.modelVersion || "Unknown")}</td>
            </tr>
          </table>
        </div>

        ${
          report?.aiAnalysis
            ? `
              <div class="section">
                <h2>AI Analysis</h2>
                <p>${escapeHtml(report.aiAnalysis)}</p>
              </div>
            `
            : ""
        }

        ${
          report?.summary
            ? `
              <div class="section">
                <h2>Summary</h2>
                <p>${escapeHtml(report.summary)}</p>
              </div>
            `
            : ""
        }

        <div class="section">
          <h2>Key Findings</h2>
          ${renderFindings(report)}
        </div>

        <div class="section">
          <h2>Recommendations</h2>
          ${renderRecommendations(report)}
        </div>

        <div class="section">
          <h2>Doctor Review</h2>
          <p><strong>Status:</strong> ${escapeHtml(formatStatusLabel(report?.status))}</p>
          <p><strong>Outcome:</strong> ${escapeHtml(report?.reviewOutcome || "Pending doctor review")}</p>
          <p><strong>Doctor comment:</strong> ${escapeHtml(report?.doctorComment || "No doctor comment yet.")}</p>
        </div>

        ${
          report?.imageQuality
            ? `
              <div class="section">
                <h2>Image Quality</h2>
                <p><strong>Type:</strong> ${escapeHtml(report.imageQuality.imageType || "Unknown")}</p>
                <p><strong>Quality:</strong> ${escapeHtml(report.imageQuality.qualityStatus || "Unknown")}</p>
                ${renderWarnings(report.imageQuality)}
              </div>
            `
            : ""
        }

        ${
          normalizeItems(report?.limitations).length > 0
            ? `
              <div class="section">
                <h2>Limitations</h2>
                ${renderTextList(report.limitations)}
              </div>
            `
            : ""
        }

        <div class="footer">
          <strong>Important disclaimer.</strong>
          <p>
            ${escapeHtml(
              report?.disclaimer ||
                "This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult a qualified healthcare provider for diagnosis and treatment.",
            )}
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function exportReportToPdf(report) {
  if (!report) {
    throw new Error("Report data is required to generate a PDF.");
  }

  const html = buildReportHtml(report);
  const fileNameSuffix = String(report.id || "report").replace(/[^a-zA-Z0-9_-]/g, "-");
  const pdf = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(pdf.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Export report ${fileNameSuffix}.pdf`,
      UTI: "com.adobe.pdf",
    });
  }

  return {
    uri: pdf.uri,
    shared: isSharingAvailable,
  };
}
