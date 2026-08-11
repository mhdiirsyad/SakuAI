import { CodeFormSchema, codeSchema, SignUpFormSchema, signUpSchema } from '@/lib/schemas/auth'
import { useAuth, useSignUp } from '@clerk/expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function SignUpScreen() {
  const { errors, fetchStatus, signUp } = useSignUp()
  const { isSignedIn, } = useAuth()
  const router = useRouter()

  const isLoading = fetchStatus === "fetching"

  const [email, setEmail] = useState("")

  const {
    control: signUpControl,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors }
  } = useForm<SignUpFormSchema>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    }
  });

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors }
  } = useForm<CodeFormSchema>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
    }
  });

  const onSignUpPress = async (values: SignUpFormSchema) => {
    setEmail(values.email)

    const { error } = await signUp.password({
      emailAddress: values.email,
      password: values.password,
      firstName: values.fullName,
    })

    if (error) {
      console.error("Sign up error:", error)
      return
    }

    if (!error) await signUp.verifications.sendEmailCode()
  }

  const onVerifyPress = async (values: CodeFormSchema) => {
    await signUp.verifications.verifyEmailCode({ code: values.code })

    if(signUp.status === "complete") {
      signUp.finalize({
        navigate: ({session, decorateUrl}) => {
          if(session.currentTask) return;
          const url = decorateUrl("/")
          router.replace(url as any)
        }
      })
    } else {
      console.error("Verification failed:", signUp)
    }
  }

  if(signUp.status === "complete" && isSignedIn) {
    return null;
  }

  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0
  ) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-brand-body"
      >
        <View className="flex-1 px-6 py-8 justify-center">
          <Text className="text-3xl text-gray-900 font-bold mb-2 leading-tight">
            Verifikasi Email
          </Text>
          <Text className="text-muted text-sm mb-2">
            Kode verifikasi telah dikirim ke {email}.
          </Text>
          <Controller
            name='code'
            control={codeControl}
            render={({ field: { onChange, value } }) => {
              return (
                <TextInput
                  className="mb-2 border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                  placeholder='Kode Verifikasi'
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize='words'
                />
              )
            }}
          />
          {codeErrors.code && (
            <Text className="text-brand-coral text-sm mt-1">{codeErrors.code.message}</Text>
          )}
          {errors.fields.code && (
            <Text className="text-brand-coral text-sm mt-1">{errors.fields.code.message}</Text>
          )}
          <TouchableOpacity
            className="bg-brand-blue w-full rounded-xl py-3 items-center"
            onPress={handleCodeSubmit(onVerifyPress)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <Text className="text-white font-semibold text-base">Verifikasi</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity className=""
            onPress={() => signUp.verifications.sendEmailCode()}
          >
            <Text className="text-brand-blue font-semibold mt-4">Kirim Ulang Kode</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "height" : "padding"}
      className="flex-1 bg-brand-body"
    >
      <View className="flex-1 px-6 py-8 justify-center">
        <Text className="text-3xl text-gray-900 font-bold mb-2 leading-tight">
          Buat Akun Baru
        </Text>
        <Text className="text-muted text-sm mb-2">
          Pantau dan kelola keuanganmu dengan mudah. Daftar sekarang untuk memulai perjalanan finansialmu!
        </Text>
        <Controller
          name='fullName'
          control={signUpControl}
          render={({ field: { onChange, value } }) => {
            return (
              <TextInput
                className="mb-2 border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                placeholder='Nama Lengkap'
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                autoCapitalize='words'
              />
            )
          }}
        />
        {signUpErrors.fullName && (
          <Text className="text-brand-coral text-sm mt-1">{signUpErrors.fullName.message}</Text>
        )}

        <Controller
          name='email'
          control={signUpControl}
          render={({ field: { onChange, value } }) => {
            return (
              <TextInput
                className="mb-2 border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                placeholder='Email'
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
              />
            )
          }}
        />
        {signUpErrors.email && (
          <Text className="text-brand-coral text-sm mt-1">{signUpErrors.email.message}</Text>
        )}
        {errors.fields.emailAddress && (
          <Text className="text-brand-coral text-sm mt-1">{errors.fields.emailAddress.message}</Text>
        )}

        <Controller
          name='password'
          control={signUpControl}
          render={({ field: { onChange, value } }) => {
            return (
              <TextInput
                className="mb-2 border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                placeholder='Password'
                placeholderTextColor="#8A8D96"
                value={value}
                onChangeText={onChange}
                secureTextEntry
              />
            )
          }}
        />
        {signUpErrors.password && (
          <Text className="text-brand-coral text-sm mt-1">{signUpErrors.password.message}</Text>
        )}
        {errors.fields.password && (
          <Text className="text-brand-coral text-sm mt-1">{errors.fields.password.message}</Text>
        )}

        <TouchableOpacity
          className="bg-brand-blue w-full rounded-xl py-3 mt-4 items-center"
          onPress={handleSignUpSubmit(onSignUpPress)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Text className="text-white font-semibold text-base">Daftar</Text>
          )}
        </TouchableOpacity>

        <View className="justify-center mt-4 flex-row">
          <Text className="text-brand-text-muted ">
            Sudah punya akun?{" "}
          </Text>
          <Link href="/(auth)/sign-in">
            <Text className="text-brand-blue font-semibold">Masuk</Text>
          </Link>
        </View>

        <View nativeID='clerk-captcha' />
      </View>
    </KeyboardAvoidingView>
  )
}