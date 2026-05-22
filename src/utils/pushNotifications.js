import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { registerDevice } from "@/utils/backendApi";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    });
  }

  const permissionStatus = await Notifications.getPermissionsAsync();
  let finalStatus = permissionStatus.status;

  if (finalStatus !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants?.easConfig?.projectId ||
    Constants?.expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data || null;
}

function buildDevicePayload(expoPushToken) {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  return {
    expoPushToken,
    devicePlatform: Platform.OS,
    deviceModel: Device.modelName || "",
    osVersion: Device.osVersion || "",
    appVersion:
      Constants.expoConfig?.version ||
      Constants.nativeAppVersion ||
      "",
    locale,
    timezone,
  };
}

function redirectFromNotificationResponse(router, response) {
  const reportId = response?.notification?.request?.content?.data?.report_id;
  if (!reportId) {
    return;
  }

  router.push({
    pathname: "/report-result",
    params: { reportId: String(reportId) },
  });
}

export function usePushNotifications() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const register = async () => {
      try {
        const expoPushToken = await registerForPushNotificationsAsync();
        if (!active || !expoPushToken) {
          return;
        }

        await registerDevice(buildDevicePayload(expoPushToken));
      } catch (error) {
        console.warn("Push notification setup failed", error);
      }
    };

    register();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const handleInitialNotification = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (!active || !lastResponse) {
          return;
        }

        redirectFromNotificationResponse(router, lastResponse);
      } catch (error) {
        console.warn("Initial notification handling failed", error);
      }
    };

    handleInitialNotification();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirectFromNotificationResponse(router, response);
      },
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, [router]);
}
