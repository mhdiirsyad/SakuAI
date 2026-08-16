import { COLORS } from "@/constants/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScannerModal({
    visible,
    onClose,
    onCaptured,
}: {
    visible: boolean;
    onClose: () => void;
    onCaptured: (base64: string, mimeType: string) => void;
}) {
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions()
    const [capturing, setCapturing] = useState(false)

    useEffect(() => {
        if (visible && !permission?.granted) requestPermission()
    }, [visible, permission?.granted, requestPermission])

    const handleCapture = async () => {
        if(!cameraRef.current || capturing) return;
        setCapturing(true)

        try{
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.6
            })
            if(photo.base64) {
                onCaptured(photo.base64, photo.uri.endsWith(".png") ? "image/png" : "image/jpeg")
            }
        }catch(e) {
            console.error("Error capturing photo:", e)
        }finally{
            setCapturing(false)
        }
    }

    const pickFromLibrary = async () => {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if(!libraryPermission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            base64: true,
            quality: 0.7
        })

        if(result.canceled) return;
        const asset = result.assets[0];
        if(asset.base64) onCaptured(asset.base64, asset.uri.endsWith(".png") ? "image/png" : "image/jpeg")
    }
    return (
        <Modal
            visible={visible}
            animationType='slide'
        >
            <View className="flex-1 bg-black">
                {permission?.granted && (
                    <CameraView
                        ref={cameraRef}
                        style={{
                            flex: 1
                        }}
                        facing="back"
                    />
                )}

                <View className="absolute inset-0 items-center justify-center px-10">
                    <View className="w-full aspect-[3/4] border-2 border-dashed border-white rounded-xl" />
                </View>

                <SafeAreaView className="absolute inset-0" edges={['top', 'bottom']}>
                    <View className="flex-row items-center px-4 py-3 justify-between">
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                        >
                            <Feather name="x-circle" size={20} color="white" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-1 rounded-full bg-black/40 px-3 py-1 mx-auto">
                            <MaterialCommunityIcons
                                name="robot-happy-outline"
                                size={12}
                                color={COLORS.teal}
                            />
                            <Text className="text-white font-medium text-base">Arahkan ke struk</Text>
                        </View>
                    </View>

                    <View className="flex-1" />
                    <View className="flex-row items-center gap-4 mb-20 mx-10">
                        <TouchableOpacity
                            onPress={(pickFromLibrary)}
                            disabled={capturing}
                            className="w-12 h-12 rounded-full bg-black/40 p-2 items-center justify-center"
                        >
                            <Feather name="image" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={(handleCapture)}
                            disabled={capturing || !permission?.granted}
                            activeOpacity={0.8}
                            className="w-20 h-20 rounded-full p-2 items-center justify-center ml-10 bg-brand-blue border-white border-4"
                        >
                            {capturing ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <Feather name="camera" size={30} color="white" />
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                {!permission?.granted && permission?.canAskAgain === false && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center px-10">
                        <Feather name="camera-off" size={40} color="white" />
                        <Text className="text-white text-center mt-4">Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan perangkat Anda.</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="mt-6"
                        >
                            <Text className="text-sm text-white font-semibold">Tutup</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    )
}