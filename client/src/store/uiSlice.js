import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isModalOpen: false,
  selectedVideoId: null,
  autoplayPreviews: true,
  toast: null, // { id, message, tone }
};

let toastCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    modalOpened(state, action) {
      state.isModalOpen = true;
      state.selectedVideoId = action.payload;
    },
    modalClosed(state) {
      state.isModalOpen = false;
      state.selectedVideoId = null;
    },
    selectedVideoChanged(state, action) {
      state.selectedVideoId = action.payload;
    },
    autoplayToggled(state, action) {
      state.autoplayPreviews =
        typeof action.payload === 'boolean' ? action.payload : !state.autoplayPreviews;
    },
    toastShown: {
      reducer(state, action) {
        state.toast = action.payload;
      },
      prepare(message, tone = 'info') {
        toastCounter += 1;
        return { payload: { id: toastCounter, message, tone } };
      },
    },
    toastDismissed(state) {
      state.toast = null;
    },
  },
});

export const {
  modalOpened,
  modalClosed,
  selectedVideoChanged,
  autoplayToggled,
  toastShown,
  toastDismissed,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectIsModalOpen = (state) => state.ui.isModalOpen;
export const selectSelectedVideoId = (state) => state.ui.selectedVideoId;
export const selectAutoplayPreviews = (state) => state.ui.autoplayPreviews;
export const selectToast = (state) => state.ui.toast;
