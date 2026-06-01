import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Camera, FileText, Activity, Clock, Plus } from "lucide-react-native";
import { getProfile, listReports } from "@/utils/backendApi";
import { useAppTheme } from "@/utils/theme";

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

function getStatusColors(status) {
  if (status === "REVIEWED") {
    return {
      background: "#dcfce7",
      text: "#16a34a",
    };
  }

  if (status === "PROCESSING") {
    return {
      background: "#fef3c7",
      text: "#d97706",
    };
  }

  return {
    background: "#dbeafe",
    text: "#2563eb",
  };
}

export default function HomeScreen() {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, statusBarStyle } = useAppTheme();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadDashboard = async () => {
        try {
          const [profileData, reportsData] = await Promise.all([
            getProfile(),
            listReports(),
          ]);

          if (!isMounted) {
            return;
          }

          setProfile(profileData);
          setReports(reportsData);
        } catch (error) {
          if (isMounted) {
            console.error("Error loading dashboard:", error);
            router.replace("/auth/phone");
          }
        }
      };

      loadDashboard();

      return () => {
        isMounted = false;
      };
    }, [router]),
  );

  const recentReports = reports.slice(0, 3);
  const processingReports = reports.filter(
    (report) => report.status === "PROCESSING",
  ).length;
  const awaitingReviewReports = reports.filter(
    (report) => report.status === "AWAITING_REVIEW",
  ).length;
  const reviewedReports = reports.filter(
    (report) => report.status === "REVIEWED",
  ).length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={statusBarStyle} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Hello, {profile?.firstName || "User"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
              lineHeight: 24,
            }}
          >
            Welcome back to HealthScan. How can we help you today?
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#acd0ff",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
              onPress={() => router.push("/(tabs)/scan")}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#2563eb",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Camera size={24} color="#ffffff" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#2563eb",
                  textAlign: "center",
                }}
              >
                Scan X-Ray
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#a3ffd1",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
              }}
              onPress={() => router.push("/(tabs)/reports")}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#16a34a",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <FileText size={24} color="#ffffff" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#16a34a",
                  textAlign: "center",
                }}
              >
                View Reports
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Health Overview
          </Text>
          <View
            style={{
              backgroundColor: colors.mutedSurface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.subtleBorder,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <View style={{ width: "47%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#2563eb",
                  }}
                >
                  {reports.length}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedText,
                  }}
                >
                  Total Scans
                </Text>
              </View>
              <View style={{ width: "47%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#2563eb",
                  }}
                >
                  {processingReports}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedText,
                  }}
                >
                  Processing
                </Text>
              </View>
              <View style={{ width: "47%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#d97706",
                  }}
                >
                  {awaitingReviewReports}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedText,
                  }}
                >
                  Awaiting Review
                </Text>
              </View>
              <View style={{ width: "47%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: "#16a34a",
                  }}
                >
                  {reviewedReports}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedText,
                  }}
                >
                  Reviewed
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              Recent Reports
            </Text>
            {recentReports.length > 0 ? (
              <TouchableOpacity onPress={() => router.push("/(tabs)/reports")}>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#2563eb",
                    fontWeight: "500",
                  }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {recentReports.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.softSurface,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
                borderStyle: "dashed",
              }}
            >
              <FileText size={48} color={colors.subtleText} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: colors.mutedText,
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                No reports yet
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.subtleText,
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Upload your first X-ray scan to get started
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => router.push("/(tabs)/scan")}
              >
                <Plus size={16} color="#ffffff" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Scan Now
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {recentReports.map((report) => {
                const statusColors = getStatusColors(report.status);

                return (
                  <TouchableOpacity
                    key={report.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/report-result",
                        params: { reportId: report.id },
                      })
                    }
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: statusColors.background,
                        borderRadius: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Activity size={20} color={statusColors.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 4,
                        }}
                      >
                        Chest X-Ray Report
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Clock size={14} color={colors.mutedText} />
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.mutedText,
                          }}
                        >
                          {formatDate(report.date)}
                        </Text>
                        <View
                          style={{
                            backgroundColor: statusColors.background,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "500",
                              color: statusColors.text,
                            }}
                          >
                            {formatStatusLabel(report.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
