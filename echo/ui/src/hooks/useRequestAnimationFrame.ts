import { useCallback, useEffect, useRef } from "react";

/**
 * Shamelessly taken from https://www.30secondsofcode.org/react/s/use-request-animation-frame.
 */
export default function useRequestAnimationFrame(callback: (time?: number) => void) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current) {
        callback(time - previousTimeRef.current);
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback],
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
}
