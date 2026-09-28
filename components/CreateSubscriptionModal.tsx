import { resolveSubscriptionIcon } from "@/constants/icons";
import { posthog } from "@/lib/posthog";
import { clsx } from "clsx";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const FREQUENCY_OPTIONS = ["Monthly", "Yearly"] as const;
const CATEGORY_OPTIONS = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "#f5d7a4",
  "AI Tools": "#d7e7ff",
  "Developer Tools": "#d9d4ff",
  Design: "#f7d4de",
  Productivity: "#d6f2d0",
  Cloud: "#d8eff6",
  Music: "#ecd8ff",
  Other: "#e8d7c2",
};

const SUBSCRIPTION_COLORS = [
  "#f5d7a4",
  "#d7e7ff",
  "#d9d4ff",
  "#f7d4de",
  "#d6f2d0",
  "#d8eff6",
  "#ecd8ff",
  "#e8d7c2",
  "#f5d6cb",
  "#d4f0f1",
  "#cfe8d8",
  "#f4e7c7",
] as const;

const getSubscriptionColor = (name: string) => {
  const hash = Array.from(name).reduce((total, char) => {
    return total + char.charCodeAt(0);
  }, 0);

  return (
    SUBSCRIPTION_COLORS[
      Math.abs(hash + Date.now()) % SUBSCRIPTION_COLORS.length
    ] ?? CATEGORY_COLORS["Entertainment"]
  );
};

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

const defaultFormState = {
  name: "",
  price: "",
  frequency: "Monthly" as "Monthly" | "Yearly",
  category: "Entertainment" as string,
};

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState(defaultFormState.name);
  const [price, setPrice] = useState(defaultFormState.price);
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">(
    defaultFormState.frequency,
  );
  const [category, setCategory] = useState(defaultFormState.category);
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setName(defaultFormState.name);
    setPrice(defaultFormState.price);
    setFrequency(defaultFormState.frequency);
    setCategory(defaultFormState.category);
    setFormError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedPrice = Number.parseFloat(price);

    if (!trimmedName) {
      setFormError("Please enter a subscription name.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError("Please enter a valid price greater than 0.");
      return;
    }

    const startDate = dayjs().toISOString();
    const renewalDate =
      frequency === "Monthly"
        ? dayjs().add(1, "month").toISOString()
        : dayjs().add(1, "year").toISOString();

    const newSubscription: Subscription = {
      id: `${trimmedName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      name: trimmedName,
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate,
      renewalDate,
      icon: resolveSubscriptionIcon(trimmedName),
      billing: frequency,
      color: getSubscriptionColor(trimmedName),
    };

    posthog?.capture("subscription_created", {
      subscription_id: newSubscription.id,
      subscription_name: newSubscription.name,
      subscription_category: newSubscription.category ?? "unknown",
      subscription_frequency: newSubscription.frequency ?? "monthly",
      subscription_billing: newSubscription.billing,
      subscription_price: newSubscription.price,
      subscription_status: newSubscription.status ?? "active",
      renewal_date: newSubscription.renewalDate ?? null,
      start_date: newSubscription.startDate ?? null,
      icon_source: "resolved",
    });

    onCreate(newSubscription);
    resetForm();
    onClose();
  };

  const isSubmitDisabled = !name.trim() || Number.parseFloat(price) <= 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="modal-overlay" onPress={handleClose}>
        <Pressable onPress={() => undefined} className="modal-container">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View className="modal-header">
                <Text className="modal-title">New Subscription</Text>

                <Pressable onPress={handleClose} className="modal-close">
                  <Text className="modal-close-text">×</Text>
                </Pressable>
              </View>

              <View className="modal-body">
                <View className="modal-form-field">
                  <Text className="modal-label">Name</Text>
                  <TextInput
                    className="modal-input"
                    value={name}
                    onChangeText={(value) => {
                      setName(value);
                      setFormError("");
                    }}
                    placeholder="e.g. Netflix"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                <View className="modal-form-field">
                  <Text className="modal-label">Price</Text>
                  <TextInput
                    className="modal-input"
                    value={price}
                    onChangeText={(value) => {
                      setPrice(value);
                      setFormError("");
                    }}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    autoCorrect={false}
                    inputMode="decimal"
                  />
                </View>

                <View className="modal-form-field">
                  <Text className="modal-label">Frequency</Text>
                  <View className="picker-row">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => setFrequency(option)}
                        className={clsx(
                          "picker-option",
                          frequency === option && "picker-option-active",
                        )}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            frequency === option && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="modal-form-field">
                  <Text className="modal-label">Category</Text>
                  <View className="category-scroll">
                    {CATEGORY_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => setCategory(option)}
                        className={clsx(
                          "category-chip",
                          category === option && "category-chip-active",
                        )}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            category === option && "category-chip-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {formError ? (
                  <Text className="auth-error">{formError}</Text>
                ) : null}

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled}
                  className={clsx(
                    "modal-submit",
                    isSubmitDisabled && "modal-submit-disabled",
                  )}
                >
                  <Text className="modal-submit-text">Create Subscription</Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
