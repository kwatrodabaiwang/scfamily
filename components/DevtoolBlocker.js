'use client';

import { useEffect } from 'react';

export default function DevtoolBlocker() {
  useEffect(() => {
    const blockShortcuts = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', blockShortcuts, true);

    const blockContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', blockContext);

    import('disable-devtool').then(({ default: DisableDevtool }) => {
      DisableDevtool({
        onDevToolOpen: function() {
          if (document.referrer) {
            window.location.replace(document.referrer);
          } else {
            window.location.replace('/');
          }
        }
      });
    });

    return () => {
      document.removeEventListener('keydown', blockShortcuts, true);
      document.removeEventListener('contextmenu', blockContext);
    };
  }, []);

  return null;
}
