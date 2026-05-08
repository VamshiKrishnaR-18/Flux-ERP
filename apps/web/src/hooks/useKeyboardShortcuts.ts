import { useEffect } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const activeElement = document.activeElement;
      const isInput = activeElement instanceof HTMLInputElement || 
                      activeElement instanceof HTMLTextAreaElement ||
                      (activeElement as HTMLElement)?.isContentEditable;

      const key = (event?.key || '').toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      // Construct shortcut string
      let shortcutStr = '';
      if (ctrlOrCmd) shortcutStr += 'mod+';
      if (shift) shortcutStr += 'shift+';
      shortcutStr += key;

      // Handle special cases like '/' for search even if in input (optional, but standard)
      if (key === '/' && !isInput) {
        event.preventDefault();
        shortcuts['/']?.(event);
        return;
      }

      if (isInput) return;

      if (shortcuts[shortcutStr]) {
        event.preventDefault();
        shortcuts[shortcutStr](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
