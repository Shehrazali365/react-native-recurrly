import { FlatList, Image, Pressable, Text, View } from "react-native";

import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import { HOME_BALANCE } from "@/constants/data";
import { icons } from "@/constants/icons";
import { posthog } from "@/lib/posthog";
import {
  getLocalCalendarDayDifference,
  getNextExpectedCharge,
} from "@/lib/subscription-insights";
import {
  addSubscription,
  getSubscriptions,
  subscribeToSubscriptions,
} from "@/lib/subscription-store";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useState } from "react";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  const router = useRouter();
  const { user } = useUser();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(),
  );
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSubscriptions((next) => {
      setSubscriptions(next);
    });

    return unsubscribe;
  }, []);

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "My account";

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const now = new Date();
  const upcomingSubscriptions = subscriptions
    .flatMap((subscription) => {
      const nextCharge = getNextExpectedCharge(subscription, now);
      if (!nextCharge) return [];

      return [
        {
          ...subscription,
          daysLeft: getLocalCalendarDayDifference(nextCharge.date, now),
          nextPaymentDate: nextCharge.date.toISOString(),
        },
      ];
    })
    .sort(
      (left, right) =>
        new Date(left.nextPaymentDate).getTime() -
        new Date(right.nextPaymentDate).getTime(),
    );

  const handleCreateSubscription = async (subscription: Subscription) => {
    await addSubscription(subscription);
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={handleCreateSubscription}
      />

      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="home-avatar"
                  />
                ) : (
                  <View className="home-avatar items-center justify-center bg-primary">
                    <Text className="text-lg font-sans-bold text-background">
                      {initials}
                    </Text>
                  </View>
                )}
                <Text className="home-user-name">{userName}</Text>
              </View>

              <Pressable onPress={() => setIsCreateModalVisible(true)}>
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>

                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading
                title="Upcoming"
                onPress={() => router.navigate("/(tabs)/subscriptions")}
              />
              <FlatList
                data={upcomingSubscriptions}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>

            <ListHeading
              title="All Subscriptions"
              onPress={() => router.navigate("/(tabs)/subscriptions")}
            />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              const willExpand = expandedSubscriptionId !== item.id;
              posthog?.capture("subscription_details_toggled", {
                subscription_id: item.id,
                action: willExpand ? "expanded" : "collapsed",
                category: item.category ?? "unknown",
                billing_interval: item.billing,
                subscription_status: item.status ?? "unknown",
              });
              setExpandedSubscriptionId(willExpand ? item.id : null);
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text>No subscriptions yet.</Text>}
        contentContainerClassName="pb-30"
      />
    </SafeAreaView>
  );
}
