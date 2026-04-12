import { useEffect, useRef } from 'react';

export function useAlertMessage(message: string) {
  const lastMessageRef = useRef('');

  useEffect(() => {
    if (!message || lastMessageRef.current === message) {
      return;
    }

    lastMessageRef.current = message;
    window.alert(message);
  }, [message]);
}
