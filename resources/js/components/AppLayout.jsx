import { useState, useEffect } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Shield, LogOut, ChevronRight, Map, CreditCard, Settings, TrendingUp, Sun, Moon } from "lucide-react";

export default function AppLayout({ children, title, subtitle }) {
    const { auth } = usePage().props;
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";
    const [adminHover, setAdminHover] = useState(false);
    const [theme, setTheme] = useState(() =>
        typeof window !== "undefined" ? (localStorage.getItem("secon-theme") || "dark") : "dark"
    );

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("secon-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
    };

    const isAdmin = auth?.user?.role === "admin";
    const isAdminActive = currentUrl.startsWith("/admin");

    const navItems = [
        {
            href: "/",
            label: "Mis Planes",
            icon: LayoutDashboard,
            active: currentUrl === "/",
        },
        {
            href: "/editor-mapas",
            label: "Editor de Mapas",
            icon: Map,
            active: currentUrl === "/editor-mapas",
        },
        {
            href: "/editor-acreditaciones",
            label: "Acreditaciones",
            icon: CreditCard,
            active: currentUrl === "/editor-acreditaciones",
        },
    ];

    return (
        <div className="h-screen flex bg-background text-foreground overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-56 flex-shrink-0 flex flex-col border-r bg-[color:var(--sidebar-bg)]" style={{ borderColor: "var(--sidebar-border)" }}>

                {/* Logo */}
                <div className="px-4 py-5 border-b border-border">
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
                                    ? "bg-[#208DCA]/15 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--nav-hover)]"
                            }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#208DCA]"
                                />
                            )}
                            <Icon size={16} className={active ? "text-[#208DCA]" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
                            {label}
                            {active && <ChevronRight size={12} className="ml-auto text-[#208DCA]/50" />}
                        </Link>
                    ))}

                    {/* Admin item con submenu hover */}
                    {isAdmin && (
                        <div
                            className="relative"
                            onMouseEnter={() => setAdminHover(true)}
                            onMouseLeave={() => setAdminHover(false)}
                        >
                            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-default relative ${
                                isAdminActive
                                    ? "bg-[#253C87]/20 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--nav-hover)]"
                            }`}>
                                {isAdminActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#208DCA]"
                                    />
                                )}
                                <Shield size={16} className={isAdminActive ? "text-[#208DCA]" : "text-white/30"} />
                                Panel Admin
                                <ChevronRight size={12} className={`ml-auto transition-transform duration-200 ${adminHover ? "rotate-90" : ""} ${isAdminActive ? "text-[#208DCA]/50" : "text-white/20"}`} />
                            </div>

                            <AnimatePresence>
                                {adminHover && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute left-full bottom-0 ml-2 z-50 bg-[color:var(--popover)] border border-border rounded-xl shadow-2xl overflow-hidden w-48"
                                    >
                                        <div className="px-3 py-2 border-b border-border">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Administración</p>
                                        </div>
                                        <Link
                                            href="/admin/prompts"
                                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[color:var(--nav-hover)] ${currentUrl.startsWith("/admin/prompts") ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <Settings size={14} className="text-[#208DCA]" />
                                            Prompts IA
                                        </Link>
                                        <Link
                                            href="/admin/stats"
                                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-[color:var(--nav-hover)] ${currentUrl === "/admin/stats" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <TrendingUp size={14} className="text-[#208DCA]" />
                                            Estadísticas IA
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-border space-y-1">
                    <div className="px-3 py-2.5 rounded-xl bg-muted">
                        <p className="text-xs font-medium text-foreground truncate">{auth?.user?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{auth?.user?.email}</p>
                        {auth?.user?.role === "admin" && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#253C87]/30 border border-[#253C87]/40 text-[#208DCA]">
                                <Shield size={8} /> Admin
                            </span>
                        )}
                    </div>
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-[color:var(--nav-hover)] transition-all"
                    >
                        {theme === "dark"
                            ? <><Sun size={15} className="text-amber-400" /> Modo claro</>
                            : <><Moon size={15} className="text-[#208DCA]" /> Modo oscuro</>
                        }
                    </button>
                    <button
                        onClick={() => router.post("/logout")}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/8 transition-all"
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
                    <header className="flex-shrink-0 px-8 py-5 border-b border-border bg-background/80 backdrop-blur-sm">
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
