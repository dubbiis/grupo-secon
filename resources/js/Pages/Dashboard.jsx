import { useState } from "react";
import { router, useForm, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Trash2, ChevronRight, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";

const STATUS_LABELS = {
    borrador: { label: "Borrador", variant: "outline" },
    en_progreso: { label: "En progreso", variant: "info" },
    completado: { label: "Completado", variant: "success" },
    pdf_listo: { label: "PDF listo", variant: "success" },
};

export default function Dashboard({ plans, auth }) {
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({ title: "" });

    const createPlan = (e) => {
        e.preventDefault();
        post("/planes", {
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    const deletePlan = (plan) => {
        if (confirm(`¿Eliminar el plan "${plan.title}"? Esta acción no se puede deshacer.`)) {
            router.delete(`/planes/${plan.id}`, {
                onSuccess: () => setDeletingId(null),
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#253C87]/3 via-background to-[#208DCA]/3">
            {/* Header */}
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#253C87] flex items-center justify-center">
                            <Shield size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-[#253C87]">Grupo Secon</span>
                            <span className="text-muted-foreground text-sm ml-2">Planes de Seguridad</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {auth?.user?.role === 'admin' && (
                            <Link href="/admin/prompts">
                                <Button variant="ghost" size="sm">Admin</Button>
                            </Link>
                        )}
                        <span className="text-sm text-muted-foreground">{auth?.user?.name}</span>
                        <Link href="/logout" method="post" as="button">
                            <Button variant="ghost" size="icon">
                                <LogOut size={16} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {/* Hero */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Mis Planes</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {plans.length === 0 ? "Crea tu primer plan de seguridad" : `${plans.length} plan${plans.length !== 1 ? 'es' : ''}`}
                        </p>
                    </div>
                    <Button variant="secon" onClick={() => setShowModal(true)} className="gap-2">
                        <Plus size={16} />
                        Nuevo Plan
                    </Button>
                </div>

                {/* Plans grid */}
                {plans.length === 0 ? (
                    <motion.div
                        className="text-center py-24 border-2 border-dashed rounded-2xl border-border"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-[#253C87]/10 flex items-center justify-center mx-auto mb-4">
                            <Shield size={28} className="text-[#253C87]" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Sin planes todavía</h3>
                        <p className="text-muted-foreground text-sm mb-6">Crea tu primer plan de seguridad para comenzar</p>
                        <Button variant="secon" onClick={() => setShowModal(true)}>
                            <Plus size={16} className="mr-2" />
                            Crear primer plan
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {plans.map((plan, i) => {
                                const status = STATUS_LABELS[plan.status] ?? { label: plan.status, variant: "outline" };
                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Card className="group hover:shadow-md transition-all hover:border-[#253C87]/30">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#253C87]/10 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={18} className="text-[#253C87]" />
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => deletePlan(plan)}
                                                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{plan.title}</h3>
                                                <p className="text-xs text-muted-foreground mb-3">{plan.uuid}</p>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                    <span className="text-xs text-muted-foreground ml-auto">{plan.created_at}</span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="space-y-1 mb-4">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>Progreso</span>
                                                        <span>{plan.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#253C87] to-[#208DCA]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${plan.progress}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.05 + 0.2 }}
                                                        />
                                                    </div>
                                                </div>

                                                <Link href={`/planes/${plan.uuid}/seccion/1`}>
                                                    <Button variant="secon-outline" size="sm" className="w-full gap-1">
                                                        {plan.progress > 0 ? "Continuar" : "Comenzar"}
                                                        <ChevronRight size={14} />
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Modal nuevo plan */}
            <Dialog open={showModal} onClose={() => { setShowModal(false); reset(); }}>
                <DialogHeader>
                    <DialogTitle>Nuevo Plan de Seguridad</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Dale un nombre al evento o instalación</p>
                </DialogHeader>
                <form onSubmit={createPlan}>
                    <DialogContent>
                        <label className="text-sm font-medium mb-1.5 block">Nombre del evento/instalación</label>
                        <Input
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            placeholder="Ej: Concierto Madrid Arena 2025"
                            autoFocus
                        />
                        {errors.title && <p className="text-destructive text-xs mt-1">{errors.title}</p>}
                    </DialogContent>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { setShowModal(false); reset(); }}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="secon" disabled={processing || !data.title.trim()}>
                            {processing ? "Creando..." : "Crear plan"}
                        </Button>
                    </DialogFooter>
                </form>
            </Dialog>
        </div>
    );
}
