import SubscriptionCard from "@/components/SubscriptionCard";
import {
  getDailyExpectedTotals,
  getExpectedCharges,
  getExpectedTotalsByCurrency,
  getLocalMonthRange,
  getLocalWeekRange,
  getMonthlyRecurringTotals,
  getPercentageChange,
  getPreviousMonthRange,
} from "@/lib/subscription-insights";
import { formatCurrency } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getSubscriptionStorageError,
  getSubscriptions,
  subscribeToSubscriptions,
} from "../../lib/subscription-store";

const palette = {
  background: "#FFFBE8",
  chart: "#F5EDC8",
  navy: "#07132F",
  orange: "#F4774F",
  yellow: "#F9D83F",
  mint: "#A5DCCB",
  secondary: "#526784",
  border: "#D8D1B7",
  white: "#FFFFFF",
};

function SectionHeading({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll: () => void;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: palette.navy,
          fontFamily: "sans-bold",
          fontSize: 20,
        }}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View all ${title.toLowerCase()}`}
        onPress={onViewAll}
        style={{
          borderColor: palette.border,
          borderRadius: 22,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <Text
          style={{
            color: palette.navy,
            fontFamily: "sans-semibold",
            fontSize: 15,
          }}
        >
          View all
        </Text>
      </Pressable>
    </View>
  );
}

function UpcomingChart({
  bars,
  currency,
}: {
  bars: { day: string; amount: number }[];
  currency: string;
}) {
  const chartHeight = 180;
  const maxAmount = Math.max(0, ...bars.map((bar) => bar.amount));
  const rawStep = (maxAmount * 1.25) / 5;
  const magnitude = rawStep > 0 ? 10 ** Math.floor(Math.log10(rawStep)) : 1;
  const step = rawStep > 0 ? Math.ceil(rawStep / magnitude) * magnitude : 1;
  const axisMax = step * 5;
  const gridPositions = Array.from(
    { length: 6 },
    (_, index) => (chartHeight * index) / 5,
  );
  const scaleLabels = gridPositions.map((_, index) => {
    const value = axisMax * (1 - index / 5);
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  });

  return (
    <View
      style={{
        backgroundColor: palette.chart,
        borderRadius: 18,
        height: 264,
        overflow: "hidden",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", height: chartHeight + 28 }}>
        <View style={{ height: chartHeight, width: 24 }}>
          {scaleLabels.map((label, index) => (
            <Text
              key={label}
              style={{
                color: palette.secondary,
                fontFamily: "sans-medium",
                fontSize: 12,
                position: "absolute",
                right: 5,
                top: Math.max(0, gridPositions[index] - 7),
              }}
            >
              {label}
            </Text>
          ))}
        </View>

        <View style={{ flex: 1, height: chartHeight }}>
          {gridPositions.map((top) => (
            <View
              key={top}
              style={{
                borderColor: "#DED5B5",
                borderStyle: "dashed",
                borderTopWidth: 1,
                left: 0,
                position: "absolute",
                right: 0,
                top,
              }}
            />
          ))}

          <View
            style={{
              flexDirection: "row",
              height: chartHeight,
              justifyContent: "space-between",
            }}
          >
            {bars.map((bar) => {
              const highlighted = bar.day === "Thu";
              const barHeight = (bar.amount / axisMax) * chartHeight;
              return (
                <View
                  key={bar.day}
                  style={{
                    alignItems: "center",
                    flex: 1,
                    height: chartHeight,
                    justifyContent: "flex-end",
                    position: "relative",
                  }}
                >
                  {highlighted && (
                    <View
                      style={{
                        alignItems: "center",
                        backgroundColor: palette.white,
                        borderRadius: 9,
                        left: "50%",
                        paddingHorizontal: 7,
                        paddingVertical: 5,
                        position: "absolute",
                        top: Math.max(0, chartHeight - barHeight - 36),
                        transform: [{ translateX: -21 }],
                        zIndex: 2,
                      }}
                    >
                      <Text
                        style={{
                          color: palette.orange,
                          fontFamily: "sans-semibold",
                          fontSize: 13,
                        }}
                      >
                        {formatCurrency(bar.amount, currency)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={{
                      backgroundColor: highlighted
                        ? palette.orange
                        : palette.navy,
                      borderRadius: 8,
                      height: barHeight,
                      width: 12,
                    }}
                  />
                  <Text
                    style={{
                      color: palette.secondary,
                      fontFamily: "sans-medium",
                      fontSize: 12,
                      height: 28,
                      paddingTop: 12,
                      position: "absolute",
                      textAlign: "center",
                      top: chartHeight + 1,
                      width: 38,
                    }}
                  >
                    {bar.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(),
  );
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    return subscribeToSubscriptions(
      (next: Subscription[], isReady: boolean) => {
        setSubscriptions(next);
        setIsLoadingSubscriptions(!isReady);
      },
    );
  }, []);

  const now = new Date();
  const monthRange = getLocalMonthRange(now);
  const previousMonthRange = getPreviousMonthRange(now);
  const weekRange = getLocalWeekRange(now);
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(now);
  const formatShortDate = (date: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  const weekLabel = `${formatShortDate(weekRange.start)} - ${formatShortDate(
    new Date(weekRange.end.getTime() - 1),
  )}`;
  const monthCharges = getExpectedCharges(
    subscriptions,
    monthRange.start,
    monthRange.end,
    now,
  );
  const previousMonthCharges = getExpectedCharges(
    subscriptions,
    previousMonthRange.start,
    previousMonthRange.end,
    now,
  );
  const weekCharges = getExpectedCharges(
    subscriptions,
    weekRange.start,
    weekRange.end,
    now,
  );
  const expectedTotals = getExpectedTotalsByCurrency(monthCharges);
  const previousTotals = new Map(
    getExpectedTotalsByCurrency(previousMonthCharges).map(
      ({ currency, amount }) => [currency, amount],
    ),
  );
  const recurringTotals = getMonthlyRecurringTotals(subscriptions, now);
  const chartCurrency =
    recurringTotals[0]?.currency ??
    subscriptions.find((subscription) => subscription.currency)?.currency ??
    "USD";
  const weeklyBars = getDailyExpectedTotals(
    weekCharges.filter((charge) => charge.currency === chartCurrency),
    weekRange.start,
  ).map(({ label, amount }) => ({ day: label, amount }));
  const weeklyOtherCurrencyTotals = getExpectedTotalsByCurrency(
    weekCharges.filter((charge) => charge.currency !== chartCurrency),
  );
  const expenseCurrencies = new Set([
    ...expectedTotals.map(({ currency }) => currency),
    ...previousTotals.keys(),
    ...recurringTotals.map(({ currency }) => currency),
  ]);
  if (expenseCurrencies.size === 0) expenseCurrencies.add(chartCurrency);
  const expensesByCurrency = [...expenseCurrencies].map((currency) => ({
    currency,
    amount:
      expectedTotals.find((total) => total.currency === currency)?.amount ?? 0,
    recurring:
      recurringTotals.find((total) => total.currency === currency)?.amount ?? 0,
    change: getPercentageChange(
      expectedTotals.find((total) => total.currency === currency)?.amount ?? 0,
      previousTotals.get(currency) ?? 0,
    ),
  }));

  const openSubscriptions = () => router.navigate("/(tabs)/subscriptions");

  if (isLoadingSubscriptions) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{
          alignItems: "center",
          backgroundColor: palette.background,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={palette.navy} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ backgroundColor: palette.background, flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={palette.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            height: 68,
            justifyContent: "space-between",
            marginBottom: 12,
            marginTop: 8,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.navigate("/")
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
            <Feather color={palette.navy} name="chevron-left" size={23} />
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
            Monthly Insights
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            onPress={() => Alert.alert("Monthly insights", monthLabel)}
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

        <View style={{ marginTop: 8 }}>
          <SectionHeading title="Upcoming" onViewAll={openSubscriptions} />
          <Text
            style={{
              color: palette.secondary,
              fontFamily: "sans-medium",
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Expected due dates · {weekLabel} · {chartCurrency}
          </Text>
          <UpcomingChart bars={weeklyBars} currency={chartCurrency} />
          {weeklyOtherCurrencyTotals.length > 0 && (
            <Text
              style={{
                color: palette.secondary,
                fontFamily: "sans-medium",
                fontSize: 12,
                marginTop: 7,
              }}
            >
              Other currencies this week:{" "}
              {weeklyOtherCurrencyTotals
                .map(({ currency, amount }) => formatCurrency(amount, currency))
                .join(" · ")}
            </Text>
          )}
        </View>

        <View
          style={{
            alignItems: "center",
            backgroundColor: palette.background,
            borderColor: palette.border,
            borderRadius: 16,
            borderWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
            minHeight: 96,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <View style={{ flexShrink: 1, paddingRight: 8 }}>
            <Text
              style={{
                color: palette.navy,
                fontFamily: "sans-bold",
                fontSize: 18,
              }}
            >
              Expenses
            </Text>
            <Text
              style={{
                color: palette.secondary,
                fontFamily: "sans-medium",
                fontSize: 14,
                marginTop: 5,
              }}
            >
              Expected · {monthLabel}
            </Text>
            <Text
              style={{
                color: palette.secondary,
                fontFamily: "sans-medium",
                fontSize: 12,
                marginTop: 5,
              }}
            >
              Monthly recurring
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
            {expensesByCurrency.map((expense) => (
              <View key={expense.currency} style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: palette.navy,
                    fontFamily: "sans-bold",
                    fontSize: 18,
                  }}
                >
                  {formatCurrency(expense.amount, expense.currency)}
                </Text>
                <Text
                  style={{
                    color: palette.secondary,
                    fontFamily: "sans-medium",
                    fontSize: 12,
                    marginTop: 3,
                  }}
                >
                  {expense.change === null
                    ? "— vs previous month"
                    : `${expense.change > 0 ? "+" : ""}${expense.change.toFixed(1)}% vs previous month`}
                </Text>
              </View>
            ))}
            <Text
              style={{
                color: palette.secondary,
                fontFamily: "sans-medium",
                fontSize: 12,
                marginTop: 7,
                textAlign: "right",
              }}
            >
              {recurringTotals.length > 0
                ? recurringTotals
                    .map(({ currency, amount }) =>
                      formatCurrency(amount, currency),
                    )
                    .join(" · ")
                : formatCurrency(0, chartCurrency)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <SectionHeading title="History" onViewAll={openSubscriptions} />
          <Text
            style={{
              color: palette.secondary,
              fontFamily: "sans-medium",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Scheduled charges, not recorded payments.
          </Text>
          <View style={{ gap: 16 }}>
            {monthCharges.map((charge) => {
              const entryId = `${charge.subscription.id}-${charge.date.getTime()}`;
              return (
                <SubscriptionCard
                  key={entryId}
                  {...charge.subscription}
                  category={`Scheduled · ${formatShortDate(charge.date)}`}
                  renewalDate={charge.date.toISOString()}
                  expanded={expandedSubscriptionId === entryId}
                  onPress={() =>
                    setExpandedSubscriptionId((current) =>
                      current === entryId ? null : entryId,
                    )
                  }
                />
              );
            })}
            {monthCharges.length === 0 && (
              <Text
                style={{
                  color: palette.secondary,
                  fontFamily: "sans-medium",
                  fontSize: 15,
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              >
                {getSubscriptionStorageError()
                  ? "Unable to load saved subscriptions."
                  : "No scheduled charges this month."}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
