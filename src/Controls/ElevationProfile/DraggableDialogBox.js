import { useCallback, useEffect, useState } from 'react';

import './DraggableDialogBox.scss';

export const DraggableDialogBox = ({ className, width, height, onClose, title, children }) => {
  const [position, setPosition] = useState({
    x: (window.innerWidth - width) / 2,
    y: (window.innerHeight - height) / 2,
  });

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onDrag = useCallback(
    (event) => {
      if (dragging) {
        const newX = event.clientX - offset.x;
        const newY = event.clientY - offset.y;
        setPosition({
          x: newX,
          y: newY,
        });
      }
    },
    [dragging, offset],
  );

  useEffect(() => {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', onStopDragging);

    return () => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', onStopDragging);
    };
  }, [onDrag]);

  const onStopDragging = () => {
    setDragging(false);
  };

  const onStartDragging = (event) => {
    setDragging(true);
    setOffset({ x: event.clientX - position.x, y: event.clientY - position.y });
  };

  return (
    <div
      className={`draggable-dialog-box ${className}`}
      style={{
        top: position.y,
        left: position.x,
        width: width,
        height: height,
      }}
    >
      <div className="title-bar drag-handle" onMouseDown={onStartDragging}>
        <h3 className="title">{title}</h3>
        <i className="close-btn fa fa-close" onClick={onClose} />
      </div>
      {children}
    </div>
  );
};
