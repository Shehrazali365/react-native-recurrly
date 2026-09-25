import { posthog } from "@/lib/posthog";
import { useAuth, useSignIn } from "@clerk/expo";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Linking
} from "react-native";
export default function SignInScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [authLoaded, isSignedIn]);
  if (!authLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="small" />
      </View>
    );
  }
  const handleSignIn = async () => {
    setFormError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError("Please enter your email address.");
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setFormError("Please enter your password.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await signIn.password({
        identifier: cleanEmail,
        password,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      if (signIn.status === "complete") {
        posthog?.capture("account_signed_in", {
          authentication_method: "password",
          verification_required: false,
        });
        posthog?.logger.info("authentication completed", {
          flow: "sign_in",
          verification_required: false,
        });
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/");

            if (url.startsWith("http")) {
              if (Platform.OS === "web") {
                window.location.href = url;
              } else {
                Linking.openURL(url);
              }
            } else {
              router.replace("/");
            }
          },
        });
        return;
      }
      if (signIn.status === "needs_client_trust") {
        await signIn.mfa.sendEmailCode();
        setIsVerifying(true);
        return;
      }
      setFormError("Additional verification is required.");
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_in" });
      setFormError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerify = async () => {
    setFormError("");
    if (!verificationCode.trim()) {
      setFormError("Please enter the verification code.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode.trim(),
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      if (signIn.status === "complete") {
        posthog?.capture("account_signed_in", {
          authentication_method: "password",
          verification_required: true,
        });
        posthog?.logger.info("authentication completed", {
          flow: "sign_in",
          verification_required: true,
        });
        await signIn.finalize({
          navigate: () => {
            router.replace("/");
          },
        });
      }
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_in_verification" });
      setFormError(error?.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleResendCode = async () => {
    setFormError("");
    try {
      setIsSubmitting(true);
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setFormError(error.message);
        return;
      }
      posthog?.capture("verification_code_resent", {
        authentication_flow: "sign_in",
      });
      setFormError("A new verification code has been sent.");
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_in_resend" });
      setFormError(error?.message || "Unable to resend the code.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="auth-safe-area"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="auth-content">
          {/* Brand */}
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>

              <View>
                <Text className="auth-wordmark">Recurrly</Text>
                <Text className="auth-wordmark-sub">Smart billing</Text>
              </View>
            </View>
          </View>
          {/* Header */}
          <Text className="auth-title">
            {isVerifying ? "Verify your account" : "Welcome back"}
          </Text>
          <Text className="auth-subtitle">
            {isVerifying
              ? "Enter the verification code sent to your email."
              : "Sign in to continue managing your subscriptions"}
          </Text>
          {/* Card */}
          <View className="auth-card">
            <View className="auth-form">
              {!isVerifying ? (
                <>
                  <View className="auth-field">
                    <Text className="auth-label">Email</Text>

                    <TextInput
                      className="auth-input"
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        setFormError("");
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Password</Text>

                    <TextInput
                      className="auth-input"
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setFormError("");
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      editable={!isSubmitting}
                    />
                  </View>

                  {formError ? (
                    <Text className="auth-error">{formError}</Text>
                  ) : null}

                  <Pressable
                    onPress={handleSignIn}
                    disabled={isSubmitting}
                    className={`auth-button ${
                      isSubmitting ? "auth-button-disabled" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="auth-button-text">Sign in</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>

                    <TextInput
                      className="auth-input"
                      value={verificationCode}
                      onChangeText={(value) => {
                        setVerificationCode(value);
                        setFormError("");
                      }}
                      placeholder="Enter verification code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      editable={!isSubmitting}
                    />

                    <Text className="auth-helper">
                      Check your email for the verification code.
                    </Text>
                  </View>

                  {formError ? (
                    <Text className="auth-error">{formError}</Text>
                  ) : null}

                  <Pressable
                    onPress={handleVerify}
                    disabled={isSubmitting}
                    className={`auth-button ${
                      isSubmitting ? "auth-button-disabled" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="auth-button-text">Verify email</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleResendCode}
                    disabled={isSubmitting}
                    className="mt-3 items-center"
                  >
                    <Text className="auth-link">Resend verification code</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
          {/* Bottom link */}
          <View className="auth-link-row">
            <Text className="auth-link-copy">New to Recurrly?</Text>

            <Pressable
              onPress={() => router.push("/(auth)/sign-up")}
              disabled={isSubmitting}
            >
              <Text className="auth-link">Create an account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
