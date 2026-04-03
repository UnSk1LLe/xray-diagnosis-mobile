import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { FileText, Calendar, Activity, Download } from "lucide-react-native";
import { Image } from "expo-image";
import { deleteReport, listReports } from "@/utils/backendApi";

function getStatusColors(status) {
  if (status === "Normal") {
    return {
      icon: "#16a34a",
      text: "#16a34a",
      background: "#dcfce7",
    };
  }

  if (status === "Processing") {
    return {
      icon: "#2563eb",
      text: "#2563eb",
      background: "#dbeafe",
    };
  }

  return {
    icon: "#d97706",
    text: "#d97706",
    background: "#fef3c7",
  };
}

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const filterReports = useCallback((items, activeStatus) => {
    if (activeStatus === "All") {
      return items;
    }

    if (activeStatus === "Normal") {
      return items.filter((report) => report.status === "Normal");
    }

    return items.filter(
      (report) =>
        report.status !== "Normal" && report.status !== "Processing",
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadReports = async () => {
        try {
          const reportsData = await listReports();

          if (!isMounted) {
            return;
          }

          setReports(reportsData);
          setFilteredReports(filterReports(reportsData, filterStatus));
        } catch (error) {
          if (isMounted) {
            console.error("Error loading reports:", error);
            router.replace("/auth/phone");
          }
        }
      };

      loadReports();

      return () => {
        isMounted = false;
      };
    }, [filterReports, filterStatus, router]),
  );

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setFilteredReports(filterReports(reports, status));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const removeReport = (reportId) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReport(reportId);
              const updatedReports = reports.filter((report) => report.id !== reportId);
              setReports(updatedReports);
              setFilteredReports(filterReports(updatedReports, filterStatus));
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete report",
              );
            }
          },
        },
      ],
    );
  };

  const exportReport = () => {
    Alert.alert(
      "Export Report",
      "Report export functionality would be implemented here",
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            My Reports
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              lineHeight: 24,
            }}
          >
            View and manage your X-ray analysis reports
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#f3f4f6",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {["All", "Normal", "Abnormal"].map((status) => (
            <TouchableOpacity
              key={status}
              style={{
                flex: 1,
                backgroundColor:
                  filterStatus === status ? "#ffffff" : "transparent",
                borderRadius: 8,
                paddingVertical: 8,
                alignItems: "center",
              }}
              onPress={() => handleFilterChange(status)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: filterStatus === status ? "#111827" : "#6b7280",
                }}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {filteredReports.length === 0 ? (
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderStyle: "dashed",
                marginTop: 40,
              }}
            >
              <FileText size={48} color="#9ca3af" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "500",
                  color: "#6b7280",
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                {filterStatus === "All"
                  ? "No reports yet"
                  : `No ${filterStatus.toLowerCase()} reports`}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                {filterStatus === "All"
                  ? "Upload your first X-ray scan to get started"
                  : `You don't have any ${filterStatus.toLowerCase()} reports yet`}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filteredReports.map((report) => {
                const statusColors = getStatusColors(report.status);

                return (
                  <TouchableOpacity
                    key={report.id}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/report-result",
                        params: { reportId: report.id },
                      })
                    }
                  >
                    <View style={{ flexDirection: "row", marginBottom: 12 }}>
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          backgroundColor: "#f3f4f6",
                          borderRadius: 8,
                          marginRight: 12,
                          overflow: "hidden",
                        }}
                      >
                        {report.imageUrl ? (
                          <Image
                            source={{ uri: report.imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <FileText size={24} color="#9ca3af" />
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: 4,
                          }}
                        >
                          Chest X-Ray Analysis
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <Calendar size={14} color="#6b7280" />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6b7280",
                            }}
                          >
                            {formatDate(report.date)}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Activity size={14} color={statusColors.icon} />
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
                              {report.status}
                            </Text>
                          </View>
                          {report.confidence ? (
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                              }}
                            >
                              {report.confidence}% confidence
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={{
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#f3f4f6",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          onPress={exportReport}
                        >
                          <Download size={16} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}
                          onPress={() => removeReport(report.id)}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#dc2626",
                            }}
                          >
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {report.findings.length > 0 ? (
                      <View
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#374151",
                            lineHeight: 20,
                          }}
                        >
                          {report.findings[0]}
                          {report.findings.length > 1 ? "..." : ""}
                        </Text>
                      </View>
                    ) : report.status === "Processing" ? (
                      <View
                        style={{
                          backgroundColor: "#eff6ff",
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#1d4ed8",
                            lineHeight: 20,
                          }}
                        >
                          Analysis is still processing. Open the report again in
                          a moment for the latest status.
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
