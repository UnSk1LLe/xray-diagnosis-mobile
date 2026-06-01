import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image as RNImage,
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
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { createReport } from "@/utils/backendApi";
import { useAppTheme } from "@/utils/theme";

const MIN_IMAGE_DIMENSION = 512;
const MAX_IMAGE_DIMENSION = 1600;

function getAssetExtension(asset) {
  const fileName = asset?.fileName ?? asset?.uri ?? "";
  const sanitized = typeof fileName === "string" ? fileName.split("?")[0] : "";
  const extension = sanitized.split(".").pop()?.toLowerCase();

  return extension || "";
}

function needsJpegNormalization(asset) {
  const mimeType = asset?.mimeType?.toLowerCase?.() || "";
  const extension = getAssetExtension(asset);

  return (
    mimeType === "image/heic" ||
    mimeType === "image/heif" ||
    mimeType === "image/webp" ||
    extension === "heic" ||
    extension === "heif" ||
    extension === "webp"
  );
}

function hasMinimumImageResolution(asset) {
  return (
    Number.isFinite(asset?.width) &&
    Number.isFinite(asset?.height) &&
    asset.width >= MIN_IMAGE_DIMENSION &&
    asset.height >= MIN_IMAGE_DIMENSION
  );
}

function summarizeAsset(asset) {
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName ?? null,
    fileSize: asset.fileSize ?? null,
    mimeType: asset.mimeType ?? null,
    type: asset.type ?? null,
    assetId: asset.assetId ?? null,
  };
}

