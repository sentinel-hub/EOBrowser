import { useRef } from 'react';
import './DialogBox.scss';
import useOutsideClick from '../../hooks/useOutsideClick';
import useKeyPressed from '../../hooks/useKeyPressed';

const DialogBox = ({
  className,
  title,
  onClose = () => {},
  children,
  onMouseDown,
  modal,
  modalMask,
  closeOnEsc = true,
  showTitleBar = true,
  showCloseButton = true,
}) => {
  const elemRef = useRef(null);

  useOutsideClick(elemRef, () => {
    if (modal) {
      onClose();
    }
  });

  useKeyPressed('Escape', () => {
    if (closeOnEsc || modal) {
      onClose();
    }
  });

  return (
    <>
      {modal && modalMask ? modalMask : null}
      <div ref={elemRef} className={`dialog-box ${className}`}>
        {showTitleBar && (
          <div className="title-bar drag-handle" onMouseDown={onMouseDown}>
            <h3 className="title ">{title}</h3>
            {showCloseButton && <i className="close-btn fa fa-close" onClick={onClose} />}
          </div>
        )}
        {children}
      </div>
    </>
  );
};

export default DialogBox;
