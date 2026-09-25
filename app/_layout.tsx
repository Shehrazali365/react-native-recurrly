import "@/global.css";
import { posthog } from "@/lib/posthog";
import { ClerkProvider , useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { PostHogProvider } from "posthog-react-native";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Set it in your local .env or inject it via EAS/CI build secrets.",
  );
}

function RootLayoutContent() {

  const {isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const pathname = usePathname();
  const previousPathname = useRef<string | null>(null);
  const identifiedUserId = useRef<string | null>(null);

  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded , authLoaded]);

  useEffect(() => {
    if (posthog && previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current,
      });
      previousPathname.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!posthog || !userLoaded) return;

    if (!user) {
      identifiedUserId.current = null;
      return;
    }

    if (identifiedUserId.current === user.id) return;

    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
    });
    identifiedUserId.current = user.id;
  }, [user, userLoaded]);

  if (!fontsLoaded || !authLoaded) return null;

  return <Stack screenOptions={{headerShown: false}} />

}

export default function RootLayout(){
  const content = posthog ? (
    <PostHogProvider
      client={posthog}
      autocapture={{ captureScreens: false, captureTouches: true }}
    >
      <RootLayoutContent />
    </PostHogProvider>
  ) : (
    <RootLayoutContent />
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {content}
    </ClerkProvider>
  );
}
