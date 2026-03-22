import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Download, Save, X, User, Image as ImageIcon, Palette, Type, Check, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";

// ── Áreas del canvas ──────────────────────────────────────────
const CANVAS_W  = 340;
const CANVAS_H  = 210;
const PHOTO_X   = 14;
const PHOTO_Y   = 44;
const PHOTO_W   = 70;
const PHOTO_H   = 85;
const LOGO_X    = CANVAS_W - 94;
const LOGO_Y    = 14;
const LOGO_W    = 80;
const LOGO_H    = 36;

const COLOR_PRESETS = [
    { label: "Secon",    bg: "#273887", accent: "#208DCA", text: "#ffffff" },
    { label: "Noir",     bg: "#1a1a1a", accent: "#C9A96E", text: "#ffffff" },
    { label: "Rojo",     bg: "#CC0000", accent: "#ffffff", text: "#ffffff" },
    { label: "Verde",    bg: "#1B5E20", accent: "#66BB6A", text: "#ffffff" },
    { label: "Morado",   bg: "#4A148C", accent: "#CE93D8", text: "#ffffff" },
    { label: "Marino",   bg: "#0D2137", accent: "#4FC3F7", text: "#ffffff" },
    { label: "Dorado",   bg: "#ffffff", accent: "#B8860B", text: "#1a1a1a" },
    { label: "Plata",    bg: "#f5f5f5", accent: "#607D8B", text: "#1a1a1a" },
];

// ── Dibuja la credencial ──────────────────────────────────────
function draw(canvas, { bg, accent, textColor, name, position, extraFields, showLogo,
    photoImg, photoTx, logoImg, logoTx }) {

    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // Fondo
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Banda superior / inferior
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);

    // Franja izquierda decorativa
    ctx.fillStyle = accent + "30";
    ctx.fillRect(0, 8, 4, H - 16);

    // Etiqueta "ACREDITACIÓN"
    ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.38)";
    ctx.font = "bold 9px Arial";
    ctx.fillText("ACREDITACIÓN", 14, 28);

    // ── Foto ──────────────────────────────────────────────────
    // Fondo del área de foto
    ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);

    if (photoImg) {
        ctx.save();
        // Clip al área de foto
        ctx.beginPath();
        ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);
        ctx.clip();

        const zoom  = photoTx.zoom;
        const drawn_w = PHOTO_W * zoom;
        const drawn_h = PHOTO_H * zoom;
        const cx = PHOTO_X + PHOTO_W / 2;
        const cy = PHOTO_Y + PHOTO_H / 2;
        ctx.drawImage(
            photoImg,
            cx - drawn_w / 2 + photoTx.x,
            cy - drawn_h / 2 + photoTx.y,
            drawn_w,
            drawn_h
        );
        ctx.restore();
    } else {
        // Placeholder
        ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
        ctx.beginPath();
        ctx.arc(PHOTO_X + PHOTO_W / 2, PHOTO_Y + 30, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(PHOTO_X + PHOTO_W / 2, PHOTO_Y + 62, 20, 0, Math.PI);
        ctx.fill();
    }
    // Borde foto
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H);

    // ── Logo ──────────────────────────────────────────────────
    if (showLogo && logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
        ctx.clip();

        const zoom    = logoTx.zoom;
        const drawn_w = LOGO_W  * zoom;
        const drawn_h = LOGO_H  * zoom;
        const cx = LOGO_X + LOGO_W / 2;
        const cy = LOGO_Y + LOGO_H / 2;
        ctx.drawImage(
            logoImg,
            cx - drawn_w / 2 + logoTx.x,
            cy - drawn_h / 2 + logoTx.y,
            drawn_w,
            drawn_h
        );
        ctx.restore();
    }

    // ── Nombre ────────────────────────────────────────────────
    const textX = 96, nameY = 64;
    ctx.fillStyle = textColor;
    const fontSize = Math.min(18, Math.floor(420 / Math.max(name.length, 1)) + 6);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillText(name.length > 22 ? name.slice(0, 22) + "…" : name, textX, nameY);

    // Cargo
    ctx.fillStyle = accent;
    ctx.font = "bold 11px Arial";
    ctx.fillText((position || "").slice(0, 28), textX, nameY + 17);

    // Línea separadora
    ctx.strokeStyle = accent + "55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(textX, nameY + 25);
    ctx.lineTo(W - 14, nameY + 25);
    ctx.stroke();

    // Campos extra
    let fy = nameY + 42;
    extraFields.filter(f => f.label && f.value).slice(0, 4).forEach(f => {
        ctx.fillStyle = textColor === "#ffffff" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";
        ctx.font = "bold 8.5px Arial";
        ctx.fillText(f.label.toUpperCase(), textX, fy);
        ctx.fillStyle = textColor;
        ctx.font = "10.5px Arial";
        ctx.fillText(f.value.slice(0, 26), textX, fy + 12);
        fy += 28;
    });
}

