import { configureStore } from '@reduxjs/toolkit';
import videosReducer from './videosSlice';
import uiReducer from './uiSlice';

const store = configureStore({
  reducer: {
    videos: videosReducer,
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
