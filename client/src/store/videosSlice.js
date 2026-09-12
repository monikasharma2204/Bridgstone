import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchVideos, postLike, postShare } from '../services/api';


const initialState = {
  ids: [],
  entities: {},
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  likedIds: [],
  pendingLikes: {},
  pendingShares: {},
};

export const loadVideos = createAsyncThunk(
  'videos/load',
  async (_arg, { signal, rejectWithValue }) => {
    try {
      return await fetchVideos({ limit: 40, signal });
    } catch (err) {
      return rejectWithValue(err.message || 'Could not load videos.');
    }
  }
);

export const toggleLike = createAsyncThunk(
  'videos/toggleLike',
  async (videoId, { getState, rejectWithValue }) => {
  
    const snapshot = getState().videos.pendingLikes[videoId];
    const wasLiked = snapshot ? snapshot.liked : false;
    try {
      return await postLike({ videoId, action: wasLiked ? 'unlike' : 'like' });
    } catch (err) {
      return rejectWithValue(err.message || 'Could not save your like.');
    }
  }
);

export const shareVideo = createAsyncThunk(
  'videos/share',
  async ({ videoId, platform }, { rejectWithValue }) => {
    try {
      return await postShare({ videoId, platform });
    } catch (err) {
      return rejectWithValue(err.message || 'Could not record the share.');
    }
  }
);

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ---- load ---------------------------------------------------------
      .addCase(loadVideos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadVideos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.ids = [];
        state.entities = {};
        state.likedIds = [];
        action.payload.forEach((video) => {
          state.ids.push(video._id);
          state.entities[video._id] = video;
          if (video.likedByMe) state.likedIds.push(video._id);
        });
      })
      .addCase(loadVideos.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = 'failed';
        state.error = action.payload || 'Could not load videos.';
      })

      // ---- like: optimistic, with rollback -------------------------------
      .addCase(toggleLike.pending, (state, action) => {
        const id = action.meta.arg;
        const video = state.entities[id];
        if (!video) return;
        const liked = state.likedIds.includes(id);

        state.pendingLikes[id] = { likes: video.likes, liked };

        video.likes = Math.max(0, video.likes + (liked ? -1 : 1));
        state.likedIds = liked
          ? state.likedIds.filter((x) => x !== id)
          : [...state.likedIds, id];
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const id = action.meta.arg;
        const video = state.entities[id];
        delete state.pendingLikes[id];
        if (!video || !action.payload) return;
        // Trust the server's count over the optimistic guess.
        video.likes = action.payload.likes;
        const liked = Boolean(action.payload.liked);
        const has = state.likedIds.includes(id);
        if (liked && !has) state.likedIds.push(id);
        if (!liked && has) state.likedIds = state.likedIds.filter((x) => x !== id);
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const id = action.meta.arg;
        const snapshot = state.pendingLikes[id];
        delete state.pendingLikes[id];
        const video = state.entities[id];
        if (!snapshot || !video) return;
        // Roll the optimistic update back exactly.
        video.likes = snapshot.likes;
        const has = state.likedIds.includes(id);
        if (snapshot.liked && !has) state.likedIds.push(id);
        if (!snapshot.liked && has) state.likedIds = state.likedIds.filter((x) => x !== id);
      })

      // ---- share: optimistic, with rollback ------------------------------
      .addCase(shareVideo.pending, (state, action) => {
        const { videoId } = action.meta.arg;
        const video = state.entities[videoId];
        if (!video) return;
        state.pendingShares[action.meta.requestId] = { videoId, shares: video.shares };
        video.shares += 1;
      })
      .addCase(shareVideo.fulfilled, (state, action) => {
        delete state.pendingShares[action.meta.requestId];
        const { videoId } = action.meta.arg;
        const video = state.entities[videoId];
        if (video && action.payload) video.shares = action.payload.shares;
      })
      .addCase(shareVideo.rejected, (state, action) => {
        const snapshot = state.pendingShares[action.meta.requestId];
        delete state.pendingShares[action.meta.requestId];
        if (!snapshot) return;
        const video = state.entities[snapshot.videoId];
        if (video) video.shares = snapshot.shares;
      });
  },
});

export default videosSlice.reducer;

// ---- selectors -----------------------------------------------------------

export const selectVideoIds = (state) => state.videos.ids;
export const selectVideosStatus = (state) => state.videos.status;
export const selectVideosError = (state) => state.videos.error;
export const selectVideoById = (state, id) => state.videos.entities[id];
export const selectIsLiked = (state, id) => state.videos.likedIds.includes(id);
