import { HOME_SUBSCRIPTIONS } from "@/constants/data";

const subscriptionStore: Subscription[] = [...HOME_SUBSCRIPTIONS];
const listeners = new Set<(next: Subscription[]) => void>();

const notify = () => {
  const snapshot = [...subscriptionStore];
  listeners.forEach((listener) => listener(snapshot));
};

export const getSubscriptions = () => [...subscriptionStore];

export const subscribeToSubscriptions = (
  listener: (next: Subscription[]) => void,
) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const addSubscription = (subscription: Subscription) => {
  subscriptionStore.unshift(subscription);
  notify();
  return getSubscriptions();
};

export const replaceSubscriptions = (nextSubscriptions: Subscription[]) => {
  subscriptionStore.splice(0, subscriptionStore.length, ...nextSubscriptions);
  notify();
  return getSubscriptions();
};

export const filterSubscriptions = (query: string) => {
  const cleanedQuery = query.trim().toLowerCase();

  if (!cleanedQuery) {
    return getSubscriptions();
  }

  return getSubscriptions().filter((subscription) => {
    const searchableText = [
      subscription.name,
      subscription.plan,
      subscription.category,
      subscription.paymentMethod,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(cleanedQuery);
  });
};