// ── CredentialCreator ─────────────────────────────────────────
export default function CredentialCreator({ uuid, sectionNumber = 12, onSaved }) {
    const canvasRef      = useRef(null);
    const photoInputRef  = useRef(null);
    const logoInputRef   = useRef(null);
    // Refs for image objects — update immediately without causing re-render loop
    const photoImgRef    = useRef(null);
    const logoImgRef     = useRef(null);

    const [config, setConfig] = useState({
        bg: "#273887", accent: "#208DCA", textColor: "#ffffff",
        name: "", position: "", showLogo: true,
        extraFields: [
            { label: "Zona de acceso", value: "" },
            { label: "Evento",         value: "" },
        ],
    });

    // Transform states for interactive photo/logo positioning
    const [photoTx, setPhotoTx] = useState({ x: 0, y: 0, zoom: 1 });
    const [logoTx,  setLogoTx]  = useState({ x: 0, y: 0, zoom: 1 });

    // Preview thumbnails (only for the buttons)
    const [photoPreview, setPhotoPreview] = useState(null);
    const [logoPreview,  setLogoPreview]  = useState(null);

    // Drag state
    const dragging    = useRef(null); // "photo" | "logo" | null
    const dragStart   = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

    // UI state
    const [activeTarget, setActiveTarget] = useState(null); // "photo" | "logo" | null — which area is being edited
    const [activeTab,   setActiveTab]   = useState("datos");
    const [saving,      setSaving]      = useState(false);
    const [saved,       setSaved]       = useState(false);

    // ── Redraw (no dependency array → always up to date) ──────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        draw(canvas, {
            ...config,
            photoImg: photoImgRef.current,
            photoTx,
            logoImg:  logoImgRef.current,
            logoTx,
        });
    });

    // ── Non-passive wheel listener (needed to call preventDefault) ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handler = (e) => {
            const rect = canvas.getBoundingClientRect();
            const pos = {
                x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
                y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
            };
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            if (photoImgRef.current && pos.x >= PHOTO_X && pos.x <= PHOTO_X + PHOTO_W && pos.y >= PHOTO_Y && pos.y <= PHOTO_Y + PHOTO_H) {
                e.preventDefault();
                setPhotoTx(t => ({ ...t, zoom: Math.max(0.3, Math.min(5, t.zoom + delta)) }));
            } else if (logoImgRef.current && pos.x >= LOGO_X && pos.x <= LOGO_X + LOGO_W && pos.y >= LOGO_Y && pos.y <= LOGO_Y + LOGO_H) {
                e.preventDefault();
                setLogoTx(t => ({ ...t, zoom: Math.max(0.3, Math.min(5, t.zoom + delta)) }));
            }
        };
        canvas.addEventListener("wheel", handler, { passive: false });
        return () => canvas.removeEventListener("wheel", handler);
    }, []);

    // ── Load image ────────────────────────────────────────────
    const loadPhoto = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
            const img = new Image();
            img.onload = () => {
                photoImgRef.current = img;
                setPhotoTx({ x: 0, y: 0, zoom: 1 }); // triggers re-render → useEffect redraws
                setActiveTarget("photo");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const loadLogo = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setLogoPreview(e.target.result);
            const img = new Image();
            img.onload = () => {
                logoImgRef.current = img;
                setLogoTx({ x: 0, y: 0, zoom: 1 });
                setActiveTarget("logo");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    // ── Canvas coords ─────────────────────────────────────────
    const getCanvasPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
            y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
        };
    };

    const inArea = (pos, ax, ay, aw, ah) =>
        pos.x >= ax && pos.x <= ax + aw && pos.y >= ay && pos.y <= ay + ah;

    // ── Canvas mouse events ───────────────────────────────────
    const onMouseDown = (e) => {
        const pos = getCanvasPos(e);
        if (photoImgRef.current && inArea(pos, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H)) {
            dragging.current = "photo";
            dragStart.current = { mx: pos.x, my: pos.y, tx: photoTx.x, ty: photoTx.y };
            setActiveTarget("photo");
            e.preventDefault();
        } else if (logoImgRef.current && inArea(pos, LOGO_X, LOGO_Y, LOGO_W, LOGO_H)) {
            dragging.current = "logo";
            dragStart.current = { mx: pos.x, my: pos.y, tx: logoTx.x, ty: logoTx.y };
            setActiveTarget("logo");
            e.preventDefault();
        }
    };

    const onMouseMove = (e) => {
        if (!dragging.current) return;
        const pos = getCanvasPos(e);
        const dx = pos.x - dragStart.current.mx;
        const dy = pos.y - dragStart.current.my;
        if (dragging.current === "photo") {
            setPhotoTx(t => ({ ...t, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
        } else {
            setLogoTx(t => ({ ...t, x: dragStart.current.tx + dx, y: dragStart.current.ty + dy }));
        }
    };

    const onMouseUp = () => { dragging.current = null; };

    // ── Config helpers ────────────────────────────────────────
    const updateField = (idx, key, val) => {
        const fields = [...config.extraFields];
        fields[idx] = { ...fields[idx], [key]: val };
        setConfig(c => ({ ...c, extraFields: fields }));
    };

    // ── Export ────────────────────────────────────────────────
    const download = () => {
        const a = document.createElement("a");
        a.href = canvasRef.current.toDataURL("image/png");
        a.download = `acreditacion-${config.name || "secon"}-${Date.now()}.png`;
        a.click();
    };

    const saveToplan = async () => {
        setSaving(true);
        try {
            const blob = await new Promise(res => canvasRef.current.toBlob(res, "image/png"));
            const fd = new FormData();
            fd.append("file", blob, `acreditacion-${Date.now()}.png`);
            fd.append("file_category", "acreditacion");
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/${sectionNumber}/archivo`, {
                method: "POST", headers: { "X-CSRF-TOKEN": csrf }, body: fd,
            });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); onSaved?.(); }
        } finally { setSaving(false); }
    };

    // ── Active transform shortcuts ────────────────────────────
    const activeTx    = activeTarget === "photo" ? photoTx   : logoTx;
    const setActiveTx = activeTarget === "photo" ? setPhotoTx : setLogoTx;
    const resetActiveTx = () => setActiveTx({ x: 0, y: 0, zoom: 1 });

    // Cursor en el canvas
    const getCursor = () => {
        if (dragging.current) return "grabbing";
        if (photoImgRef.current || logoImgRef.current) return "grab";
        return "default";
    };

    return (
        <div className="rounded-2xl border border-gray-300 bg-gray-200 overflow-hidden">
            <div className="flex gap-0">

                {/* ── Left: canvas + controls ── */}
                <div className="flex-shrink-0 p-5 flex flex-col items-center gap-3 border-r border-gray-300 bg-black/20">
                    <p className="text-[10px] text-gray-900 uppercase tracking-wider">Vista previa</p>

                    {/* Canvas */}
                    <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/60 relative">
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            className="block"
                            style={{ cursor: getCursor() }}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                        />
                        {/* Labels on canvas areas */}
                        {!photoImgRef.current && (
                            <div className="absolute pointer-events-none"
                                style={{ left: PHOTO_X + 2, top: PHOTO_Y + PHOTO_H + 4 }}>
                                <span className="text-[8px] text-gray-900">↑ foto</span>
                            </div>
                        )}
                    </div>

                    {/* Photo/logo positioning controls (shown when an area is active) */}
                    {activeTarget && (activeTx !== null) && (photoImgRef.current || logoImgRef.current) && (
                        <div className="w-full rounded-xl bg-gray-200 border border-gray-300 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-900 uppercase tracking-wider flex items-center gap-1">
                                    <Move size={9} />
                                    {activeTarget === "photo" ? "Foto" : "Logo"} — arrastrar para mover
                                </span>
                                <button onClick={resetActiveTx}
                                    className="text-[10px] text-gray-900 hover:text-gray-900 flex items-center gap-1 transition-colors"
                                    title="Restablecer posición">
                                    <RotateCcw size={9} />
                                    Reset
                                </button>
                            </div>
                            {/* Zoom slider */}
                            <div className="flex items-center gap-2">
                                <ZoomOut size={11} className="text-gray-900 flex-shrink-0" />
                                <input type="range" min={30} max={400} step={5}
                                    value={Math.round(activeTx.zoom * 100)}
                                    onChange={e => setActiveTx(t => ({ ...t, zoom: parseInt(e.target.value) / 100 }))}
                                    className="flex-1 h-1 accent-[#208DCA] cursor-pointer"
                                />
                                <ZoomIn size={11} className="text-gray-900 flex-shrink-0" />
                                <span className="text-[10px] text-gray-900 w-8 text-right">
                                    {Math.round(activeTx.zoom * 100)}%
                                </span>
                            </div>
                            {/* Target switch */}
                            <div className="flex gap-1">
                                {photoImgRef.current && (
                                    <button onClick={() => setActiveTarget("photo")}
                                        className={`flex-1 text-[10px] py-1 rounded-lg transition-colors ${activeTarget === "photo" ? "bg-[#208DCA]/20 text-[#208DCA]" : "text-gray-900 hover:text-gray-900 hover:bg-gray-200"}`}>
                                        Ajustar foto
                                    </button>
                                )}
                                {logoImgRef.current && (
                                    <button onClick={() => setActiveTarget("logo")}
                                        className={`flex-1 text-[10px] py-1 rounded-lg transition-colors ${activeTarget === "logo" ? "bg-[#208DCA]/20 text-[#208DCA]" : "text-gray-900 hover:text-gray-900 hover:bg-gray-200"}`}>
                                        Ajustar logo
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    {(photoImgRef.current || logoImgRef.current) && (
                        <p className="text-[9px] text-gray-900 text-center leading-relaxed">
                            Arrastra foto/logo para mover · Rueda del ratón para zoom
                        </p>
                    )}

                    {/* Upload buttons */}
                    <div className="flex gap-2 w-full">
                        <button onClick={() => photoInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border border-dashed border-gray-300 text-gray-900 hover:text-gray-900 hover:border-[#208DCA]/30 transition-all group relative overflow-hidden min-h-[60px]">
                            {photoPreview
                                ? <img src={photoPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                : <><User size={14} className="group-hover:text-[#208DCA]/60 transition-colors" />
                                    <span className="text-[9px]">Foto</span></>
                            }
                        </button>
                        <button onClick={() => logoInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border border-dashed border-gray-300 text-gray-900 hover:text-gray-900 hover:border-[#208DCA]/30 transition-all group relative overflow-hidden min-h-[60px]">
                            {logoPreview
                                ? <img src={logoPreview} alt="" className="absolute inset-0 w-full h-full object-contain p-1" />
                                : <><ImageIcon size={14} className="group-hover:text-[#208DCA]/60 transition-colors" />
                                    <span className="text-[9px]">Logo</span></>
                            }
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 w-full">
                        <button onClick={download}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-gray-200 border border-gray-300 text-gray-900 hover:text-gray-900 hover:bg-white/12 transition-all">
                            <Download size={12} />
                            PNG
                        </button>
                        {uuid && (
                            <button onClick={saveToplan} disabled={saving}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl border transition-all ${
                                    saved ? "bg-green-600/20 border-green-500/30 text-green-400"
                                          : "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] hover:bg-[#208DCA]/25"}`}>
                                {saved ? <><Check size={12} /> Guardado</> : saving ? "…" : <><Save size={12} /> Al plan</>}
                            </button>
                        )}
                    </div>

                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files[0]) loadPhoto(e.target.files[0]); }} />
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files[0]) loadLogo(e.target.files[0]); }} />
                </div>

                {/* ── Right: config tabs ── */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-300">
                        {[
                            { id: "datos",  label: "Datos",  icon: Type    },
                            { id: "diseño", label: "Diseño", icon: Palette  },
                            { id: "campos", label: "Campos", icon: Plus     },
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                                    activeTab === id ? "border-[#208DCA] text-[#208DCA]" : "border-transparent text-gray-900 hover:text-gray-900"}`}>
                                <Icon size={12} />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-80">

                        {/* ── Datos ── */}
                        {activeTab === "datos" && (<>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-900 mb-1 block uppercase tracking-wide">Nombre *</label>
                                <input value={config.name}
                                    onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                                    placeholder="Nombre completo del portador"
                                    className="w-full bg-gray-200 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#208DCA]/50 focus:bg-gray-200 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-900 mb-1 block uppercase tracking-wide">Cargo / Tipo de acreditación</label>
                                <input value={config.position}
                                    onChange={e => setConfig(c => ({ ...c, position: e.target.value }))}
                                    placeholder="Ej: Staff, Prensa, VIP, Artista..."
                                    className="w-full bg-gray-200 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#208DCA]/50 focus:bg-gray-200 transition-all"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={config.showLogo}
                                    onChange={e => setConfig(c => ({ ...c, showLogo: e.target.checked }))}
                                    className="accent-[#208DCA]" />
                                <span className="text-xs text-gray-900">Mostrar logo</span>
                            </label>
                        </>)}

                        {/* ── Diseño ── */}
                        {activeTab === "diseño" && (<>
                            <div>
                                <label className="text-[10px] font-semibold text-gray-900 mb-2 block uppercase tracking-wide">Paletas</label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {COLOR_PRESETS.map(p => (
                                        <button key={p.label}
                                            onClick={() => setConfig(c => ({ ...c, bg: p.bg, accent: p.accent, textColor: p.text }))}
                                            className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-gray-200 transition-colors group">
                                            <div className="w-10 h-6 rounded-md overflow-hidden flex border border-gray-300">
                                                <div className="flex-1" style={{ backgroundColor: p.bg }} />
                                                <div className="w-[10px]" style={{ backgroundColor: p.accent }} />
                                            </div>
                                            <span className="text-[9px] text-gray-900 group-hover:text-gray-900">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { key: "bg",     label: "Fondo" },
                                    { key: "accent", label: "Acento" },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label className="text-[10px] text-gray-900 mb-1 block">{label}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={config[key]}
                                                onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                                            <span className="text-[10px] text-gray-900 font-mono">{config[key]}</span>
                                        </div>
                                    </div>
                                ))}
                                <div>
                                    <label className="text-[10px] text-gray-900 mb-1 block">Texto</label>
                                    <div className="flex gap-1">
                                        {[{ v: "#ffffff", l: "Blanco" }, { v: "#1a1a1a", l: "Negro" }].map(({ v, l }) => (
                                            <button key={v} onClick={() => setConfig(c => ({ ...c, textColor: v }))}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] border transition-all ${config.textColor === v ? "bg-gray-200 border-white/30 text-white" : "border-gray-300 text-gray-900 hover:text-gray-900"}`}>
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>)}

                        {/* ── Campos ── */}
                        {activeTab === "campos" && (<>
                            <p className="text-xs text-gray-900">Campos adicionales (máx. 4)</p>
                            <div className="space-y-2">
                                {config.extraFields.map((field, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input value={field.label}
                                            onChange={e => updateField(idx, "label", e.target.value)}
                                            placeholder="Etiqueta"
                                            className="w-28 bg-gray-200 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-white/20 focus:outline-none focus:border-[#208DCA]/50 transition-all"
                                        />
                                        <input value={field.value}
                                            onChange={e => updateField(idx, "value", e.target.value)}
                                            placeholder="Valor"
                                            className="flex-1 bg-gray-200 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-white/20 focus:outline-none focus:border-[#208DCA]/50 transition-all"
                                        />
                                        <button onClick={() => setConfig(c => ({ ...c, extraFields: c.extraFields.filter((_, i) => i !== idx) }))}
                                            className="p-1 text-gray-900 hover:text-red-400 transition-colors flex-shrink-0">
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {config.extraFields.length < 4 && (
                                <button onClick={() => setConfig(c => ({ ...c, extraFields: [...c.extraFields, { label: "", value: "" }] }))}
                                    className="flex items-center gap-1.5 text-xs text-gray-900 hover:text-[#208DCA] transition-colors">
                                    <Plus size={12} />
                                    Añadir campo
                                </button>
                            )}
                        </>)}
                    </div>
                </div>
            </div>
        </div>
    );
}
