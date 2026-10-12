import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('ricoz_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ricoz_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('ricoz_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const isDark = !document.documentElement.getAttribute('data-theme');
    return {
      isDark,
      toggleTheme: () => {
        if (isDark) {
          document.documentElement.setAttribute('data-theme', 'light');
          localStorage.setItem('ricoz_theme', 'light');
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('ricoz_theme', 'dark');
        }
      }
    };
  }
  return context;
};
