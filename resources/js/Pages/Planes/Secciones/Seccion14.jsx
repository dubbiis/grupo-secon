import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

function newAnexo() {
    return { id: Math.random().toString(36).slice(2, 8), nombre: "", descripcion: "" };
}

export default function Seccion14({ plan, section, files = [] }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(null);
    const [items, setItems] = useState(() => {
        try {
            const parsed = JSON.parse(section.form_data?.anexos_json ?? "[]");
            return parsed.length > 0 ? parsed : [];
        } catch { return []; }
    });

    // Build readable summary for AI
    const anexosResumen = items.length > 0
        ? items.map((a, i) => {
            const itemFiles = files.filter((f) => f.file_category === `anexo_${a.id}`);
            const fileInfo = itemFiles.length > 0
                ? `(${itemFiles.length} archivo${itemFiles.length > 1 ? "s" : ""}: ${itemFiles.map((f) => f.original_name).join(", ")})`
                : "(sin archivo adjunto)";
            return `${i + 1}. ${a.nombre || "Sin nombre"}${a.descripcion ? ` — ${a.descripcion}` : ""} ${fileInfo}`;
        }).join("\n")
        : "No se han añadido anexos todavía.";

    const formData = {
        anexos_json: JSON.stringify(items),
        anexos_resumen: anexosResumen,
        num_anexos: items.length,
    };

    const addItem = () => {
        const a = newAnexo();
        setItems((prev) => [...prev, a]);
        setExpanded(items.length);
    };

    const removeItem = (i) => {
        setItems((prev) => prev.filter((_, idx) => idx !== i));
        if (expanded === i) setExpanded(null);
        else if (expanded > i) setExpanded(expanded - 1);
    };

    const updateItem = (i, key, val) => {
        setItems((prev) => prev.map((a, idx) => idx === i ? { ...a, [key]: val } : a));
    };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-slate-500">
                Lista y sube los documentos que se adjuntan al plan de seguridad como anexos.
            </p>

            <div className="space-y-2">
                <AnimatePresence initial={false}>
                    {items.map((item, i) => {
                        const isOpen = expanded === i;
                        const itemFiles = files.filter((f) => f.file_category === `anexo_${item.id}`);
                        const hasFile = itemFiles.length > 0;
                        const hasName = !!item.nombre;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96, y: -5 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                            >
                                {/* Header */}
                                <div
                                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`}
                                    onClick={() => setExpanded(isOpen ? null : i)}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${hasFile ? "bg-[#208DCA]/15 border border-[#208DCA]/30" : "bg-slate-100 border border-slate-200"}`}>
                                        <Paperclip size={13} className={hasFile ? "text-[#208DCA]" : "text-slate-400"} />
                                    </div>
                                    <span className="flex-1 text-xs font-medium text-slate-800 truncate">
                                        {hasName ? item.nombre : `Anexo ${i + 1}`}
                                    </span>
                                    {hasFile && (
                                        <span className="text-[10px] font-medium text-[#208DCA] bg-[#208DCA]/10 px-2 py-0.5 rounded-full">
                                            {itemFiles.length} archivo{itemFiles.length > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 size={12} />
                                    </motion.button>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-slate-400 flex-shrink-0"
                                    >
                                        <ChevronDown size={13} />
                                    </motion.div>
                                </div>

                                {/* Expanded content */}
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            transition={{ duration: 0.22, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-4 space-y-3 border-t border-slate-100">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                                                        Nombre del anexo <span className="text-[#208DCA]">*</span>
                                                    </label>
                                                    <Input
                                                        value={item.nombre}
                                                        onChange={(e) => updateItem(i, "nombre", e.target.value)}
                                                        placeholder="Ej: Contrato de servicios, Licencia municipal, Seguro de responsabilidad..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">
                                                        Descripción <span className="text-slate-400 normal-case tracking-normal font-normal">(opcional)</span>
                                                    </label>
                                                    <Textarea
                                                        value={item.descripcion}
                                                        onChange={(e) => updateItem(i, "descripcion", e.target.value)}
                                                        placeholder="Breve descripción del documento adjunto..."
                                                        rows={2}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">Archivo</label>
                                                    <FileUpload
                                                        uuid={plan.uuid}
                                                        sectionNumber={14}
                                                        category={`anexo_${item.id}`}
                                                        accept="*"
                                                        multiple
                                                        existingFiles={itemFiles}
                                                        label="Subir documento"
                                                        description="PDF, Word, Excel u otros formatos"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                <Shine enableOnHover color="#208DCA" opacity={0.06} duration={500} asChild>
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addItem}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-[#208DCA] hover:border-[#208DCA]/40 hover:bg-[#208DCA]/3 transition-all text-xs font-medium"
                    >
                        <Plus size={13} />
                        {t("s14.add")}
                    </motion.button>
                </Shine>
            </div>
        </SectionShell>
    );
}
