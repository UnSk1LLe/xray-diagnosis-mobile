import { useState, useEffect } from "react";
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
  FileText,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

export default function ReportResult() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reportId } = useLocalSearchParams();

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      const reports = await AsyncStorage.getItem("xrayReports");
      if (reports) {
        const parsedReports = JSON.parse(reports);
        const foundReport = parsedReports.find((r) => r.id === reportId);
        if (foundReport) {
          setReport(foundReport);
        } else {
          Alert.alert("Error", "Report not found");
          router.back();
        }
      }
    } catch (error) {
      console.error("Error loading report:", error);
      Alert.alert("Error", "Failed to load report");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
    if (!report) return;

    try {
      const shareContent = `HealthScan X-Ray Report\n\nDate: ${formatDate(report.date)}\nStatus: ${report.status}\nConfidence: ${report.confidence}%\n\nFindings:\n${report.findings.map((f) => `• ${f}`).join("\n")}\n\nRecommendations:\n${report.recommendations.map((r) => `• ${r}`).join("\n")}`;

      await Share.share({
        message: shareContent,
        title: "HealthScan X-Ray Report",
      });
    } catch (error) {
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
          backgroundColor: "#ffffff",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text style={{ fontSize: 16, color: "#6b7280" }}>
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
          backgroundColor: "#ffffff",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: insets.top,
        }}
      >
        <Text style={{ fontSize: 16, color: "#6b7280" }}>Report not found</Text>
      </View>
    );
  }

  const isNormal = report.status === "Normal";

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#111827",
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
                backgroundColor: "#f3f4f6",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={shareReport}
            >
              <Share2 size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={downloadReport}
            >
              <Download size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View
          style={{
            backgroundColor: isNormal ? "#f0fdf4" : "#fef3c7",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isNormal ? "#bbf7d0" : "#fde68a",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            {isNormal ? (
              <CheckCircle size={24} color="#16a34a" />
            ) : (
              <AlertTriangle size={24} color="#d97706" />
            )}
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isNormal ? "#16a34a" : "#d97706",
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
              <Calendar size={16} color="#6b7280" />
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {formatDate(report.date)}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Activity size={16} color="#6b7280" />
              <Text style={{ fontSize: 14, color: "#6b7280" }}>
                {report.confidence}% confidence
              </Text>
            </View>
          </View>
        </View>

        {/* X-Ray Image */}
        {report.imageUrl && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              X-Ray Image
            </Text>
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Image
                source={{ uri: report.imageUrl }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                }}
                contentFit="cover"
              />
            </View>
          </View>
        )}

        {/* AI Analysis */}
        {report.aiAnalysis && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              AI Analysis
            </Text>
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: "#374151",
                  lineHeight: 24,
                }}
              >
                {report.aiAnalysis}
              </Text>
            </View>
          </View>
        )}

        {/* Findings */}
        {report.findings && report.findings.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Key Findings
            </Text>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              {report.findings.map((finding, index) => (
                <View
                  key={index}
                  style={{
                    padding: 16,
                    borderBottomWidth:
                      index < report.findings.length - 1 ? 1 : 0,
                    borderBottomColor: "#e5e7eb",
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
                      color: "#374151",
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
        )}

        {/* Recommendations */}
        {report.recommendations && report.recommendations.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Recommendations
            </Text>
            <View
              style={{
                backgroundColor: "#eff6ff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#bfdbfe",
              }}
            >
              {report.recommendations.map((recommendation, index) => (
                <View
                  key={index}
                  style={{
                    padding: 16,
                    borderBottomWidth:
                      index < report.recommendations.length - 1 ? 1 : 0,
                    borderBottomColor: "#bfdbfe",
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
                      color: "#1e40af",
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
        )}

        {/* Disclaimer */}
        <View
          style={{
            backgroundColor: "#fef3c7",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#fde68a",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <AlertTriangle
              size={20}
              color="#d97706"
              style={{ marginTop: 2, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#92400e",
                  marginBottom: 4,
                }}
              >
                Important Disclaimer
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#92400e",
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
