import { useRef } from "react";

export const useHold = ({
  onHold,
  onRelease,
}: {
  onHold?: () => void;
  onRelease?: () => void;
}) => {
  const holdTimer = useRef<number | null>(null);
  const holdDuration = 600; // milisegundos

  const handleHoldStart = () => {
    holdTimer.current = setTimeout(() => {
      if (onHold) {
        onHold();
      }
    }, holdDuration);
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;

      if (onRelease) {
        onRelease();
      }
    }
  };

  return {
    handlers: {
      onTouchStart: handleHoldStart,
      onTouchEnd: handleHoldEnd,
      onTouchMove: handleHoldEnd,
    },
  };
};
