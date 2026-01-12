// Simple event-based approach for triggering refreshes across components
interface ExplorationStore {
  lastExplorationTime: number;
  triggerRefresh: () => void;
}

// Using a simple event-based approach since we don't have zustand
const listeners = new Set<() => void>();
let lastExplorationTime = 0;

export function useExplorationRefresh() {
  const triggerRefresh = () => {
    lastExplorationTime = Date.now();
    listeners.forEach(listener => listener());
  };

  const subscribe = (callback: () => void): (() => void) => {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  };

  return {
    lastExplorationTime,
    triggerRefresh,
    subscribe,
  };
}

// Global singleton for triggering refresh from GPSTracker
export const explorationEvents = {
  trigger: () => {
    lastExplorationTime = Date.now();
    listeners.forEach(listener => listener());
  },
  subscribe: (callback: () => void): (() => void) => {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  },
  getLastTime: () => lastExplorationTime,
};
