import { useForm, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { GravityStarsBackground } from "@/components/animate-ui/components/backgrounds/gravity-stars";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { Input } from "@/components/ui/input";

export default function Login() {
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0f1e]">
            <GravityStarsBackground
                className="absolute inset-0 text-[#208DCA]/60"
                starsCount={100}
                mouseGravity="attract"
                gravityStrength={60}
                glowIntensity={12}
                movementSpeed={0.25}
            />

            {/* Glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#253C87]/20 rounded-full blur-3xl pointer-events-none" />
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
                    {/* Logo */}
                    <img
                        src="/images/logo-blanco.png"
                        alt="Grupo Secon"
                        className="h-20 w-auto object-contain mb-5"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <h1 className="text-3xl font-bold tracking-tight">
                        <GradientText
                            text="Grupo Secon"
                            gradient="linear-gradient(90deg, #ffffff 0%, #208DCA 30%, #253C87 60%, #208DCA 80%, #ffffff 100%)"
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />
                    </h1>
                    <p className="text-sm text-white/50 mt-1">Planes de Seguridad Privada</p>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-lg font-semibold text-white mb-1">Iniciar sesión</h2>
                    <p className="text-sm text-white/40 mb-6">Accede a tu cuenta</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Email</label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="tu@email.com"
                                autoComplete="email"
                                className="bg-white/8 border-white/15 text-white placeholder:text-white/25 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Contraseña</label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="bg-white/8 border-white/15 text-white placeholder:text-white/25 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={(e) => setData("remember", e.target.checked)}
                                className="rounded border-white/20 bg-white/10"
                            />
                            <label htmlFor="remember" className="text-sm text-white/40">Recordarme</label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#253C87] to-[#208DCA] hover:from-[#253C87]/90 hover:to-[#208DCA]/90 text-white h-10 rounded-lg font-medium shadow-lg shadow-[#253C87]/30 mt-2 transition-all disabled:opacity-60"
                        >
                            {processing ? "Accediendo..." : (<>Iniciar sesión <ArrowRight size={16} /></>)}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-sm text-white/30 mt-5">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-[#208DCA] hover:text-[#208DCA]/80 font-medium transition-colors">
                        Registrarse
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
