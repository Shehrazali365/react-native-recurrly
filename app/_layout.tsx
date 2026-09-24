import { Stack } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import "@/global.css";

SplashScreen.preventAutoHideAsync();

const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Add your clerk Publishable Key to the .env file"
  );
}

export default function RootLayout() {

  const [fontsLoaded] = useFonts({

    'sans-regular' : require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold' : require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium' : require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold' : require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold' : require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light' : require('../assets/fonts/PlusJakartaSans-Light.ttf'),

  })

  useEffect(() => {
    if(fontsLoaded){
      SplashScreen.hideAsync()
    }
  },[fontsLoaded])

  if(!fontsLoaded) return null;


  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </ClerkProvider>
  );
}
