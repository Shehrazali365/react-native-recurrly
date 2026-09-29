import { resolveSubscriptionIcon } from "@/constants/icons";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

type StoredSubscription = Omit<Subscription, "icon">;

const getSubscriptionsFile = (ownerId: string) => {
  const safeOwnerId = ownerId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return new File(Paths.document, `recurrly-subscriptions-${safeOwnerId}.json`);
};
const getStorageKey = (ownerId: string) => {
  const safeOwnerId = ownerId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `recurrly-subscriptions-${safeOwnerId}`;
};
let subscriptionStore: Subscription[] = [];
let activeOwnerId = "local";
let subscriptionsLoaded = false;
let storageError: string | null = null;
const listeners = new Set<(next: Subscription[], isReady: boolean) => void>();
let persistenceQueue = Promise.resolve();
let mutationQueue = Promise.resolve();
let subscriptionsReady: Promise<void> = Promise.resolve();

const snapshotForStorage = (subscriptions: Subscription[]) =>
  JSON.stringify(
    subscriptions.map(({ icon: _icon, ...subscription }) => subscription),
  );

const persistSubscriptions = (
  subscriptions = subscriptionStore,
  ownerId = activeOwnerId,
) => {
  const contents = snapshotForStorage(subscriptions);
  const write = persistenceQueue.then(() => {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") {
        throw new Error("Browser storage is unavailable.");
      }
      localStorage.setItem(getStorageKey(ownerId), contents);
    } else {
      const file = getSubscriptionsFile(ownerId);
      if (!file.exists) {
        file.create({ intermediates: true });
      }
      file.write(contents);
    }
    storageError = null;
  });

  persistenceQueue = write.catch((error: unknown) => {
    storageError =
      error instanceof Error ? error.message : "Unable to save subscriptions.";
  });

  return write;
};

const notify = (isReady = subscriptionsLoaded) => {
  const snapshot = [...subscriptionStore];
  listeners.forEach((listener) => listener(snapshot, isReady));
};

const isStoredSubscription = (value: unknown): value is StoredSubscription => {
  if (!value || typeof value !== "object") return false;
  const subscription = value as Partial<StoredSubscription>;
  return (
    typeof subscription.id === "string" &&
    typeof subscription.name === "string" &&
    typeof subscription.price === "number" &&
    Number.isFinite(subscription.price) &&
    subscription.price >= 0 &&
    typeof subscription.billing === "string"
  );
};

const restoreSubscriptions = (stored: unknown): Subscription[] => {
  if (!Array.isArray(stored)) return [];
  return stored.filter(isStoredSubscription).map((subscription) => ({
    ...subscription,
    icon: resolveSubscriptionIcon(subscription.name),
  }));
};

export const setSubscriptionOwner = (ownerId: string) => {
  if (!ownerId || ownerId === activeOwnerId) return subscriptionsReady;

  activeOwnerId = ownerId;
  subscriptionsLoaded = false;
  storageError = null;
  subscriptionStore = [];
  notify();

  subscriptionsReady = (async () => {
    try {
      let nextSubscriptions: Subscription[];
      const storedContents =
        Platform.OS === "web"
          ? typeof localStorage === "undefined"
            ? null
            : localStorage.getItem(getStorageKey(ownerId))
          : await (async () => {
              const file = getSubscriptionsFile(ownerId);
              return file.exists ? file.text() : null;
            })();
      if (storedContents !== null) {
        const stored = JSON.parse(storedContents) as unknown;
        nextSubscriptions = restoreSubscriptions(stored);
      } else {
        nextSubscriptions = [];
        subscriptionStore = nextSubscriptions;
        await persistSubscriptions(nextSubscriptions, ownerId);
      }

      if (activeOwnerId !== ownerId) return;
      subscriptionStore = nextSubscriptions;
    } catch (error) {
      if (activeOwnerId === ownerId) {
        storageError =
          error instanceof Error
            ? error.message
            : "Unable to load subscriptions.";
      }
    }

    if (activeOwnerId === ownerId) {
      subscriptionsLoaded = true;
      notify();
    }
  })();

  return subscriptionsReady;
};

