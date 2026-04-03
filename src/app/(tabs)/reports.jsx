import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  FileText,
  Calendar,
  Activity,
  Search,
  Filter,
  Download,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, filterStatus]);

  const loadReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem("xrayReports");
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);
        setReports(parsedReports);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  };

  const filterReports = () => {
    if (filterStatus === "All") {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter((report) =>
        filterStatus === "Normal"
          ? report.status === "Normal"
          : report.status !== "Normal",
      );
      setFilteredReports(filtered);
    }
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

  const deleteReport = async (reportId) => {
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
              const updatedReports = reports.filter(
                (report) => report.id !== reportId,
              );
              setReports(updatedReports);
              await AsyncStorage.setItem(
                "xrayReports",
                JSON.stringify(updatedReports),
              );
            } catch (error) {
              Alert.alert("Error", "Failed to delete report");
            }
          },
        },
      ],
    );
  };

  const exportReport = (report) => {
    // In a real app, this would export the report as PDF or share it
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
        {/* Header */}
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

        {/* Filter Tabs */}
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
              onPress={() => setFilterStatus(status)}
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

        {/* Reports List */}
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
              {filteredReports.map((report) => (
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
                    {/* X-ray thumbnail */}
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

                    {/* Report info */}
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
                        <Activity
                          size={14}
                          color={
                            report.status === "Normal" ? "#16a34a" : "#d97706"
                          }
                        />
                        <View
                          style={{
                            backgroundColor:
                              report.status === "Normal"
                                ? "#dcfce7"
                                : "#fef3c7",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "500",
                              color:
                                report.status === "Normal"
                                  ? "#16a34a"
                                  : "#d97706",
                            }}
                          >
                            {report.status}
                          </Text>
                        </View>
                        {report.confidence && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                            }}
                          >
                            {report.confidence}% confidence
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Actions */}
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
                        onPress={() => exportReport(report)}
                      >
                        <Download size={16} color="#6b7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                        }}
                        onPress={() => deleteReport(report.id)}
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

                  {/* Quick preview of findings */}
                  {report.findings && report.findings.length > 0 && (
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
                        {report.findings.length > 1 && "..."}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
