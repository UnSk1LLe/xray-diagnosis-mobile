import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  User,
  Edit,
  Settings,
  HelpCircle,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const [personalInfo, setPersonalInfo] = useState(null);
  const [stats, setStats] = useState({ totalScans: 0, normalResults: 0 });
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      const info = await AsyncStorage.getItem("personalInfo");
      if (info) {
        setPersonalInfo(JSON.parse(info));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadStats = async () => {
    try {
      const reports = await AsyncStorage.getItem("xrayReports");
      if (reports) {
        const parsedReports = JSON.parse(reports);
        setStats({
          totalScans: parsedReports.length,
          normalResults: parsedReports.filter((r) => r.status === "Normal")
            .length,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "isAuthenticated",
              "hasCompletedOnboarding",
              "personalInfo",
              "xrayReports",
            ]);
            router.replace("/auth/phone");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const editProfile = () => {
    Alert.alert(
      "Edit Profile",
      "Profile editing functionality would be implemented here",
    );
  };

  const showSettings = () => {
    Alert.alert("Settings", "Settings functionality would be implemented here");
  };

  const showHelp = () => {
    Alert.alert(
      "Help & Support",
      "Help and support functionality would be implemented here",
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: "#eff6ff",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <User size={40} color="#2563eb" />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            {personalInfo
              ? `${personalInfo.firstName} ${personalInfo.lastName}`
              : "User"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
            }}
          >
            HealthScan Member
          </Text>
        </View>

        {/* Stats Cards */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#eff6ff",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#2563eb",
                marginBottom: 4,
              }}
            >
              {stats.totalScans}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Total Scans
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "#f0fdf4",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#16a34a",
                marginBottom: 4,
              }}
            >
              {stats.normalResults}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              Normal Results
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        {personalInfo && (
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
                  color: "#111827",
                }}
              >
                Personal Information
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: 8,
                  padding: 8,
                }}
                onPress={editProfile}
              >
                <Edit size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              {personalInfo.dateOfBirth && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                  }}
                >
                  <Calendar size={20} color="#6b7280" />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Date of Birth
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#111827",
                        fontWeight: "500",
                      }}
                    >
                      {personalInfo.dateOfBirth}
                    </Text>
                  </View>
                </View>
              )}

              {personalInfo.gender && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                  }}
                >
                  <User size={20} color="#6b7280" />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Gender
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#111827",
                        fontWeight: "500",
                      }}
                    >
                      {personalInfo.gender}
                    </Text>
                  </View>
                </View>
              )}

              {personalInfo.address && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                  }}
                >
                  <MapPin size={20} color="#6b7280" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Address
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#111827",
                        fontWeight: "500",
                        lineHeight: 22,
                      }}
                    >
                      {personalInfo.address}
                    </Text>
                  </View>
                </View>
              )}

              {personalInfo.emergencyContact && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Phone size={20} color="#6b7280" />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 2,
                      }}
                    >
                      Emergency Contact
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#111827",
                        fontWeight: "500",
                      }}
                    >
                      {personalInfo.emergencyContact}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Menu Options */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Settings
          </Text>

          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
              onPress={showSettings}
            >
              <Settings size={20} color="#6b7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111827",
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                App Settings
              </Text>
              <Text style={{ color: "#9ca3af" }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
              onPress={showHelp}
            >
              <HelpCircle size={20} color="#6b7280" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#111827",
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Help & Support
              </Text>
              <Text style={{ color: "#9ca3af" }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
              }}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#dc2626" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#dc2626",
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Logout
              </Text>
              <Text style={{ color: "#9ca3af" }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            HealthScan v1.0.0{"\n"}
            AI-powered chest X-ray analysis
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
