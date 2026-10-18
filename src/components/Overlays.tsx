import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ToastState } from "../hooks/useCopyToast";

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="toast"
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 26, scale: 0.94, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 14, scale: 0.96, x: "-50%" }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        >
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          className="scroll-top"
          aria-label="Наверх"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.25 }}
        >
          <ArrowUp size={19} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}


