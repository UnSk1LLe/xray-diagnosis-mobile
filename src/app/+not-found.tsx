import { Ionicons } from "@expo/vector-icons";
import {
  type RelativePathString,
  type SitemapType,
  Stack,
  useGlobalSearchParams,
  useRouter,
  useSitemap,
} from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundaryWrapper } from "../../__create/SharedErrorBoundary";
import { useAppTheme } from "@/utils/theme";

interface ParentSitemap {
  expoPages?: Array<{
    id: string;
    name: string;
    filePath: string;
    cleanRoute?: string;
  }>;
}

function RouteButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: {
    surface: string;
    border: string;
    text: string;
  };
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "500",
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NotFoundScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const expoSitemap = useSitemap();
  const [sitemap, setSitemap] = useState<SitemapType | ParentSitemap | null>(
    expoSitemap,
  );
  const { colors, statusBarStyle } = useAppTheme();

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "sandbox:sitemap") {
          window.removeEventListener("message", handler);
          setSitemap(event.data.sitemap);
        }
      };

      window.parent.postMessage(
        {
          type: "sandbox:sitemap",
        },
        "*",
      );
      window.addEventListener("message", handler);

      return () => {
        window.removeEventListener("message", handler);
      };
    }
  }, []);

  const isExpoSitemap = sitemap === expoSitemap;
  const missingPath = params["not-found"]?.[0] || "";

  const availableRoutes = useMemo(() => {
    return (
      expoSitemap?.children?.filter(
        (child) =>
          child.href &&
          child.contextKey !== "./auth.jsx" &&
          child.contextKey !== "./auth.web.jsx" &&
          child.contextKey !== "./+not-found.tsx" &&
          child.contextKey !== "expo-router/build/views/Sitemap.js",
      ) || []
    );
  }, [expoSitemap]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      const hasTabsIndex = expoSitemap?.children?.some(
        (child) =>
          child.contextKey === "./(tabs)/_layout.jsx" &&
          child.children.some((nestedChild) => nestedChild.contextKey === "./(tabs)/index.jsx"),
      );

      if (isExpoSitemap) {
        if (hasTabsIndex) {
          router.replace("../(tabs)/index.jsx");
        } else {
          router.replace("../");
        }
      } else {
        router.replace("..");
      }
    }
  };

  const handleNavigate = (url: string) => {
    try {
      if (url) {
        router.push(url as RelativePathString);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleCreatePage = useCallback(() => {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "sandbox:web:create",
          path: missingPath,
          view: "mobile",
        },
        "*",
      );
    }
  }, [missingPath]);

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found", headerShown: false }} />
      <StatusBar style={statusBarStyle} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 20,
              gap: 8,
            }}
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.elevatedSurface,
              }}
            >
              <Ionicons name="arrow-back" size={18} color={colors.mutedText} />
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                height: 32,
                width: 300,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.softSurface,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 5,
                  justifyContent: "center",
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                }}
              >
                <Text style={{ color: colors.mutedText }}>/</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.mutedText }} numberOfLines={1}>
                  {missingPath}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 40,
              paddingHorizontal: 20,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "500",
                color: colors.text,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Uh-oh! This screen doesn't exist (yet).
            </Text>

            <Text
              style={{
                paddingTop: 16,
                paddingBottom: 48,
                color: colors.mutedText,
                textAlign: "center",
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              Looks like "
              <Text style={{ fontWeight: "bold", color: colors.text }}>
                /{missingPath}
              </Text>
              " isn't part of your project. But no worries, you've got options!
            </Text>

            {typeof window !== "undefined" && window.parent && window.parent !== window && (
              <View
                style={{
                  width: "100%",
                  maxWidth: 800,
                  marginBottom: 40,
                  paddingHorizontal: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 20,
                    backgroundColor: colors.surface,
                    gap: 15,
                  }}
                >
                  <View style={{ gap: 10 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.text,
                        fontWeight: "500",
                        textAlign: "center",
                      }}
                    >
                      Build it from scratch
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.mutedText,
                        textAlign: "center",
                      }}
                    >
                      Create a new screen to live at "/{missingPath}"
                    </Text>
                  </View>
                  <View
                    style={{
                      alignItems: "flex-start",
                      justifyContent: "center",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleCreatePage()}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: "500",
                        }}
                      >
                        Create Screen
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <Text
              style={{
                color: colors.mutedText,
                marginBottom: 80,
                textAlign: "center",
              }}
            >
              Check out all your project's routes here ↓
            </Text>

            <View
              style={{
                width: "100%",
                alignItems: "center",
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: "100%",
                  maxWidth: 600,
                  gap: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.subtleText,
                    alignSelf: "flex-start",
                    marginBottom: 10,
                    paddingHorizontal: 16,
                  }}
                >
                  MOBILE
                </Text>

                {!isExpoSitemap && sitemap
                  ? ((sitemap as ParentSitemap).expoPages || []).map((route) => (
                      <RouteButton
                        key={route.id}
                        label={route.name}
                        onPress={() => handleNavigate(route.cleanRoute || "")}
                        colors={colors}
                      />
                    ))
                  : (availableRoutes as SitemapType[]).map((route) => {
                      const url =
                        typeof route.href === "string"
                          ? route.href
                          : route.href?.pathname || "/";

                      if (url === "/(tabs)" && route.children) {
                        return route.children.map((childRoute: SitemapType) => {
                          const childUrl =
                            typeof childRoute.href === "string"
                              ? childRoute.href
                              : childRoute.href.pathname || "/";
                          const displayPath =
                            childUrl === "/(tabs)"
                              ? "Homepage"
                              : childUrl.replace(/^\//, "").replace(/^\(tabs\)\//, "");

                          return (
                            <RouteButton
                              key={childRoute.contextKey}
                              label={displayPath}
                              onPress={() => handleNavigate(childUrl)}
                              colors={colors}
                            />
                          );
                        });
                      }

                      const displayPath = url === "/" ? "Homepage" : url.replace(/^\//, "");

                      return (
                        <RouteButton
                          key={route.contextKey}
                          label={displayPath}
                          onPress={() => handleNavigate(url)}
                          colors={colors}
                        />
                      );
                    })}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

export default function NotFoundPage() {
  return (
    <ErrorBoundaryWrapper>
      <NotFoundScreen />
    </ErrorBoundaryWrapper>
  );
}
