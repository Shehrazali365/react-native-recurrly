import { View, Text } from 'react-native'
import { Link, useLocalSearchParams } from 'expo-router';

const SubscriptionDetails = () => {

    const {id} = useLocalSearchParams<{ id : string }>();
  return (
    <View>
      <Text>Subscription Details : {id}</Text>
      <Link href="/" className="mt-4 rounded text-white bg-primary p-4">Go Back</Link>
    </View>
  )
}

export default SubscriptionDetails