import { tabs } from "@/constants/data";
import { Tabs } from "expo-router";
import { View , Image } from "react-native";
import clsx from "clsx";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { components , colors } from "@/constants/theme";

const tabbar = components.tabBar;

const TabsLayout = () => {

   const insets = useSafeAreaInsets();

   const TabIcon = ({ focused, icon} : TabIconProps) => {
      return (
         <View className="tabs-icon">
            <View className={clsx('tabs-pill' , focused && 'tabs-active')}>
               <Image source={icon} resizeMode="contain"  className="tabs-glyph" />
            </View>
         </View>
      );
   };
   
   
   return (
      <Tabs screenOptions={{ 
         headerShown: false,
         tabBarShowLabel: false,
         tabBarStyle: {
            position: "absolute",
            bottom: Math.max(insets.bottom, tabbar.horizontalInset),
            height: tabbar.height,
            marginHorizontal: tabbar.horizontalInset,
            borderRadius: tabbar.radius,
            backgroundColor: colors.primary,
            borderTopWidth: 0,
            elevation: 0,
         },
         tabBarItemStyle: {
            paddingVertical: tabbar.height / 2 - tabbar.iconFrame / 1.6
         },
         tabBarIconStyle:{
            width: tabbar.iconFrame,
            height: tabbar.iconFrame,
            alignItems: "center",
         }
         }}>

      {tabs.map((tab) => (
         <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ 
               title: tab.title,
               tabBarIcon: ({ focused }) => (
                  <TabIcon focused={focused} icon={tab.icon} />
               )
            }}
         />
      ))}
   </Tabs>
   )
};

export default TabsLayout;