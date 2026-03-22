import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dialog({ open, onClose, children }) {
    const overlayRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={overlayRef}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => e.target === overlayRef.current && onClose?.()}
                >
                    <motion.div
                        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-black/60"
                        initial={{ scale: 0.95, y: 8, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 8, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        {children}
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn("px-6 pt-6 pb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
    return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogContent({ className, ...props }) {
    return <div className={cn("px-6 pb-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
    return <div className={cn("flex justify-end gap-3 px-6 pb-6", className)} {...props} />;
}
