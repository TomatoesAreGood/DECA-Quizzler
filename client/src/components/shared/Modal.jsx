import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export function Modal({ isOpen, onClose, children, variant = 'default' }) {
  const [positionPx, setPositionPx] = useState(() => {
    try {
      const saved = localStorage.getItem('modalPosition');
      return saved ? parseFloat(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startTopPx = useRef(0);
  const startMarginPx = useRef(0);
  const dragScale = useRef(1);

  const startDrag = (clientY, modalElement) => {
    setIsDragging(true);
    dragStartY.current = clientY;

    // Get current position in pixels
    const rect = modalElement.getBoundingClientRect();
    startTopPx.current = rect.top;
    startMarginPx.current = parseFloat(getComputedStyle(modalElement).marginTop) || 0;
    // Screen pixels per CSS pixel, which isn't 1 when the page is zoomed out (see html in index.css)
    dragScale.current = rect.height / modalElement.offsetHeight || 1;
  };

  const handleMouseDown = (e) => {
    startDrag(e.clientY, e.currentTarget.parentElement);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    startDrag(e.touches[0].clientY, e.currentTarget.parentElement);
    e.preventDefault();
  };

  useEffect(() => {
    const dragTo = (clientY) => {
      const newTopPx = startTopPx.current + clientY - dragStartY.current;

      // Get navbar height to prevent dragging past it
      const navbar = document.querySelector('.navbar');
      const minTop = navbar ? navbar.getBoundingClientRect().bottom : 0;
      const maxTop = window.innerHeight * 0.8;
      const constrainedTopPx = Math.max(minTop, Math.min(maxTop, newTopPx));

      // The modal is placed by its top margin, which is in CSS pixels
      const marginPx = startMarginPx.current + (constrainedTopPx - startTopPx.current) / dragScale.current;
      setPositionPx(marginPx);

      // Save to localStorage
      try {
        localStorage.setItem('modalPosition', marginPx.toString());
      } catch {
        // Ignore localStorage errors
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      dragTo(e.clientY);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      dragTo(e.touches[0].clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const getMarginTop = () => {
    if (positionPx !== null) {
      return `${positionPx}px`;
    }
    return '20%';
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal" style={{ display: 'block' }}>
          <Dialog.Content
            className={variant === 'confirm' ? 'modal-content-confirm-exit' : 'modal-content'}
            style={{ marginTop: getMarginTop() }}
            aria-describedby={undefined}
          >
            <VisuallyHidden.Root>
              <Dialog.Title>Quiz Modal</Dialog.Title>
            </VisuallyHidden.Root>
            <VisuallyHidden.Root>
              <Dialog.Description>Modal dialog with quiz information</Dialog.Description>
            </VisuallyHidden.Root>
            <div
              className={`modal-drag-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div className="modal-drag-indicator"></div>
            </div>
            {children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
