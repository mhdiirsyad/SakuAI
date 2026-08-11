import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

const useNativeTabs = Platform.OS === 'ios'
export default function TabLayout() {
    if (useNativeTabs) {
        return (
            <NativeTabs iconColor={{ default: "#5C5F68", selected: "#4A9EFF" }}>
                <NativeTabs.Trigger name="index">
                    <Label>Home</Label>
                    <Icon sf="house.fill" />
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="transactions">
                    <Icon sf="list.bullet.rectangle.portrait.fill" />
                    <Label>Transactions</Label>
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="add-transaction">
                    <Icon sf="plus.circle.fill" />
                    <Label>Add Transaction</Label>
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="assistant">
                    <Icon sf="sparkles" />
                    <Label>Assistant</Label>
                </NativeTabs.Trigger>

                <NativeTabs.Trigger name="profile">
                    <Icon sf="person" drawable="custom_profile_drawable" />
                    <Label>Profile</Label>
                </NativeTabs.Trigger>
            </NativeTabs>
        );
    }

    return (
        <Tabs
            screenOptions={{
                tabBarInactiveTintColor: '#5C5F68',
                tabBarActiveTintColor: '#4A9EFF',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#E5E5E5',
                    paddingTop: 5,
                    paddingBottom: 5,
                    height: 64,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Transactions',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="list" color={color} />,
                }}
            />
            <Tabs.Screen
                name="add-transaction"
                options={{
                    title: 'Add Transaction',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="plus-circle" color={color} />,
                }}
            />
            <Tabs.Screen
                name="assistant"
                options={{
                    title: 'Assistant',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="magic" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
                }}
            />
        </Tabs>
    )
}
