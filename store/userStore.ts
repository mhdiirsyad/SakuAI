import { create } from "zustand";

interface UserStore{
    currency: string;
    setCurrency: (value: string) => void;
    needsOnBoarding: boolean | null;
    setNeedsOnBoarding: (value: boolean | null) => void
}

export const useUserStore = create<UserStore>((set) => ({
    currency: "IDR",
    setCurrency: (value) => set({currency: value}),
    needsOnBoarding: null,
    setNeedsOnBoarding: (value) => set({needsOnBoarding: value})
}))