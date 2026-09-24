import "@/global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="sign-in" screenOptions={{ headerShown: false }} />
  );
}
