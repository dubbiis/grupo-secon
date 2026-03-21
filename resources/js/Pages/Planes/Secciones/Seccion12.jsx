import { useState } from "react";
import { motion } from "framer-motion";
import SectionShell from "@/components/planes/SectionShell";
import LoopItems from "@/components/planes/LoopItems";
import CredentialCreator from "@/components/planes/CredentialCreator";
import { CreditCard, List, ChevronDown } from "lucide-react";

const FIELDS = [
    { key: "nombre_acreditacion", label: "Nombre de la acreditación", placeholder: "Ej: Staff, Prensa, VIP, Artista, Seguridad...", required: true, wide: true },
    { key: "cantidad",            label: "Cantidad",                  type: "number", placeholder: "Nº de acreditaciones" },
    { key: "usuarios",            label: "Usuarios / Colectivo",      placeholder: "¿Quién la porta?" },
    { key: "zonas_acceso",        label: "Zonas de acceso autorizadas", placeholder: "Ej: Backstage, Zona VIP, Escenario...", wide: true },
    { key: "descripcion",         label: "Descripción / Características", type: "textarea", placeholder: "Color, forma, datos impresos, controles de verificación...", wide: true },
];

export default function Seccion12({ plan, section }) {
    const [items, setItems] = useState(() => {
        try { return JSON.parse(section.form_data?.acreditaciones_json ?? "[]"); }
        catch { return []; }
    });
    const [view, setView] = useState("lista"); // "lista" | "disenador"

    const formData = { acreditaciones_json: JSON.stringify(items, null, 2) };

    return (
        <SectionShell plan={plan} section={section} formData={formData} onFormChange={() => {}}>
            <p className="text-sm text-muted-foreground">
                Define los tipos de acreditación del evento, sus características y las zonas a las que permiten acceso.
                Usa el diseñador para crear tarjetas visuales listas para imprimir o incluir en el plan.
            </p>

            {/* View toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setView("lista")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        view === "lista"
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}
                >
                    <List size={12} />
                    Lista de acreditaciones
                </button>
                <button
                    onClick={() => setView("disenador")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all ${
                        view === "disenador"
                            ? "bg-[#208DCA]/15 border-[#208DCA]/30 text-[#208DCA]"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    }`}
                >
                    <CreditCard size={12} />
                    Diseñador de tarjetas
                </button>
            </div>

            {/* Lista */}
            {view === "lista" && (
                <LoopItems
                    items={items}
                    onChange={setItems}
                    fields={FIELDS}
                    addLabel="Añadir tipo de acreditación"
                    itemLabel={(item) => item.nombre_acreditacion || "Acreditación sin nombre"}
                />
            )}

            {/* Diseñador */}
            {view === "disenador" && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <CredentialCreator
                        uuid={plan.uuid}
                        sectionNumber={12}
                        onSaved={() => {}}
                    />
                </motion.div>
            )}
        </SectionShell>
    );
}
