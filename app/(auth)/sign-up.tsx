import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignUp = () => {
  return (
    <View>
      <Text>SignUp</Text>
      <Link className="mt-4 rounded text-white bg-primary p-4" href="/(auth)/sign-in">Sign In</Link>
    </View>
  )
}

export default SignUp