import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import { Plus, Trash2, ChevronDown, User, ImagePlus, Upload, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

// ── Inline photo uploader ─────────────────────────────────
function PhotoUpload({ person, uuid, onUploaded }) {
    const inputRef = useRef(null);
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);

    const upload = async (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => setLocalPreview(e.target.result);
        reader.readAsDataURL(file);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("file_category", "acreditacion");
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/12/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrf },
                body: fd,
            });
            if (res.ok) {
                const data = await res.json();
                onUploaded({ foto_id: data.id, foto_url: data.url });
                setLocalPreview(null);
            }
        } finally {
            setUploading(false);
        }
    };

    const displayUrl = localPreview || person.foto_url;

    return (
        <div
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#208DCA]/50 hover:bg-[#208DCA]/5 transition-all group relative overflow-hidden"
            onClick={() => inputRef.current?.click()}
            title="Subir imagen de pulsera / acreditación"
        >
            {displayUrl ? (
                <img src={displayUrl} alt="acreditación" className="absolute inset-0 w-full h-full object-contain rounded-xl p-1" />
            ) : uploading ? (
                <div className="text-xs text-[#208DCA] animate-pulse">{t("files.uploading")}</div>
            ) : (
                <>
                    <User size={22} className="text-slate-300 group-hover:text-[#208DCA]/40 transition-colors" />
                    <span className="text-xs text-slate-400 group-hover:text-[#208DCA]/60 transition-colors">Imagen de pulsera / acreditación</span>
                    <span className="text-[10px] text-slate-300">PNG, JPG — formato apaisado recomendado</span>
                </>
            )}
            {displayUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <ImagePlus size={18} className="text-white" />
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
    );
}

// ── Accreditation card ────────────────────────────────────
function AcreditacionCard({ person, idx, onUpdate, onRemove, uuid, isOpen, onToggle }) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-slate-200 overflow-hidden bg-white"
        >
            {/* Header */}
            <div
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`}
                onClick={onToggle}
            >
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {person.foto_url
                        ? <img src={person.foto_url} alt="" className="w-full h-full object-cover" />
                        : <User size={13} className="text-slate-400" />
                    }
                </div>
                <span className="flex-1 text-xs font-medium text-slate-800 truncate">
                    {person.nombre || `Acreditación ${idx + 1}`}
                </span>
                {person.cargo && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{person.cargo}</span>
                )}
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                    <Trash2 size={12} />
                </motion.button>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-slate-400 flex-shrink-0">
                    <ChevronDown size={13} />
                </motion.div>
            </div>

            {/* Expanded */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-slate-100 space-y-3">
                            <PhotoUpload
                                person={person}
                                uuid={uuid}
                                onUploaded={(data) => onUpdate(idx, { ...person, ...data })}
                            />
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                                        Nombre de la acreditación <span className="text-[#208DCA]">*</span>
                                    </label>
                                    <Input
                                        value={person.nombre ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...person, nombre: e.target.value })}
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wide">
                                        Zonas de acceso y permisos
                                    </label>
                                    <Input
                                        value={person.cargo ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...person, cargo: e.target.value })}
                                        placeholder="Ej: Director, Staff, Prensa, VIP..."
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main section ──────────────────────────────────────────
export default function Seccion12({ plan, section, files = [] }) {
    const { t } = useTranslation();
    const [modo, setModo] = useState(section.form_data?.modo ?? "crear");
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.personas_json ?? "[]"); }
        catch { return []; }
    });
    const [openIdx, setOpenIdx] = useState(null);

    const acreditacionFiles = files.filter((f) => f.file_category === "acreditacion_img");

    // Build readable summary for AI
    const acreditacionesResumen = items.length > 0
        ? items.map((p, i) => `${i + 1}. ${p.nombre || "Sin nombre"} — Zonas: ${p.cargo || "No especificadas"}`).join("\n")
        : "No se han creado acreditaciones todavía.";

    const formData = {
        modo,
        personas_json: JSON.stringify(items, null, 2),
        acreditaciones_resumen: acreditacionesResumen,
        num_acreditaciones: items.length,
    };

    const addItem = () => {
        const newItems = [...items, { nombre: "", cargo: "", foto_id: null, foto_url: null }];
        setItems(newItems);
        setOpenIdx(newItems.length - 1);
    };

    const updateItem = (idx, updated) => setItems((prev) => prev.map((v, i) => i === idx ? updated : v));
    const removeItem = (idx) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
        if (openIdx === idx) setOpenIdx(null);
        else if (openIdx > idx) setOpenIdx(openIdx - 1);
    };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-slate-500">
                Añade las acreditaciones del evento: sube las imágenes si ya las tienes hechas, o créalas aquí con foto, nombre y cargo.
            </p>

            {/* Mode toggle */}
            <div className="flex items-center gap-2">
                {[
                    { value: "subir", label: "Subir acreditaciones", icon: Upload },
                    { value: "crear", label: "Crear acreditaciones", icon: CreditCard },
                ].map(({ value, label, icon: Icon }) => (
                    <motion.button
                        key={value}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setModo(value)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                            modo === value
                                ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm shadow-[#208DCA]/10"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <Icon size={12} />
                        {label}
                    </motion.button>
                ))}
            </div>

            {/* ── Subir mode ── */}
            {modo === "subir" && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <FileUpload
                        uuid={plan.uuid}
                        sectionNumber={12}
                        category="acreditacion_img"
                        accept="image/*,application/pdf"
                        multiple
                        existingFiles={acreditacionFiles}
                        label="Subir acreditaciones del evento"
                        description="PNG, JPG o PDF — imágenes de las acreditaciones ya diseñadas"
                    />
                </motion.div>
            )}

            {/* ── Crear mode ── */}
            {modo === "crear" && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Acreditaciones del evento</label>
                        {items.length > 0 && (
                            <span className="text-xs text-slate-400">{items.length} {items.length === 1 ? "acreditación" : "acreditaciones"}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <AnimatePresence initial={false}>
                            {items.map((person, i) => (
                                <AcreditacionCard
                                    key={i}
                                    person={person}
                                    idx={i}
                                    uuid={plan.uuid}
                                    isOpen={openIdx === i}
                                    onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                />
                            ))}
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
                                Añadir acreditación
                            </motion.button>
                        </Shine>
                    </div>
                </motion.div>
            )}
        </SectionShell>
    );
}
