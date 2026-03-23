import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pen, Minus, ArrowRight, Circle, Square, Type, Undo2, Redo2,
    Trash2, Download, Map, Search, Save, X, ImagePlus, Layers,
    ChevronDown, Check, MousePointer, Grid, ZoomIn, ZoomOut,
    Copy, Maximize2, Minimize2, Crosshair, FileImage, Navigation,
} from "lucide-react";
import LeafletMap from "@/components/planes/LeafletMap";
import AddressAutocomplete from "@/components/planes/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

// ── Herramientas ──────────────────────────────────────────────
const TOOLS = [
    { id: "select", icon: MousePointer, label: "Seleccionar / Mover", shortcut: "S" },
    { id: "pen",    icon: Pen,          label: "Lápiz libre",          shortcut: "P" },
    { id: "line",   icon: Minus,        label: "Línea recta",          shortcut: "L" },
    { id: "arrow",  icon: ArrowRight,   label: "Flecha",               shortcut: "A" },
    { id: "rect",   icon: Square,       label: "Rectángulo",           shortcut: "R" },
    { id: "circle", icon: Circle,       label: "Círculo / Elipse",     shortcut: "C" },
    { id: "text",   icon: Type,         label: "Texto",                shortcut: "T" },
];

const ICON_CATEGORIES = {
    emergencia: {
        label: "Emergencia", color: "#EF4444",
        icons: [
            { emoji: "🏥", label: "Hospital" }, { emoji: "🚑", label: "Ambulancia" },
            { emoji: "🚒", label: "Bomberos" }, { emoji: "👮", label: "Policía" },
            { emoji: "🚓", label: "Patrulla" }, { emoji: "⛑️", label: "Primeros Auxilios" },
            { emoji: "💊", label: "Farmacia" }, { emoji: "🩺", label: "Médico" },
        ],
    },
    transporte: {
        label: "Transporte", color: "#208DCA",
        icons: [
            { emoji: "🅿️", label: "Parking" }, { emoji: "🚪", label: "Entrada" },
            { emoji: "🚧", label: "Salida" },  { emoji: "🚇", label: "Metro" },
            { emoji: "🚌", label: "Autobús" }, { emoji: "🚆", label: "Tren" },
            { emoji: "🚕", label: "Taxi" },    { emoji: "🚲", label: "Bicicleta" },
            { emoji: "🚁", label: "Helicóptero" }, { emoji: "⛽", label: "Gasolinera" },
        ],
    },
    ubicaciones: {
        label: "Ubicaciones", color: "#273887",
        icons: [
            { emoji: "📍", label: "Punto" },   { emoji: "🏟️", label: "Recinto" },
            { emoji: "🏢", label: "Edificio" }, { emoji: "⭐", label: "VIP" },
            { emoji: "🎪", label: "Evento" },  { emoji: "🏨", label: "Hotel" },
            { emoji: "🏫", label: "Centro" },  { emoji: "🎭", label: "Teatro" },
            { emoji: "🏖️", label: "Playa" },   { emoji: "⛪", label: "Iglesia" },
        ],
    },
    senalizacion: {
        label: "Señalización", color: "#F59E0B",
        icons: [
            { emoji: "⚠️", label: "Atención" }, { emoji: "🔴", label: "Peligro" },
            { emoji: "ℹ️", label: "Info" },     { emoji: "✅", label: "OK" },
            { emoji: "🚫", label: "Prohibido" }, { emoji: "🔒", label: "Restringido" },
            { emoji: "🔊", label: "Sonido" },   { emoji: "📢", label: "Altavoz" },
            { emoji: "🎯", label: "Objetivo" }, { emoji: "🔑", label: "Acceso" },
        ],
    },
    personal: {
        label: "Personal", color: "#22C55E",
        icons: [
            { emoji: "🕵️", label: "Agente" },  { emoji: "👷", label: "Seguridad" },
            { emoji: "🎤", label: "Speaker" },  { emoji: "📸", label: "Fotógrafo" },
            { emoji: "🎬", label: "Cámara" },   { emoji: "🎧", label: "Técnico" },
            { emoji: "🤵", label: "Staff" },    { emoji: "👨‍⚕️", label: "Sanitario" },
        ],
    },
};

const QUICK_COLORS = [
    "#EF4444", "#208DCA", "#273887", "#22C55E",
    "#F97316", "#EAB308", "#A855F7", "#EC4899",
    "#000000", "#FFFFFF",
];

const STROKE_WIDTHS = [1, 2, 4, 6, 10, 16];
const TEXT_SIZES = [14, 20, 28, 36, 48];

const CANVAS_PRESETS = [
    { label: "A4 Horizontal", w: 1123, h: 794 },
    { label: "A4 Vertical",   w: 794,  h: 1123 },
    { label: "HD 16:9",       w: 1280, h: 720  },
    { label: "Cuadrado",      w: 800,  h: 800  },
    { label: "Panorámico",    w: 1600, h: 600  },
];

