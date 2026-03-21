import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Reusable component for list-based sections.
 * Props:
 *   items: array of objects
 *   onChange: (items) => void
 *   fields: array of { key, label, type: 'text'|'email'|'tel'|'number'|'textarea', placeholder, required, wide }
 *   addLabel: string
 *   itemLabel: (item, i) => string
 */
export default function LoopItems({ items = [], onChange, fields, addLabel = "Añadir ítem", itemLabel }) {
    const [expanded, setExpanded] = useState(null);

    const addItem = () => {
        const empty = Object.fromEntries(fields.map((f) => [f.key, ""]));
        const newItems = [...items, empty];
        onChange(newItems);
        setExpanded(newItems.length - 1);
    };

    const updateItem = (index, key, value) => {
        const updated = items.map((item, i) => i === index ? { ...item, [key]: value } : item);
        onChange(updated);
    };

    const removeItem = (index) => {
        const updated = items.filter((_, i) => i !== index);
        onChange(updated);
        if (expanded === index) setExpanded(null);
        else if (expanded > index) setExpanded(expanded - 1);
    };

    return (
        <div className="space-y-2">
            <AnimatePresence initial={false}>
                {items.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="border rounded-lg overflow-hidden"
                    >
                        <div
                            className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer select-none"
                            onClick={() => setExpanded(expanded === i ? null : i)}
                        >
                            <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-sm font-medium truncate">
                                {itemLabel ? itemLabel(item, i) : `Ítem ${i + 1}`}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 size={13} />
                            </button>
                            {expanded === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>

                        <AnimatePresence initial={false}>
                            {expanded === i && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t">
                                        {fields.map((f) => (
                                            <div key={f.key} className={f.wide ? "md:col-span-2" : ""}>
                                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                    {f.label}{f.required && " *"}
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
                ))}
            </AnimatePresence>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1.5 border-dashed"
            >
                <Plus size={14} />
                {addLabel}
            </Button>
        </div>
    );
}
