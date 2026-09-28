import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function SubscriptionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 bg-background p-5">
      <Text className="mt-8 text-3xl font-sans-bold text-primary">
        Subscription details
      </Text>
      <Text className="mt-3 text-base font-sans-medium text-muted-foreground">
        Subscription ID: {id ?? "unknown"}
      </Text>

      <View className="mt-6 rounded-[24px] border border-border bg-card p-5">
        <Text className="text-xl font-sans-bold text-primary">
          This screen is ready for the real detail view.
        </Text>
        <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
          Connect this route to your API or data layer to show plan details,
          billing cadence, and renewal history.
        </Text>
      </View>

      <Link
        href="/(tabs)/subscriptions"
        className="mt-8 rounded-[18px] bg-accent px-4 py-4 text-center text-lg font-sans-bold text-primary"
      >
        Back to subscriptions
      </Link>
    </View>
  );
}
