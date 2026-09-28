import { styled } from "nativewind";
import { Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function InsightsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="mt-8 text-3xl font-sans-bold text-primary">
        Insights
      </Text>

      <View className="mt-6 rounded-[24px] border border-border bg-card p-5">
        <Text className="text-xl font-sans-bold text-primary">
          Spending overview
        </Text>
        <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
          This screen is ready for your analytics and trend charts.
        </Text>
      </View>
    </SafeAreaView>
  );
}
