import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionShell from "@/components/planes/SectionShell";
import { Plus, Trash2, ChevronDown, User, ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";

// ── Inline photo uploader ──────────────────────────────────
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
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/12/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
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
            className="w-20 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#208DCA]/50 hover:bg-[#208DCA]/5 transition-all group relative overflow-hidden flex-shrink-0"
            onClick={() => inputRef.current?.click()}
            title={t("s12.add_photo")}
        >
            {displayUrl ? (
                <img src={displayUrl} alt="foto" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            ) : uploading ? (
                <div className="text-[9px] text-[#208DCA] animate-pulse">{t("files.uploading")}</div>
            ) : (
                <>
                    <User size={18} className="text-slate-400 group-hover:text-[#208DCA]/50 transition-colors" />
                    <span className="text-[9px] text-slate-400 text-center leading-tight">{t("s12.photo")}</span>
                </>
            )}
            {displayUrl && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImagePlus size={16} className="text-white" />
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
            />
        </div>
    );
}

// ── Person card ────────────────────────────────────────────
function PersonCard({ person, idx, onUpdate, onRemove, uuid, isOpen, onToggle }) {
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
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isOpen ? "bg-slate-100" : "hover:bg-slate-50"}`}
                onClick={onToggle}
            >
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {person.foto_url
                        ? <img src={person.foto_url} alt="" className="w-full h-full object-cover" />
                        : <User size={13} className="text-slate-400" />
                    }
                </div>
                <span className="flex-1 text-xs font-medium text-slate-900 truncate">
                    {person.nombre || `${t("s12.person")} ${idx + 1}`}
                </span>
                {person.cargo && (
                    <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{person.cargo}</span>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <Trash2 size={12} />
                </button>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-slate-400">
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
                        <div className="p-4 border-t border-slate-200 flex gap-4">
                            <PhotoUpload
                                person={person}
                                uuid={uuid}
                                onUploaded={(data) => onUpdate(idx, { ...person, ...data })}
                            />
                            <div className="flex-1 grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-900 mb-1 block uppercase tracking-wide">
                                        {t("s12.name")} <span className="text-[#208DCA]">*</span>
                                    </label>
                                    <Input
                                        value={person.nombre ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...person, nombre: e.target.value })}
                                        placeholder={t("s12.name_placeholder")}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-900 mb-1 block uppercase tracking-wide">
                                        {t("s12.role")}
                                    </label>
                                    <Input
                                        value={person.cargo ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...person, cargo: e.target.value })}
                                        placeholder={t("s12.role_placeholder")}
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

// ── Main section ───────────────────────────────────────────
export default function Seccion12({ plan, section }) {
    const { t } = useTranslation();
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.personas_json ?? "[]"); }
        catch { return []; }
    });
    const [openIdx, setOpenIdx] = useState(null);

    const formData = { personas_json: JSON.stringify(items, null, 2) };

    const addPerson = () => {
        const newItems = [...items, { nombre: "", cargo: "", foto_id: null, foto_url: null }];
        setItems(newItems);
        setOpenIdx(newItems.length - 1);
    };

    const updatePerson = (idx, updated) => {
        setItems((prev) => prev.map((v, i) => (i === idx ? updated : v)));
    };

    const removePerson = (idx) => {
        setItems((prev) => prev.filter((_, i) => i !== idx));
        if (openIdx === idx) setOpenIdx(null);
        else if (openIdx > idx) setOpenIdx(openIdx - 1);
    };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                {t("s12.desc")}
            </p>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">{t("s12.title")}</label>
                    {items.length > 0 && (
                        <span className="text-xs text-slate-500">{items.length} {t("s12.registered")}</span>
                    )}
                </div>

                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {items.map((person, i) => (
                            <PersonCard
                                key={i}
                                person={person}
                                idx={i}
                                uuid={plan.uuid}
                                isOpen={openIdx === i}
                                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                                onUpdate={updatePerson}
                                onRemove={removePerson}
                            />
                        ))}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addPerson}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-slate-700 hover:border-[#208DCA]/40 hover:bg-[#208DCA]/5 transition-all text-xs font-medium"
                    >
                        <Plus size={13} />
                        {t("s12.add")}
                    </motion.button>
                </div>
            </div>
        </SectionShell>
    );
}
