import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-sm rounded-[28px] border border-border bg-card p-6">
        <Text className="text-3xl font-sans-bold text-primary">
          Welcome to Recurrly
        </Text>
        <Text className="mt-3 text-base font-sans-medium text-muted-foreground">
          Track what you pay, spot renewals, and manage your subscriptions with
          less effort.
        </Text>

        <Pressable className="mt-6 items-center rounded-[18px] bg-accent px-4 py-4">
          <Link
            href="/(auth)/sign-in"
            className="text-lg font-sans-bold text-primary"
          >
            Get started
          </Link>
        </Pressable>

        <Link
          href="/"
          className="mt-4 text-center text-base font-sans-semibold text-accent"
        >
          Skip for now
        </Link>
      </View>
    </View>
  );
}
