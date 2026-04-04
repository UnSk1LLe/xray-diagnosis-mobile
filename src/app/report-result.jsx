import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
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
import SafeImage from "@/components/SafeImage";
import { useAppTheme } from "@/utils/theme";

function getStatusStyle(status) {
  if (status === "Normal") {
    return {
      background: "#f0fdf4",
      border: "#bbf7d0",
      text: "#16a34a",
      icon: "normal",
    };
  }

  if (status === "Processing") {
    return {
      background: "#eff6ff",
      border: "#bfdbfe",
      text: "#2563eb",
      icon: "processing",
    };
  }

  return {
    background: "#fef3c7",
    border: "#fde68a",
    text: "#d97706",
    icon: "alert",
  };
}

export default function ReportResult() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const reportId = asString(params.reportId);
  const { colors, statusBarStyle } = useAppTheme();

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      if (!reportId) {
        router.back();
        return;
      }

      try {
        const reportData = await getReport(reportId);

        if (isMounted) {
          setReport(reportData);
        }
      } catch (error) {
        if (isMounted) {
          Alert.alert(
            "Error",
            error instanceof Error ? error.message : "Failed to load report",
          );
          router.back();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [reportId, router]);

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
        `Status: ${report.status}`,
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

  const downloadReport = () => {
    Alert.alert(
      "Download Report",
      "PDF download functionality would be implemented here",
    );
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        style={{ flex: 1 }}
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
              }}
              onPress={downloadReport}
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
              {report.status}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
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
                  {report.confidence}% confidence
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

        {report.findings.length > 0 ? (
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
              {report.findings.map((finding, index) => (
                <View
                  key={`${finding}-${index}`}
                  style={{
                    padding: 16,
                    borderBottomWidth: index < report.findings.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#2563eb",
                      borderRadius: 3,
                      marginTop: 8,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      lineHeight: 24,
                      flex: 1,
                    }}
                  >
                    {finding}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {report.recommendations.length > 0 ? (
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
              {report.recommendations.map((recommendation, index) => (
                <View
                  key={`${recommendation}-${index}`}
                  style={{
                    padding: 16,
                    borderBottomWidth:
                      index < report.recommendations.length - 1 ? 1 : 0,
                    borderBottomColor: colors.primary,
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      backgroundColor: "#2563eb",
                      borderRadius: 3,
                      marginTop: 8,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.primary,
                      lineHeight: 24,
                      flex: 1,
                    }}
                  >
                    {recommendation}
                  </Text>
                </View>
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
                This AI analysis is for informational purposes only and should
                not replace professional medical advice. Please consult with a
                qualified healthcare provider for proper diagnosis and
                treatment.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
