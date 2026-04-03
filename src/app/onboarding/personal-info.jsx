import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { User, Calendar, MapPin } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.dateOfBirth.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Save personal info to local storage
      await AsyncStorage.setItem("personalInfo", JSON.stringify(formData));
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to save information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#fef3c7",
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <User size={32} color="#d97706" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#111827",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Personal Information
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Help us personalize your healthcare experience
          </Text>
        </View>

        {/* Form Fields */}
        <View style={{ marginBottom: 32 }}>
          {/* Name Fields */}
          <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                First Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#f9fafb",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#111827",
                }}
                placeholder="John"
                placeholderTextColor="#9ca3af"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange("firstName", value)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Last Name *
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#f9fafb",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#111827",
                }}
                placeholder="Doe"
                placeholderTextColor="#9ca3af"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange("lastName", value)}
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Date of Birth *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
              }}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
              value={formData.dateOfBirth}
              onChangeText={(value) => handleInputChange("dateOfBirth", value)}
            />
          </View>

          {/* Gender */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
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
                      formData.gender === gender ? "#eff6ff" : "#f9fafb",
                    borderWidth: 1,
                    borderColor:
                      formData.gender === gender ? "#2563eb" : "#e5e7eb",
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
                      color: formData.gender === gender ? "#2563eb" : "#6b7280",
                    }}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Address
            </Text>
            <TextInput
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
              }}
              placeholder="Enter your address"
              placeholderTextColor="#9ca3af"
              value={formData.address}
              onChangeText={(value) => handleInputChange("address", value)}
              multiline
            />
          </View>

          {/* Emergency Contact */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Emergency Contact
            </Text>
            <TextInput
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
              }}
              placeholder="Emergency contact number"
              placeholderTextColor="#9ca3af"
              value={formData.emergencyContact}
              onChangeText={(value) =>
                handleInputChange("emergencyContact", value)
              }
              keyboardType="phone-pad"
            />
          </View>

          {/* Medical History */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Medical History (Optional)
            </Text>
            <TextInput
              style={{
                backgroundColor: "#f9fafb",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: "#111827",
                height: 100,
                textAlignVertical: "top",
              }}
              placeholder="Any relevant medical history, allergies, or conditions..."
              placeholderTextColor="#9ca3af"
              value={formData.medicalHistory}
              onChangeText={(value) =>
                handleInputChange("medicalHistory", value)
              }
              multiline
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
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
    </KeyboardAvoidingView>
  );
}
