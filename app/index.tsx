import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function IndexRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const [fallbackReady, setFallbackReady] = useState(false);
  const startupDelayMs = 1200;

  useEffect(() => {
    const timeout = setTimeout(() => setFallbackReady(true), startupDelayMs);
    return () => clearTimeout(timeout);
  }, []);

  if (!isLoaded && !fallbackReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <View className="w-full max-w-[360px] items-center rounded-[32px] border border-[#f2d5c4] bg-[#fffaf7] px-6 py-8 shadow-sm shadow-black/5">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-[24px] bg-accent">
            <Text className="text-4xl font-sans-extrabold text-background">
              R
            </Text>
          </View>

          <Text className="mb-2 text-center text-3xl font-sans-bold text-primary">
            Recurrly
          </Text>
          <Text className="mb-6 text-center text-xs font-sans-medium uppercase tracking-[3px] text-muted-foreground">
            Smart billing
          </Text>

          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#f6e2d7]">
            <ActivityIndicator size="small" color="#ea7a53" />
          </View>

          <Text className="text-center text-sm font-sans-medium text-primary/80">
            Preparing your workspace...
          </Text>
        </View>
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)" : "/(auth)/sign-in"} />;
}
