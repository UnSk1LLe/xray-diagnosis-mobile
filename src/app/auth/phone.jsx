import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Phone } from "lucide-react-native";
import { normalizePhone, requestOTP } from "@/utils/backendApi";

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSendOTP = async () => {
    const phone = normalizePhone(phoneNumber);

    if (!phone) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const response = await requestOTP(phone);

      router.push({
        pathname: "/auth/otp",
        params: {
          phone: response.phone,
          devOtpCode: response.otpCode,
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to send OTP. Please try again.",
      );
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
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 40,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 60 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#eff6ff",
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Phone size={32} color="#2563eb" />
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
            Welcome to HealthScan
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Enter your phone number to get started with secure access to your
            health reports
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Phone Number
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f9fafb",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: "#111827",
            }}
            placeholder="Enter your phone number"
            placeholderTextColor="#9ca3af"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Text
            style={{
              fontSize: 14,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
