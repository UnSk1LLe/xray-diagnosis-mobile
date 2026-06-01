import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { FileText, Calendar, Activity, Download, Trash2 } from "lucide-react-native";
import { deleteReport, getReport, listReports } from "@/utils/backendApi";
import { exportReportToPdf } from "@/utils/reportPdf";
import SafeImage from "@/components/SafeImage";
import { useAppTheme } from "@/utils/theme";

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PROCESSING", label: "Processing" },
  { key: "AWAITING_REVIEW", label: "Awaiting Review" },
  { key: "REVIEWED", label: "Reviewed" },
];

function getStatusColors(status, colors) {
  if (status === "REVIEWED") {
    return {
      icon: colors.success,
      text: colors.success,
      background: colors.successSoft,
    };
  }

  if (status === "PROCESSING") {
    return {
      icon: colors.warning,
      text: colors.warning,
      background: colors.warningSoft,
    };
  }

  return {
    icon: colors.primary,
    text: colors.primary,
    background: colors.primarySoft,
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

export default function ReportsScreen() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [exportingReportId, setExportingReportId] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, statusBarStyle } = useAppTheme();

  const filterReports = useCallback((items, activeStatus) => {
    if (activeStatus === "ALL") {
      return items;
    }

    return items.filter((report) => report.status === activeStatus);
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
    if (!dateString) {
      return "Unknown date";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

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

  const exportReport = async (reportId) => {
    if (!reportId || exportingReportId === reportId) {
      return;
    }

    try {
      setExportingReportId(reportId);
      const fullReport = await getReport(reportId);
      const pdfResult = await exportReportToPdf(fullReport);

      if (!pdfResult.shared) {
        Alert.alert("PDF generated", `Saved to temporary file:\n${pdfResult.uri}`);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to export report",
      );
    } finally {
      setExportingReportId("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={statusBarStyle} />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            My Reports
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
              lineHeight: 24,
            }}
          >
            View and manage your X-ray analysis reports
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            flexGrow: 0,
            marginBottom: 24,
          }}
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.elevatedSurface,
            borderRadius: 12,
            padding: 4,
            gap: 4,
          }}
        >
          {STATUS_FILTERS.map((statusOption) => (
            <TouchableOpacity
              key={statusOption.key}
              style={{
                backgroundColor:
                  filterStatus === statusOption.key
                    ? colors.surface
                    : "transparent",
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 14,
                alignItems: "center",
              }}
              onPress={() => handleFilterChange(statusOption.key)}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    filterStatus === statusOption.key
                      ? colors.text
                      : colors.mutedText,
                }}
              >
                {statusOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filteredReports.length === 0 ? (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.softSurface,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                justifyContent: "center",
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
                {filterStatus === "ALL"
                  ? "No reports yet"
                  : `No ${formatStatusLabel(filterStatus).toLowerCase()} reports`}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.subtleText,
                  textAlign: "center",
                }}
              >
                {filterStatus === "ALL"
                  ? "Upload your first X-ray scan to get started"
                  : `You don't have any ${formatStatusLabel(filterStatus).toLowerCase()} reports yet`}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {filteredReports.map((report) => {
                const statusColors = getStatusColors(report.status, colors);

                return (
                  <TouchableOpacity
                    key={report.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
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
                          backgroundColor: colors.elevatedSurface,
                          borderRadius: 8,
                          marginRight: 12,
                          overflow: "hidden",
                        }}
                      >
                        {report.imageUrl ? (
                          <SafeImage
                            uri={report.imageUrl}
                            style={{ width: "100%", height: "100%" }}
                            borderRadius={8}
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <FileText size={24} color={colors.subtleText} />
                          </View>
                        )}
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
                          <Calendar size={14} color={colors.mutedText} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: colors.mutedText,
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
                              {formatStatusLabel(report.status)}
                            </Text>
                          </View>
                          {report.confidence ? (
                            <Text
                              style={{
                                fontSize: 12,
                                color: colors.mutedText,
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
                            backgroundColor: colors.elevatedSurface,
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: exportingReportId === report.id ? 0.5 : 1,
                          }}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            exportReport(report.id);
                          }}
                          disabled={exportingReportId === report.id}
                        >
                          <Download size={16} color={colors.mutedText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.elevatedSurface,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          onPress={(event) => {
                            event.stopPropagation?.();
                            removeReport(report.id);
                          }}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {report.findings.length > 0 ? (
                      <View
                        style={{
                          backgroundColor: colors.mutedSurface,
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.text,
                            lineHeight: 20,
                          }}
                        >
                          {report.findings[0]}
                          {report.findings.length > 1 ? "..." : ""}
                        </Text>
                      </View>
                    ) : report.status === "PROCESSING" ? (
                      <View
                        style={{
                          backgroundColor: colors.primarySoft,
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            color: colors.primary,
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
