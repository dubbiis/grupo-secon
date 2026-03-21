import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import { Plus, Trash2, ChevronDown, User, ImagePlus, X } from "lucide-react";

const TIPOS_PUBLICO = [
    "Público general mixto",
    "Jóvenes (18-30 años)",
    "Familiar (todas las edades)",
    "Profesional / Corporativo",
    "Deportivo",
    "Cultural / Artístico",
    "Otro",
];

// ── Inline VIP photo uploader ──────────────────────────────
function VipPhotoUpload({ vip, uuid, onUploaded }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("file_category", "vip_foto");
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/6/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                body: fd,
            });
            if (res.ok) {
                const data = await res.json();
                onUploaded({ foto_id: data.id, foto_url: data.url });
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="w-20 h-24 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#208DCA]/50 hover:bg-[#208DCA]/5 transition-all group relative overflow-hidden flex-shrink-0"
            onClick={() => inputRef.current?.click()}
            title="Foto del VIP (opcional)"
        >
            {vip.foto_url ? (
                <img src={vip.foto_url} alt="foto" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            ) : uploading ? (
                <div className="text-[9px] text-[#208DCA] animate-pulse">Subiendo...</div>
            ) : (
                <>
                    <User size={18} className="text-white/20 group-hover:text-[#208DCA]/50 transition-colors" />
                    <span className="text-[9px] text-white/25 text-center leading-tight">Añadir foto</span>
                </>
            )}
            {vip.foto_url && (
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

// ── VIP item card ──────────────────────────────────────────
function VipCard({ vip, idx, onUpdate, onRemove, uuid, isOpen, onToggle }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-white/8 overflow-hidden bg-white/3"
        >
            {/* Header */}
            <div
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isOpen ? "bg-white/6" : "hover:bg-white/5"}`}
                onClick={onToggle}
            >
                {/* Avatar thumbnail */}
                <div className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {vip.foto_url
                        ? <img src={vip.foto_url} alt="" className="w-full h-full object-cover" />
                        : <User size={13} className="text-white/30" />
                    }
                </div>
                <span className="flex-1 text-xs font-medium text-white/70 truncate">
                    {vip.nombre || `VIP ${idx + 1}`}
                </span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                    className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <Trash2 size={12} />
                </button>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/25">
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
                        <div className="p-4 border-t border-white/6 flex gap-4">
                            {/* Photo upload */}
                            <VipPhotoUpload
                                vip={vip}
                                uuid={uuid}
                                onUploaded={(data) => onUpdate(idx, { ...vip, ...data })}
                            />

                            {/* Fields */}
                            <div className="flex-1 grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-white/35 mb-1 block uppercase tracking-wide">
                                        Nombre / Artista / Personalidad <span className="text-[#208DCA]">*</span>
                                    </label>
                                    <Input
                                        value={vip.nombre ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...vip, nombre: e.target.value })}
                                        placeholder="Nombre completo"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-white/35 mb-1 block uppercase tracking-wide">
                                        Perfil y consideraciones de seguridad
                                    </label>
                                    <Textarea
                                        value={vip.descripcion ?? ""}
                                        onChange={(e) => onUpdate(idx, { ...vip, descripcion: e.target.value })}
                                        placeholder="Describe el perfil y qué implica su presencia para la seguridad..."
                                        rows={3}
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
export default function Seccion6({ plan, section }) {
    const [form, setForm] = useState({
        perfil_publico: "",
        rango_edad: "",
        ambito_geografico: "",
        ...section.form_data,
    });

    const [vips, setVips] = useState(() => {
        try { return JSON.parse(section.form_data?.vips_json ?? "[]"); }
        catch { return []; }
    });

    const [openIdx, setOpenIdx] = useState(null);

    const formData = {
        ...form,
        vips_json: JSON.stringify(vips, null, 2),
    };

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const addVip = () => {
        const newVips = [...vips, { nombre: "", descripcion: "", foto_id: null, foto_url: null }];
        setVips(newVips);
        setOpenIdx(newVips.length - 1);
    };

    const updateVip = (idx, updated) => {
        setVips((prev) => prev.map((v, i) => (i === idx ? updated : v)));
    };

    const removeVip = (idx) => {
        setVips((prev) => prev.filter((_, i) => i !== idx));
        if (openIdx === idx) setOpenIdx(null);
        else if (openIdx > idx) setOpenIdx(openIdx - 1);
    };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={setForm}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Tipo de público *</label>
                    <select
                        value={form.perfil_publico}
                        onChange={(e) => setForm((prev) => ({ ...prev, perfil_publico: e.target.value }))}
                        className="flex h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 py-1 text-sm text-white shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50"
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_PUBLICO.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Rango de edad estimado</label>
                    <Input {...field("rango_edad")} placeholder="Ej: 18-45 años, mayoritariamente 25-35" />
                </div>

                <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Ámbito geográfico</label>
                    <Input {...field("ambito_geografico")} placeholder="Ej: Local (ciudad), Regional (Cataluña), Nacional, Internacional" />
                </div>
            </div>

            {/* VIPs */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Artistas / VIPs / Personalidades</label>
                    {vips.length > 0 && (
                        <span className="text-xs text-white/30">{vips.length} registrado{vips.length !== 1 ? "s" : ""}</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                    Añade cada artista, VIP o personalidad relevante. Puedes añadir su foto para el plan.
                </p>

                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {vips.map((vip, i) => (
                            <VipCard
                                key={i}
                                vip={vip}
                                idx={i}
                                uuid={plan.uuid}
                                isOpen={openIdx === i}
                                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                                onUpdate={updateVip}
                                onRemove={removeVip}
                            />
                        ))}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={addVip}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-[#208DCA]/40 hover:bg-[#208DCA]/5 transition-all text-xs font-medium"
                    >
                        <Plus size={13} />
                        Añadir artista / VIP
                    </motion.button>
                </div>
            </div>
        </SectionShell>
    );
}
