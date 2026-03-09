import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_PROVIDER_KEY = 'auth_provider'
const USER_DATA_KEY = 'user_data'
const LANGUAGE_KEY = 'app_language'

// Web fallback: use localStorage since expo-secure-store is mobile-only
const getItem = (key: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.getItem(key))
    : SecureStore.getItemAsync(key)

const setItem = (key: string, value: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.setItem(key, value))
    : SecureStore.setItemAsync(key, value)

const deleteItem = (key: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.removeItem(key))
    : SecureStore.deleteItemAsync(key)

export const secureStorage = {
  getAuthToken: () => getItem(AUTH_TOKEN_KEY),
  setAuthToken: (token: string) => setItem(AUTH_TOKEN_KEY, token),
  removeAuthToken: () => deleteItem(AUTH_TOKEN_KEY),

  getAuthProvider: () => getItem(AUTH_PROVIDER_KEY),
  setAuthProvider: (provider: string) => setItem(AUTH_PROVIDER_KEY, provider),
  removeAuthProvider: () => deleteItem(AUTH_PROVIDER_KEY),

  getUserData: async () => {
    const data = await getItem(USER_DATA_KEY)
    return data ? JSON.parse(data) : null
  },
  setUserData: (data: object) => setItem(USER_DATA_KEY, JSON.stringify(data)),
  removeUserData: () => deleteItem(USER_DATA_KEY),

  getLanguage: () => getItem(LANGUAGE_KEY),
  setLanguage: (lang: 'en' | 'es') => setItem(LANGUAGE_KEY, lang),

  clearAuth: async () => {
    await Promise.all([
      deleteItem(AUTH_TOKEN_KEY),
      deleteItem(AUTH_PROVIDER_KEY),
      deleteItem(USER_DATA_KEY),
    ])
  },
}
