import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const ListHeading = ({ title, onPress }: ListHeadingProps) => {
  return (
    <View className="list-head">
      <Text className="list-title">{title}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View all ${title.toLowerCase()}`}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Text className="list-action-text">View All</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListHeading;
