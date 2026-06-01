import { useEffect } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  getCurrentUser,
  registerDevice,
  unregisterDevice,
} from "@/utils/backendApi";

const PUSH_TOKEN_SYNC_STORAGE_KEY = "pushNotifications:lastSyncedRegistration";

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

async function getLastSyncedRegistration() {
  try {
    const rawValue = await AsyncStorage.getItem(PUSH_TOKEN_SYNC_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (
      typeof parsedValue?.token !== "string" ||
      typeof parsedValue?.userId !== "number"
    ) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

async function setLastSyncedRegistration(userId, token) {
  await AsyncStorage.setItem(
    PUSH_TOKEN_SYNC_STORAGE_KEY,
    JSON.stringify({ userId, token }),
  );
}

export async function rememberPushRegistrationSynced(userId, token) {
  if (!userId || !token) {
    return;
  }

  await setLastSyncedRegistration(userId, token);
}

export async function clearStoredPushRegistration() {
  await AsyncStorage.removeItem(PUSH_TOKEN_SYNC_STORAGE_KEY);
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

export async function preparePushRegistrationPayload() {
  const expoPushToken = await registerForPushNotificationsAsync();
  if (!expoPushToken) {
    return null;
  }

  return buildDevicePayload(expoPushToken);
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

export async function syncPushNotificationsForUser(userId) {
  if (!userId) {
    return false;
  }

  const registrationPayload = await preparePushRegistrationPayload();
  if (!registrationPayload?.expoPushToken) {
    return false;
  }

  console.log("[pushNotifications] gathered Expo push token", {
    userId,
    expoPushToken: registrationPayload.expoPushToken,
  });

  const existingRegistration = await getLastSyncedRegistration();
  if (
    existingRegistration?.userId === userId &&
    existingRegistration?.token === registrationPayload.expoPushToken
  ) {
    return false;
  }

  await registerDevice(registrationPayload);
  await setLastSyncedRegistration(userId, registrationPayload.expoPushToken);

  return true;
}

export async function unregisterPushNotificationsForUser(userId) {
  const existingRegistration = await getLastSyncedRegistration();

  if (
    !existingRegistration?.token ||
    !userId ||
    existingRegistration.userId !== userId
  ) {
    await clearStoredPushRegistration();
    return false;
  }

  await unregisterDevice({ expoPushToken: existingRegistration.token });
  await clearStoredPushRegistration();

  return true;
}

export function usePushNotifications() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const syncRegistration = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!active || !currentUser?.id) {
          return;
        }

        await syncPushNotificationsForUser(currentUser.id);
      } catch (error) {
        console.warn("Push notification setup failed", error);
      }
    };

    syncRegistration();

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
