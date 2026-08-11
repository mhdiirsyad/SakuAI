import { CodeFormSchema, codeSchema, SignInFormSchema, signInSchema } from '@/lib/schemas/auth'
import { useSignIn } from '@clerk/expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function SignInScreen() {
  const { errors, fetchStatus, signIn } = useSignIn()
  // const { isSignedIn } = useAuth()
  const router = useRouter()

  const isLoading = fetchStatus === "fetching"

  const {
    control: signInControl,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors }
  } = useForm<SignInFormSchema>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    }
  })

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

  const onSignInPress = async (values: SignInFormSchema) => {
    const { error } = await signIn.password({
      emailAddress: values.email,
      password: values.password,
    })

    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session.currentTask) return;
          const url = decorateUrl("/(root)/(tabs)")
          router.replace(url as any)
        }
      })
    } else if (signIn.status === "needs_second_factor") {
      await signIn.mfa.sendPhoneCode()
    } else if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code"
      )
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      console.error("Sign-in gagal: ", signIn)
    }
  }

  const onVerifyPress = async (values: CodeFormSchema) => {
    await signIn.mfa.verifyEmailCode({ code: values.code })

    if (signIn.status === "complete") {
      signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session.currentTask) return;
          const url = decorateUrl("/")
          router.replace(url as any)
        }
      })
    } else {
      console.error("Verification failed:", signIn)
    }
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-brand-body"
      >
        <View className="flex-1 px-6 py-8 justify-center">
          <Text className="text-3xl text-gray-900 font-bold mb-2 leading-tight">
            Verifikasi Email
          </Text>
          <Controller
            name='code'
            control={codeControl}
            render={({ field: { onChange, value } }) => {
              return (
                <TextInput
                  className="border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
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
            <Text className="text-brand-coral text-sm mb-1">{codeErrors.code.message}</Text>
          )}
          {errors.fields.code && (
            <Text className="text-brand-coral text-sm mb-1">{errors.fields.code.message}</Text>
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
            onPress={() => signIn.mfa.sendEmailCode()}
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
          Masuk ke Akunmu
        </Text>
        <Text className="text-muted text-sm mb-2">
          Pantau dan kelola keuanganmu dengan mudah. Masuk sekarang untuk memulai perjalanan finansialmu!
        </Text>
        <View className="mb-2">
          <Controller
            name='email'
            control={signInControl}
            render={({ field: { onChange, value } }) => {
              return (
                <TextInput
                  className="border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                  placeholder='Email'
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                />
              )
            }}
          />
          {signInErrors.email && (
            <Text className="text-brand-coral text-sm mb-1">{signInErrors.email.message}</Text>
          )}
          {errors.fields.identifier && (
            <Text className="text-brand-coral text-sm mb-1">{errors.fields.identifier.message}</Text>
          )}
        </View>

        <View className="mb-2">
          <Controller
            name='password'
            control={signInControl}
            render={({ field: { onChange, value } }) => {
              return (
                <TextInput
                  className="border-gray-200 rounded-xl border px-4 py-3 bg-white text-gray-900"
                  placeholder='Password'
                  placeholderTextColor="#8A8D96"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                />
              )
            }}
          />
          {signInErrors.password && (
            <Text className="text-brand-coral text-sm mb-1">{signInErrors.password.message}</Text>
          )}
          {errors.fields.password && (
            <Text className="text-brand-coral text-sm mb-1">{errors.fields.password.message}</Text>
          )}
        </View>
        <TouchableOpacity
          className="bg-brand-blue w-full rounded-xl py-3 mt-4 items-center"
          onPress={handleSignInSubmit(onSignInPress)}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Text className="text-white font-semibold text-base">Masuk</Text>
          )}
        </TouchableOpacity>

        <View className="justify-center mt-4 flex-row">
          <Text className="text-brand-text-muted ">
            Belum punya akun?{" "}
          </Text>
          <Link href="/(auth)/sign-up">
            <Text className="text-brand-blue font-semibold">Daftar</Text>
          </Link>
        </View>

        <View nativeID='clerk-captcha' />
      </View>
    </KeyboardAvoidingView>
  )
}