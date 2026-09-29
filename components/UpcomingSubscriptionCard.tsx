import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { Image, Text, View } from "react-native";

const UpcomingSubscriptionCard = ({
  name,
  price,
  daysLeft,
  icon,
  currency,
  nextPaymentDate,
}: UpcomingSubscription) => {
  const relativeDate =
    daysLeft === 0
      ? "Due today"
      : daysLeft === 1
        ? "Due tomorrow"
        : `In ${daysLeft} days`;
  const dueDate = nextPaymentDate
    ? dayjs(nextPaymentDate).format("MMM D")
    : null;

  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <Image source={icon} className="upcoming-icon" />
        <View className="upcoming-info" style={{ flex: 1, minWidth: 0 }}>
          <Text
            className="upcoming-price"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {formatCurrency(price, currency)}
          </Text>
          <Text
            className="upcoming-meta"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {relativeDate}
          </Text>
          {dueDate && (
            <Text className="upcoming-meta" numberOfLines={1}>
              {dueDate}
            </Text>
          )}
        </View>
      </View>

      <Text className="upcoming-name" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
