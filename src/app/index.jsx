import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await AsyncStorage.getItem("isAuthenticated");
        const hasCompletedOnboarding = await AsyncStorage.getItem(
          "hasCompletedOnboarding",
        );

        if (!isAuthenticated) {
          router.replace("/auth/phone");
        } else if (!hasCompletedOnboarding) {
          router.replace("/onboarding/personal-info");
        } else {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        router.replace("/auth/phone");
      }
    };

    checkAuthStatus();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: insets.top,
      }}
    >
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}
