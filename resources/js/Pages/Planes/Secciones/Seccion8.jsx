import { useState } from "react";
import SectionShell from "@/components/planes/SectionShell";
import FileUpload from "@/components/planes/FileUpload";
import MapEditor from "@/components/planes/MapEditor";
import GoogleMapsProvider from "@/components/GoogleMapsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Upload, Plus, Trash2, ChevronDown, FileImage } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { useTranslation } from "@/i18n";

function newPlano() {
    return { id: Math.random().toString(36).slice(2, 8), nombre: "", descripcion: "" };
}

export default function Seccion8({ plan, section, files = [], eventAddress = "", planAddresses = [] }) {
    const { t } = useTranslation();
    const [showMapEditor, setShowMapEditor] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [planos, setPlanos] = useState(() => {
        try {
            const parsed = JSON.parse(section.form_data?.planos_json ?? "[]");
            return parsed.length > 0 ? parsed : [newPlano()];
        } catch { return [newPlano()]; }
    });

    const formData = { planos_json: JSON.stringify(planos) };

    const addPlano = () => {
        const p = newPlano();
        setPlanos((prev) => [...prev, p]);
        setExpanded(planos.length);
    };

    const removePlano = (i) => {
        setPlanos((prev) => prev.filter((_, idx) => idx !== i));
        if (expanded === i) setExpanded(null);
        else if (expanded > i) setExpanded(expanded - 1);
    };

    const updatePlano = (i, key, val) => {
        setPlanos((prev) => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
    };

    const legacyFiles = files.filter((f) => f.file_category === "plano");

    return (
        <GoogleMapsProvider>
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl bg-[#208DCA]/8 border border-[#208DCA]/20 p-4"
            >
                <div className="w-8 h-8 rounded-lg bg-[#208DCA]/15 border border-[#208DCA]/20 flex items-center justify-center flex-shrink-0">
                    <Map size={15} className="text-[#208DCA]" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#208DCA] mb-0.5">{t("s8.title")}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{t("s8.desc")}</p>
                </div>
            </motion.div>

            {/* Toggle upload / map editor */}
            <div className="flex items-center gap-2">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowMapEditor(false)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        !showMapEditor
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm shadow-[#208DCA]/10"
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                >
                    <Upload size={12} />
                    {t("s8.upload_plans")}
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowMapEditor(true)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        showMapEditor
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA] shadow-sm shadow-[#208DCA]/10"
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                    }`}
                >
                    <Map size={12} />
                    {t("s8.map_editor")}
                </motion.button>
            </div>

            {showMapEditor ? (
                <MapEditor
                    mode="section"
                    uuid={plan.uuid}
                    sectionNumber={8}
                    category="plano"
                    existingFiles={legacyFiles}
                    onSaved={() => {}}
                    eventAddress={eventAddress}
                    planAddresses={planAddresses}
                />
            ) : (
                <div className="space-y-2">
                    <AnimatePresence initial={false}>
                        {planos.map((plano, i) => {
                            const isOpen = expanded === i;
                            const planoFiles = files.filter((f) => f.file_category === `plano_${plano.id}`);
                            const hasFile = planoFiles.length > 0;

                            return (
                                <motion.div
                                    key={plano.id}
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
                                            <FileImage size={13} className={hasFile ? "text-[#208DCA]" : "text-slate-400"} />
                                        </div>
                                        <span className="flex-1 text-xs font-medium text-slate-800 truncate">
                                            {plano.nombre || t("s8.plan_n", { n: i + 1 })}
                                        </span>
                                        {hasFile && (
                                            <span className="text-[10px] font-medium text-[#208DCA] bg-[#208DCA]/10 px-2 py-0.5 rounded-full">
                                                {planoFiles.length} {planoFiles.length > 1 ? t("common.files") : t("common.file")}
                                            </span>
                                        )}
                                        {planos.length > 1 && (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => { e.stopPropagation(); removePlano(i); }}
                                                className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={12} />
                                            </motion.button>
                                        )}
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
                                                        <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">{t("s8.plan_name")}</label>
                                                        <Input
                                                            value={plano.nombre}
                                                            onChange={(e) => updatePlano(i, "nombre", e.target.value)}
                                                            placeholder={t("s8.plan_name_ph")}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">{t("s8.plan_desc")} <span className="text-slate-400 normal-case tracking-normal font-normal">({t("common.optional")})</span></label>
                                                        <Textarea
                                                            value={plano.descripcion}
                                                            onChange={(e) => updatePlano(i, "descripcion", e.target.value)}
                                                            placeholder={t("s8.plan_desc_ph")}
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wide">{t("s8.plan_file")}</label>
                                                        <FileUpload
                                                            uuid={plan.uuid}
                                                            sectionNumber={8}
                                                            category={`plano_${plano.id}`}
                                                            accept="image/*,application/pdf"
                                                            multiple
                                                            existingFiles={planoFiles}
                                                            label={t("s8.upload_plan_file")}
                                                            description={t("s8.upload_plan_desc")}
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
                            onClick={addPlano}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-[#208DCA] hover:border-[#208DCA]/40 hover:bg-[#208DCA]/3 transition-all text-xs font-medium"
                        >
                            <Plus size={13} />
                            {t("s8.add_plan")}
                        </motion.button>
                    </Shine>
                </div>
            )}
        </SectionShell>
        </GoogleMapsProvider>
    );
}
