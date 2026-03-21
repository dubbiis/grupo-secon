import { Link, router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Shield, LogOut, ChevronRight, BarChart2 } from "lucide-react";

export default function AppLayout({ children, title, subtitle }) {
    const { auth } = usePage().props;
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";

    const navItems = [
        {
            href: "/",
            label: "Mis Planes",
            icon: LayoutDashboard,
            active: currentUrl === "/",
        },
        ...(auth?.user?.role === "admin" ? [
            {
                href: "/admin/prompts",
                label: "Panel Admin",
                icon: Shield,
                active: currentUrl.startsWith("/admin/prompts"),
            },
            {
                href: "/admin/stats",
                label: "Estadísticas IA",
                icon: BarChart2,
                active: currentUrl === "/admin/stats",
            },
        ] : []),
    ];

    return (
        <div className="h-screen flex bg-[#07090f] text-white overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-56 flex-shrink-0 flex flex-col border-r border-white/8 bg-[#050709]">

                {/* Logo */}
                <div className="px-4 py-5 border-b border-white/6">
                    <Link href="/" className="flex items-center gap-3">
                        <img
                            src="/images/logo.png"
                            alt="Grupo Secon"
                            className="h-8 w-auto object-contain"
                        />
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ href, label, icon: Icon, active }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                                active
                                    ? "bg-[#208DCA]/15 text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/6"
                            }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#208DCA]"
                                />
                            )}
                            <Icon size={16} className={active ? "text-[#208DCA]" : "text-white/30 group-hover:text-white/60 transition-colors"} />
                            {label}
                            {active && <ChevronRight size={12} className="ml-auto text-[#208DCA]/50" />}
                        </Link>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-white/6 space-y-1">
                    <div className="px-3 py-2.5 rounded-xl bg-white/3">
                        <p className="text-xs font-medium text-white truncate">{auth?.user?.name}</p>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{auth?.user?.email}</p>
                        {auth?.user?.role === "admin" && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#253C87]/30 border border-[#253C87]/40 text-[#208DCA]">
                                <Shield size={8} /> Admin
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => router.post("/logout")}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-400/8 transition-all"
                    >
                        <LogOut size={15} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                {(title || subtitle) && (
                    <header className="flex-shrink-0 px-8 py-5 border-b border-white/6 bg-black/20 backdrop-blur-sm">
                        {title && <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>}
                        {subtitle && <p className="text-sm text-white/35 mt-0.5">{subtitle}</p>}
                    </header>
                )}

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
