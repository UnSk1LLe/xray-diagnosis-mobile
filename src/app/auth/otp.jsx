import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Shield } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OTPVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete OTP");
      return;
    }

    setLoading(true);

    try {
      // Simulate API call for OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For demo purposes, accept any 6-digit OTP
      if (otpCode.length === 6) {
        await AsyncStorage.setItem("isAuthenticated", "true");
        router.replace("/onboarding/personal-info");
      } else {
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTimer(30);
      Alert.alert("Success", "OTP sent successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP");
    } finally {
      setResendLoading(false);
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
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{ alignItems: "center", marginBottom: 60 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: "#dcfce7",
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Shield size={32} color="#16a34a" />
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
            Verify Your Phone
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            We've sent a 6-digit code to{"\n"}
            <Text style={{ fontWeight: "600", color: "#374151" }}>
              {phoneNumber}
            </Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 32,
            paddingHorizontal: 20,
          }}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={{
                width: 45,
                height: 55,
                borderWidth: 2,
                borderColor: digit ? "#2563eb" : "#e5e7eb",
                borderRadius: 12,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "600",
                color: "#111827",
                backgroundColor: digit ? "#eff6ff" : "#f9fafb",
              }}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? "#9ca3af" : "#2563eb",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Text>
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={{ alignItems: "center" }}>
          {timer > 0 ? (
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              Resend OTP in {timer}s
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#2563eb",
                  fontWeight: "600",
                }}
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
