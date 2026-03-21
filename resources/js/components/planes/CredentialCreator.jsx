import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Download, Save, X, User, Image, Palette, Type, Check, RotateCcw } from "lucide-react";

// ── Color presets ─────────────────────────────────────────────
const COLOR_PRESETS = [
    { label: "Secon",     bg: "#253C87", accent: "#208DCA", text: "#ffffff" },
    { label: "Noir",      bg: "#1a1a1a", accent: "#C9A96E", text: "#ffffff" },
    { label: "Rojo",      bg: "#CC0000", accent: "#ffffff", text: "#ffffff" },
    { label: "Verde",     bg: "#1B5E20", accent: "#66BB6A", text: "#ffffff" },
    { label: "Morado",    bg: "#4A148C", accent: "#CE93D8", text: "#ffffff" },
    { label: "Marino",    bg: "#0D2137", accent: "#4FC3F7", text: "#ffffff" },
    { label: "Dorado",    bg: "#ffffff", accent: "#B8860B", text: "#1a1a1a" },
    { label: "Plata",     bg: "#f5f5f5", accent: "#607D8B", text: "#1a1a1a" },
];

// ── Draw credential on canvas ─────────────────────────────────
function drawCredential(canvas, config) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const { bg, accent, textColor, name, position, extraFields, photoImg, logoImg, showLogo } = config;

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Top color band
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 8);

    // Bottom color band
    ctx.fillStyle = accent;
    ctx.fillRect(0, H - 8, W, 8);

    // Logo area (top right)
    if (showLogo && logoImg) {
        const lh = 36, lw = lh * (logoImg.width / logoImg.height);
        ctx.save();
        ctx.drawImage(logoImg, W - lw - 14, 16, Math.min(lw, 80), lh);
        ctx.restore();
    }

    // Org/event name (top left, small)
    ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";
    ctx.font = "bold 10px Arial";
    ctx.fillText("ACREDITACIÓN", 14, 28);

    // Photo placeholder / actual photo (left center)
    const photoX = 14, photoY = 44, photoW = 70, photoH = 85;
    ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(photoX, photoY, photoW, photoH);
    if (photoImg) {
        // Crop to fill
        const scale = Math.max(photoW / photoImg.width, photoH / photoImg.height);
        const sw = photoW / scale, sh = photoH / scale;
        const sx = (photoImg.width - sw) / 2, sy = (photoImg.height - sh) / 2;
        ctx.drawImage(photoImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } else {
        // Placeholder icon
        ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.arc(photoX + photoW / 2, photoY + 32, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(photoX + photoW / 2, photoY + 62, 22, 0, Math.PI);
        ctx.fill();
    }
    // Photo border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    // Name (large)
    const textX = 96, nameY = 64;
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.min(18, Math.floor(400 / Math.max(name.length, 1)) + 6)}px Arial`;
    const truncName = name.length > 22 ? name.slice(0, 22) + "…" : name;
    ctx.fillText(truncName, textX, nameY);

    // Position
    ctx.fillStyle = accent;
    ctx.font = "bold 11px Arial";
    const truncPos = (position || "").length > 28 ? (position || "").slice(0, 28) + "…" : (position || "");
    ctx.fillText(truncPos, textX, nameY + 18);

    // Divider line
    ctx.strokeStyle = accent + "60";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textX, nameY + 26);
    ctx.lineTo(W - 14, nameY + 26);
    ctx.stroke();

    // Extra fields
    let fieldY = nameY + 44;
    extraFields.filter((f) => f.label && f.value).slice(0, 4).forEach((f) => {
        ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
        ctx.font = "bold 9px Arial";
        ctx.fillText(f.label.toUpperCase(), textX, fieldY);
        ctx.fillStyle = textColor;
        ctx.font = "11px Arial";
        const val = f.value.length > 26 ? f.value.slice(0, 26) + "…" : f.value;
        ctx.fillText(val, textX, fieldY + 13);
        fieldY += 30;
    });

    // Decorative vertical stripe left of photo
    ctx.fillStyle = accent + "30";
    ctx.fillRect(0, 8, 4, H - 16);
}

// ── CredentialCreator component ───────────────────────────────
export default function CredentialCreator({ uuid, sectionNumber = 12, onSaved }) {
    const canvasRef = useRef(null);
    const photoInputRef = useRef(null);
    const logoInputRef = useRef(null);

    const [config, setConfig] = useState({
        bg: "#253C87",
        accent: "#208DCA",
        textColor: "#ffffff",
        name: "",
        position: "",
        extraFields: [
            { label: "Zona de acceso", value: "" },
            { label: "Evento",         value: "" },
        ],
        showLogo: true,
    });

    const [photoImg, setPhotoImg] = useState(null);
    const [logoImg, setLogoImg] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState("datos");

    // ── Draw on config change ──────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawCredential(canvas, { ...config, photoImg, logoImg });
    }, [config, photoImg, logoImg]);

    useEffect(() => { render(); }, [render]);

    // ── Load image util ──────────────────────────────────────
    const loadImage = (file, onLoad, onPreview) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            onPreview(e.target.result);
            const img = new Image();
            img.onload = () => onLoad(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const updateField = (idx, key, val) => {
        const fields = [...config.extraFields];
        fields[idx] = { ...fields[idx], [key]: val };
        setConfig((c) => ({ ...c, extraFields: fields }));
    };

    const addField = () => setConfig((c) => ({
        ...c, extraFields: [...c.extraFields, { label: "", value: "" }],
    }));

    const removeField = (idx) => setConfig((c) => ({
        ...c, extraFields: c.extraFields.filter((_, i) => i !== idx),
    }));

    const applyPreset = (preset) => setConfig((c) => ({
        ...c, bg: preset.bg, accent: preset.accent, textColor: preset.text,
    }));

    // ── Download ───────────────────────────────────────────────
    const download = () => {
        const canvas = canvasRef.current;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = `acreditacion-${config.name || "secon"}-${Date.now()}.png`;
        a.click();
    };

    // ── Save to plan ───────────────────────────────────────────
    const saveToplan = async () => {
        const canvas = canvasRef.current;
        setSaving(true);
        try {
            const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
            const fd = new FormData();
            fd.append("file", blob, `acreditacion-${Date.now()}.png`);
            fd.append("file_category", "acreditacion");
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/${sectionNumber}/archivo`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                body: fd,
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                onSaved?.();
            }
        } finally { setSaving(false); }
    };

    const CANVAS_W = 340, CANVAS_H = 210;

    return (
        <div className="rounded-2xl border border-white/8 bg-white/2 overflow-hidden">
            <div className="flex gap-0">
                {/* Left: canvas preview */}
                <div className="flex-shrink-0 p-5 flex flex-col items-center gap-3 border-r border-white/8 bg-black/20">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Vista previa</p>
                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            className="block rounded-lg"
                        />
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={download}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12 transition-all"
                        >
                            <Download size={12} />
                            PNG
                        </button>
                        {uuid && (
                            <button
                                onClick={saveToplan}
                                disabled={saving}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border transition-all ${
                                    saved
                                        ? "bg-green-600/20 border-green-500/30 text-green-400"
                                        : "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] hover:bg-[#208DCA]/25"
                                }`}
                            >
                                {saved ? <><Check size={12} /> Guardado</> : saving ? "..." : <><Save size={12} /> Al plan</>}
                            </button>
                        )}
                    </div>

                    {/* Photo / logo uploads */}
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={() => photoInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border border-dashed border-white/12 text-white/35 hover:text-white hover:border-[#208DCA]/30 transition-all group relative overflow-hidden min-h-[60px]"
                        >
                            {photoPreview
                                ? <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                : <>
                                    <User size={14} className="group-hover:text-[#208DCA]/60 transition-colors" />
                                    <span className="text-[9px]">Foto</span>
                                  </>
                            }
                        </button>
                        <button
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border border-dashed border-white/12 text-white/35 hover:text-white hover:border-[#208DCA]/30 transition-all group relative overflow-hidden min-h-[60px]"
                        >
                            {logoPreview
                                ? <img src={logoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-1" />
                                : <>
                                    <Image size={14} className="group-hover:text-[#208DCA]/60 transition-colors" />
                                    <span className="text-[9px]">Logo</span>
                                  </>
                            }
                        </button>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { if (e.target.files[0]) loadImage(e.target.files[0], setPhotoImg, setPhotoPreview); }} />
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { if (e.target.files[0]) loadImage(e.target.files[0], setLogoImg, setLogoPreview); }} />
                </div>

                {/* Right: config tabs */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tabs */}
                    <div className="flex border-b border-white/8">
                        {[
                            { id: "datos",  label: "Datos",   icon: Type },
                            { id: "diseño", label: "Diseño",  icon: Palette },
                            { id: "campos", label: "Campos",  icon: Plus },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                                    activeTab === id
                                        ? "border-[#208DCA] text-[#208DCA]"
                                        : "border-transparent text-white/35 hover:text-white/60"
                                }`}
                            >
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80">
                        {/* Datos tab */}
                        {activeTab === "datos" && (
                            <>
                                <div>
                                    <label className="text-[10px] font-semibold text-white/35 mb-1 block uppercase tracking-wide">Nombre *</label>
                                    <input
                                        value={config.name}
                                        onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
                                        placeholder="Nombre completo del portador"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#208DCA]/50 focus:bg-white/8 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-white/35 mb-1 block uppercase tracking-wide">Cargo / Tipo de acreditación</label>
                                    <input
                                        value={config.position}
                                        onChange={(e) => setConfig((c) => ({ ...c, position: e.target.value }))}
                                        placeholder="Ej: Staff, Prensa, VIP, Artista, Seguridad..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#208DCA]/50 focus:bg-white/8 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="show-logo"
                                        checked={config.showLogo}
                                        onChange={(e) => setConfig((c) => ({ ...c, showLogo: e.target.checked }))}
                                        className="accent-[#208DCA]"
                                    />
                                    <label htmlFor="show-logo" className="text-xs text-white/50 cursor-pointer">Mostrar logo</label>
                                </div>
                            </>
                        )}

                        {/* Diseño tab */}
                        {activeTab === "diseño" && (
                            <>
                                <div>
                                    <label className="text-[10px] font-semibold text-white/35 mb-2 block uppercase tracking-wide">Paletas predefinidas</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {COLOR_PRESETS.map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => applyPreset(p)}
                                                className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-white/8 transition-colors group"
                                            >
                                                <div className="w-10 h-6 rounded-md overflow-hidden flex border border-white/10">
                                                    <div className="flex-1" style={{ backgroundColor: p.bg }} />
                                                    <div className="w-[10px]" style={{ backgroundColor: p.accent }} />
                                                </div>
                                                <span className="text-[9px] text-white/35 group-hover:text-white/60">{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/35 mb-1 block">Fondo</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={config.bg}
                                                onChange={(e) => setConfig((c) => ({ ...c, bg: e.target.value }))}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            <span className="text-[10px] text-white/30 font-mono">{config.bg}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/35 mb-1 block">Acento</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={config.accent}
                                                onChange={(e) => setConfig((c) => ({ ...c, accent: e.target.value }))}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            <span className="text-[10px] text-white/30 font-mono">{config.accent}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/35 mb-1 block">Texto</label>
                                        <div className="flex gap-1">
                                            <button onClick={() => setConfig((c) => ({ ...c, textColor: "#ffffff" }))}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] border transition-all ${config.textColor === "#ffffff" ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/30 hover:text-white"}`}>
                                                Blanco
                                            </button>
                                            <button onClick={() => setConfig((c) => ({ ...c, textColor: "#1a1a1a" }))}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] border transition-all ${config.textColor === "#1a1a1a" ? "bg-white/15 border-white/30 text-white" : "border-white/10 text-white/30 hover:text-white"}`}>
                                                Negro
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Campos tab */}
                        {activeTab === "campos" && (
                            <>
                                <p className="text-xs text-white/35">Campos adicionales visibles en la tarjeta (máx. 4)</p>
                                <div className="space-y-2">
                                    {config.extraFields.map((field, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                value={field.label}
                                                onChange={(e) => updateField(idx, "label", e.target.value)}
                                                placeholder="Etiqueta"
                                                className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#208DCA]/50 transition-all"
                                            />
                                            <input
                                                value={field.value}
                                                onChange={(e) => updateField(idx, "value", e.target.value)}
                                                placeholder="Valor"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#208DCA]/50 transition-all"
                                            />
                                            <button onClick={() => removeField(idx)}
                                                className="p-1 text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {config.extraFields.length < 4 && (
                                    <button onClick={addField}
                                        className="flex items-center gap-1.5 text-xs text-white/35 hover:text-[#208DCA] transition-colors">
                                        <Plus size={12} />
                                        Añadir campo
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
