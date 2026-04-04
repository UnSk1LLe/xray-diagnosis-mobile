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
import { useAppTheme } from "@/utils/theme";

function formatKazakhPhoneInput(value) {
  const digits = value.replace(/\D/g, "");
  const normalizedDigits = digits.startsWith("7")
    ? digits
    : digits.startsWith("8")
      ? `7${digits.slice(1)}`
      : `7${digits}`;
  const trimmedDigits = normalizedDigits.slice(0, 11);
  const localDigits = trimmedDigits.slice(1);
  const parts = [];

  if (localDigits.length > 0) {
    parts.push(localDigits.slice(0, 3));
  }

  if (localDigits.length > 3) {
    parts.push(localDigits.slice(3, 6));
  }

  if (localDigits.length > 6) {
    parts.push(localDigits.slice(6, 8));
  }

  if (localDigits.length > 8) {
    parts.push(localDigits.slice(8, 10));
  }

  return `+7${parts.length ? `-${parts.join("-")}` : ""}`;
}

export default function PhoneAuth() {
  const [phoneNumber, setPhoneNumber] = useState("+7");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useAppTheme();

  const handleSendOTP = async () => {
    const phone = normalizePhone(phoneNumber);

    if (!phone || phone === "+7") {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    if (!/^\+7\d{10}$/.test(phone)) {
      Alert.alert("Error", "Please enter a valid phone number in +7 format");
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={statusBarStyle} />
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
              backgroundColor: colors.primarySoft,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Phone size={32} color={colors.primary} />
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
            Welcome to HealthScan
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
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
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Phone Number
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.softSurface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 16,
              color: colors.text,
            }}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.subtleText}
            value={phoneNumber}
            onChangeText={(value) => setPhoneNumber(formatKazakhPhoneInput(value))}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: loading ? colors.subtleText : colors.primary,
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
              color: colors.mutedText,
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
