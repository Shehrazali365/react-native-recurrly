import SubscriptionCard from "@/components/SubscriptionCard";
import { icons } from "@/constants/icons";
import {
  filterSubscriptions,
  getSubscriptions,
} from "@/lib/subscription-store";
import { styled } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
  const [search, setSearch] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    void getSubscriptions();
  }, []);

  const filteredSubscriptions = useMemo(() => {
    return filterSubscriptions(search);
  }, [search]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              setExpandedSubscriptionId((current) =>
                current === item.id ? null : item.id,
              );
            }}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: 88,
          paddingTop: 12,
        }}
        ListHeaderComponent={
          <>
            <View className="mb-3 flex-row items-center justify-between px-1 pt-1">
              <Pressable
                accessibilityRole="button"
                className="items-center justify-center rounded-full border border-border  p-3"
                onPress={() => setSearch("")}
              >
                <Image source={icons.back} className="h-4 w-4" />
              </Pressable>

              <Text className="text-[28px] font-sans-bold text-[#081126]">
                Subscriptions
              </Text>

              <Pressable
                accessibilityRole="button"
                className="items-center justify-center rounded-full border border-border  p-3"
                onPress={() => setSearch("")}
              >
                <Image source={icons.menu} className="h-4 w-4" />
              </Pressable>
            </View>

            <View className="mb-4 rounded-full border border-border  px-4 py-2.5 shadow-[0_1px_0_rgba(8,17,38,0.04)]">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search subscriptions"
                placeholderTextColor="#5f6470"
                selectionColor="#081126"
                autoCapitalize="none"
                autoCorrect={false}
                className="text-base font-sans-medium text-[#081126]"
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="mt-8 rounded-2xl border border-dashed border-black/10 bg-white/30 p-6">
            <Text className="text-center text-base font-sans-medium text-[#081126]">
              No subscriptions match your search.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
