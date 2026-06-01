import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle,
  Share2,
  Download,
} from "lucide-react-native";
import { asString, getReport } from "@/utils/backendApi";
import { exportReportToPdf } from "@/utils/reportPdf";
import SafeImage from "@/components/SafeImage";
import { useAppTheme } from "@/utils/theme";

function getStatusStyle(status) {
  if (status === "REVIEWED") {
    return {
      background: "#f0fdf4",
      border: "#bbf7d0",
      text: "#16a34a",
      icon: "normal",
    };
  }

  if (status === "PROCESSING") {
    return {
      background: "#fef3c7",
      border: "#fde68a",
      text: "#d97706",
      icon: "processing",
    };
  }

  return {
    background: "#eff6ff",
    border: "#bfdbfe",
    text: "#2563eb",
    icon: "alert",
  };
}

function formatStatusLabel(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ReportResult() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportId = asString(params.reportId);
  const { colors, statusBarStyle } = useAppTheme();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadReport = useCallback(
    async ({ isRefresh = false } = {}) => {
      if (!reportId) {
        router.back();
        return;
      }

      try {
        const reportData = await getReport(reportId);
        if (!isMountedRef.current) {
          return;
        }

        setReport(reportData);
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to load report",
        );
        if (!isRefresh) {
          router.back();
        }
      } finally {
        if (isMountedRef.current && !isRefresh) {
          setLoading(false);
        }
      }
    },
    [reportId, router],
  );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const refreshReport = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      await loadReport({ isRefresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const shareReport = async () => {
    if (!report) {
      return;
    }

    try {
      const findings = report.findings.map((item) => `- ${item}`).join("\n");
      const recommendations = report.recommendations
        .map((item) => `- ${item}`)
        .join("\n");

      const shareContent = [
        "HealthScan X-Ray Report",
        "",
        `Date: ${formatDate(report.date)}`,
        `Status: ${formatStatusLabel(report.status)}`,
        report.confidence ? `Confidence: ${report.confidence}%` : null,
        "",
        findings ? `Findings:\n${findings}` : null,
        recommendations ? `Recommendations:\n${recommendations}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await Share.share({
        message: shareContent,
        title: "HealthScan X-Ray Report",
      });
    } catch {
      Alert.alert("Error", "Failed to share report");
    }
  };

  const downloadReport = async () => {
    if (!report || isExportingPdf) {
      return;
    }

    try {
      setIsExportingPdf(true);
      const pdfResult = await exportReportToPdf(report);

      if (!pdfResult.shared) {
        Alert.alert("PDF generated", `Saved to temporary file:\n${pdfResult.uri}`);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to generate PDF report",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text style={{ fontSize: 16, color: colors.mutedText }}>
          Loading report...
        </Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text style={{ fontSize: 16, color: colors.mutedText }}>Report not found</Text>
      </View>
    );
  }

  const statusStyle = getStatusStyle(report.status);
  const displayedFindings =
    report.structuredFindings.length > 0
      ? report.structuredFindings
      : report.topFindings;
  const displayedRecommendations =
    report.structuredRecommendations.length > 0
      ? report.structuredRecommendations
      : report.recommendations.map((text, index) => ({
          findingCode: `recommendation-${index}`,
          title: "Recommendation",
          text,
          urgency: "",
        }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshReport}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.elevatedSurface,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              X-Ray Analysis
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.elevatedSurface,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={shareReport}
            >
              <Share2 size={18} color={colors.mutedText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.elevatedSurface,
                justifyContent: "center",
                alignItems: "center",
                opacity: isExportingPdf ? 0.5 : 1,
              }}
              onPress={downloadReport}
              disabled={isExportingPdf}
            >
              <Download size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            backgroundColor: statusStyle.background,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: statusStyle.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {statusStyle.icon === "normal" ? (
              <CheckCircle size={24} color={statusStyle.text} />
            ) : statusStyle.icon === "processing" ? (
              <Activity size={24} color={statusStyle.text} />
            ) : (
              <AlertTriangle size={24} color={statusStyle.text} />
            )}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: statusStyle.text,
                marginLeft: 12,
              }}
            >
              {formatStatusLabel(report.status)}
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Calendar size={16} color={colors.mutedText} />
              <Text style={{ fontSize: 14, color: colors.mutedText }}>
                {formatDate(report.date)}
              </Text>
            </View>
            {report.confidence ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Activity size={16} color={colors.mutedText} />
                <Text style={{ fontSize: 14, color: colors.mutedText }}>
                  Confidence: {report.confidence}%
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {report.imageUrl ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              X-Ray Image
            </Text>
            <View
              style={{
                backgroundColor: colors.mutedSurface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.subtleBorder,
              }}
            >
              <SafeImage
                uri={report.imageUrl}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                }}
              />
            </View>
          </View>
        ) : null}

        {report.aiAnalysis ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              AI Analysis
            </Text>
            <View
              style={{
                backgroundColor: colors.mutedSurface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.subtleBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  lineHeight: 24,
                }}
              >
                {report.aiAnalysis}
              </Text>
            </View>
          </View>
        ) : null}

        {report.summary ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Summary
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.text,
                  lineHeight: 24,
                }}
              >
                {report.summary}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Doctor Review
          </Text>
          <View
            style={{
              backgroundColor: statusStyle.background,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: statusStyle.border,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.text }}>
              Report status: {formatStatusLabel(report.status)}
            </Text>
            <Text style={{ fontSize: 15, color: colors.text }}>
              Review outcome: {report.reviewOutcome || "Pending doctor review"}
            </Text>
            <Text style={{ fontSize: 15, color: colors.text }}>
              Reviewed at:{" "}
              {report.reviewedAt ? formatDate(report.reviewedAt) : "Not reviewed yet"}
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.text,
                lineHeight: 22,
              }}
            >
              Doctor comment: {report.doctorComment || "No doctor comment yet."}
            </Text>
            {report.reviewOutcome === "CORRECTED" ? (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.primary,
                  lineHeight: 20,
                }}
              >
                The effective findings shown below were corrected by a doctor and
                override the original AI-generated result.
              </Text>
            ) : null}
          </View>
        </View>

        {report.imageQuality ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Image Quality
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 15, color: colors.text }}>
                Type: {report.imageQuality.imageType || "Unknown"}
              </Text>
              <Text style={{ fontSize: 15, color: colors.text }}>
                Quality: {report.imageQuality.qualityStatus || "Unknown"}
              </Text>
              {Array.isArray(report.imageQuality.warnings) &&
              report.imageQuality.warnings.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {report.imageQuality.warnings.map((warning, index) => (
                    <Text
                      key={`${warning}-${index}`}
                      style={{
                        fontSize: 14,
                        color: colors.warning,
                        lineHeight: 20,
                      }}
                    >
                      - {warning}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 14, color: colors.mutedText }}>
                  No image quality warnings were returned for this report.
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {displayedFindings.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Key Findings
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {displayedFindings.map((finding, index) => (
                <View
                  key={`${finding.findingCode || finding}-${index}`}
                  style={{
                    padding: 16,
                    borderBottomWidth: index < displayedFindings.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  {typeof finding === "string" ? (
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        lineHeight: 24,
                      }}
                    >
                      {finding}
                    </Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {finding.findingName} - {Math.round((finding.probability || 0) * 100)}%
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.primary,
                          fontWeight: "600",
                        }}
                      >
                        Risk: {finding.riskLevel}
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: colors.text,
                          lineHeight: 22,
                        }}
                      >
                        {finding.interpretation}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {displayedRecommendations.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Recommendations
            </Text>
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              {displayedRecommendations.map((recommendation, index) => (
                <View
                  key={`${recommendation.findingCode || recommendation.text}-${index}`}
                  style={{
                    padding: 16,
                    borderBottomWidth:
                      index < displayedRecommendations.length - 1 ? 1 : 0,
                    borderBottomColor: colors.primary,
                  }}
                >
                  {typeof recommendation === "string" ? (
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.primary,
                        lineHeight: 24,
                      }}
                    >
                      {recommendation}
                    </Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.primary,
                        }}
                      >
                        {recommendation.title}
                      </Text>
                      {recommendation.urgency ? (
                        <Text
                          style={{
                            fontSize: 13,
                            color: colors.primary,
                            fontWeight: "600",
                          }}
                        >
                          Urgency: {recommendation.urgency}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          fontSize: 15,
                          color: colors.primary,
                          lineHeight: 22,
                        }}
                      >
                        {recommendation.text}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {report.limitations.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 12,
              }}
            >
              Limitations
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 10,
              }}
            >
              {report.limitations.map((item, index) => (
                <Text
                  key={`${item}-${index}`}
                  style={{
                    fontSize: 14,
                    color: colors.mutedText,
                    lineHeight: 22,
                  }}
                >
                  - {item}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: colors.warningSoft,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.warning,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <AlertTriangle
              size={20}
              color={colors.warning}
              style={{ marginTop: 2, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.warning,
                  marginBottom: 4,
                }}
              >
                Important Disclaimer
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.warning,
                  lineHeight: 20,
                }}
              >
                {report.disclaimer ||
                  "This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
