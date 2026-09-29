import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

const colors = {
  coral: "#EF7355",
  cream: "#F5F3DF",
  yellow: "#F3D18E",
  mint: "#80B49D",
  navy: "#353957",
};

function GeometricArtwork({ height }: { height: number }) {
  return (
    <Svg
      width="100%"
      height={height}
      viewBox="0 0 440 552"
      preserveAspectRatio="xMidYMid meet"
      accessibilityLabel="Colorful geometric artwork"
    >
      <Path d="M0 0H110A110 110 0 0 1 0 110Z" fill="#DF7961" />
      <Circle cx="165" cy="55" r="55" fill={colors.yellow} />

      <Path d="M220 0H440V110H330A110 110 0 0 0 220 110Z" fill={colors.cream} />
      <Path d="M330 0A110 110 0 0 1 440 110H330Z" fill={colors.yellow} />
      <Path d="M330 110H440V220A110 110 0 0 1 330 110Z" fill={colors.cream} />

      <Circle cx="55" cy="165" r="55" fill={colors.cream} />
      <Circle cx="165" cy="165" r="55" fill={colors.mint} />
      <Circle cx="275" cy="165" r="55" fill={colors.yellow} />
      <Path d="M0 330A110 110 0 0 1 110 220V330Z" fill={colors.cream} />

      <Path d="M110 220H220V330A110 110 0 0 1 110 220Z" fill={colors.navy} />
      <Path d="M220 330V220A110 110 0 0 1 330 330Z" fill={colors.navy} />
      <Path d="M330 220H440V330A110 110 0 0 1 330 220Z" fill={colors.yellow} />

      <Path d="M0 330H110V440A110 110 0 0 1 0 330Z" fill={colors.navy} />
      <Path d="M110 330A110 110 0 0 1 220 440H110Z" fill={colors.cream} />
      <Path d="M220 330H330V440A110 110 0 0 1 220 330Z" fill={colors.cream} />
      <Circle cx="385" cy="385" r="55" fill={colors.mint} />

      <Path d="M0 440H110V550A110 110 0 0 1 0 440Z" fill={colors.cream} />
      <Path d="M110 550A110 110 0 0 1 220 440V550Z" fill={colors.navy} />
      <Circle cx="275" cy="495" r="55" fill={colors.navy} />
      <Path d="M330 440H440V552A110 110 0 0 1 330 440Z" fill={colors.mint} />

      {[110, 220, 330].map((x) => (
        <Line
          key={`vertical-${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="552"
          stroke="#FFFFFF"
          strokeOpacity={0.13}
          strokeWidth={1}
        />
      ))}
      {[110, 220, 330, 440].map((y) => (
        <Line
          key={`horizontal-${y}`}
          x1="0"
          y1={y}
          x2="440"
          y2={y}
          stroke="#FFFFFF"
          strokeOpacity={0.13}
          strokeWidth={1}
        />
      ))}
      <Rect
        x="0"
        y="0"
        width="440"
        height="552"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.13}
        strokeWidth={1}
      />
    </Svg>
  );
}

export default function IndexRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const { width, height: windowHeight } = useWindowDimensions();
  const [isNavigating, setIsNavigating] = useState(false);
  const hasNavigated = useRef(false);
  const artworkHeight = Math.min(width * (552 / 440), windowHeight * 0.58);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return null;
  if (isSignedIn) return null;

  const handleGetStarted = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setIsNavigating(true);
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.coral }}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ marginTop: 20 }}>
          <GeometricArtwork height={artworkHeight} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 42 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "sans-bold",
              fontSize: Math.min(38, Math.max(30, width * 0.083)),
              textAlign: "center",
            }}
          >
            Gain Financial Clarity
          </Text>
          <Text
            style={{
              marginTop: 8,
              color: "#FFF9F5",
              fontFamily: "sans-regular",
              fontSize: 17,
              textAlign: "center",
            }}
          >
            Track, analyze and cancel with ease
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            disabled={isNavigating}
            onPress={handleGetStarted}
            style={({ pressed }) => ({
              height: 60,
              marginTop: 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 30,
              backgroundColor: "#FFFFFF",
              opacity: pressed || isNavigating ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: colors.navy,
                fontFamily: "sans-bold",
                fontSize: 16,
              }}
            >
              Get Started
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
