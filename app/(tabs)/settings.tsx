import { posthog } from "@/lib/posthog";
import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const SettingsScreen = () => {
  const { isLoaded: authLoaded, signOut } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  if (!authLoaded || !userLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color="#081126" />
      </SafeAreaView>
    );
  }

  if (isSigningOut) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
        <View className="w-full max-w-[360px] items-center rounded-[32px] border border-[#f2d5c4] bg-[#fffaf7] px-6 py-8 shadow-sm shadow-black/5">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-[24px] bg-accent">
            <Text className="text-4xl font-sans-extrabold text-background">
              R
            </Text>
          </View>

          <Text className="mb-2 text-center text-3xl font-sans-bold text-primary">
            Signing out
          </Text>
          <Text className="mb-6 text-center text-sm font-sans-medium text-primary/80">
            Please wait while we safely sign you out.
          </Text>

          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#f6e2d7]">
            <ActivityIndicator size="small" color="#ea7a53" />
          </View>

          <Text className="text-center text-sm font-sans-medium text-primary/80">
            Signing you out...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "My account";

  const email = user?.emailAddresses?.[0]?.emailAddress || "No email available";

  const joinedDate = user?.createdAt
    ? (() => {
        const d = new Date(user.createdAt);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}. ${mm}. ${yyyy}.`;
      })()
    : "N/A";

  const displayId = user?.id ? `${user.id.slice(0, 12)}...` : "N/A";

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      posthog?.capture("account_signed_out");
      posthog?.reset();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      posthog?.captureException(error, { authentication_flow: "sign_out" });
      Alert.alert("Sign out failed", "Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="mt-5 text-[42px] font-sans-bold leading-[1.1] text-primary">
        Settings
      </Text>

      <View className="mt-6 rounded-[22px] border border-border  p-4">
        <View className="flex-row items-center">
          <View className="mr-4 h-18.5 w-18.5 items-center justify-center overflow-hidden rounded-[18px] bg-[#f1f1f1]">
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                className="h-18.5 w-18.5"
                resizeMode="cover"
              />
            ) : (
              <View className="h-18.5 w-18.5 items-center justify-center rounded-[18px] bg-[#0d1f3b]">
                <Text className="text-[28px] font-sans-bold text-[#4da9eb]">
                  {initials || "SH"}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-[28px] font-sans-bold leading-[1.2] text-primary">
              {fullName}
            </Text>
            <Text className="mt-1 text-[18px] font-sans-medium text-primary/80">
              {email}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-6 rounded-[22px] border border-border p-5">
        <Text className="text-[30px] font-sans-bold text-primary">Account</Text>

        <View className="mt-5 gap-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-[18px] font-sans-medium text-primary/70">
              Account ID
            </Text>
            <Text
              className="flex-1 text-right text-[18px] font-sans-medium text-primary"
              numberOfLines={1}
            >
              {displayId}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-[18px] font-sans-medium text-primary/70">
              Joined
            </Text>
            <Text className="text-[18px] font-sans-medium text-primary">
              {joinedDate}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        disabled={isSigningOut}
        className={`mt-8 rounded-[18px] bg-accent p-4 ${
          isSigningOut ? "opacity-60" : ""
        }`}
      >
        {isSigningOut ? (
          <View className="flex-row items-center justify-center gap-2">
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text className="text-center text-[24px] font-sans-bold text-background">
              Signing out...
            </Text>
          </View>
        ) : (
          <Text className="text-center text-[24px] font-sans-bold text-background">
            Sign Out
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default SettingsScreen;
