import { AI_GRADIENT, COLORS, RECORDING_GRADIENT } from '@/constants/theme';
import { ExtractedTransaction, extractFromVoice } from '@/lib/services/extractTransaction';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { BlurView } from 'expo-blur';
import { File } from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native';

export type Status = "idle" | "recording" | "processing" | "error"
export default function VoiceRecorderModal({
    visible,
    onClose,
    onExtracted
}: {
    visible: boolean;
    onClose: () => void;
    onExtracted: (extracted: ExtractedTransaction) => void;
}) {
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [status, setStatus] = useState<Status>("idle")
    const [second, setSecond] = useState(0)

    useEffect(() => {
        if (!visible) {
            setStatus("idle")
            setSecond(0)
            return;
        }

        (async () => {
            const { granted } = await requestRecordingPermissionsAsync()
            if (!granted) {
                setStatus("error")
                return;
            }

            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            })
        })()
    }, [visible])

    useEffect(() => {
        if(status !== "recording") return;
        const interval = setInterval(() => setSecond((s) => s + 1), 1000)
        return () => clearInterval(interval)
    }, [status])

    const onStartRecording = async () => {
        setSecond(0)
        await recorder.prepareToRecordAsync()
        recorder.record()
        setStatus("recording")
    }
    const onStopRecording = async () => {
        setStatus("processing")
        await recorder.stop()

        try {
            const uri = recorder.uri
            if(!uri) throw new Error("No recording uri");
            
            const file = new File(uri)
            const base64 = await file.base64()
            const result = await extractFromVoice(base64, "audio/m4a")
            onExtracted(result)
            onClose()
        } catch (e) {
            console.error("Error processing voice recording:", e)
            setStatus("error")
        } finally {
            setStatus("idle")
        }
    }
    return (
        <Modal visible={visible} animationType='slide' transparent>
            <View className="flex-1 justify-end">
                <BlurView className="absolute inset-0" intensity={40} tint="dark" />
                <View className="w-full bg-brand-surface rounded-t-3xl p-10 items-center overflow-hidden">
                    {status === "error" ? (
                        <>
                            <Feather name="alert-circle" size={30} color="#FF6B4A" />
                            <Text className="text-white text-base font-semibold mt-2">
                                Terjadi kesalahan saat memproses suara. Cek perizinan mikrofon dan coba lagi.
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="bg-white/10 px-4 py-2 rounded-full"
                            >
                                <Text className="text-white text-base font-semibold">Tutup</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View className="flex-row items-center gap-2">
                                <MaterialCommunityIcons
                                    name="robot-happy-outline"
                                    size={15}
                                    color={COLORS.teal}
                                />
                                <Text className="text-teal-500 text-sm uppercase tracking-wide">
                                    AI Voice log
                                </Text>
                            </View>
                            <Text className="text-white text-base font-semibold">
                                {status === "recording" ?
                                    "Mendengarkan.." : status === "processing"
                                        ? "Memahami.." : "Katakan tentang transaksi Anda"
                                }
                            </Text>
                            <Text className="text-brand-text-secondary text-sm">
                                {status === "recording" ?
                                    `${Math.floor(second / 60)}:${String(second % 60).padStart(2, '0')}` : status === "processing"
                                        ? "Extract detail.." : '"Saya beli bubur 10000"'
                                }
                            </Text>
                            <View className="w-24 h-24 items-center justify-center m-6">
                                {status === "processing" ? (
                                    <ActivityIndicator size="large" color={COLORS.teal} />
                                ) : (
                                    <TouchableOpacity
                                        onPress={
                                            status === "recording" ? onStopRecording : onStartRecording
                                        }
                                        activeOpacity={0.8}
                                        className="w-16 h-16 rounded-full items-center justify-center"
                                        style={{
                                            backgroundColor: status === "recording" ? RECORDING_GRADIENT[0] : AI_GRADIENT[0],
                                        }}
                                    >
                                        <Feather name={status === "recording" ? "stop-circle" : "mic"} size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={onClose}
                                disabled={status === "processing"}
                            >
                                <Text className="text-brand-text-secondary text-lg font-medium">Tutup</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    )
}