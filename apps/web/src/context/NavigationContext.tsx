import React, { createContext, useContext, useEffect, useState } from 'react';
import { ViewType } from '@saarathi/types';

interface NavigationContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  navigate: (view: ViewType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const hash = window.location.hash.replace('#', '');
    const validViews: ViewType[] = [
      'landing',
      'dashboard',
      'today',
      'calendar',
      'tasks',
      'aichat',
      'analytics',
      'braindump',
      'focus',
      'habits',
      'goals',
      'settings',
      'notifications',
      'profile',
    ];
    return validViews.includes(hash as ViewType) ? (hash as ViewType) : 'landing';
  });

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ViewType;
      if (hash) {
        setCurrentView(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentView, setCurrentView: navigate, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
