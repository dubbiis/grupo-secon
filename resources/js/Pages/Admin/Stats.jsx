import { motion } from "framer-motion";
import { BarChart2, Zap, DollarSign, Hash, TrendingUp, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { useTranslation } from "@/i18n";

const SECTION_NAMES = {
    1: "Objetivo", 2: "Descripción", 3: "Titulares", 4: "Accesos",
    5: "Recursos Sanitarios", 6: "Perfil Público", 7: "Análisis Riesgos",
    8: "Dispositivo", 9: "Personal", 10: "Transporte", 11: "Run of Show",
    12: "Acreditaciones", 13: "Contactos", 14: "Anexos", 15: "Branding",
};

const MODEL_COLORS = {
    "gpt-4o-mini": "text-emerald-600 bg-emerald-50 border-emerald-200",
    "gpt-4o":      "text-[#208DCA] bg-blue-50 border-blue-200",
    "gpt-4-turbo": "text-purple-600 bg-purple-50 border-purple-200",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-[#208DCA]", delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200`}>
                    <Icon size={16} className={color} />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
        </motion.div>
    );
}

function formatNumber(n) {
    if (!n) return "0";
    return Number(n).toLocaleString("es-ES");
}

const USD_TO_EUR = 0.92;
function formatCost(n) {
    if (!n) return "0.000000 €";
    const val = parseFloat(n) * USD_TO_EUR;
    if (val < 0.01) return `${val.toFixed(6)} €`;
    if (val < 1)    return `${val.toFixed(4)} €`;
    return `${val.toFixed(2)} €`;
}

export default function Stats({ totals, byModel, bySection, recent, daily }) {
    const { t } = useTranslation();
    const totalCalls = parseInt(totals?.total_calls ?? 0);
    const totalTokens = parseInt(totals?.total_tokens ?? 0);
    const totalCost = parseFloat(totals?.total_cost ?? 0);
    const totalPrompt = parseInt(totals?.total_prompt_tokens ?? 0);
    const totalCompletion = parseInt(totals?.total_completion_tokens ?? 0);

    const maxSectionTokens = Math.max(...(bySection?.map((s) => parseInt(s.total_tokens)) ?? [1]), 1);

    return (
        <AppLayout title={t("stats.title")} subtitle="Consumo de tokens y coste por modelo y sección">
            <div className="px-8 py-6 max-w-5xl mx-auto space-y-8">

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Zap}        label={t("stats.total_generations")} value={<SlidingNumber number={totalCalls} inView={true} />}                                     color="text-[#208DCA]" delay={0} />
                    <StatCard icon={Hash}        label={t("stats.total_tokens")}       value={<SlidingNumber number={totalTokens} inView={true} />}                                   color="text-purple-500" delay={0.05} sub={`${formatNumber(totalPrompt)} entrada · ${formatNumber(totalCompletion)} salida`} />
                    <StatCard icon={DollarSign}  label={t("stats.estimated_cost")} value={formatCost(totalCost)}                                                                 color="text-amber-500" delay={0.1} sub="Tipo de cambio fijo aprox. 1 $ = 0.92 €" />
                    <StatCard icon={TrendingUp}  label={t("stats.tokens_per_call")}   value={totalCalls > 0 ? <SlidingNumber number={Math.round(totalTokens / totalCalls)} inView={true} /> : "—"} color="text-emerald-500" delay={0.15} sub="Promedio" />
                </div>

                {/* Por modelo */}
                {byModel?.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                            <BarChart2 size={14} className="text-[#208DCA]" />
                            <h3 className="text-sm font-semibold text-slate-800">{t("stats.usage_by_model")}</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {byModel.map((m) => (
                                <div key={m.model} className="px-5 py-4 flex items-center gap-4">
                                    <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${MODEL_COLORS[m.model] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
                                        {m.model}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-600">{formatNumber(m.total_tokens)} tokens</span>
                                            <span className="text-slate-500">{m.calls} llamadas</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-[#273887] to-[#208DCA]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, (parseInt(m.total_tokens) / Math.max(parseInt(totals?.total_tokens ?? 1), 1)) * 100)}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono text-amber-500 w-24 text-right flex-shrink-0">{formatCost(m.cost)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Por sección */}
                {bySection?.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                            <Hash size={14} className="text-[#208DCA]" />
                            <h3 className="text-sm font-semibold text-slate-800">{t("stats.tokens_by_section")}</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            {bySection.map((s) => {
                                const pct = (parseInt(s.total_tokens) / maxSectionTokens) * 100;
                                return (
                                    <div key={s.section_number} className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#273887]/20 to-[#208DCA]/20 border border-[#208DCA]/20 flex items-center justify-center text-[10px] font-bold text-[#208DCA] flex-shrink-0">
                                            {s.section_number}
                                        </span>
                                        <span className="text-xs text-slate-700 w-36 flex-shrink-0 truncate">
                                            {SECTION_NAMES[s.section_number] ?? `Sección ${s.section_number}`}
                                        </span>
                                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-[#273887] to-[#208DCA]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-700 w-20 text-right flex-shrink-0 font-mono">{formatNumber(s.total_tokens)}</span>
                                        <span className="text-[10px] text-amber-500 w-16 text-right flex-shrink-0 font-mono">{formatCost(s.cost)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Últimas generaciones */}
                {recent?.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                            <Clock size={14} className="text-[#208DCA]" />
                            <h3 className="text-sm font-semibold text-slate-800">{t("stats.last_generations")}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wide text-xs">
                                        <th className="px-5 py-3 text-left font-medium">Plan</th>
                                        <th className="px-3 py-3 text-left font-medium">§</th>
                                        <th className="px-3 py-3 text-left font-medium">Modelo</th>
                                        <th className="px-3 py-3 text-left font-medium">Tipo</th>
                                        <th className="px-3 py-3 text-right font-medium">Tokens</th>
                                        <th className="px-3 py-3 text-right font-medium">Coste</th>
                                        <th className="px-5 py-3 text-right font-medium">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 text-slate-700 truncate max-w-[180px]">{log.plan_title}</td>
                                            <td className="px-3 py-3">
                                                <span className="w-6 h-6 rounded-lg bg-[#208DCA]/10 border border-[#208DCA]/20 inline-flex items-center justify-center text-xs font-bold text-[#208DCA]">
                                                    {log.section_number}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`font-mono px-2 py-0.5 rounded text-xs border ${MODEL_COLORS[log.model] ?? "text-slate-600 bg-slate-50 border-slate-200"}`}>
                                                    {log.model}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${log.type === 'generate' ? 'text-[#208DCA] bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                                                    {log.type === 'generate' ? 'Generar' : 'Cambios'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-slate-700">{formatNumber(log.total_tokens)}</td>
                                            <td className="px-3 py-3 text-right font-mono text-amber-500">{formatCost(log.cost_usd)}</td>
                                            <td className="px-5 py-3 text-right text-slate-500">{log.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Estado vacío */}
                {!recent?.length && (
                    <div className="text-center py-20 text-slate-400">
                        <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm text-slate-500">Aún no hay generaciones registradas.</p>
                        <p className="text-xs text-slate-400 mt-1">Los datos aparecen aquí después de generar texto en cualquier sección.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
