import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, FileDown, LogOut, LayoutDashboard } from "lucide-react";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import SidebarSecciones from "@/components/planes/SidebarSecciones";

import Seccion1 from "./Secciones/Seccion1";
import Seccion2 from "./Secciones/Seccion2";
import Seccion3 from "./Secciones/Seccion3";
import Seccion4 from "./Secciones/Seccion4";
import Seccion5 from "./Secciones/Seccion5";
import Seccion6 from "./Secciones/Seccion6";
import Seccion7 from "./Secciones/Seccion7";
import Seccion8 from "./Secciones/Seccion8";
import Seccion9 from "./Secciones/Seccion9";
import Seccion10 from "./Secciones/Seccion10";
import Seccion11 from "./Secciones/Seccion11";
import Seccion12 from "./Secciones/Seccion12";
import Seccion13 from "./Secciones/Seccion13";
import Seccion14 from "./Secciones/Seccion14";
import Seccion15 from "./Secciones/Seccion15";
import SeccionTextoSimple from "./Secciones/SeccionTextoSimple";

const SECTION_COMPONENTS = {
    1: Seccion1, 2: Seccion2, 3: Seccion3, 4: Seccion4, 5: Seccion5,
    6: Seccion6, 7: Seccion7, 8: Seccion8, 9: Seccion9, 10: Seccion10,
    11: Seccion11, 12: Seccion12, 13: Seccion13, 14: Seccion14, 15: Seccion15,
};

export default function Show({ plan, sections, currentSection, files }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const doneSections = sections.filter((s) => ["listo", "editado"].includes(s.status)).length;
    const progress = Math.round((doneSections / 15) * 100);
    const SectionComponent = currentSection ? (SECTION_COMPONENTS[currentSection.section_number] ?? SeccionTextoSimple) : null;

    return (
        <div className="h-screen flex flex-col bg-[#F8FAFC] text-gray-900 overflow-hidden">

            {/* ── Header ── */}
            <header className="h-14 flex-shrink-0 border-b border-gray-200 bg-gray-50 backdrop-blur-md flex items-center px-4 gap-3 z-20">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {sidebarOpen
                            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} /></motion.div>
                            : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} /></motion.div>
                        }
                    </AnimatePresence>
                </motion.button>

                <Link href="/" className="flex items-center gap-2 flex-shrink-0" title="Volver al dashboard">
                    <img src="/images/logo-secon.svg" alt="Grupo Secon" className="h-7 w-auto object-contain" />
                    <span className="hidden lg:flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1">
                        <LayoutDashboard size={11} /> Dashboard
                    </span>
                </Link>

                <div className="h-4 w-px bg-gray-100 mx-0.5" />

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold text-gray-900 truncate leading-tight">{plan.title}</h1>
                    <p className="text-[10px] text-gray-400 font-mono leading-tight">{plan.uuid}</p>
                </div>

                {/* Progress mini bar */}
                <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-28 h-1 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[#273887] to-[#208DCA]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right"><SlidingNumber number={progress} inView={true} initiallyStable={true} />%</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {progress >= 67 && (
                        <a href={`/planes/${plan.uuid}/pdf/descargar`} target="_blank">
                            <RippleButton
                                size="sm"
                                className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 gap-1.5 shadow-md shadow-[#273887]/25 text-xs"
                            >
                                <FileDown size={13} />
                                <span className="hidden sm:inline">PDF</span>
                            </RippleButton>
                        </a>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => router.post("/logout")}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut size={15} />
                    </motion.button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* Sidebar */}
                <motion.div
                    initial={false}
                    animate={{ width: sidebarOpen ? 260 : 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden flex-shrink-0 h-full"
                >
                    <SidebarSecciones
                        uuid={plan.uuid}
                        sections={sections}
                        currentSection={currentSection?.section_number}
                        progress={progress}
                    />
                </motion.div>

                {/* Main */}
                <main className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {currentSection && SectionComponent ? (
                            <motion.div
                                key={currentSection.section_number}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="max-w-5xl mx-auto px-6 py-10"
                            >
                                <SectionComponent
                                    plan={plan}
                                    section={currentSection}
                                    sections={sections}
                                    files={files}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full gap-3 text-gray-300"
                            >
                                <Shield size={32} className="opacity-30" />
                                <p className="text-sm">Selecciona una sección</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
