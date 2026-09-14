import { Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {styled} from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);
 

const subscriptions = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>subscriptions</Text>
      <Link href="/" className="mt-4 rounded text-white bg-primary p-4">Go Back</Link>
    </SafeAreaView>
  )
}

export default subscriptions