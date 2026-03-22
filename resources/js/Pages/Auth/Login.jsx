import { useForm, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { Input } from "@/components/ui/input";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/i18n";

export default function Login() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post("/login");
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F8FAFC]">
            <GravityStarsBackground
                className="absolute inset-0 text-[#208DCA]/60 pointer-events-none"
                starsCount={100}
                mouseGravity="attract"
                gravityStrength={60}
                glowIntensity={12}
                movementSpeed={0.25}
            />

            {/* Glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#273887]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#208DCA]/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                className="relative z-10 w-full max-w-sm px-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Logo */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <img
                        src="/images/logo-secon.svg"
                        alt="Grupo Secon"
                        className="h-20 w-auto object-contain mb-5 mx-auto"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <h1 className="text-3xl font-bold tracking-tight">
                        <GradientText
                            text="Grupo Secon"
                            gradient="linear-gradient(90deg, #273887 0%, #208DCA 30%, #273887 60%, #208DCA 80%, #273887 100%)"
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{t("auth.app_subtitle")}</p>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="bg-white border border-slate-200 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-slate-200/60"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">{t("auth.login")}</h2>
                    <p className="text-sm text-slate-500 mb-6">{t("auth.login_subtitle")}</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block uppercase tracking-wide">{t("auth.email")}</label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder={t("auth.email_placeholder")}
                                autoComplete="email"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1.5 block uppercase tracking-wide">{t("auth.password")}</label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                placeholder={t("auth.password_placeholder")}
                                autoComplete="current-password"
                                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={(e) => setData("remember", e.target.checked)}
                                className="rounded border-slate-300 bg-white"
                            />
                            <label htmlFor="remember" className="text-sm text-slate-600">{t("auth.remember_me")}</label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#273887] to-[#208DCA] hover:from-[#273887]/90 hover:to-[#208DCA]/90 text-white h-10 rounded-lg font-medium shadow-lg shadow-[#273887]/30 mt-2 transition-all disabled:opacity-60"
                        >
                            {processing ? t("auth.logging_in") : (<>{t("auth.login")} <ArrowRight size={16} /></>)}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-sm text-slate-500 mt-5">
                    {t("auth.no_account")}{" "}
                    <Link href="/register" className="text-[#208DCA] hover:text-[#208DCA]/80 font-medium transition-colors">
                        {t("auth.register")}
                    </Link>
                </p>
            </motion.div>

            {/* Language selector */}
            <div className="fixed bottom-4 right-4 z-20">
                <LanguageSelector />
            </div>
        </div>
    );
}
