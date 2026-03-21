import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Shield, Menu, X, FileDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    1: Seccion1,
    2: Seccion2,
    3: Seccion3,
    4: Seccion4,
    5: Seccion5,
    6: Seccion6,
    7: Seccion7,
    8: Seccion8,
    9: Seccion9,
    10: Seccion10,
    11: Seccion11,
    12: Seccion12,
    13: Seccion13,
    14: Seccion14,
    15: Seccion15,
};

function getSectionComponent(number) {
    return SECTION_COMPONENTS[number] ?? SeccionTextoSimple;
}

export default function Show({ plan, sections, currentSection, files, auth }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const doneSections = sections.filter((s) => ["listo", "editado"].includes(s.status)).length;
    const progress = Math.round((doneSections / 15) * 100);

    const SectionComponent = currentSection ? getSectionComponent(currentSection.section_number) : null;

    const logout = () => {
        router.post("/logout");
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="h-14 flex-shrink-0 border-b bg-card flex items-center px-4 gap-3 z-10">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                    {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <Link href="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#253C87] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-[#253C87] text-sm hidden sm:block">Grupo Secon</span>
                </Link>

                <div className="h-4 w-px bg-border mx-1" />

                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-semibold truncate">{plan.title}</h1>
                    <p className="text-xs text-muted-foreground">{plan.uuid}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {progress >= 67 && (
                        <Link href={`/planes/${plan.uuid}/pdf/descargar`}>
                            <Button variant="secon" size="sm" className="gap-1.5">
                                <FileDown size={14} />
                                <span className="hidden sm:inline">PDF</span>
                            </Button>
                        </Link>
                    )}
                    <button onClick={logout} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <motion.div
                    initial={false}
                    animate={{ width: sidebarOpen ? 256 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex-shrink-0"
                >
                    {sidebarOpen && (
                        <SidebarSecciones
                            uuid={plan.uuid}
                            sections={sections}
                            currentSection={currentSection?.section_number}
                            progress={progress}
                        />
                    )}
                </motion.div>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto bg-background">
                    {currentSection && SectionComponent ? (
                        <motion.div
                            key={currentSection.section_number}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-3xl mx-auto px-6 py-8"
                        >
                            <SectionComponent
                                plan={plan}
                                section={currentSection}
                                sections={sections}
                                files={files}
                            />
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Selecciona una sección
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