export default function ScanScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparingImage, setPreparingImage] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, statusBarStyle } = useAppTheme();

  const optimizeImageAsset = async (asset) => {
    console.log("[scan] optimizeImageAsset:start", summarizeAsset(asset));

    if (!asset?.uri || !asset.width || !asset.height) {
      console.log("[scan] optimizeImageAsset:skip-missing-dimensions");
      return asset;
    }

    const longestSide = Math.max(asset.width, asset.height);
    const shouldNormalizeToJpeg = needsJpegNormalization(asset);
    console.log("[scan] optimizeImageAsset:dimensions", {
      width: asset.width,
      height: asset.height,
      longestSide,
      shouldNormalizeToJpeg,
    });

    if (longestSide <= MAX_IMAGE_DIMENSION && !shouldNormalizeToJpeg) {
      console.log("[scan] optimizeImageAsset:skip-resize", {
        maxDimension: MAX_IMAGE_DIMENSION,
      });
      return asset;
    }

    const scale =
      longestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longestSide : 1;
    const width = Math.round(asset.width * scale);
    const height = Math.round(asset.height * scale);
    const optimizedImage = await manipulateAsync(
      asset.uri,
      [{ resize: { width, height } }],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
      },
    );

    console.log("[scan] optimizeImageAsset:done", {
      originalWidth: asset.width,
      originalHeight: asset.height,
      width: optimizedImage.width,
      height: optimizedImage.height,
      uri: optimizedImage.uri,
    });

    return {
      ...asset,
      uri: optimizedImage.uri,
      width: optimizedImage.width,
      height: optimizedImage.height,
      fileName: (asset.fileName || "xray.jpg").replace(
        /\.(heic|heif|webp)$/i,
        ".jpg",
      ),
      mimeType: "image/jpeg",
    };
  };

  const handleSelectedAsset = async (asset) => {
    console.log("[scan] handleSelectedAsset:start", summarizeAsset(asset));
    setPreparingImage(true);

    try {
      if (!asset?.width || !asset?.height) {
        Alert.alert(
          "Invalid image",
          "We could not read the image dimensions. Please choose a different image.",
        );
        return;
      }

      if (!hasMinimumImageResolution(asset)) {
        Alert.alert(
          "Image too small",
          `Please choose an image that is at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} pixels.`,
        );
        return;
      }

      const optimizedAsset = await optimizeImageAsset(asset);

      if (!hasMinimumImageResolution(optimizedAsset)) {
        Alert.alert(
          "Image too small",
          `Please choose an image that is at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} pixels.`,
        );
        return;
      }

      console.log(
        "[scan] handleSelectedAsset:setSelectedImage",
        summarizeAsset(optimizedAsset),
      );
      setSelectedImage(optimizedAsset);
    } catch (error) {
      console.error("Image optimization error:", error);
      Alert.alert("Error", "Failed to prepare the selected image");
    } finally {
      setPreparingImage(false);
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      console.log("[scan] pickImageFromLibrary:request-permission");
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[scan] pickImageFromLibrary:permission", { status });
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library",
        );
        return;
      }

      console.log("[scan] pickImageFromLibrary:launch");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      console.log("[scan] pickImageFromLibrary:result", {
        canceled: result.canceled,
        assetsCount: result.assets?.length ?? 0,
        firstAsset: summarizeAsset(result.assets?.[0]),
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleSelectedAsset(result.assets[0]);
      }
    } catch (error) {
      console.error("[scan] pickImageFromLibrary:error", error);
      Alert.alert("Error", "Failed to pick image from library");
    }
  };

  const takePhoto = async () => {
    try {
      console.log("[scan] takePhoto:request-permission");
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log("[scan] takePhoto:permission", { status });
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your camera",
        );
        return;
      }

      console.log("[scan] takePhoto:launch");
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      console.log("[scan] takePhoto:result", {
        canceled: result.canceled,
        assetsCount: result.assets?.length ?? 0,
        firstAsset: summarizeAsset(result.assets?.[0]),
      });

      if (!result.canceled && result.assets?.[0]) {
        await handleSelectedAsset(result.assets[0]);
      }
    } catch (error) {
      console.error("[scan] takePhoto:error", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const analyzeXRay = async () => {
    if (!selectedImage || preparingImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setAnalyzing(true);

    try {
      console.log("[scan] analyzeXRay:start", summarizeAsset(selectedImage));
      const response = await createReport(selectedImage);
      console.log("[scan] analyzeXRay:success", response);

      router.push({
        pathname: "/report-result",
        params: { reportId: String(response.reportId) },
      });
    } catch (error) {
      console.error("[scan] analyzeXRay:error", error);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={statusBarStyle} />
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
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Scan X-Ray
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedText,
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
                backgroundColor: colors.mutedSurface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.subtleBorder,
              }}
            >
              <RNImage
                source={{ uri: selectedImage.uri }}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 12,
                }}
                resizeMode="cover"
                onLoadStart={() => {
                  console.log("[scan] preview:onLoadStart", {
                    uri: selectedImage.uri,
                  });
                }}
                onLoad={() => {
                  console.log("[scan] preview:onLoad", {
                    uri: selectedImage.uri,
                  });
                }}
                onError={(event) => {
                  console.error("[scan] preview:onError", event.nativeEvent);
                }}
              />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  backgroundColor: colors.surface,
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
                <Text style={{ fontSize: 18, color: colors.mutedText }}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", marginBottom: 32 }}>
            <View
              style={{
                backgroundColor: colors.softSurface,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.border,
                borderStyle: "dashed",
                marginBottom: 24,
              }}
            >
              <ImageIcon size={64} color={colors.subtleText} />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                Select X-Ray Image
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedText,
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
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
                onPress={takePhoto}
                disabled={preparingImage}
              >
                {preparingImage ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
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
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
                onPress={pickImageFromLibrary}
                disabled={preparingImage}
              >
                {preparingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Upload size={20} color={colors.primary} />
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Choose from Gallery
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedImage ? (
          <View style={{ marginTop: "auto" }}>
            <TouchableOpacity
              style={{
                backgroundColor: analyzing ? colors.subtleText : colors.success,
                borderRadius: 12,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
              onPress={analyzeXRay}
              disabled={analyzing || preparingImage}
            >
              {analyzing || preparingImage ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {preparingImage
                      ? "Preparing image..."
                      : "Uploading and queueing report..."}
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
                color: colors.mutedText,
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
