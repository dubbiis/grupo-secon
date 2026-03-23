import { useState, useRef } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Shield, LogOut, ChevronRight, Map, Settings, TrendingUp, Users } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/i18n";

function LogoShimmer() {
    return (
        <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
            <img src="/images/logo-secon.svg" alt="Grupo Secon" className="h-10 w-auto object-contain" />
        </motion.div>
    );
}

export default function AppLayout({ children, title, subtitle, headerAction }) {
    const { auth } = usePage().props;
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : "";
    const [adminHover, setAdminHover] = useState(false);
    const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
    const adminRef = useRef(null);

    const { t } = useTranslation();
    const isAdmin = auth?.user?.role === "admin";
    const isAdminActive = currentUrl.startsWith("/admin");

    const navItems = [
        {
            href: "/",
            label: t("nav.my_plans"),
            icon: LayoutDashboard,
            active: currentUrl === "/",
        },
        {
            href: "/editor-mapas",
            label: t("nav.map_editor"),
            icon: Map,
            active: currentUrl === "/editor-mapas",
        },
    ];

    const handleAdminEnter = () => {
        if (adminRef.current) {
            const rect = adminRef.current.getBoundingClientRect();
            setSubmenuPos({ top: rect.top, left: rect.right + 8 });
        }
        setAdminHover(true);
    };

    return (
        <div className="h-screen flex bg-[#F8FAFC] text-slate-900 overflow-hidden">

            {/* ── Sidebar ── */}
            <aside className="w-56 flex-shrink-0 flex flex-col border-r border-slate-200 bg-[#F8FAFC]">

                {/* Logo */}
                <div className="py-6 border-b border-slate-200 flex justify-center">
                    <Link href="/">
                        <LogoShimmer />
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
                                    ? "bg-[#208DCA]/10 text-[#273887] font-semibold"
                                    : "text-slate-900 hover:text-slate-900 hover:bg-slate-200"
                            }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#208DCA]"
                                />
                            )}
                            <Icon size={16} className={active ? "text-[#208DCA]" : "text-slate-900 group-hover:text-slate-900 transition-colors"} />
                            {label}
                            {active && <ChevronRight size={12} className="ml-auto text-[#208DCA]/50" />}
                        </Link>
                    ))}

                    {/* Admin item con submenu fixed */}
                    {isAdmin && (
                        <div
                            ref={adminRef}
                            onMouseEnter={handleAdminEnter}
                            onMouseLeave={() => setAdminHover(false)}
                        >
                            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-default relative ${
                                isAdminActive
                                    ? "bg-[#273887]/10 text-[#273887] font-semibold"
                                    : "text-slate-900 hover:text-slate-900 hover:bg-slate-200"
                            }`}>
                                {isAdminActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#208DCA]"
                                    />
                                )}
                                <Shield size={16} className={isAdminActive ? "text-[#208DCA]" : "text-slate-900"} />
                                {t("nav.admin_panel")}
                                <ChevronRight size={12} className={`ml-auto transition-transform duration-200 ${adminHover ? "rotate-90" : ""} ${isAdminActive ? "text-[#208DCA]/50" : "text-slate-900"}`} />
                            </div>
                        </div>
                    )}
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-slate-200 space-y-1">
                    <div className="px-3 py-2.5 rounded-xl bg-white">
                        <p className="text-xs font-medium text-slate-900 truncate">{auth?.user?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{auth?.user?.email}</p>
                        {auth?.user?.role === "admin" && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#273887]/30 border border-[#273887]/40 text-[#208DCA]">
                                <Shield size={8} /> Admin
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        <LanguageSelector />
                        <button
                            onClick={() => router.post("/logout")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-900 hover:text-red-400 hover:bg-red-400/8 transition-all"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Admin submenu (fixed, fuera del overflow) ── */}
            <AnimatePresence>
                {isAdmin && adminHover && (
                    <motion.div
                        initial={{ opacity: 0, x: -6, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: "fixed", top: submenuPos.top, left: submenuPos.left }}
                        className="z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden w-48"
                        onMouseEnter={() => setAdminHover(true)}
                        onMouseLeave={() => setAdminHover(false)}
                    >
                        <div className="px-3 py-2 border-b border-slate-200">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t("nav.administration")}</p>
                        </div>
                        <Link
                            href="/admin/prompts"
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 ${currentUrl.startsWith("/admin/prompts") ? "text-[#273887] font-medium" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            <Settings size={14} className="text-[#208DCA]" />
                            {t("nav.ai_prompts")}
                        </Link>
                        <Link
                            href="/admin/stats"
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 ${currentUrl === "/admin/stats" ? "text-[#273887] font-medium" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            <TrendingUp size={14} className="text-[#208DCA]" />
                            {t("nav.ai_stats")}
                        </Link>
                        <Link
                            href="/admin/users"
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 ${currentUrl === "/admin/users" ? "text-[#273887] font-medium" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            <Users size={14} className="text-[#208DCA]" />
                            Usuarios
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top bar */}
                {(title || subtitle) && (
                    <header className="flex-shrink-0 px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between">
                        <div>
                            {title && <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>}
                            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                        </div>
                        {headerAction}
                    </header>
                )}

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
