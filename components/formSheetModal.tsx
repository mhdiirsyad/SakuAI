import React from 'react';
import { KeyboardAvoidingView, Modal, Text, TouchableOpacity, View } from 'react-native';

export default function FormSheetModal({
    visible,
    title,
    onClose,
    children
}: {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}>
                <KeyboardAvoidingView behavior="padding"
                className="flex-1 justify-end bg-black/50">
                    <View className="bg-brand-body rounded-t-2xl px-5 pt-5 pb-8">
                        <Text className="text-brand-text font-semibold text-lg mb-4">{title}</Text>
                        {children}
                        <TouchableOpacity
                            onPress={onClose}
                            className="mt-2 bg-brand-coral py-3 rounded-xl items-center"
                        >
                            <Text className="text-white font-semibold">Batal</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
        </Modal>
    )
}