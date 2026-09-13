import { Link } from "expo-router";
import { Text, View } from "react-native";
 
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-blue-500">
        Welcome to Nativewind Shehraz Ali! 
      </Text>
      <Link href="/onboarding" className="mt-4 rounded text-white bg-primary p-4">Go to Onboarding</Link>
      <Link href="/(auth)/sign-in" className="mt-4 rounded text-white bg-primary p-4">Go to Sign in</Link>
      <Link href="/(auth)/sign-up" className="mt-4 rounded text-white bg-primary p-4">Go to Sign up</Link>

      <Link href="/(tabs)/subscriptions" className="mt-4 rounded text-white bg-primary p-4">Spotify subscription</Link>

      <Link href={{
        pathname : "/subscriptions/[id]",
        params : {id : "claude"}
      }} className="mt-4 rounded text-white bg-primary p-4">Claude max subscription</Link>
    </View>
  );
}