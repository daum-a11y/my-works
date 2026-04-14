import { useEffect } from 'react';

export function cleanupKrdsModalState() {
  document.body.classList.remove('scroll-no');
  document.getElementById('wrap')?.removeAttribute('inert');
}

export function useKrdsModalCleanup(open: boolean) {
  useEffect(() => {
    if (!open) {
      cleanupKrdsModalState();
      return undefined;
    }

    return cleanupKrdsModalState;
  }, [open]);
}
