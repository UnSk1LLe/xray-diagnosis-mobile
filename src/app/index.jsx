import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCurrentUser } from "@/utils/backendApi";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        if (!currentUser.hasCompletedProfile) {
          router.replace("/onboarding/personal-info");
          return;
        }

        router.replace("/(tabs)");
      } catch {
        if (isMounted) {
          router.replace("/auth/phone");
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
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
