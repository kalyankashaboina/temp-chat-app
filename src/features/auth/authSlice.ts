import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/features/auth/authService';
import type { AuthUser, Language } from '@/features/chat/types';
import { STORAGE_KEYS } from '@/config';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  language: Language;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isInitialized: false,
  language: 'en',
};

// Called once on app mount — validates cookie with server
export const initAuth = createAsyncThunk('auth/init', async () => {
  return authService.getMe();
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const result = await authService.login(email, password);
    if (!result.success || !result.user) return rejectWithValue(result.error || 'Login failed');
    return result.user;
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    { name, email, password }: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    const result = await authService.register(name, email, password);
    if (!result.success || !result.user)
      return rejectWithValue(result.error || 'Registration failed');
    return result.user;
  }
);

export const forgotPasswordAction = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    const result = await authService.forgotPassword(email);
    if (!result.success) return rejectWithValue(result.error || 'Failed to send reset email');
    return true;
  }
);

export const logoutUserAsync = createAsyncThunk('auth/logoutAsync', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser(state) {
      state.user = null;
      localStorage.removeItem(STORAGE_KEYS.USER);
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // init
    builder.addCase(initAuth.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(initAuth.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isInitialized = true;
      state.user = action.payload;
    });
    builder.addCase(initAuth.rejected, (state) => {
      state.isLoading = false;
      state.isInitialized = true;
    });
    // login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isInitialized = true;
    });
    builder.addCase(loginUser.rejected, (state) => {
      state.isLoading = false;
    });
    // register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.isInitialized = true;
    });
    builder.addCase(registerUser.rejected, (state) => {
      state.isLoading = false;
    });
    // forgotPassword
    builder.addCase(forgotPasswordAction.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(forgotPasswordAction.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(forgotPasswordAction.rejected, (state) => {
      state.isLoading = false;
    });
    // logout
    builder.addCase(logoutUserAsync.fulfilled, (state) => {
      state.user = null;
    });
  },
});

export const { logoutUser, setLanguage, setUser } = authSlice.actions;
export default authSlice.reducer;

export const selectAuth = (s: { auth: AuthState }) => s.auth;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
export const selectIsAuthenticated = (s: { auth: AuthState }) => !!s.auth.user;
export const selectAuthLoading = (s: { auth: AuthState }) => s.auth.isLoading;
export const selectAuthLanguage = (s: { auth: AuthState }) => s.auth.language;
export const selectIsInitialized = (s: { auth: AuthState }) => s.auth.isInitialized;
