import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const subscriptions = () => {
  return (
    <View>
      <Text>subscriptions</Text>
      <Link href="/" className="mt-4 rounded text-white bg-primary p-4">Go Back</Link>
    </View>
  )
}

export default subscriptions