import { useState } from "react";
import { View, Image as RNImage } from "react-native";
import { FileText } from "lucide-react-native";
import { useAppTheme } from "@/utils/theme";

export default function SafeImage({
  uri,
  style,
  resizeMode = "cover",
  iconSize = 24,
  borderRadius = 12,
}) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View
        style={[
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.elevatedSurface,
            borderRadius,
          },
          style,
        ]}
      >
        <FileText size={iconSize} color={colors.subtleText} />
      </View>
    );
  }

  return (
    <RNImage
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        console.warn("[SafeImage] failed to load image", { uri });
        setFailed(true);
      }}
    />
  );
}
