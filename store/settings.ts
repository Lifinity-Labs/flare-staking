import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SettingsState {
  selectedEndpointId: number;
  customEndpoint: string;
  setSelectedEndpointId: (selectedEndpointId: number) => void;
  setCustomEndpoint: (customEndpoint: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        selectedEndpointId: 1,
        customEndpoint: "",
        setSelectedEndpointId: (selectedEndpointId) =>
          set(() => ({ selectedEndpointId })),
        setCustomEndpoint: (customEndpoint) => set(() => ({ customEndpoint })),
      }),
      {
        name: "settings-storage",
      }
    )
  )
);
