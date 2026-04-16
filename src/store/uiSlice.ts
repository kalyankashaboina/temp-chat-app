import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type BottomSheetType = 'theme' | 'language' | 'notificationTone' | 'fontSize' | 'notificationSettings' | null;

interface UIState {
  activeBottomSheet: BottomSheetType;
  isProfileOpen: boolean;
  isMediaGalleryOpen: boolean;
  isMobile: boolean;
}

const initialState: UIState = {
  activeBottomSheet: null,
  isProfileOpen: false,
  isMediaGalleryOpen: false,
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openBottomSheet: (state, action: PayloadAction<BottomSheetType>) => {
      state.activeBottomSheet = action.payload;
    },
    closeBottomSheet: (state) => {
      state.activeBottomSheet = null;
    },
    setProfileOpen: (state, action: PayloadAction<boolean>) => {
      state.isProfileOpen = action.payload;
    },
    setMediaGalleryOpen: (state, action: PayloadAction<boolean>) => {
      state.isMediaGalleryOpen = action.payload;
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
  },
});

export const {
  openBottomSheet,
  closeBottomSheet,
  setProfileOpen,
  setMediaGalleryOpen,
  setIsMobile,
} = uiSlice.actions;

export default uiSlice.reducer;
