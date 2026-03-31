import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { Check, Pencil, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { useTranslation } from "@/i18n";

function StatusDot({ status }) {
    if (status === "listo") return (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <Check size={8} className="text-green-400" strokeWidth={3} />
        </motion.div>
    );
    if (status === "editado") return (
        <div className="w-4 h-4 rounded-full bg-[#208DCA]/15 border border-[#208DCA]/30 flex items-center justify-center flex-shrink-0">
            <Pencil size={8} className="text-[#208DCA]" />
        </div>
    );
    if (status === "generando") return (
        <Loader2 size={12} className="text-[#208DCA] animate-spin flex-shrink-0" />
    );
    return null;
}

export default function SidebarSecciones({ uuid, sections, currentSection, progress }) {
    const { t } = useTranslation();
    const doneSections = sections.filter((s) => s.status === "listo" || s.status === "editado").length;

    return (
        <aside className="w-[260px] flex flex-col border-r border-slate-200 bg-[#F8FAFC] h-full">

            {/* Progress header */}
            <div className="px-4 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{t("sections.progress")}</span>
                    <span className="text-xs font-bold text-[#208DCA]"><SlidingNumber number={progress} inView={true} initiallyStable={true} />%</span>
                </div>
                <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#273887] to-[#208DCA] shadow-sm shadow-[#208DCA]/30"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                </div>
                <p className="text-[10px] text-slate-900 mt-2">
                    {doneSections} {t("sections.of")} 15 {t("sections.completed")}
                </p>
            </div>

            {/* Sections nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
                {sections.map((section, i) => {
                    const isActive = section.section_number === currentSection;
                    const isDone = section.status === "listo" || section.status === "editado";

                    return (
                        <motion.div
                            key={section.section_number}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.025, duration: 0.2 }}
                        >
                            <Link
                                href={`/planes/${uuid}/seccion/${section.section_number}`}
                                className={cn(
                                    "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all group mb-0.5",
                                    isActive
                                        ? "bg-slate-200 shadow-inner shadow-slate-200/50"
                                        : "hover:bg-slate-200"
                                )}
                            >
                                {/* Active left glow bar */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeBar"
                                        className="absolute left-0 inset-y-1 w-0.5 rounded-full bg-gradient-to-b from-[#273887] to-[#208DCA]"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                    />
                                )}

                                {/* Number badge */}
                                <span className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all",
                                    isActive
                                        ? "bg-gradient-to-br from-[#273887] to-[#208DCA] text-white shadow-md shadow-[#208DCA]/20"
                                        : isDone
                                            ? "bg-green-500/15 text-green-500 border border-green-500/30 shadow-sm shadow-green-500/10"
                                            : "bg-slate-200 text-slate-900 border border-slate-200 group-hover:border-slate-200 group-hover:text-slate-900"
                                )}>
                                    {section.section_number}
                                </span>

                                {/* Section name */}
                                <span className={cn(
                                    "flex-1 leading-snug line-clamp-2 transition-colors",
                                    isActive ? "text-slate-900 font-medium" : "text-slate-900 group-hover:text-white/65"
                                )}>
                                    {t(`section_full_names.${section.section_number}`) || section.section_name}
                                </span>

                                <StatusDot status={section.status} />
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>
        </aside>
    );
}
