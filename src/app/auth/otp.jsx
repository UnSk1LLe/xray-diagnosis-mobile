import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Shield } from "lucide-react-native";
import {
  asString,
  requestOTP,
  verifyOTP,
} from "@/utils/backendApi";
import { useAppTheme } from "@/utils/theme";

const OTP_LENGTH = 4;

export default function OTPVerification() {
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [devOtpCode, setDevOtpCode] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = asString(params.phone);
  const insets = useSafeAreaInsets();
  const inputRefs = useRef([]);
  const { colors, statusBarStyle } = useAppTheme();

  useEffect(() => {
    setDevOtpCode(asString(params.devOtpCode));
  }, [params.devOtpCode]);

  useEffect(() => {
    if (!phone) {
      router.replace("/auth/phone");
    }
  }, [phone, router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((currentTimer) => currentTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const digits = value.replace(/\D/g, "");
    const nextOtp = [...otp];

    if (!digits) {
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    digits
      .slice(0, OTP_LENGTH - index)
      .split("")
      .forEach((digit, offset) => {
        nextOtp[index + offset] = digit;
      });

    setOtp(nextOtp);

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert("Error", "Please enter the complete 4-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP(phone, otpCode);

      if (response.user.hasCompletedProfile) {
        router.replace("/(tabs)");
        return;
      }

      router.replace("/onboarding/personal-info");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to verify OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const response = await requestOTP(phone);
      setDevOtpCode(response.otpCode);
      setTimer(30);
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
      Alert.alert("Success", "OTP sent successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to resend OTP",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <StatusBar style={statusBarStyle} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 60 }}>
          <View
            style={{
              alignSelf: "stretch",
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
                backgroundColor: colors.elevatedSurface,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: colors.successSoft,
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Shield size={32} color={colors.success} />
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
            Verify Your Phone
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            We've sent a 4-digit code to{"\n"}
            <Text style={{ fontWeight: "600", color: colors.text }}>{phone}</Text>
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 32,
            paddingHorizontal: 32,
          }}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={{
                width: 52,
                height: 56,
                borderWidth: 2,
                borderColor: digit ? colors.primary : colors.border,
                borderRadius: 12,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "600",
                color: colors.text,
                backgroundColor: digit ? colors.primarySoft : colors.softSurface,
              }}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              selectTextOnFocus
              returnKeyType="done"
              textContentType="oneTimeCode"
            />
          ))}
        </View>

        <View style={{ marginTop: "auto" }}>
          <TouchableOpacity
            style={{
              backgroundColor: loading ? colors.subtleText : colors.primary,
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

          <View style={{ alignItems: "center" }}>
            {timer > 0 ? (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedText,
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
                    color: colors.primary,
                    fontWeight: "600",
                  }}
                >
                  {resendLoading ? "Sending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
