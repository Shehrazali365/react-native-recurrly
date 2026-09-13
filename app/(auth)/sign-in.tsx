import { Link } from 'expo-router';
import { View, Text } from 'react-native'

const SignIn = () => {
  return (
    <View>
      <Text>SignIn</Text>
      <Link className="mt-4 rounded text-white bg-primary p-4" href="/(auth)/sign-up">Create Account</Link>
    </View>
  )
}

export default SignIn;