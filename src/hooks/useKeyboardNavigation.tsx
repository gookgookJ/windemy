import { useEffect, useRef } from 'react';

interface KeyboardNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  onActivate: () => void;
  isEnabled?: boolean;
}

export const useKeyboardNavigation = ({
  onPrevious,
  onNext,
  onActivate,
  isEnabled = true,
}: KeyboardNavigationProps) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when the hero section is focused
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNext();
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onActivate();
          break;
        case 'Home':
          event.preventDefault();
          // Could add jump to first slide
          break;
        case 'End':
          event.preventDefault();
          // Could add jump to last slide
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrevious, onNext, onActivate, isEnabled]);

  // Helper to set focus on the container
  const focusContainer = () => {
    containerRef.current?.focus();
  };

  return {
    containerRef,
    focusContainer,
  };
};