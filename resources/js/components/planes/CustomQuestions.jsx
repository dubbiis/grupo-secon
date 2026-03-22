import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Star, Search, MessageSquarePlus } from "lucide-react";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export default function CustomQuestions({ sectionNumber, customAnswers = {}, onChange }) {
    const [questions, setQuestions] = useState([]); // added to this plan
    const [catalog, setCatalog] = useState([]); // all available questions
    const [showPicker, setShowPicker] = useState(false);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const pickerRef = useRef(null);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute("content");

    // Load catalog and template questions on mount
    useEffect(() => {
        fetchCatalog();
    }, [sectionNumber]);

    // Initialize questions from existing custom_answers
    useEffect(() => {
        if (catalog.length === 0) return;
        const activeIds = new Set(questions.map((q) => q.id));
        const toAdd = [];

        // Add template questions that aren't already added
        for (const q of catalog) {
            if (q.is_template && !activeIds.has(q.id)) {
                toAdd.push(q);
            }
        }

        // Add questions that have existing answers
        for (const qId of Object.keys(customAnswers)) {
            const id = parseInt(qId);
            if (!activeIds.has(id)) {
                const q = catalog.find((c) => c.id === id);
                if (q) toAdd.push(q);
            }
        }

        if (toAdd.length > 0) {
            setQuestions((prev) => [...prev, ...toAdd]);
        }
    }, [catalog]);

    const fetchCatalog = async () => {
        try {
            const res = await fetch(`/custom-questions/${sectionNumber}`, {
                headers: { "Accept": "application/json" },
            });
            if (res.ok) setCatalog(await res.json());
        } catch {}
    };

    const createQuestion = async (text) => {
        setLoading(true);
        try {
            const res = await fetch("/custom-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
                body: JSON.stringify({ section_number: sectionNumber, question_text: text }),
            });
            if (res.ok) {
                const q = await res.json();
                setCatalog((prev) => [q, ...prev]);
                setQuestions((prev) => [...prev, q]);
                setSearch("");
                setShowPicker(false);
            }
        } catch {}
        setLoading(false);
    };

    const toggleTemplate = async (id) => {
        try {
            const res = await fetch(`/custom-questions/${id}/toggle-template`, {
                method: "PUT",
                headers: { "X-CSRF-TOKEN": csrfToken, "Accept": "application/json" },
            });
            if (res.ok) {
                const updated = await res.json();
                setCatalog((prev) => prev.map((q) => q.id === id ? { ...q, is_template: updated.is_template } : q));
                setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, is_template: updated.is_template } : q));
            }
        } catch {}
    };

    const addFromCatalog = (q) => {
        if (questions.some((existing) => existing.id === q.id)) return;
        setQuestions((prev) => [...prev, q]);
        setShowPicker(false);
        setSearch("");
    };

    const removeQuestion = (id) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        // Remove answer
        const updated = { ...customAnswers };
        delete updated[id];
        onChange(updated);
    };

    const updateAnswer = (id, value) => {
        onChange({ ...customAnswers, [id]: value });
    };

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        if (showPicker) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showPicker]);

    // Filter catalog for picker
    const availableQuestions = catalog.filter((q) => {
        if (questions.some((added) => added.id === q.id)) return false;
        if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const canCreate = search.trim().length >= 3 && !catalog.some((q) => q.question_text.toLowerCase() === search.trim().toLowerCase());

    if (questions.length === 0 && !showPicker) {
        return (
            <div className="pt-2">
                <Shine enableOnHover color="white" opacity={0.3} duration={600} asChild>
                    <button
                        onClick={() => setShowPicker(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-200"
                    >
                        <MessageSquarePlus size={13} />
                        Añadir pregunta personalizada
                    </button>
                </Shine>
            </div>
        );
    }

    return (
        <div className="space-y-3 pt-2">
            {/* Added questions */}
            <AnimatePresence>
                {questions.map((q) => (
                    <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="rounded-xl bg-white border border-gray-200 p-3 space-y-2"
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex-1 text-xs font-medium text-gray-600">{q.question_text}</span>
                            <button
                                onClick={() => toggleTemplate(q.id)}
                                title={q.is_template ? "Quitar de plantilla" : "Añadir a plantilla (aparecerá en futuros planes)"}
                                className={`p-1 rounded transition-all ${q.is_template ? "text-amber-400 hover:text-amber-300" : "text-white/15 hover:text-amber-400"}`}
                            >
                                <Star size={13} fill={q.is_template ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => removeQuestion(q.id)}
                                className="text-white/15 hover:text-red-400 transition-colors p-1">
                                <X size={12} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={customAnswers[q.id] ?? ""}
                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                            placeholder="Escribe la respuesta..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[#208DCA]/40 focus:ring-1 focus:ring-[#208DCA]/30 transition-colors"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Add button + picker */}
            <div className="relative" ref={pickerRef}>
                <Shine enableOnHover color="white" opacity={0.3} duration={600} asChild>
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-600 hover:border-gray-200"
                    >
                        <Plus size={12} />
                        Añadir pregunta
                    </button>
                </Shine>

                <AnimatePresence>
                    {showPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
                                <Search size={13} className="text-gray-400 flex-shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && canCreate && createQuestion(search.trim())}
                                    placeholder="Buscar o escribir pregunta..."
                                    className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                                />
                            </div>

                            {/* Options */}
                            <div className="max-h-48 overflow-y-auto">
                                {availableQuestions.map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => addFromCatalog(q)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left"
                                    >
                                        {q.is_template
                                            ? <Star size={11} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                                            : <MessageSquarePlus size={11} className="text-gray-400 flex-shrink-0" />
                                        }
                                        <span className="flex-1 truncate">{q.question_text}</span>
                                    </button>
                                ))}

                                {availableQuestions.length === 0 && !canCreate && (
                                    <p className="px-3 py-3 text-[11px] text-gray-400 text-center">
                                        {search ? "No se encontraron preguntas" : "No hay preguntas anteriores"}
                                    </p>
                                )}
                            </div>

                            {/* Create new */}
                            {canCreate && (
                                <button
                                    onClick={() => createQuestion(search.trim())}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#208DCA] hover:bg-[#208DCA]/8 transition-colors border-t border-gray-200"
                                >
                                    <Plus size={12} />
                                    <span>Crear: "{search.trim()}"</span>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
