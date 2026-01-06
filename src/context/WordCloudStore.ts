import * as React from 'react';

// Simple store without external dependencies
type Listener = () => void;

interface WordCloudState {
  isActive: boolean;
}

const state: WordCloudState = {
  isActive: false,
};

const listeners: Set<Listener> = new Set();

export const wordCloudStore = {
  getState: () => state,
  setIsActive: (active: boolean) => {
    state.isActive = active;
    listeners.forEach((listener) => listener());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// Custom hook to use the store
export const useWordCloudStore = () => {
  const [, forceUpdate] = React.useState({});

  React.useEffect(() => {
    const unsubscribe = wordCloudStore.subscribe(() => forceUpdate({}));
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isActive: wordCloudStore.getState().isActive,
    setIsActive: wordCloudStore.setIsActive,
  };
};
