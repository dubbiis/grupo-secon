import { useForm, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { RippleButton } from "@/components/animate-ui/components/buttons/ripple";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { Input } from "@/components/ui/input";

export default function Register() {
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Grupo Secon</h1>
                    <p className="text-sm text-gray-900 mt-1">Planes de Seguridad Privada</p>
                </div>

                <div className="bg-gray-200 border border-gray-300 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Crear cuenta</h2>
                    <p className="text-sm text-gray-900 mb-6">Regístrate para acceder</p>

                    <form onSubmit={submit} className="space-y-4">
                        {[
                            { key: "name", label: "Nombre completo", type: "text", placeholder: "Tu nombre" },
                            { key: "email", label: "Email", type: "email", placeholder: "tu@email.com" },
                            { key: "password", label: "Contraseña", type: "password", placeholder: "Mínimo 8 caracteres" },
                            { key: "password_confirmation", label: "Confirmar contraseña", type: "password", placeholder: "Repite la contraseña" },
                        ].map(({ key, label, type, placeholder }) => (
                            <div key={key}>
                                <label className="text-xs font-medium text-gray-900 mb-1.5 block uppercase tracking-wide">{label}</label>
                                <Input
                                    type={type}
                                    value={data[key]}
                                    onChange={(e) => setData(key, e.target.value)}
                                    placeholder={placeholder}
                                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/50"
                                />
                                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
                            </div>
                        ))}

                        <RippleButton
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 h-10 font-medium shadow-lg shadow-[#273887]/30 mt-2"
                        >
                            {processing ? "Creando cuenta..." : <span className="flex items-center gap-2">Crear cuenta <ArrowRight size={16} /></span>}
                        </RippleButton>
                    </form>
                </div>

                <p className="text-center text-sm text-gray-900 mt-5">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-[#208DCA] hover:text-[#208DCA]/80 font-medium transition-colors">
                        Iniciar sesión
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
