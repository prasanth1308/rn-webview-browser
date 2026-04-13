import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { InAppNotificationBanner } from '@/components/notifications/InAppNotificationBanner';

export type NotificationType = 'info' | 'success' | 'error';

export type InAppNotification = {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
};

type InAppNotificationContextValue = {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
};

const InAppNotificationContext = createContext<InAppNotificationContextValue | null>(null);

export function InAppNotificationProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<InAppNotification | null>(null);
  const queue = useRef<InAppNotification[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    const next = queue.current.shift();
    if (!next) {
      setCurrent(null);
      return;
    }
    setCurrent(next);
    timerRef.current = setTimeout(() => {
      setCurrent(null);
      // Small gap before showing next notification
      timerRef.current = setTimeout(showNext, 300);
    }, next.duration);
  }, []);

  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info', duration = 3000) => {
      const notification: InAppNotification = {
        id: String(Date.now()),
        message,
        type,
        duration,
      };

      if (current === null && queue.current.length === 0) {
        setCurrent(notification);
        timerRef.current = setTimeout(() => {
          setCurrent(null);
          timerRef.current = setTimeout(showNext, 300);
        }, duration);
      } else {
        queue.current.push(notification);
      }
    },
    [current, showNext],
  );

  return (
    <InAppNotificationContext.Provider value={{ showNotification }}>
      {children}
      <InAppNotificationBanner notification={current} />
    </InAppNotificationContext.Provider>
  );
}

export function useInAppNotificationContext() {
  const ctx = useContext(InAppNotificationContext);
  if (!ctx) throw new Error('useInAppNotificationContext must be used within InAppNotificationProvider');
  return ctx;
}