const validateSubscription = (subscription: Subscription) => {
  if (!subscription.name.trim()) {
    throw new Error("A subscription name is required.");
  }
  if (!Number.isFinite(subscription.price) || subscription.price < 0) {
    throw new Error("Subscription price must be a valid non-negative amount.");
  }
  if (!subscription.billing?.trim()) {
    throw new Error("A billing interval is required.");
  }
};

const waitForActiveOwner = async () => {
  const ownerAtCall = activeOwnerId;
  const readyAtCall = subscriptionsReady;
  await readyAtCall;
  if (activeOwnerId !== ownerAtCall) {
    throw new Error("The active account changed. Please retry the action.");
  }
  return ownerAtCall;
};

const serializeMutation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = mutationQueue.then(operation);
  mutationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const getSubscriptions = () => [...subscriptionStore];

export const getSubscriptionStorageError = () => storageError;

export const subscribeToSubscriptions = (
  listener: (next: Subscription[], isReady: boolean) => void,
) => {
  listeners.add(listener);
  listener(getSubscriptions(), subscriptionsLoaded);

  return () => {
    listeners.delete(listener);
  };
};

export const addSubscription = (subscription: Subscription) =>
  serializeMutation(async () => {
    const ownerId = await waitForActiveOwner();
    validateSubscription(subscription);

    if (subscriptionStore.some((item) => item.id === subscription.id)) {
      throw new Error("A subscription with this ID already exists.");
    }

    const now = new Date().toISOString();
    const updatedSubscription = {
      ...subscription,
      currency: subscription.currency || "USD",
      createdAt: subscription.createdAt || now,
      updatedAt: now,
    };
    const nextSubscriptions = [updatedSubscription, ...subscriptionStore];
    await persistSubscriptions(nextSubscriptions, ownerId);
    if (activeOwnerId !== ownerId) {
      throw new Error("The active account changed. Please retry the action.");
    }

    subscriptionStore = nextSubscriptions;
    notify();
    return getSubscriptions();
  });

export const updateSubscription = async (
  id: string,
  updates: Partial<Omit<Subscription, "id">>,
) =>
  serializeMutation(async () => {
    const ownerId = await waitForActiveOwner();
    const index = subscriptionStore.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Subscription not found.");

    const current = subscriptionStore[index];
    const updated: Subscription = {
      ...current,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    validateSubscription(updated);
    const nextSubscriptions = [...subscriptionStore];
    nextSubscriptions[index] = updated;
    await persistSubscriptions(nextSubscriptions, ownerId);
    if (activeOwnerId !== ownerId) {
      throw new Error("The active account changed. Please retry the action.");
    }

    subscriptionStore = nextSubscriptions;
    notify();
    return getSubscriptions();
  });

export const deleteSubscription = (id: string) =>
  serializeMutation(async () => {
    const ownerId = await waitForActiveOwner();
    const nextSubscriptions = subscriptionStore.filter(
      (item) => item.id !== id,
    );
    await persistSubscriptions(nextSubscriptions, ownerId);
    if (activeOwnerId !== ownerId) {
      throw new Error("The active account changed. Please retry the action.");
    }

    subscriptionStore = nextSubscriptions;
    notify();
    return getSubscriptions();
  });

export const replaceSubscriptions = (nextSubscriptions: Subscription[]) =>
  serializeMutation(async () => {
    const ownerId = await waitForActiveOwner();
    nextSubscriptions.forEach(validateSubscription);
    await persistSubscriptions(nextSubscriptions, ownerId);
    if (activeOwnerId !== ownerId) {
      throw new Error("The active account changed. Please retry the action.");
    }

    subscriptionStore = [...nextSubscriptions];
    notify();
    return getSubscriptions();
  });

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
