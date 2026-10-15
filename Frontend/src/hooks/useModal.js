import { useEffect, useRef } from "react";

export function useModal(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  const props = {
    ref,
    onClose,
    onClick: (e) => {
      if (e.target === ref.current) ref.current.close(); // click on backdrop
    },
  };
  return [ref, props];
}