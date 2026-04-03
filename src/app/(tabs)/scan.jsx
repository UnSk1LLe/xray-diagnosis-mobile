import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  FileText,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { createReport } from "@/utils/backendApi";

export default function ScanScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const pickImageFromLibrary = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image from library");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your camera",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const analyzeXRay = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setAnalyzing(true);

    try {
      const response = await createReport(selectedImage);

      router.push({
        pathname: "/report-result",
        params: { reportId: String(response.reportId) },
      });
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to analyze X-ray. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetSelection = () => {
    setSelectedImage(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Scan X-Ray
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: "#6b7280",
              lineHeight: 24,
            }}
          >
            Upload or take a photo of your chest X-ray for AI analysis
          </Text>
        </View>

        {selectedImage ? (
          <View style={{ marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Image
                source={{ uri: selectedImage.uri }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                }}
                contentFit="cover"
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={resetSelection}
              >
                <Text style={{ fontSize: 18, color: "#6b7280" }}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#e5e7eb",
                borderStyle: "dashed",
                marginBottom: 24,
              }}
            >
              <ImageIcon size={64} color="#9ca3af" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#374151",
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                Select X-Ray Image
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                Choose from your gallery or take a new photo of your chest X-ray
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
                onPress={takePhoto}
              >
                <Camera size={20} color="#ffffff" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#ffffff",
                  borderWidth: 2,
                  borderColor: "#2563eb",
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
                onPress={pickImageFromLibrary}
              >
                <Upload size={20} color="#2563eb" />
                <Text
                  style={{
                    color: "#2563eb",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedImage ? (
          <View style={{ marginTop: "auto" }}>
            <TouchableOpacity
              style={{
                backgroundColor: analyzing ? "#9ca3af" : "#16a34a",
                borderRadius: 12,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
              onPress={analyzeXRay}
              disabled={analyzing}
            >
              {analyzing ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Uploading and queueing report...
                  </Text>
                </>
              ) : (
                <>
                  <FileText size={20} color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Analyze X-Ray
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 12,
                color: "#6b7280",
                textAlign: "center",
                marginTop: 12,
                lineHeight: 16,
              }}
            >
              Analysis typically takes 30-60 seconds
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
