import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Calendar as CalendarIcon, User } from "lucide-react-native";
import { Calendar } from "react-native-calendars";
import { getProfile, updateProfile } from "@/utils/backendApi";
import { useAppTheme } from "@/utils/theme";

function formatDateForCalendar(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}

export default function PersonalInfo() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedTheme } = useAppTheme();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profile = await getProfile();

        if (!isMounted) {
          return;
        }

        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: formatDateForCalendar(profile.dateOfBirth),
          gender: profile.gender,
          address: profile.address,
          emergencyContact: profile.emergencyContact,
          medicalHistory: profile.medicalHistory,
        });
      } catch {
        if (isMounted) {
          router.replace("/auth/phone");
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleInputChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert("Error", "Please fill in your first and last name");
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        gender: formData.gender.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        medicalHistory: formData.medicalHistory.trim(),
      });

      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to save information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: colors.mutedText }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={statusBarStyle} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: colors.warningSoft,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <User size={32} color={colors.warning} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Personal Information
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Help us personalize your healthcare experience
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                First Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.softSurface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.text,
                }}
                placeholder="John"
                placeholderTextColor={colors.subtleText}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange("firstName", value)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Last Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.softSurface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.text,
                }}
                placeholder="Doe"
                placeholderTextColor={colors.subtleText}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange("lastName", value)}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Date of Birth
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.softSurface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: formData.dateOfBirth ? colors.text : colors.subtleText,
                }}
              >
                {formData.dateOfBirth
                  ? formatDateForDisplay(formData.dateOfBirth)
                  : "Select your date of birth"}
              </Text>
              <CalendarIcon size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Gender
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {["Male", "Female", "Other"].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={{
                    flex: 1,
                    backgroundColor:
                      formData.gender === gender
                        ? colors.primarySoft
                        : colors.softSurface,
                    borderWidth: 1,
                    borderColor:
                      formData.gender === gender ? colors.primary : colors.border,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                  onPress={() => handleInputChange("gender", gender)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color:
                        formData.gender === gender
                          ? colors.primary
                          : colors.mutedText,
                    }}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Address
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.softSurface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
              placeholder="Enter your address"
              placeholderTextColor={colors.subtleText}
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              multiline
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Emergency Contact
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.softSurface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
              }}
              placeholder="Emergency contact number"
              placeholderTextColor={colors.subtleText}
              value={formData.emergencyContact}
              onChangeText={(value) =>
                handleInputChange("emergencyContact", value)
              }
              keyboardType="phone-pad"
            />
          </View>

          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Medical History (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.softSurface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: colors.text,
                height: 100,
                textAlignVertical: "top",
              }}
              placeholder="Any relevant medical history, allergies, or conditions..."
              placeholderTextColor={colors.subtleText}
              value={formData.medicalHistory}
              onChangeText={(value) =>
                handleInputChange("medicalHistory", value)
              }
              multiline
            />
          </View>
        </View>

          <TouchableOpacity
            style={{
            backgroundColor: loading ? colors.subtleText : colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
            marginBottom: 24,
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {loading ? "Saving..." : "Complete Setup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor:
              resolvedTheme === "dark"
                ? "rgba(2, 6, 23, 0.72)"
                : "rgba(17, 24, 39, 0.4)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Select Date of Birth
            </Text>

            <Calendar
              current={formData.dateOfBirth || undefined}
              maxDate={new Date().toISOString().split("T")[0]}
              markedDates={
                formData.dateOfBirth
                  ? {
                      [formData.dateOfBirth]: {
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }
                  : undefined
              }
              onDayPress={({ dateString }) => {
                handleInputChange("dateOfBirth", dateString);
                setShowDatePicker(false);
              }}
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: "#ffffff",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
                calendarBackground: colors.surface,
                monthTextColor: colors.text,
                dayTextColor: colors.text,
                textDisabledColor: colors.subtleText,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
                onPress={() => setShowDatePicker(false)}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.mutedText,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              {formData.dateOfBirth ? (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                  onPress={() => {
                    handleInputChange("dateOfBirth", "");
                    setShowDatePicker(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.danger,
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
