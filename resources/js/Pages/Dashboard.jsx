import { useState } from "react";
import { router, useForm, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Trash2, ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import AppLayout from "@/components/AppLayout";

const STATUS_CONFIG = {
    borrador:    { label: "Borrador",    color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20" },
    en_progreso: { label: "En progreso", color: "bg-[#208DCA]/15 text-[#208DCA] border-[#208DCA]/20" },
    completado:  { label: "Completado",  color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    pdf_listo:   { label: "PDF listo",   color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

export default function Dashboard({ plans, auth }) {
    const [showModal, setShowModal] = useState(false);
    const [planToDelete, setPlanToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({ title: "" });

    const createPlan = (e) => {
        e.preventDefault();
        post("/planes", { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const confirmDelete = () => {
        if (!planToDelete) return;
        setDeleting(true);
        router.delete(`/planes/${planToDelete.id}`, {
            onFinish: () => { setDeleting(false); setPlanToDelete(null); },
        });
    };

    return (
        <AppLayout>
            <div className="px-8 py-8 max-w-6xl mx-auto">
                {/* Hero */}
                <motion.div
                    className="flex items-end justify-between mb-8"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div>
                        <p className="text-white/30 text-sm mb-1">Bienvenido, {auth?.user?.name}</p>
                        <h1 className="text-3xl font-bold tracking-tight">Mis Planes</h1>
                        <p className="text-white/40 text-sm mt-1">
                            {plans.length === 0 ? "Crea tu primer plan" : `${plans.length} plan${plans.length !== 1 ? 'es' : ''} activo${plans.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <RippleButton
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-2 shadow-lg shadow-[#253C87]/25 hover:shadow-[#253C87]/40"
                    >
                        <Plus size={16} />
                        Nuevo Plan
                    </RippleButton>
                </motion.div>

                {/* Empty state */}
                {plans.length === 0 ? (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl border border-white/8 text-center py-24"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GradientBackground className="absolute inset-0 opacity-30" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#253C87] to-[#208DCA] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#253C87]/30">
                                <Shield size={28} className="text-white" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Sin planes todavía</h3>
                            <p className="text-white/40 text-sm mb-6">Crea tu primer plan de seguridad para comenzar</p>
                            <RippleButton
                                onClick={() => setShowModal(true)}
                                className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 gap-2"
                            >
                                <Plus size={16} />
                                Crear primer plan
                            </RippleButton>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {plans.map((plan, i) => {
                                const status = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.borrador;
                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.06, duration: 0.35 }}
                                        className="group relative"
                                    >
                                        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 hover:bg-white/6 hover:border-white/15 transition-all duration-300 p-5">
                                            {/* Subtle gradient on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#253C87]/0 to-[#208DCA]/0 group-hover:from-[#253C87]/5 group-hover:to-[#208DCA]/5 transition-all duration-300 rounded-2xl" />

                                            <div className="relative">
                                                {/* Top row */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#253C87]/30 to-[#208DCA]/30 flex items-center justify-center border border-[#208DCA]/20">
                                                        <FileText size={18} className="text-[#208DCA]" />
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setPlanToDelete(plan)}
                                                            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="font-semibold text-sm leading-snug mb-1 line-clamp-2">{plan.title}</h3>
                                                <p className="text-xs text-white/30 font-mono mb-3">{plan.uuid}</p>

                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                    <span className="text-xs text-white/25 ml-auto">{plan.created_at}</span>
                                                </div>

                                                {/* Progress */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="flex justify-between text-xs text-white/30">
                                                        <span>Progreso</span>
                                                        <span>{plan.progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-gradient-to-r from-[#253C87] to-[#208DCA]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${plan.progress}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.06 + 0.3, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>

                                                <Link href={`/planes/${plan.uuid}/seccion/1`}>
                                                    <RippleButton
                                                        className="w-full bg-white/6 hover:bg-white/10 text-white/80 border border-white/10 gap-1.5 h-8 text-xs font-medium"
                                                        rippleColor="rgba(255,255,255,0.1)"
                                                    >
                                                        {plan.progress > 0 ? "Continuar" : "Comenzar"}
                                                        <ChevronRight size={12} />
                                                    </RippleButton>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={showModal} onClose={() => { setShowModal(false); reset(); }}>
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-[#208DCA]" />
                        <DialogTitle>Nuevo Plan de Seguridad</DialogTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">Dale un nombre al evento o instalación</p>
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
                        <Button type="button" variant="outline" onClick={() => { setShowModal(false); reset(); }}>Cancelar</Button>
                        <RippleButton
                            type="submit"
                            disabled={processing || !data.title.trim()}
                            className="bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0"
                        >
                            {processing ? "Creando..." : "Crear plan"}
                        </RippleButton>
                    </DialogFooter>
                </form>
            </Dialog>

            {/* Modal confirmar eliminación */}
            <Dialog open={!!planToDelete} onClose={() => !deleting && setPlanToDelete(null)}>
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={16} className="text-red-400" />
                        </div>
                        <DialogTitle className="text-red-400">Eliminar plan</DialogTitle>
                    </div>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed">
                        ¿Seguro que quieres eliminar <span className="text-white font-medium">"{planToDelete?.title}"</span>?
                        <br />
                        <span className="text-white/35 text-xs">Esta acción no se puede deshacer.</span>
                    </p>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPlanToDelete(null)}
                        disabled={deleting}
                    >
                        Cancelar
                    </Button>
                    <RippleButton
                        onClick={confirmDelete}
                        disabled={deleting}
                        className="bg-red-500/90 hover:bg-red-500 text-white border-0 gap-2"
                        rippleColor="rgba(255,255,255,0.2)"
                    >
                        <Trash2 size={14} />
                        {deleting ? "Eliminando..." : "Sí, eliminar"}
                    </RippleButton>
                </DialogFooter>
            </Dialog>
        </AppLayout>
    );
}
