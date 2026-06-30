import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ImportQueueContextType = {
  queue: string[];
  currentIndex: number;
  totalCount: number;
  isActive: boolean;
  startQueue: (trackIds: string[]) => void;
  getCurrentTrackId: () => string | null;
  getProgress: () => { current: number; total: number };
  advanceToNext: () => string | null;
  clearQueue: () => void;
};

const ImportQueueContext = createContext<ImportQueueContextType | undefined>(undefined);

export function ImportQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startQueue = useCallback((trackIds: string[]) => {
    setQueue(trackIds);
    setCurrentIndex(0);
  }, []);

  const getCurrentTrackId = useCallback(() => {
    if (queue.length === 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  }, [queue, currentIndex]);

  const getProgress = useCallback(() => {
    if (queue.length === 0) {
      return { current: 0, total: 0 };
    }
    return { current: currentIndex + 1, total: queue.length };
  }, [queue, currentIndex]);

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (nextIndex >= queue.length) {
      setQueue([]);
      setCurrentIndex(0);
      return null;
    }
    return queue[nextIndex];
  }, [queue, currentIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  return (
    <ImportQueueContext.Provider
      value={{
        queue,
        currentIndex,
        totalCount: queue.length,
        isActive: queue.length > 0,
        startQueue,
        getCurrentTrackId,
        getProgress,
        advanceToNext,
        clearQueue,
      }}>
      {children}
    </ImportQueueContext.Provider>
  );
}

export function useImportQueue() {
  const context = useContext(ImportQueueContext);
  if (!context) {
    throw new Error('useImportQueue must be used within ImportQueueProvider');
  }
  return context;
}
