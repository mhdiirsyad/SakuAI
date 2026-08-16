import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

const CARD_HEIGHT = 120
export default function AIActionCard({
    icon,
    title,
    subtitle,
    onPress,
    colors
}: {
    icon: keyof typeof Feather.glyphMap,
    title: string,
    subtitle: string,
    onPress: () => void,
    colors: [string, string]
}) {
    const [width, setWidth] = useState(0)
    const diag = width > 0 ? Math.sqrt(width * width + CARD_HEIGHT * CARD_HEIGHT) * 1.4 : 0
    const translateX = useSharedValue(0)

    useEffect(() => {
        if (diag === 0) return
        translateX.value = 0
        translateX.value = withRepeat(
            withTiming(-diag, { duration: 3400, easing: Easing.linear }),
            -1,
            false
        )
    })

    const sweepStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }))
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{
                flex: 1
            }}
        >
            <View
                onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
                style={{
                    height: CARD_HEIGHT,
                    borderRadius: 16,
                    backgroundColor: colors[0],
                    overflow: "hidden"
                }}
            >
                {diag > 0 && (
                    <View
                        style={{
                            position: "absolute",
                            width: diag,
                            height: diag,
                            top: -(diag - CARD_HEIGHT) / 2,
                            left: -(diag - width) / 2,
                            transform: [{ rotate: "-20deg" }]
                        }}
                    >
                        <Animated.View
                            style={[{
                                width: diag ** 2,
                                height: "100%"
                            }, sweepStyle]}
                        >
                            <LinearGradient
                                colors={[colors[0], colors[1], colors[0], colors[1], colors[0]]}
                                locations={[0, 0.25, 0.5, 0.75, 1]}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{
                                    width: "100%",
                                    height: "100%"
                                }}
                            />
                        </Animated.View>
                    </View>
                )}

                <View className='absolute inset-0 p-4 items-center justify-center'>
                    <View className='w-9 h-9 rounded-full bg-white/20 items-center justify-center'>
                        <Feather name={icon} size={16} color="white" />
                    </View>
                    <Text className='text-white text-lg font-bold mt-2'>{title}</Text>
                    <Text className='text-white/80 text-sm mt-1'>{subtitle}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}