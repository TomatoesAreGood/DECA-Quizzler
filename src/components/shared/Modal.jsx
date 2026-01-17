import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

export function Modal({ isOpen, onClose, children, variant = 'default' }) {
  const [positionPx, setPositionPx] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startTopPx = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setPositionPx(null);
    }
  }, [isOpen]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;

    // Get current position in pixels
    const modalElement = e.currentTarget.parentElement;
    const rect = modalElement.getBoundingClientRect();
    startTopPx.current = rect.top;

    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaY = e.clientY - dragStartY.current;
      const newTopPx = startTopPx.current + deltaY;

      // Constrain between 0px and 80% of viewport height
      const maxTop = window.innerHeight * 0.8;
      const constrainedTopPx = Math.max(0, Math.min(maxTop, newTopPx));
      setPositionPx(constrainedTopPx);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
          >
            <VisuallyHidden.Root>
              <Dialog.Title>Quiz Modal</Dialog.Title>
            </VisuallyHidden.Root>
            <div
              className={`modal-drag-handle ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
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
