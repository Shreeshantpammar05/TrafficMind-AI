import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext =
  createContext(null);

const THEME_STORAGE_KEY =
  "trafficmind-theme";

const getInitialTheme = () => {
  if (
    typeof window ===
    "undefined"
  ) {
    return "dark";
  }

  const savedTheme =
    localStorage.getItem(
      THEME_STORAGE_KEY
    );

  if (
    savedTheme === "light" ||
    savedTheme === "dark"
  ) {
    return savedTheme;
  }

  return "dark";
};

export function ThemeProvider({
  children,
}) {
  const [theme, setTheme] =
    useState(getInitialTheme);

  useEffect(() => {
    const root =
      document.documentElement;

    root.dataset.theme =
      theme;

    root.style.colorScheme =
      theme;

    document.body.style.background =
      theme === "dark"
        ? "#000000"
        : "var(--app-bg)";

    document.body.style.color =
      "var(--text-primary)";

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );
  }, [theme]);

  const setSafeTheme =
    (nextTheme) => {
      setTheme(
        nextTheme === "light"
          ? "light"
          : "dark"
      );
    };

  const value = useMemo(
    () => ({
      theme,

      isDark:
        theme === "dark",

      isLight:
        theme === "light",

      setTheme:
        setSafeTheme,

      toggleTheme:
        () =>
          setTheme(
            (current) =>
              current ===
              "dark"
                ? "light"
                : "dark"
          ),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}