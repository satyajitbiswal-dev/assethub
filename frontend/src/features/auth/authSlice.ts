import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

const stored = localStorage.getItem('auth')
const initial: AuthState = stored
  ? JSON.parse(stored)
  : { user: null, accessToken: null, refreshToken: null, isAuthenticated: false }

const authSlice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: User; access: string; refresh: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.access
      state.refreshToken = action.payload.refresh
      state.isAuthenticated = true
      localStorage.setItem('auth', JSON.stringify(state))
    },
    setCredentials(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken
      localStorage.setItem('auth', JSON.stringify(state))
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload
      localStorage.setItem('auth', JSON.stringify(state))
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('auth')
    },
  },
})

export const { setAuth, setCredentials, updateUser, logout } = authSlice.actions
export default authSlice.reducer
