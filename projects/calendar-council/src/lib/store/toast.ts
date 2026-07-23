"use client";

import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  kind?: "default" | "success" | "warning" | "council";
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    counter += 1;
    const id = `t${counter}`;
    set((s) => ({ toasts: [...s.toasts, { id, duration: 4200, ...t }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(t: Omit<ToastItem, "id">) {
  return useToastStore.getState().push(t);
}
