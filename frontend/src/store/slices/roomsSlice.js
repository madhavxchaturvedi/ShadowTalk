import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async ({ topic, search, sort } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (topic) params.append('topic', topic);
      if (search) params.append('search', search);
      if (sort) params.append('sort', sort);

      const response = await api.get(`/rooms?${params.toString()}`);
      return response.data.data.rooms;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  }
);

export const createRoom = createAsyncThunk(
  'rooms/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data.data.room;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'rooms/joinRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/rooms/${roomId}/join`);
      return response.data.data.room;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'rooms/leaveRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      return roomId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave room');
    }
  }
);

export const fetchMyRooms = createAsyncThunk(
  'rooms/fetchMyRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/rooms/my/joined');
      return response.data.data.rooms;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your rooms');
    }
  }
);

const roomsSlice = createSlice({
  name: 'rooms',
  initialState: {
    allRooms: [],
    myRooms: [],
    currentRoom: null,
    loading: false,
    error: null,
    filters: {
      topic: 'all',
      search: '',
      sort: 'trending',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create room
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms.unshift(action.payload);
        state.myRooms.unshift(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Join room
      .addCase(joinRoom.fulfilled, (state, action) => {
        const room = action.payload;
        const index = state.allRooms.findIndex(r => r._id === room._id);
        if (index !== -1) {
          state.allRooms[index] = room;
        }
        // Only add if not already in myRooms
        if (!state.myRooms.some(r => r._id === room._id)) {
          state.myRooms.push(room);
        }
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Leave room
      .addCase(leaveRoom.fulfilled, (state, action) => {
        const roomId = action.payload;
        state.myRooms = state.myRooms.filter(r => r._id !== roomId);
        // Update member count in allRooms
        const index = state.allRooms.findIndex(r => r._id === roomId);
        if (index !== -1) {
          state.allRooms[index] = {
            ...state.allRooms[index],
            memberCount: state.allRooms[index].memberCount - 1
          };
        }
      })
      .addCase(leaveRoom.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Fetch my rooms
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        console.log('fetchMyRooms fulfilled:', action.payload);
        state.myRooms = action.payload;
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        console.error('fetchMyRooms rejected:', action.payload);
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, setCurrentRoom } = roomsSlice.actions;
export default roomsSlice.reducer;
