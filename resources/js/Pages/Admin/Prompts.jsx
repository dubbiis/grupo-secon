import { Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

export default function Prompts({ prompts, flash }) {
    return (
        <AppLayout title="Gestión de Prompts IA" subtitle="Configura las instrucciones de IA para cada sección del plan de seguridad">
            <div className="px-8 py-6 max-w-4xl mx-auto">

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
            </div>
        </AppLayout>
    );
}
