import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/auth';

// Async thunks
export const initializeSession = createAsyncThunk(
  'auth/initializeSession',
  async (_, { rejectWithValue }) => {
    try {
      const existingToken = authService.getToken();
      const existingUser = authService.getCurrentUser();

      // If we have both token and user in localStorage, trust it without validation
      // This prevents unnecessary API calls on every page refresh
      if (existingToken && existingUser) {
        return { user: existingUser, token: existingToken };
      }

      // If we have token but no user, validate it
      if (existingToken) {
        try {
          const result = await authService.joinSession(existingToken);
          if (result.success) {
            return { user: result.user, token: existingToken };
          }
        } catch (err) {
          // Token validation failed, clear it and create new session
          authService.logout();
        }
      }

      // Create new session
      const result = await authService.createSession();
      if (result.success) {
        return { user: result.user, token: result.token };
      }

      return rejectWithValue('Failed to create session');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: authService.getCurrentUser(),
    token: authService.getToken(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      authService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('shadowtalk_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(initializeSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