// ── Drawing helper ─────────────────────────────────────────────
function drawElements(ctx, elements, selectedIdx = null, showGrid = false, canvasW = 0, canvasH = 0) {
    // Grid
    if (showGrid && canvasW && canvasH) {
        ctx.save();
        ctx.strokeStyle = "rgba(100,150,255,0.12)";
        ctx.lineWidth = 1;
        const step = 50;
        for (let x = step; x < canvasW; x += step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
        }
        for (let y = step; y < canvasH; y += step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
        }
        ctx.restore();
    }

    elements.forEach((el, idx) => {
        ctx.save();
        ctx.globalAlpha = el.opacity ?? 1;

        if (el.type === "path") {
            ctx.strokeStyle = el.color; ctx.lineWidth = el.width;
            ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.beginPath();
            el.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.stroke();
        } else if (el.type === "line") {
            ctx.strokeStyle = el.color; ctx.lineWidth = el.width; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
        } else if (el.type === "arrow") {
            ctx.strokeStyle = el.color; ctx.fillStyle = el.color;
            ctx.lineWidth = el.width; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
            const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
            const as = Math.max(14, el.width * 3);
            ctx.beginPath();
            ctx.moveTo(el.x2, el.y2);
            ctx.lineTo(el.x2 - as * Math.cos(angle - Math.PI / 6), el.y2 - as * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(el.x2 - as * Math.cos(angle + Math.PI / 6), el.y2 - as * Math.sin(angle + Math.PI / 6));
            ctx.closePath(); ctx.fill();
        } else if (el.type === "rect") {
            const x = Math.min(el.x1, el.x2), y = Math.min(el.y1, el.y2);
            const w = Math.abs(el.x2 - el.x1), h = Math.abs(el.y2 - el.y1);
            ctx.strokeStyle = el.color; ctx.lineWidth = el.width;
            ctx.strokeRect(x, y, w, h);
            if (el.fill) { ctx.fillStyle = el.fillColor; ctx.globalAlpha = (el.opacity ?? 1) * 0.25; ctx.fillRect(x, y, w, h); }
        } else if (el.type === "circle") {
            const r = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2) / 2;
            const cx = (el.x1 + el.x2) / 2, cy = (el.y1 + el.y2) / 2;
            ctx.strokeStyle = el.color; ctx.lineWidth = el.width;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
            if (el.fill) { ctx.fillStyle = el.fillColor; ctx.globalAlpha = (el.opacity ?? 1) * 0.25; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill(); }
        } else if (el.type === "text") {
            ctx.fillStyle = el.color;
            ctx.font = `bold ${el.size ?? 22}px Arial`;
            ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 3;
            ctx.fillText(el.text, el.x, el.y);
        } else if (el.type === "emoji") {
            ctx.font = `${el.size ?? 36}px Arial`;
            ctx.fillText(el.emoji, el.x, el.y);
            if (el.label) {
                ctx.font = "bold 11px Arial"; ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 2;
                ctx.fillText(el.label, el.x, el.y + (el.size ?? 36) + 2);
            }
        }
        ctx.restore();

        // Selection highlight
        if (idx === selectedIdx && (el.type === "text" || el.type === "emoji")) {
            ctx.save();
            const s = el.size ?? 36;
            ctx.strokeStyle = "#208DCA";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(el.x - 4, el.y - s - 4, 120, s + 12);
            ctx.restore();
        }
    });
}

