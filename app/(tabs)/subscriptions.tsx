import SubscriptionCard from "@/components/SubscriptionCard";
import {
  deleteSubscription,
  getSubscriptions,
  subscribeToSubscriptions,
} from "@/lib/subscription-store";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const palette = {
  background: "#FFFBE8",
  navy: "#07132F",
  secondary: "#526784",
  border: "#D8D1B7",
};

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(),
  );
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    return subscribeToSubscriptions(setSubscriptions);
  }, []);

  const filteredSubscriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subscriptions;

    return subscriptions.filter((subscription) =>
      [
        subscription.name,
        subscription.plan,
        subscription.category,
        subscription.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, subscriptions]);

  const showMenu = () => {
    Alert.alert("My Subscriptions", undefined, [
      { text: "Search", onPress: () => setSearchVisible(true) },
      { text: "Close", style: "cancel" },
    ]);
  };

  const confirmDeleteSubscription = (subscription: Subscription) => {
    Alert.alert(
      "Remove subscription?",
      `Remove ${subscription.name}? This cannot be undone.`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setDeletingSubscriptionId(subscription.id);
            void deleteSubscription(subscription.id)
              .then(() => setExpandedSubscriptionId(null))
              .catch((error: unknown) => {
                Alert.alert(
                  "Unable to remove subscription",
                  error instanceof Error ? error.message : "Please try again.",
                );
              })
              .finally(() => setDeletingSubscriptionId(null));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: palette.background, flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          height: 50,
          justifyContent: "space-between",
          marginBottom: searchVisible ? 16 : 32,
          marginHorizontal: 16,
          marginTop: 6,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.navigate("/(tabs)")
          }
          style={{
            alignItems: "center",
            borderColor: palette.border,
            borderRadius: 26,
            borderWidth: 1,
            height: 50,
            justifyContent: "center",
            width: 50,
          }}
        >
          <Feather color={palette.navy} name="chevron-left" size={22} />
        </Pressable>
        <Text
          style={{
            color: palette.navy,
            fontFamily: "sans-bold",
            fontSize: 19,
            left: 50,
            position: "absolute",
            right: 50,
            textAlign: "center",
          }}
        >
          My Subscriptions
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          onPress={showMenu}
          style={{
            alignItems: "center",
            borderColor: palette.border,
            borderRadius: 26,
            borderWidth: 1,
            height: 50,
            justifyContent: "center",
            width: 50,
          }}
        >
          <Feather color={palette.navy} name="more-horizontal" size={22} />
        </Pressable>
      </View>

      {searchVisible && (
        <View
          style={{
            alignItems: "center",
            borderColor: palette.border,
            borderRadius: 22,
            borderWidth: 1,
            flexDirection: "row",
            marginBottom: 16,
            marginHorizontal: 16,
            paddingHorizontal: 14,
          }}
        >
          <TextInput
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Search subscriptions"
            placeholderTextColor={palette.secondary}
            selectionColor={palette.navy}
            style={{
              color: palette.navy,
              flex: 1,
              fontFamily: "sans-medium",
              fontSize: 15,
              paddingVertical: 11,
            }}
            value={search}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close search"
            onPress={() => {
              setSearch("");
              setSearchVisible(false);
            }}
          >
            <Feather color={palette.secondary} name="x" size={19} />
          </Pressable>
        </View>
      )}

      <FlatList
        data={filteredSubscriptions}
        extraData={deletingSubscriptionId ?? expandedSubscriptionId}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onDeletePress={() => confirmDeleteSubscription(item)}
            isDeleting={deletingSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((current) =>
                current === item.id ? null : item.id,
              )
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
        ListEmptyComponent={
          <Text
            style={{
              color: palette.secondary,
              fontFamily: "sans-medium",
              fontSize: 15,
              paddingTop: 12,
              textAlign: "center",
            }}
          >
            No subscriptions match your search.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
