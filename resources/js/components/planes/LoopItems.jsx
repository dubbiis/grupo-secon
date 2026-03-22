import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, GripVertical, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/i18n";

export default function LoopItems({ items = [], onChange, fields, addLabel = "Añadir ítem", itemLabel }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(null);

    const addItem = () => {
        const empty = Object.fromEntries(fields.map((f) => [f.key, ""]));
        const newItems = [...items, empty];
        onChange(newItems);
        setExpanded(newItems.length - 1);
    };

    const updateItem = (index, key, value) => {
        onChange(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
    };

    const removeItem = (index) => {
        onChange(items.filter((_, i) => i !== index));
        if (expanded === index) setExpanded(null);
        else if (expanded > index) setExpanded(expanded - 1);
    };

    const hasContent = (item) => fields.some((f) => item[f.key]);

    return (
        <div className="space-y-2">
            <AnimatePresence initial={false}>
                {items.map((item, i) => {
                    const isOpen = expanded === i;
                    const filled = hasContent(item);

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                        >
                            {/* Header row */}
                            <div
                                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isOpen ? "bg-slate-200" : "hover:bg-slate-200"}`}
                                onClick={() => setExpanded(isOpen ? null : i)}
                            >
                                <GripVertical size={13} className="text-slate-900 flex-shrink-0" />

                                {/* Status dot */}
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${filled ? "bg-[#208DCA]/20 border-[#208DCA]/40" : "border-slate-200"}`}>
                                    {filled && <Check size={8} className="text-[#208DCA]" strokeWidth={3} />}
                                </div>

                                <span className="flex-1 text-xs font-medium text-slate-900 truncate">
                                    {itemLabel ? itemLabel(item, i) : `Ítem ${i + 1}`}
                                </span>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                                    className="p-1 rounded-lg text-slate-900 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                                >
                                    <Trash2 size={12} />
                                </motion.button>

                                <motion.div
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-slate-900 flex-shrink-0"
                                >
                                    <ChevronDown size={13} />
                                </motion.div>
                            </div>

                            {/* Expanded fields */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: "auto" }}
                                        exit={{ height: 0 }}
                                        transition={{ duration: 0.22, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-200">
                                            {fields.map((f) => (
                                                <div key={f.key} className={f.wide ? "md:col-span-2" : ""}>
                                                    <label className="text-[10px] font-semibold text-slate-900 mb-1.5 block uppercase tracking-wide">
                                                        {f.label}{f.required && <span className="text-[#208DCA] ml-0.5">*</span>}
                                                    </label>
                                                    {f.type === "textarea" ? (
                                                        <Textarea
                                                            value={item[f.key] ?? ""}
                                                            onChange={(e) => updateItem(i, f.key, e.target.value)}
                                                            placeholder={f.placeholder}
                                                            rows={3}
                                                        />
                                                    ) : (
                                                        <Input
                                                            type={f.type ?? "text"}
                                                            value={item[f.key] ?? ""}
                                                            onChange={(e) => updateItem(i, f.key, e.target.value)}
                                                            placeholder={f.placeholder}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* Add button */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-900 hover:text-slate-900 hover:border-[#208DCA]/40 hover:bg-[#208DCA]/5 transition-all text-xs font-medium"
            >
                <Plus size={13} />
                {addLabel}
            </motion.button>
        </div>
    );
}
