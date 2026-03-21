import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Pencil, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Prompts({ prompts, auth, flash }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#253C87] flex items-center justify-center">
                        <Shield size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-[#253C87]">Grupo Secon</span>
                    <span className="text-muted-foreground text-sm">/ Admin / Prompts</span>
                    <div className="ml-auto">
                        <Link href="/">
                            <Button variant="ghost" size="sm">← Volver</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-xl font-bold">Gestión de Prompts</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura los prompts de IA para cada sección del plan
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3">
                        {flash.success}
                    </div>
                )}

                <div className="space-y-2">
                    {prompts.map((prompt, i) => (
                        <motion.div
                            key={prompt.section_number}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 h-8 rounded-full bg-[#253C87]/10 flex items-center justify-center text-sm font-bold text-[#253C87] flex-shrink-0">
                                            {prompt.section_number}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{prompt.section_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {prompt.model} · max {prompt.max_tokens} tokens
                                                {prompt.updated_at && ` · Editado ${prompt.updated_at}`}
                                            </p>
                                        </div>
                                        <Link href={`/admin/prompts/${prompt.section_number}`}>
                                            <Button variant="outline" size="sm" className="gap-1.5">
                                                <Pencil size={12} />
                                                Editar
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
