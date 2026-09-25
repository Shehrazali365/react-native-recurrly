import { posthog } from "@/lib/posthog";
import { useAuth, useSignUp } from "@clerk/expo";
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
} from "react-native";
export default function SignUpScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const handleSignUp = async () => {
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
      setFormError("Please enter a password.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await signUp.password({
        emailAddress: cleanEmail,
        password,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      const { error: verificationError } =
        await signUp.verifications.sendEmailCode();
      if (verificationError) {
        setFormError(verificationError.message);
        return;
      }
      setIsVerifying(true);
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_up" });
      setFormError(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVerify = async () => {
    setFormError("");
    const code = verificationCode.trim();
    if (!code) {
      setFormError("Please enter the verification code.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        setFormError(error.message);
        return;
      }
      if (signUp.status === "complete") {
        posthog?.capture("account_signed_up", {
          authentication_method: "password",
          verification_method: "email_code",
        });
        posthog?.logger.info("authentication completed", {
          flow: "sign_up",
          verification_required: true,
        });
        await signUp.finalize({
          navigate: () => {
            router.replace("/");
          },
        });
        return;
      }
      setFormError("Your email was verified, but sign-up is not complete yet.");
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_up_verification" });
      setFormError(error?.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleResendCode = async () => {
    setFormError("");
    try {
      setIsSubmitting(true);
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setFormError(error.message);
        return;
      }
      setFormError("A new verification code has been sent.");
    } catch (error: any) {
      posthog?.captureException(error, { authentication_flow: "sign_up_resend" });
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
            {isVerifying ? "Verify your account" : "Create your account"}
          </Text>
          <Text className="auth-subtitle">
            {isVerifying
              ? "Enter the verification code sent to your email."
              : "Track every renewal and stay ahead of your subscriptions."}
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

                    <Text className="auth-helper">
                      Use at least 8 characters for a stronger password.
                    </Text>
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Confirm password</Text>

                    <TextInput
                      className="auth-input"
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setFormError("");
                      }}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      editable={!isSubmitting}
                    />
                  </View>

                  {formError ? (
                    <Text className="auth-error">{formError}</Text>
                  ) : null}

                  <Pressable
                    onPress={handleSignUp}
                    disabled={isSubmitting}
                    className={`auth-button ${
                      isSubmitting ? "auth-button-disabled" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="auth-button-text">Create account</Text>
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
            <Text className="auth-link-copy">Already have an account?</Text>

            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              disabled={isSubmitting}
            >
              <Text className="auth-link">Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
