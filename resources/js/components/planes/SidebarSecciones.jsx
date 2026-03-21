import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { Check, Clock, Pencil, Circle, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_ICON = {
    pendiente: <Circle size={14} className="text-muted-foreground" />,
    generando: <Loader2 size={14} className="text-[#208DCA] animate-spin" />,
    listo: <Check size={14} className="text-green-600" />,
    editado: <Pencil size={14} className="text-[#208DCA]" />,
};

const STATUS_BG = {
    pendiente: "",
    generando: "bg-[#208DCA]/5",
    listo: "bg-green-50",
    editado: "bg-[#208DCA]/5",
};

export default function SidebarSecciones({ uuid, sections, currentSection, progress }) {
    return (
        <aside className="w-64 flex-shrink-0 flex flex-col border-r bg-card h-full">
            {/* Header sidebar */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Secciones</span>
                    <span className="text-xs font-medium text-[#253C87]">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#253C87] to-[#208DCA]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6 }}
                    />
                </div>
            </div>

            {/* Sections list */}
            <nav className="flex-1 overflow-y-auto py-2">
                {sections.map((section) => {
                    const isActive = section.section_number === currentSection;
                    return (
                        <Link
                            key={section.section_number}
                            href={`/planes/${uuid}/seccion/${section.section_number}`}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent group",
                                isActive && "bg-[#253C87]/8 border-r-2 border-[#253C87]",
                                STATUS_BG[section.status]
                            )}
                        >
                            <span className={cn(
                                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border",
                                isActive
                                    ? "bg-[#253C87] text-white border-[#253C87]"
                                    : "border-border text-muted-foreground group-hover:border-[#253C87]/40"
                            )}>
                                {section.section_number}
                            </span>
                            <span className={cn(
                                "flex-1 leading-snug line-clamp-2",
                                isActive ? "font-medium text-[#253C87]" : "text-muted-foreground"
                            )}>
                                {section.section_name}
                            </span>
                            {STATUS_ICON[section.status]}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
