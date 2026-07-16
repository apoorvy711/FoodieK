import { useEffect, useState } from "react";
import "./styles/theme.css";
import "./App.css";
import "./styles/profile.css";
import { Toaster } from "react-hot-toast";

import AppRoutes from "./routes/AppRoutes";

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("foodiek-theme");

    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem("foodiek-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3200,
          style: {
            borderRadius: "16px",
            background: "rgba(15, 23, 42, 0.94)",
            color: "#f8fafc",
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.24)",
          },
          success: {
            iconTheme: {
              primary: "#34d399",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#f87171",
              secondary: "#fff",
            },
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;
