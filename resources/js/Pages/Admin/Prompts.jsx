import { Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Shield, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";

export default function Prompts({ prompts, flash }) {
    return (
        <div className="min-h-screen bg-[#07090f] text-white">
            <header className="border-b border-white/8 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#253C87] to-[#208DCA] flex items-center justify-center shadow-md shadow-[#253C87]/25">
                        <Shield size={13} className="text-white" />
                    </div>
                    <span className="font-bold text-white">Grupo Secon</span>
                    <span className="text-white/25 text-sm">/ Admin / Prompts</span>
                    <div className="ml-auto">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white">
                                ← Volver
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-[#208DCA]" />
                        <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Panel de administración</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Gestión de Prompts IA</h1>
                    <p className="text-sm text-white/40 mt-1">Configura las instrucciones de IA para cada sección del plan de seguridad</p>
                </div>

                <AnimatePresence>
                    {flash?.success && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 flex items-center gap-2"
                        >
                            <Check size={14} />
                            {flash.success}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    {prompts.map((prompt, i) => (
                        <motion.div
                            key={prompt.section_number}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 hover:border-white/12 transition-all group"
                        >
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C87]/30 to-[#208DCA]/30 border border-[#208DCA]/20 flex items-center justify-center text-sm font-bold text-[#208DCA] flex-shrink-0">
                                {prompt.section_number}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-white">{prompt.section_name}</p>
                                <p className="text-xs text-white/30 mt-0.5">
                                    {prompt.model} · max {prompt.max_tokens} tokens
                                    {prompt.updated_at && ` · Editado ${prompt.updated_at}`}
                                </p>
                            </div>
                            <Link href={`/admin/prompts/${prompt.section_number}`}>
                                <Button variant="outline" size="sm" className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil size={12} />
                                    Editar
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