// ── Main component ─────────────────────────────────────────────
export default function MapEditor({
    mode = "standalone",
    uuid, sectionNumber,
    category = "plano",
    existingFiles = [],
    onSaved,
    eventAddress = "",
}) {
    const canvasRef = useRef(null);
    const bgRef = useRef(null);
    const containerRef = useRef(null);

    // Drawing refs (avoid re-render during draw)
    const isDrawingRef = useRef(false);
    const startRef = useRef(null);
    const pathRef = useRef([]);
    const isDraggingRef = useRef(false);
    const dragIdxRef = useRef(null);
    const dragOffRef = useRef({ x: 0, y: 0 });

    // State
    const [tool, setTool] = useState("pen");
    const [color, setColor] = useState("#EF4444");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [opacity, setOpacity] = useState(1);
    const [useFill, setUseFill] = useState(false);
    const [textSize, setTextSize] = useState(22);
    const [elements, setElements] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [history, setHistory] = useState([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const [hasBg, setHasBg] = useState(false);
    const [showMap,   setShowMap]   = useState(true);
    const [mapMode,   setMapMode]   = useState("search"); // "search" | "route"
    const [mapQuery,  setMapQuery]  = useState("");
    const [routeA,    setRouteA]    = useState("");
    const [routeB,    setRouteB]    = useState("");
    const [routeACoords, setRouteACoords] = useState(null);
    const [routeBCoords, setRouteBCoords] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [mapCommand, setMapCommand] = useState(null);
    const [mapStatus,  setMapStatus]  = useState(null); // null | "loading" | "error" | "1.2 km · 4 min"
    const [openIconCat, setOpenIconCat] = useState(null);
    const [showIconLabels, setShowIconLabels] = useState(false);
    const [textPrompt, setTextPrompt] = useState(null);
    const [textValue, setTextValue] = useState("");
    const [showGrid, setShowGrid] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [exportFormat, setExportFormat] = useState("png");
    const [contextMenu, setContextMenu] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copiedMsg, setCopiedMsg] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    // ── Redraw ──────────────────────────────────────────────────
    const redraw = useCallback((els = elements, selIdx = selectedIdx) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, canvas.width, canvas.height);
        drawElements(ctx, els, selIdx, showGrid, canvas.width, canvas.height);
    }, [elements, selectedIdx, showGrid]);

    useEffect(() => { redraw(); }, [redraw]);

    // ── History ─────────────────────────────────────────────────
    const pushHistory = useCallback((els) => {
        setHistory((h) => {
            const next = h.slice(0, historyStep + 1);
            next.push(JSON.parse(JSON.stringify(els)));
            setHistoryStep(next.length - 1);
            return next;
        });
    }, [historyStep]);

    const undo = useCallback(() => {
        if (historyStep <= 0) return;
        const step = historyStep - 1;
        const els = JSON.parse(JSON.stringify(history[step]));
        setHistoryStep(step);
        setElements(els);
        setSelectedIdx(null);
        redraw(els, null);
    }, [historyStep, history, redraw]);

    const redo = useCallback(() => {
        if (historyStep >= history.length - 1) return;
        const step = historyStep + 1;
        const els = JSON.parse(JSON.stringify(history[step]));
        setHistoryStep(step);
        setElements(els);
        setSelectedIdx(null);
        redraw(els, null);
    }, [historyStep, history, redraw]);

    const clearAll = () => {
        setElements([]); setSelectedIdx(null);
        pushHistory([]);  redraw([]);
    };

    const deleteSelected = useCallback(() => {
        if (selectedIdx === null) return;
        const els = elements.filter((_, i) => i !== selectedIdx);
        setElements(els); setSelectedIdx(null);
        pushHistory(els); redraw(els, null);
    }, [selectedIdx, elements, pushHistory, redraw]);

    const duplicateElement = useCallback((idx) => {
        const el = elements[idx];
        if (!el) return;
        const clone = { ...JSON.parse(JSON.stringify(el)), x: (el.x ?? 0) + 20, y: (el.y ?? 0) + 20 };
        const els = [...elements, clone];
        setElements(els); pushHistory(els); redraw(els, els.length - 1);
        setSelectedIdx(els.length - 1);
    }, [elements, pushHistory, redraw]);

    const bringToFront = useCallback((idx) => {
        const el = elements[idx];
        const els = [...elements.filter((_, i) => i !== idx), el];
        setElements(els); pushHistory(els); redraw(els, els.length - 1);
        setSelectedIdx(els.length - 1);
    }, [elements, pushHistory, redraw]);

    const sendToBack = useCallback((idx) => {
        const el = elements[idx];
        const els = [el, ...elements.filter((_, i) => i !== idx)];
        setElements(els); pushHistory(els); redraw(els, 0);
        setSelectedIdx(0);
    }, [elements, pushHistory, redraw]);

    // ── Keyboard shortcuts ───────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "z") { e.preventDefault(); undo(); }
                if (e.key === "y" || (e.key === "Z" && e.shiftKey)) { e.preventDefault(); redo(); }
                return;
            }
            const keyMap = { s: "select", p: "pen", l: "line", a: "arrow", r: "rect", c: "circle", t: "text" };
            if (keyMap[e.key.toLowerCase()]) { setTool(keyMap[e.key.toLowerCase()]); return; }
            if ((e.key === "Delete" || e.key === "Backspace") && selectedIdx !== null) {
                e.preventDefault(); deleteSelected();
            }
            if (e.key === "Escape") { setSelectedIdx(null); setTextPrompt(null); setContextMenu(null); setFullscreen(false); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [undo, redo, deleteSelected, selectedIdx]);

    // ── Clipboard paste ──────────────────────────────────────────
    const loadBg = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const maxW = showMap ? 600 : 1100;
                const maxH = 680;
                const scale = Math.min(maxW / img.width, maxH / img.height, 1);
                canvas.width  = Math.round(img.width  * scale);
                canvas.height = Math.round(img.height * scale);
                bgRef.current = img;
                setHasBg(true);
                setElements([]); pushHistory([]);
                redraw([], null);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }, [showMap, redraw, pushHistory]);

    useEffect(() => {
        const handlePaste = (e) => {
            const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
            if (item) loadBg(item.getAsFile());
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [loadBg]);

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) loadBg(file);
    };

    const initBlankCanvas = (w = 900, h = 600) => {
        const canvas = canvasRef.current;
        canvas.width = w; canvas.height = h;
        bgRef.current = null;
        setHasBg(true);
        setShowPresets(false);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#f8f9fa"; ctx.fillRect(0, 0, w, h);
        setElements([]); pushHistory([]);
    };

    // ── Canvas coords ────────────────────────────────────────────
    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / (rect.width  / zoom);
        const scaleY = canvas.height / (rect.height / zoom);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width  / rect.width),
            y: (clientY - rect.top)  * (canvas.height / rect.height),
        };
    };

    // Hit test for text/emoji
    const hitTestTextEmoji = (pos) => {
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (el.type === "text" || el.type === "emoji") {
                const s = el.size ?? 36;
                if (pos.x >= el.x - 4 && pos.x <= el.x + 120 && pos.y >= el.y - s - 4 && pos.y <= el.y + 12) {
                    return i;
                }
            }
        }
        return -1;
    };

    // ── Drawing events ───────────────────────────────────────────
    const onMouseDown = (e) => {
        if (!hasBg) return;
        setContextMenu(null);
        const pos = getPos(e);

        // Select tool
        if (tool === "select") {
            const idx = hitTestTextEmoji(pos);
            if (idx >= 0) {
                setSelectedIdx(idx);
                isDraggingRef.current = true;
                dragIdxRef.current = idx;
                dragOffRef.current = { x: pos.x - elements[idx].x, y: pos.y - elements[idx].y };
            } else {
                setSelectedIdx(null);
            }
            redraw(elements, idx >= 0 ? idx : null);
            return;
        }

        // Drag text/emoji with any tool
        const idx = hitTestTextEmoji(pos);
        if (idx >= 0 && tool !== "text") {
            isDraggingRef.current = true;
            dragIdxRef.current = idx;
            dragOffRef.current = { x: pos.x - elements[idx].x, y: pos.y - elements[idx].y };
            return;
        }

        if (tool === "text") {
            setTextPrompt(pos); setTextValue("");
            return;
        }

        isDrawingRef.current = true;
        startRef.current = pos;
        if (tool === "pen") pathRef.current = [pos];
    };

    const onMouseMove = (e) => {
        if (!hasBg) return;
        const pos = getPos(e);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (isDraggingRef.current && dragIdxRef.current !== null) {
            const els = [...elements];
            els[dragIdxRef.current] = { ...els[dragIdxRef.current], x: pos.x - dragOffRef.current.x, y: pos.y - dragOffRef.current.y };
            setElements(els);
            redraw(els, selectedIdx);
            return;
        }

        if (!isDrawingRef.current) return;
        const { x: x1, y: y1 } = startRef.current;

        if (tool === "pen") {
            pathRef.current.push(pos);
            redraw();
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = color; ctx.lineWidth = strokeWidth;
            ctx.lineCap = "round"; ctx.lineJoin = "round";
            ctx.beginPath();
            pathRef.current.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
            ctx.stroke(); ctx.restore();
        } else if (["line", "arrow", "rect", "circle"].includes(tool)) {
            redraw();
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = color; ctx.lineWidth = strokeWidth; ctx.lineCap = "round";
            if (tool === "rect") {
                ctx.strokeRect(Math.min(x1, pos.x), Math.min(y1, pos.y), Math.abs(pos.x - x1), Math.abs(pos.y - y1));
                if (useFill) { ctx.fillStyle = color; ctx.globalAlpha = opacity * 0.25; ctx.fillRect(Math.min(x1, pos.x), Math.min(y1, pos.y), Math.abs(pos.x - x1), Math.abs(pos.y - y1)); }
            } else if (tool === "circle") {
                const r = Math.sqrt((pos.x - x1) ** 2 + (pos.y - y1) ** 2) / 2;
                ctx.beginPath(); ctx.arc((x1 + pos.x) / 2, (y1 + pos.y) / 2, r, 0, 2 * Math.PI); ctx.stroke();
                if (useFill) { ctx.fillStyle = color; ctx.globalAlpha = opacity * 0.25; ctx.beginPath(); ctx.arc((x1 + pos.x) / 2, (y1 + pos.y) / 2, r, 0, 2 * Math.PI); ctx.fill(); }
            } else {
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(pos.x, pos.y); ctx.stroke();
                if (tool === "arrow") {
                    const angle = Math.atan2(pos.y - y1, pos.x - x1);
                    const as = Math.max(14, strokeWidth * 3);
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(pos.x - as * Math.cos(angle - Math.PI / 6), pos.y - as * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(pos.x - as * Math.cos(angle + Math.PI / 6), pos.y - as * Math.sin(angle + Math.PI / 6));
                    ctx.closePath(); ctx.fill();
                }
            }
            ctx.restore();
        }
    };

    const onMouseUp = (e) => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            pushHistory(elements);
            return;
        }
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        const pos = getPos(e);
        const { x: x1, y: y1 } = startRef.current ?? pos;

        let newEl = null;
        if (tool === "pen" && pathRef.current.length > 0) {
            newEl = { type: "path", points: [...pathRef.current], color, width: strokeWidth, opacity };
            pathRef.current = [];
        } else if (tool === "line") {
            newEl = { type: "line", x1, y1, x2: pos.x, y2: pos.y, color, width: strokeWidth, opacity };
        } else if (tool === "arrow") {
            newEl = { type: "arrow", x1, y1, x2: pos.x, y2: pos.y, color, width: strokeWidth, opacity };
        } else if (tool === "rect") {
            newEl = { type: "rect", x1, y1, x2: pos.x, y2: pos.y, color, width: strokeWidth, opacity, fill: useFill, fillColor: color };
        } else if (tool === "circle") {
            newEl = { type: "circle", x1, y1, x2: pos.x, y2: pos.y, color, width: strokeWidth, opacity, fill: useFill, fillColor: color };
        }

        if (newEl) {
            const els = [...elements, newEl];
            setElements(els); pushHistory(els); redraw(els, selectedIdx);
        }
    };

    // ── Text confirm ─────────────────────────────────────────────
    const confirmText = () => {
        if (!textValue.trim() || !textPrompt) { setTextPrompt(null); return; }
        const els = [...elements, { type: "text", text: textValue.trim(), x: textPrompt.x, y: textPrompt.y, color, size: textSize, opacity }];
        setElements(els); pushHistory(els); redraw(els, selectedIdx);
        setTextPrompt(null); setTextValue("");
    };

    // ── Add emoji ────────────────────────────────────────────────
    const addEmoji = (emoji, label) => {
        if (!hasBg) return;
        const canvas = canvasRef.current;
        const cx = canvas.width / 2 + (Math.random() - 0.5) * 100;
        const cy = canvas.height / 2 + (Math.random() - 0.5) * 100;
        const els = [...elements, { type: "emoji", emoji, x: cx, y: cy, size: 40, label: showIconLabels ? label : null }];
        setElements(els); pushHistory(els); redraw(els, selectedIdx);
        setOpenIconCat(null);
    };

    // ── Map search / route ────────────────────────────────────────
    const searchMap = () => {
        if (mapMode === "search" && mapQuery.trim()) {
            setMapCommand({ type: "search", query: mapQuery });
        } else if (mapMode === "route") {
            const a = routeACoords || (routeA.trim() ? routeA : null);
            const b = routeBCoords || (routeB.trim() ? routeB : null);
            if (a && b) setMapCommand({ type: "route", a, b });
        }
    };

    // Auto-fill point A from event address
    useEffect(() => {
        if (eventAddress && !routeA && mapMode === "route") {
            setRouteA(eventAddress);
        }
    }, [eventAddress, mapMode]);



    // ── Context menu ─────────────────────────────────────────────
    const onContextMenu = (e) => {
        e.preventDefault();
        if (!hasBg) return;
        const pos = getPos(e);
        const idx = hitTestTextEmoji(pos);
        if (idx >= 0) {
            setContextMenu({ x: e.clientX, y: e.clientY, elIdx: idx });
            setSelectedIdx(idx);
            redraw(elements, idx);
        }
    };

    // ── Export ───────────────────────────────────────────────────
    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!hasBg) return;

        if (mode === "standalone") {
            const mime = exportFormat === "jpeg" ? "image/jpeg" : "image/png";
            const quality = exportFormat === "jpeg" ? 0.92 : 1;
            const a = document.createElement("a");
            a.href = canvas.toDataURL(mime, quality);
            a.download = `mapa-secon-${Date.now()}.${exportFormat}`;
            a.click();
            return;
        }

        setSaving(true);
        try {
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            const fd = new FormData();
            fd.append("file", blob, `mapa-${sectionNumber}-${Date.now()}.png`);
            fd.append("file_category", category);
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");
            const res = await fetch(`/planes/${uuid}/seccion/${sectionNumber}/archivo`, {
                method: "POST", headers: { "X-CSRF-TOKEN": csrfToken }, body: fd,
            });
            if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); onSaved?.(); }
        } finally { setSaving(false); }
    };

    const copyToClipboard = async () => {
        const canvas = canvasRef.current;
        if (!hasBg || !canvas) return;
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                setCopiedMsg(true);
                setTimeout(() => setCopiedMsg(false), 2000);
            } catch { /* fallback: not supported */ }
        });
    };

    const canUndo = historyStep > 0;
    const canRedo = historyStep < history.length - 1;

    const cursorClass = {
        select: selectedIdx !== null ? "cursor-move" : "cursor-default",
        pen: "cursor-crosshair",
        line: "cursor-crosshair",
        arrow: "cursor-crosshair",
        rect: "cursor-crosshair",
        circle: "cursor-crosshair",
        text: "cursor-text",
    }[tool] ?? "cursor-crosshair";

    return (
        <div className={`flex flex-col gap-2 w-full h-full ${openIconCat ? "" : "overflow-hidden"} ${fullscreen ? "fixed inset-0 z-[9999] bg-[#F8FAFC] p-4" : ""}`} onClick={() => setContextMenu(null)}>

            {/* ── Toolbar — Glass Card with Shine ── */}
            <Shine enable loop duration={3000} loopDelay={5000} color="#208DCA" opacity={0.08} asChild>
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    className={`flex flex-wrap items-center gap-1.5 p-2.5 rounded-2xl backdrop-blur-2xl bg-gradient-to-r from-white/80 via-slate-50/70 to-white/80 border border-slate-200/50 shadow-[0_8px_32px_rgba(32,141,202,0.08),0_2px_8px_rgba(0,0,0,0.06)] ${fullscreen ? "" : "sticky top-0 z-40"}`}
                >
                    {/* Tools — glass pill with gradient border */}
                    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 shadow-sm border border-slate-300/60">
                        {TOOLS.map((tl, i) => (
                            <motion.button
                                key={tl.id}
                                onClick={() => setTool(tl.id)}
                                title={`${tl.label} (${tl.shortcut})`}
                                whileHover={{ scale: 1.15, y: -2 }}
                                whileTap={{ scale: 0.85 }}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all relative ${
                                    tool === tl.id
                                        ? "bg-gradient-to-br from-[#253C87] to-[#208DCA] text-white shadow-lg shadow-[#208DCA]/50"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                }`}
                            >
                                <tl.icon size={15} />
                                {tool === tl.id && (
                                    <motion.div
                                        layoutId="tool-glow"
                                        className="absolute inset-0 rounded-xl bg-[#208DCA]/20 blur-md -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* Colors — glass pill with hover glow */}
                    <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 shadow-sm border border-slate-300/60">
                        {QUICK_COLORS.map((c) => (
                            <motion.button
                                key={c}
                                onClick={() => setColor(c)}
                                whileHover={{ scale: 1.3, y: -3 }}
                                whileTap={{ scale: 0.8 }}
                                className={`w-5 h-5 rounded-full transition-all flex-shrink-0 ${
                                    color === c ? "ring-2 ring-[#208DCA] ring-offset-2 scale-125" : ""
                                }`}
                                style={{
                                    backgroundColor: c,
                                    boxShadow: color === c
                                        ? `0 0 12px ${c}80, 0 4px 8px ${c}40`
                                        : c === "#FFFFFF" ? "inset 0 0 0 1px #e2e8f0" : `0 2px 6px ${c}30`,
                                }}
                            />
                        ))}
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" title="Color personalizado" />
                    </div>

                    {/* Stroke widths — glass pill */}
                    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 shadow-sm border border-slate-300/60">
                        {STROKE_WIDTHS.map((w) => (
                            <motion.button key={w} onClick={() => setStrokeWidth(w)} title={`${w}px`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${strokeWidth === w ? "bg-white shadow-md" : "hover:bg-white/80"}`}
                            >
                                <span className="rounded-full bg-slate-700 transition-all" style={{ width: Math.min(w + 2, 14), height: Math.min(w + 2, 14), boxShadow: strokeWidth === w ? `0 0 6px rgba(0,0,0,0.3)` : 'none' }} />
                            </motion.button>
                        ))}
                    </div>

                    {/* Fill toggle (rect/circle) */}
                    <AnimatePresence>
                        {["rect", "circle"].includes(tool) && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                onClick={() => setUseFill((v) => !v)}
                                title="Relleno"
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                                    useFill ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm shadow-[#208DCA]/20" : "bg-white border-slate-300/50 text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <div className="w-3.5 h-3.5 rounded" style={{ background: useFill ? color : "transparent", border: `2px solid ${color}` }} />
                                Relleno
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Text size (text tool) */}
                    <AnimatePresence>
                        {tool === "text" && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-gradient-to-b from-white to-slate-100 border border-slate-300/50 overflow-hidden">
                                {TEXT_SIZES.map((s) => (
                                    <motion.button key={s} onClick={() => setTextSize(s)} title={`${s}px`}
                                        whileHover={{ scale: 1.15 }}
                                        className={`text-xs px-1.5 py-0.5 rounded-lg transition-all ${textSize === s ? "bg-[#208DCA]/15 text-[#208DCA] font-bold shadow-sm" : "text-slate-400 hover:text-slate-800"}`}
                                        style={{ fontSize: 10 + (TEXT_SIZES.indexOf(s)) }}
                                    >A</motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Opacity — compact glass */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-white to-slate-100 border border-slate-300/50">
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wide">OP</span>
                        <input type="range" min={20} max={100} step={5} value={Math.round(opacity * 100)}
                            onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                            className="w-14 h-1.5 accent-[#208DCA] cursor-pointer rounded-full"
                        />
                        <span className="text-[10px] text-[#208DCA] font-bold font-mono w-6">{Math.round(opacity * 100)}%</span>
                    </div>

                    {/* Icons dropdown */}
                    <div className="relative">
                        <Shine enableOnHover color="#208DCA" opacity={0.15} duration={500} asChild>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setOpenIconCat(openIconCat ? null : "emergencia")}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                                    openIconCat
                                        ? "bg-gradient-to-r from-[#253C87]/15 to-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm"
                                        : "bg-white border-slate-300/50 text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                <Layers size={13} />
                                Iconos
                                <motion.span animate={{ rotate: openIconCat ? 180 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <ChevronDown size={10} />
                                </motion.span>
                            </motion.button>
                        </Shine>
                        <AnimatePresence>
                            {openIconCat && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                                    transition={{ type: "spring", damping: 22, stiffness: 350 }}
                                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] backdrop-blur-2xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.15)] overflow-hidden"
                                    style={{ width: 340 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center gap-0.5 px-2 pt-2.5 pb-2 border-b border-slate-100">
                                        <div className="flex gap-0.5 flex-1 overflow-x-auto no-scrollbar">
                                            {Object.entries(ICON_CATEGORIES).map(([key, cat]) => (
                                                <motion.button key={key} onClick={() => setOpenIconCat(key)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`flex-shrink-0 text-[10px] px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                                        openIconCat === key
                                                            ? "text-white bg-gradient-to-r from-[#253C87] to-[#208DCA] font-semibold shadow-md shadow-[#208DCA]/30"
                                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                                    }`}
                                                >{cat.label}</motion.button>
                                            ))}
                                        </div>
                                        <button onClick={() => setShowIconLabels((v) => !v)}
                                            className={`flex-shrink-0 text-[10px] px-2 py-1.5 rounded-lg ml-1 transition-all font-medium ${showIconLabels ? "text-[#208DCA] bg-[#208DCA]/10" : "text-slate-500 hover:text-slate-800"}`}
                                        >Aa</button>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 p-3">
                                        {ICON_CATEGORIES[openIconCat]?.icons.map((ic, i) => (
                                            <motion.button key={ic.emoji}
                                                onClick={() => addEmoji(ic.emoji, ic.label)}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.02, type: "spring", stiffness: 400 }}
                                                whileHover={{ scale: 1.25, y: -4 }}
                                                whileTap={{ scale: 0.8, rotate: 15 }}
                                                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gradient-to-b hover:from-[#208DCA]/5 hover:to-[#208DCA]/10 transition-colors group cursor-pointer"
                                            >
                                                <span className="text-2xl leading-none drop-shadow-sm">{ic.emoji}</span>
                                                {showIconLabels && <span className="text-[8px] text-slate-400 group-hover:text-[#208DCA] truncate w-full text-center font-medium">{ic.label}</span>}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Undo / Redo / Clear — glass pill */}
                    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-300/60">
                        <motion.button whileHover={{ scale: 1.15, rotate: -15 }} whileTap={{ scale: 0.8 }} onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-[#208DCA] hover:bg-[#208DCA]/10 disabled:opacity-30 transition-all">
                            <Undo2 size={16} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15, rotate: 15 }} whileTap={{ scale: 0.8 }} onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-[#208DCA] hover:bg-[#208DCA]/10 disabled:opacity-30 transition-all">
                            <Redo2 size={16} />
                        </motion.button>
                        <AnimatePresence>
                            {selectedIdx !== null && (
                                <motion.button initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}
                                    onClick={deleteSelected} title="Eliminar (Del)"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-all">
                                    <Trash2 size={16} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.8 }} onClick={clearAll} disabled={elements.length === 0} title="Borrar todo"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all">
                            <X size={16} />
                        </motion.button>
                    </div>

                    {/* View controls — glass pill */}
                    <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-gradient-to-b from-white to-slate-100 border border-slate-300/50">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setShowGrid((v) => !v)} title="Cuadrícula"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showGrid ? "text-[#208DCA] bg-[#208DCA]/15 shadow-sm shadow-[#208DCA]/20" : "text-slate-600 hover:text-slate-900 hover:bg-white"}`}>
                            <Grid size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                            onClick={() => setZoom((z) => Math.max(0.3, z - 0.25))} title="Alejar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all">
                            <ZoomOut size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }}
                            onClick={() => setZoom(1)} title="Zoom 100%"
                            className="text-[10px] text-[#208DCA] font-bold font-mono px-1.5 hover:bg-[#208DCA]/8 rounded-md transition-colors">
                            {Math.round(zoom * 100)}%
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.85 }}
                            onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title="Acercar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all">
                            <ZoomIn size={14} />
                        </motion.button>
                    </div>

                    {/* Map/Search/Route — grouped navigation pills */}
                    <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-gradient-to-b from-slate-100/90 to-slate-200/60 border border-slate-300/50">
                        <Shine enableOnHover color="white" opacity={0.3} duration={400} asChild>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                                onClick={() => { setShowMap(true); setMapMode("search"); }}
                                className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                                    showMap && mapMode === "search"
                                        ? "bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white shadow-md shadow-[#208DCA]/40"
                                        : showMap ? "bg-white/80 text-slate-600 hover:bg-white" : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                <Search size={12} />
                                Buscar
                            </motion.button>
                        </Shine>
                        <Shine enableOnHover color="#208DCA" opacity={0.2} duration={400} asChild>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                                onClick={() => { setShowMap(true); setMapMode("route"); }}
                                className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                                    showMap && mapMode === "route"
                                        ? "bg-gradient-to-r from-[#208DCA] to-[#253C87] text-white shadow-md shadow-[#253C87]/40"
                                        : showMap ? "bg-white/80 text-slate-600 hover:bg-white" : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                <Navigation size={12} />
                                Ruta
                            </motion.button>
                        </Shine>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                            onClick={() => setShowMap(false)}
                            className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                                !showMap
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                        >
                            <ImagePlus size={12} />
                            Canvas
                        </motion.button>
                    </div>

                    {/* Fullscreen toggle */}
                    <motion.button whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9, rotate: -5 }}
                        onClick={() => setFullscreen((v) => !v)}
                        title={fullscreen ? "Salir (Esc)" : "Pantalla completa"}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            fullscreen ? "bg-gradient-to-br from-purple-500/20 to-purple-600/15 text-purple-500 shadow-sm shadow-purple-500/20" : "bg-white border border-slate-300/50 text-slate-500 hover:text-slate-900 hover:shadow-md"
                        }`}
                    >
                        {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </motion.button>

                    {/* Save / Export */}
                    <div className="ml-auto flex items-center gap-2">
                        {hasBg && (
                            <>
                                {mode === "standalone" && (
                                    <div className="flex items-center text-xs rounded-xl overflow-hidden border border-slate-200/50 shadow-sm">
                                        <motion.button whileHover={{ backgroundColor: "rgba(32,141,202,0.08)" }}
                                            onClick={() => setExportFormat("png")}
                                            className={`px-3 py-1.5 transition-all ${exportFormat === "png" ? "bg-[#208DCA]/12 text-[#208DCA] font-bold" : "text-slate-400 bg-white/60"}`}>
                                            PNG
                                        </motion.button>
                                        <motion.button whileHover={{ backgroundColor: "rgba(32,141,202,0.08)" }}
                                            onClick={() => setExportFormat("jpeg")}
                                            className={`px-3 py-1.5 transition-all ${exportFormat === "jpeg" ? "bg-[#208DCA]/12 text-[#208DCA] font-bold" : "text-slate-400 bg-white/60"}`}>
                                            JPG
                                        </motion.button>
                                    </div>
                                )}
                                <motion.button whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.85 }}
                                    onClick={copyToClipboard} title="Copiar al portapapeles"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${copiedMsg ? "bg-green-100 text-green-600 shadow-sm shadow-green-200/50" : "bg-white border border-slate-300/50 text-slate-500 hover:text-slate-900 hover:shadow-md"}`}>
                                    {copiedMsg ? <Check size={15} /> : <Copy size={15} />}
                                </motion.button>
                                <Shine enableOnHover color="white" opacity={0.4} duration={500} asChild>
                                    <RippleButton size="sm" onClick={handleSave} disabled={saving}
                                        className={`gap-1.5 text-xs border-0 ${saved ? "bg-green-600 hover:bg-green-600" : "bg-gradient-to-r from-[#253C87] to-[#208DCA]"} text-white shadow-lg shadow-[#208DCA]/30`}>
                                {saved ? <><Check size={12} /> Guardado</>
                                    : saving ? "Guardando..."
                                    : mode === "standalone" ? <><Download size={12} /> Descargar</>
                                    : <><Save size={12} /> Guardar</>}
                            </RippleButton>
                                </Shine>
                        </>
                    )}
                </div>
            </motion.div>
            </Shine>

            {/* ── Canvas + Map ── */}
            <div className="flex-1 min-h-0">

                {/* Map panel — full width, replaces canvas when active */}
                <AnimatePresence>
                    {showMap && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col gap-2 w-full h-full"
                        >
                            {/* Search mode */}
                            {mapMode === "search" && (
                                <AddressAutocomplete
                                    value={mapQuery}
                                    onChange={setMapQuery}
                                    onSelect={(place) => {
                                        setMapQuery(place.displayName);
                                        setMapCommand({ type: "search", query: { lat: place.lat, lng: place.lng } });
                                    }}
                                    placeholder="Buscar dirección, hospital..."
                                    biasLat={routeACoords?.lat}
                                    biasLng={routeACoords?.lng}
                                />
                            )}

                            {/* Route mode */}
                            {mapMode === "route" && (
                                <div className="space-y-1.5">
                                    <AddressAutocomplete
                                        label="A" labelColor="#253C87"
                                        value={routeA}
                                        onChange={setRouteA}
                                        onSelect={(place) => {
                                            setRouteA(place.displayName);
                                            const coordsA = { lat: place.lat, lng: place.lng };
                                            setRouteACoords(coordsA);
                                            if (routeBCoords) {
                                                setMapCommand({ type: "route", a: coordsA, b: routeBCoords });
                                            } else {
                                                // Show A on map while user types B
                                                setMapCommand({ type: "search", query: coordsA });
                                            }
                                        }}
                                        biasLat={routeACoords?.lat}
                                        biasLng={routeACoords?.lng}
                                        placeholder="Origen (dirección o lugar)"
                                    />
                                    <AddressAutocomplete
                                        label="B" labelColor="#208DCA"
                                        value={routeB}
                                        onChange={setRouteB}
                                        onSelect={(place) => {
                                            setRouteB(place.displayName);
                                            const coordsB = { lat: place.lat, lng: place.lng };
                                            setRouteBCoords(coordsB);
                                            // Auto-trace if A already has coords
                                            if (routeACoords) {
                                                setMapCommand({ type: "route", a: routeACoords, b: coordsB });
                                            }
                                        }}
                                        biasLat={routeACoords?.lat || routeBCoords?.lat}
                                        biasLng={routeACoords?.lng || routeBCoords?.lng}
                                        placeholder="Destino (dirección o lugar)"
                                    />
                                    <button onClick={searchMap} disabled={!routeA.trim() || !routeB.trim()}
                                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#208DCA]/20 border border-[#208DCA]/30 text-[#208DCA] text-xs font-medium hover:bg-[#208DCA]/30 transition-colors disabled:opacity-40">
                                        <Navigation size={11} /> Trazar ruta
                                    </button>
                                    {mapStatus === "error" && (
                                        <p className="text-center text-[11px] text-red-500">No se encontró una o ambas direcciones</p>
                                    )}
                                    {mapStatus === "loading" && (
                                        <p className="text-center text-[11px] text-slate-500">Calculando ruta…</p>
                                    )}
                                </div>
                            )}

                            {/* Leaflet map + route panel side by side */}
                            <div className="flex gap-2 flex-1 min-h-0" style={{ height: "100%" }}>
                                <div className={`rounded-xl overflow-hidden border border-slate-200 transition-all ${routeData?.routes?.length > 1 ? "flex-1" : "w-full"}`} style={{ height: "100%" }}>
                                <LeafletMap
                                    command={mapCommand}
                                    onStatus={setMapStatus}
                                    onRouteData={setRouteData}
                                    onMarkerDrag={(place) => {
                                        if (mapMode === "search") {
                                            setMapQuery(place.displayName);
                                        } else if (mapMode === "route") {
                                            setRouteA(place.displayName);
                                            setRouteACoords({ lat: place.lat, lng: place.lng });
                                        }
                                    }}
                                />
                                </div>

                                {/* Route panel — right side */}
                                <AnimatePresence>
                                    {routeData?.routes?.length > 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0, x: 20 }}
                                            animate={{ opacity: 1, width: 200, x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: 20 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                            className="flex flex-col gap-2 overflow-hidden"
                                        >
                                            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1">Rutas</div>
                                            {routeData.routes.map((route, i) => {
                                                const dist = (route.distance / 1000).toFixed(1);
                                                const mins = Math.round(route.duration / 60);
                                                const selected = i === routeData.selectedIndex;
                                                return (
                                                    <Shine key={i} enableOnHover color="#208DCA" opacity={0.15} duration={400} asChild>
                                                        <motion.button
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.08, type: "spring", stiffness: 300 }}
                                                            onClick={() => {
                                                                setMapCommand({ type: "route", a: routeACoords || routeA, b: routeBCoords || routeB, _selectIdx: i });
                                                            }}
                                                            whileHover={{ scale: 1.03, x: -2 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                                                                selected
                                                                    ? "bg-gradient-to-r from-[#253C87]/10 to-[#208DCA]/10 border-[#208DCA]/30 shadow-md shadow-[#208DCA]/15"
                                                                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                                            }`}
                                                        >
                                                            <div className={`text-base font-bold ${selected ? "text-[#208DCA]" : "text-slate-700"}`}>
                                                                🚗 {mins} min
                                                            </div>
                                                            <div className={`text-[11px] ${selected ? "text-[#208DCA]/70" : "text-slate-400"}`}>
                                                                {dist} km
                                                            </div>
                                                            {selected && (
                                                                <motion.div
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#208DCA] flex items-center justify-center"
                                                                >
                                                                    <Check size={10} className="text-white" />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    </Shine>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Canvas area — hidden when map is active */}
                <div ref={containerRef} className={`relative flex flex-col items-center justify-center overflow-auto h-full ${showMap ? "hidden" : ""}`}>

                    {/* Upload dropzone — visible only when no image loaded */}
                    {!hasBg && (
                        <div
                            className="w-full h-full flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-200 cursor-pointer transition-colors hover:border-[#208DCA]/40 hover:bg-[#208DCA]/3"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => document.getElementById("map-file-input").click()}
                        >
                            <div className="text-center space-y-2">
                                <FileImage size={40} className="text-slate-900 mx-auto" />
                                <p className="text-sm font-medium text-slate-900">Sube una imagen o captura de pantalla</p>
                                <p className="text-xs text-slate-900">Arrastra aquí · Ctrl+V para pegar · clic para seleccionar</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap justify-center px-8">
                                <span className="text-xs text-slate-900">— o empezar con lienzo en blanco —</span>
                            </div>

                            {/* Canvas presets */}
                            <div className="flex flex-wrap gap-2 justify-center px-8">
                                {CANVAS_PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        onClick={(e) => { e.stopPropagation(); initBlankCanvas(p.w, p.h); }}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                    >
                                        {p.label}
                                        <span className="text-slate-900 ml-1.5 text-[10px]">{p.w}×{p.h}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Canvas — always in DOM so canvasRef is always valid */}
                    <div className={`relative origin-top-left ${!hasBg ? "hidden" : ""}`} style={{ transform: `scale(${zoom})` }}>
                        <canvas
                            ref={canvasRef}
                            className={`rounded-xl shadow-2xl shadow-slate-300/50 max-w-full block ${cursorClass}`}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                            onContextMenu={onContextMenu}
                            onTouchStart={(e) => { e.preventDefault(); onMouseDown(e); }}
                            onTouchMove={(e) => { e.preventDefault(); onMouseMove(e); }}
                            onTouchEnd={(e) => { e.preventDefault(); onMouseUp(e); }}
                        />
                        {/* Text input overlay */}
                        {textPrompt && (
                            <div className="absolute z-10 -translate-y-full" style={{ left: textPrompt.x, top: textPrompt.y - 16 }}>
                                <div className="flex items-center gap-1 bg-white border border-[#208DCA]/40 rounded-lg shadow-xl px-2 py-1">
                                    <input autoFocus value={textValue}
                                        onChange={(e) => setTextValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") confirmText(); if (e.key === "Escape") setTextPrompt(null); }}
                                        className="bg-transparent text-sm text-slate-900 outline-none w-44" placeholder="Escribe el texto..."
                                    />
                                    <button onClick={confirmText} className="text-[#208DCA] hover:text-slate-900 transition-colors"><Check size={14} /></button>
                                    <button onClick={() => setTextPrompt(null)} className="text-slate-900 hover:text-slate-900 transition-colors"><X size={13} /></button>
                                </div>
                            </div>
                        )}
                        {/* Reset image button */}
                        <button
                            onClick={() => { setHasBg(false); bgRef.current = null; setElements([]); setSelectedIdx(null); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/90 border border-slate-200 text-slate-900 hover:text-slate-900 flex items-center justify-center transition-colors"
                            title="Cambiar imagen"
                        >
                            <X size={12} />
                        </button>
                        {/* Select mode indicator */}
                        {tool === "select" && selectedIdx !== null && (
                            <div className="absolute bottom-2 left-2 bg-[#208DCA]/90 text-slate-900 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5">
                                <Crosshair size={10} />
                                Elemento seleccionado — <kbd className="bg-slate-2000 px-1 rounded">Del</kbd> para eliminar · arrastrar para mover
                            </div>
                        )}
                    </div>

                    <input id="map-file-input" type="file" accept="image/*" className="hidden"
                        onChange={(e) => { if (e.target.files[0]) loadBg(e.target.files[0]); }}
                    />
                </div>
            </div>

            {/* ── Context menu ── */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[160px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {[
                            { label: "Eliminar",        action: () => { deleteSelected(); setContextMenu(null); }, cls: "text-red-400 hover:bg-red-500/10" },
                            { label: "Duplicar",         action: () => { duplicateElement(contextMenu.elIdx); setContextMenu(null); }, cls: "text-slate-900 hover:bg-slate-200" },
                            { label: "Traer al frente",  action: () => { bringToFront(contextMenu.elIdx); setContextMenu(null); }, cls: "text-slate-900 hover:bg-slate-200" },
                            { label: "Enviar al fondo",  action: () => { sendToBack(contextMenu.elIdx); setContextMenu(null); }, cls: "text-slate-900 hover:bg-slate-200" },
                        ].map(({ label, action, cls }) => (
                            <button key={label} onClick={action}
                                className={`w-full text-left text-xs px-3 py-2 transition-colors ${cls}`}>
                                {label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
