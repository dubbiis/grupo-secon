import { useForm, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";

export default function Register() {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        name: "", email: "", password: "", password_confirmation: "",
    });

    const submit = (e) => { e.preventDefault(); post("/register"); };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#F8FAFC]">
            <StarsBackground className="absolute inset-0" quantity={120} />
            <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#273887]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#208DCA]/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                className="relative z-10 w-full max-w-sm px-4"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#273887] to-[#208DCA] shadow-lg shadow-[#273887]/40 mb-4">
                        <Shield size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Grupo Secon</h1>
                    <p className="text-sm text-slate-900 mt-1">{t("auth.app_subtitle")}</p>
                </div>

                <div className="bg-slate-200 border border-slate-200 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">{t("auth.create_account")}</h2>
                    <p className="text-sm text-slate-900 mb-6">{t("auth.register_subtitle")}</p>

                    <form onSubmit={submit} className="space-y-4">
                        {[
                            { key: "name", label: t("auth.full_name"), type: "text", placeholder: t("auth.full_name_placeholder") },
                            { key: "email", label: t("auth.email"), type: "email", placeholder: t("auth.email_placeholder") },
                            { key: "password", label: t("auth.password"), type: "password", placeholder: t("auth.password_min_8") },
                            { key: "password_confirmation", label: t("auth.confirm_password"), type: "password", placeholder: t("auth.confirm_password_placeholder") },
                        ].map(({ key, label, type, placeholder }) => (
                            <div key={key}>
                                <label className="text-xs font-medium text-slate-900 mb-1.5 block uppercase tracking-wide">{label}</label>
                                <Input
                                    type={type}
                                    value={data[key]}
                                    onChange={(e) => setData(key, e.target.value)}
                                    placeholder={placeholder}
                                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                                />
                                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
                            </div>
                        ))}

                        <RippleButton
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 h-10 font-medium shadow-lg shadow-[#273887]/30 mt-2"
                        >
                            {processing ? t("auth.creating_account") : <span className="flex items-center gap-2">{t("auth.create_account")} <ArrowRight size={16} /></span>}
                        </RippleButton>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-900 mt-5">
                    {t("auth.has_account")}{" "}
                    <Link href="/login" className="text-[#208DCA] hover:text-[#208DCA]/80 font-medium transition-colors">
                        {t("auth.login_link")}
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
