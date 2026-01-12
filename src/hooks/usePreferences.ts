import { useState, useEffect, useCallback } from 'react';

export interface UserPreferences {
  notifications: boolean;
  badgeNotifications: boolean;
  streakReminders: boolean;
  darkMode: boolean;
  language: 'fr' | 'en' | 'es';
  units: 'metric' | 'imperial';
  publicProfile: boolean;
}

const STORAGE_KEY = 'user_preferences';

const defaultPreferences: UserPreferences = {
  notifications: true,
  badgeNotifications: true,
  streakReminders: true,
  darkMode: false,
  language: 'fr',
  units: 'metric',
  publicProfile: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading preferences:', e);
    }
    return defaultPreferences;
  });

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving preferences:', e);
    }
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}
