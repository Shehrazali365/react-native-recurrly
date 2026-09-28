import PostHog from "posthog-react-native";

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

export const isPostHogConfigured = Boolean(projectToken && host);

export const posthog = isPostHogConfigured
  ? new PostHog(projectToken as string, {
      host: host as string,
      logs: {
        serviceName: "recurrly-mobile",
        environment: __DEV__ ? "development" : "production",
      },
    })
  : null;
