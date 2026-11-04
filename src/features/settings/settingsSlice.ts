import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Theme } from "@/types/chat";

export interface SettingsState {
  theme: Theme;
  simulateActivity: boolean;
}

export const initialSettingsState: SettingsState = {
  theme: "light",
  simulateActivity: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: initialSettingsState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    setSimulateActivity(state, action: PayloadAction<boolean>) {
      state.simulateActivity = action.payload;
    },
    toggleSimulateActivity(state) {
      state.simulateActivity = !state.simulateActivity;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  setSimulateActivity,
  toggleSimulateActivity,
} = settingsSlice.actions;

export default settingsSlice.reducer;
