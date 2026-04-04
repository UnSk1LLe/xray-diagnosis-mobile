import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Edit,
  Settings,
  HelpCircle,
  LogOut,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react-native";
import {
  getProfile,
  getProfileStats,
  logoutUser,
} from "@/utils/backendApi";
import { useAppTheme } from "@/utils/theme";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalScans: 0,
    normalResults: 0,
    abnormalResults: 0,
    processing: 0,
  });
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, resolvedTheme, setThemePreference, statusBarStyle, themePreference } =
    useAppTheme();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadProfileData = async () => {
        try {
          const [profileResult, statsResult] = await Promise.allSettled([
            getProfile(),
            getProfileStats(),
          ]);

          if (profileResult.status !== "fulfilled") {
            throw profileResult.reason;
          }

          if (!isMounted) {
            return;
          }

          setProfile(profileResult.value);

          if (statsResult.status === "fulfilled") {
            setStats(statsResult.value);
            return;
          }

          console.warn("Error loading profile stats:", statsResult.reason);
          setStats({
            totalScans: 0,
            normalResults: 0,
            abnormalResults: 0,
            processing: 0,
          });
        } catch (error) {
          if (isMounted) {
            console.error("Error loading profile:", error);
            router.replace("/auth/phone");
          }
        }
      };

      loadProfileData();

      return () => {
        isMounted = false;
      };
    }, [router]),
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutUser();
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            await AsyncStorage.multiRemove([
              "isAuthenticated",
              "hasCompletedOnboarding",
              "personalInfo",
              "xrayReports",
            ]);
            router.replace("/auth/phone");
          }
        },
      },
    ]);
  };

  const editProfile = () => {
    router.push("/onboarding/personal-info");
  };

  const showSettings = () => {
    Alert.alert("Theme", "Choose app theme", [
      {
        text: `System${themePreference === "system" ? " (Current)" : ""}`,
        onPress: () => setThemePreference("system"),
      },
      {
        text: `Light${themePreference === "light" ? " (Current)" : ""}`,
        onPress: () => setThemePreference("light"),
      },
      {
        text: `Dark${themePreference === "dark" ? " (Current)" : ""}`,
        onPress: () => setThemePreference("dark"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showHelp = () => {
    Alert.alert(
      "Help & Support",
      "Help and support functionality would be implemented here",
    );
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
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.primarySoft,
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <User size={40} color={colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {profile ? `${profile.firstName} ${profile.lastName}`.trim() : "User"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
            }}
          >
            HealthScan Member
          </Text>
        </View>

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
              backgroundColor: colors.primarySoft,
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {stats.totalScans}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedText,
                textAlign: "center",
              }}
            >
              Total Scans
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.successSoft,
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: colors.success,
                marginBottom: 4,
              }}
            >
              {stats.normalResults}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedText,
                textAlign: "center",
              }}
            >
              Normal Results
            </Text>
          </View>
        </View>

        {profile ? (
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
                Personal Information
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.elevatedSurface,
                  borderRadius: 8,
                  padding: 8,
                }}
                onPress={editProfile}
              >
                <Edit size={16} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: colors.mutedSurface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.subtleBorder,
              }}
            >
              {profile.phone ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Phone size={20} color={colors.mutedText} />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        marginBottom: 2,
                      }}
                    >
                      Phone
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {profile.phone}
                    </Text>
                  </View>
                </View>
              ) : null}

              {profile.dateOfBirth ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Calendar size={20} color={colors.mutedText} />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        marginBottom: 2,
                      }}
                    >
                      Date of Birth
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {profile.dateOfBirth}
                    </Text>
                  </View>
                </View>
              ) : null}

              {profile.gender ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <User size={20} color={colors.mutedText} />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        marginBottom: 2,
                      }}
                    >
                      Gender
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {profile.gender}
                    </Text>
                  </View>
                </View>
              ) : null}

              {profile.address ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <MapPin size={20} color={colors.mutedText} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        marginBottom: 2,
                      }}
                    >
                      Address
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: "500",
                        lineHeight: 22,
                      }}
                    >
                      {profile.address}
                    </Text>
                  </View>
                </View>
              ) : null}

              {profile.emergencyContact ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <Phone size={20} color={colors.mutedText} />
                  <View style={{ marginLeft: 12 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        marginBottom: 2,
                      }}
                    >
                      Emergency Contact
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {profile.emergencyContact}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Settings
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={showSettings}
            >
              <Settings size={20} color={colors.mutedText} />
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Theme
              </Text>
              <Text style={{ color: colors.subtleText }}>
                {resolvedTheme[0].toUpperCase() + resolvedTheme.slice(1)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={showHelp}
            >
              <HelpCircle size={20} color={colors.mutedText} />
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                Help & Support
              </Text>
              <Text style={{ color: colors.subtleText }}>{">"}</Text>
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
              <Text style={{ color: colors.subtleText }}>{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.softSurface,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedText,
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
