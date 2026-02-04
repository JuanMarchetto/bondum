import * as SecureStore from 'expo-secure-store'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_PROVIDER_KEY = 'auth_provider'
const USER_DATA_KEY = 'user_data'

export const secureStorage = {
  // Auth token
  getAuthToken: () => SecureStore.getItemAsync(AUTH_TOKEN_KEY),
  setAuthToken: (token: string) => SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
  removeAuthToken: () => SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),

  // Auth provider
  getAuthProvider: () => SecureStore.getItemAsync(AUTH_PROVIDER_KEY),
  setAuthProvider: (provider: string) => SecureStore.setItemAsync(AUTH_PROVIDER_KEY, provider),
  removeAuthProvider: () => SecureStore.deleteItemAsync(AUTH_PROVIDER_KEY),

  // User data
  getUserData: async () => {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY)
    return data ? JSON.parse(data) : null
  },
  setUserData: (data: object) => SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data)),
  removeUserData: () => SecureStore.deleteItemAsync(USER_DATA_KEY),

  // Clear all auth data
  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(AUTH_PROVIDER_KEY),
      SecureStore.deleteItemAsync(USER_DATA_KEY),
    ])
  },
}
