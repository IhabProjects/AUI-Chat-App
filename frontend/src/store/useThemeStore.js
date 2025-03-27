import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "lemonade",
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    // Update the HTML document's data-theme attribute
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));
