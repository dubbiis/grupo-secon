import { useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Users as UsersIcon, Plus, Pencil, Trash2, Shield, User, X, Check } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export default function UserManagement({ users }) {
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: "", email: "", password: "", role: "user",
    });

    const openCreate = () => {
        reset();
        setEditUser(null);
        setShowModal(true);
    };

    const openEdit = (user) => {
        setData({ name: user.name, email: user.email, password: "", role: user.role });
        setEditUser(user);
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editUser) {
            put(`/admin/users/${editUser.id}`, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); reset(); setEditUser(null); },
            });
        } else {
            post("/admin/users", {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = () => {
        router.delete(`/admin/users/${deleteUser.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteUser(null),
        });
    };

    return (
        <AppLayout title="Gestión de usuarios" subtitle="Crear, editar y gestionar usuarios y roles">
            <div className="px-8 py-6 max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UsersIcon size={20} className="text-[#208DCA]" />
                        <h2 className="text-lg font-semibold text-slate-800">{users.length} usuarios</h2>
                    </div>
                    <Shine enableOnHover color="white" opacity={0.4} duration={600} asChild>
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#273887] to-[#208DCA] text-white shadow-md shadow-[#273887]/25 hover:opacity-90 transition-all"
                        >
                            <Plus size={14} /> Nuevo usuario
                        </button>
                    </Shine>
                </div>

                {/* Users table */}
                <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wide text-xs">
                                <th className="px-5 py-3 text-left font-medium">Nombre</th>
                                <th className="px-3 py-3 text-left font-medium">Email</th>
                                <th className="px-3 py-3 text-left font-medium">Rol</th>
                                <th className="px-3 py-3 text-center font-medium">Planes</th>
                                <th className="px-3 py-3 text-left font-medium">Creado</th>
                                <th className="px-5 py-3 text-right font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {users.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#273887]/20 to-[#208DCA]/20 flex items-center justify-center">
                                                    {user.role === "admin" ? <Shield size={14} className="text-[#208DCA]" /> : <User size={14} className="text-slate-400" />}
                                                </div>
                                                <span className="font-medium text-slate-800">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-3 py-3">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                                                user.role === "admin"
                                                    ? "text-[#208DCA] bg-blue-50 border-blue-200"
                                                    : "text-slate-500 bg-slate-50 border-slate-200"
                                            }`}>
                                                {user.role === "admin" ? "Admin" : "Usuario"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center text-slate-600">{user.plans_count}</td>
                                        <td className="px-3 py-3 text-slate-500 text-xs">{user.created_at}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(user)} title="Editar"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#208DCA] hover:bg-[#208DCA]/10 transition-colors">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => setDeleteUser(user)} title="Eliminar"
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Create/Edit Modal */}
                <Dialog open={showModal} onClose={() => { setShowModal(false); reset(); setEditUser(null); }}>
                    <DialogHeader>
                        <DialogTitle>{editUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <DialogContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Nombre</label>
                                <Input value={data.name} onChange={(e) => setData("name", e.target.value)} placeholder="Nombre completo" />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Email</label>
                                <Input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} placeholder="email@ejemplo.com" />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">
                                    Contraseña {editUser && <span className="text-slate-400 font-normal">(dejar vacío para no cambiar)</span>}
                                </label>
                                <Input type="password" value={data.password} onChange={(e) => setData("password", e.target.value)} placeholder={editUser ? "••••••••" : "Mínimo 6 caracteres"} />
                                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Rol</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setData("role", "user")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                            data.role === "user" ? "border-[#208DCA] bg-[#208DCA]/10 text-[#273887]" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        }`}>
                                        <User size={14} /> Usuario
                                    </button>
                                    <button type="button" onClick={() => setData("role", "admin")}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                            data.role === "admin" ? "border-[#208DCA] bg-[#208DCA]/10 text-[#273887]" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        }`}>
                                        <Shield size={14} /> Admin
                                    </button>
                                </div>
                            </div>
                        </DialogContent>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setShowModal(false); reset(); setEditUser(null); }}>Cancelar</Button>
                            <RippleButton type="submit" disabled={processing}
                                className="bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0">
                                {processing ? "Guardando..." : editUser ? "Guardar cambios" : "Crear usuario"}
                            </RippleButton>
                        </DialogFooter>
                    </form>
                </Dialog>

                {/* Delete confirmation */}
                <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)}>
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Eliminar usuario</DialogTitle>
                        <p className="text-sm text-slate-500 mt-2">
                            ¿Seguro que quieres eliminar a <span className="font-medium text-slate-700">{deleteUser?.name}</span>?
                            Se eliminarán también todos sus planes.
                        </p>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancelar</Button>
                        <RippleButton onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white border-0 gap-2">
                            <Trash2 size={14} /> Eliminar
                        </RippleButton>
                    </DialogFooter>
                </Dialog>
            </div>
        </AppLayout>
    );
}
