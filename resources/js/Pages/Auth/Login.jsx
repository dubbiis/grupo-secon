import { useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#253C87]/5 via-background to-[#208DCA]/5 p-4">
            <motion.div
                className="w-full max-w-sm"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#253C87] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[#253C87]">Grupo Secon</h1>
                    <p className="text-sm text-muted-foreground mt-1">Planes de Seguridad Privada</p>
                </div>

                {/* Card */}
                <div className="bg-card border rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-1">Iniciar sesión</h2>
                    <p className="text-sm text-muted-foreground mb-5">Accede a tu cuenta</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Email</label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                placeholder="tu@email.com"
                                autoComplete="email"
                            />
                            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Contraseña</label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={(e) => setData("remember", e.target.checked)}
                                className="rounded border-input"
                            />
                            <label htmlFor="remember" className="text-sm text-muted-foreground">
                                Recordarme
                            </label>
                        </div>

                        <Button type="submit" variant="secon" className="w-full" disabled={processing}>
                            {processing ? "Accediendo..." : "Iniciar sesión"}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    ¿No tienes cuenta?{" "}
                    <Link href="/register" className="text-[#253C87] font-medium hover:underline">
                        Registrarse
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
