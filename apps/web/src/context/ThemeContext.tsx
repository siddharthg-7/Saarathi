import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'glass-midnight';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('saarathi_theme');
    return (saved as ThemeMode) || 'dark';
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('saarathi_theme', mode);
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'glass-midnight' : 'dark';
    setTheme(nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'glass-midnight') {
      root.classList.add('glass-midnight');
    } else {
      root.classList.remove('glass-midnight');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
