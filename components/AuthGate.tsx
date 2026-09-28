import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

type AuthGateProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
};

export default function AuthGate({
  children,
  requireAuth = true,
  redirectTo = "/(auth)/sign-in",
}: AuthGateProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color="#081126" />
      </View>
    );
  }

  const destination = redirectTo as any;

  if (requireAuth && !isSignedIn) {
    return <Redirect href={destination} />;
  }

  if (!requireAuth && isSignedIn) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
