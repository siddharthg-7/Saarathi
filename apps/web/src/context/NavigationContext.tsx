import React, { createContext, useContext, useEffect, useState } from 'react';
import { ViewType } from '@saarathi/types';

export const ALL_VIEWS: ViewType[] = [
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

// Views that are safe to render without an authenticated user.
export const PUBLIC_VIEWS: ViewType[] = ['landing', 'auth'];

export const isPublicView = (view: ViewType): boolean => PUBLIC_VIEWS.includes(view);

export const isValidView = (view: string): view is ViewType =>
  ALL_VIEWS.includes(view as ViewType);

interface NavigationContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  navigate: (view: ViewType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const hash = window.location.hash.replace('#', '');
    return isValidView(hash) ? hash : 'landing';
  });

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (isValidView(hash)) {
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
