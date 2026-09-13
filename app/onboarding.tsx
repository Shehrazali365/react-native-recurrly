import { Link } from 'expo-router'
import { View, Text } from 'react-native'

const onboarding = () => {
  return (
    <View>
      <Text>onboarding</Text>
      <Link href="/" className="mt-4 rounded text-white bg-primary p-4">Go Back</Link>
      
    </View>
  )
}

export default onboarding