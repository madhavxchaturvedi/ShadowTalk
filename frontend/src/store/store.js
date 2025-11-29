import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import roomsReducer from './slices/roomsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
