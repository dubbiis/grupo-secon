import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SectionShell from "@/components/planes/SectionShell";
import { useTranslation } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Wrench, CalendarDays, ChevronRight } from "lucide-react";

function getDaysBetween(start, end) {
    if (!start || !end) return [];
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e) || e < s) return [];
    const days = [];
    const d = new Date(s);
    while (d <= e) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }
    return days;
}

function formatDay(date, lang) {
    const weekday = date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", { month: "short" });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${day} ${month}`;
}

function formatDateKey(date) {
    return date.toISOString().split("T")[0];
}

function DayScheduleCard({ day, index, label, icon: Icon, colorClass, horarios, onUpdate, t }) {
    const dateKey = formatDateKey(day);
    const inicio = horarios?.[dateKey]?.inicio ?? "";
    const fin = horarios?.[dateKey]?.fin ?? "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
            <div className="p-3 pl-4">
                <div className="flex items-center gap-2 mb-2.5">
                    <div className={`w-7 h-7 rounded-lg ${colorClass} bg-opacity-15 flex items-center justify-center`}>
                        <Icon size={14} className={colorClass.replace("bg-", "text-")} />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-800 block">{label}</span>
                        <span className="text-[10px] text-slate-400">{formatDay(day, t("common.lang_code") || "es")}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 mb-0.5 block">{t("forms.start_time")}</label>
                        <Input
                            type="time"
                            value={inicio}
                            onChange={(e) => onUpdate(dateKey, "inicio", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-slate-400 mb-0.5 block">{t("forms.end_time")}</label>
                        <Input
                            type="time"
                            value={fin}
                            onChange={(e) => onUpdate(dateKey, "fin", e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function Timeline({ setupDays, eventDays, teardownDays, setupHorarios, eventHorarios, teardownHorarios, t }) {
    const items = [];

    const addDays = (days, horarios, type, label) => {
        days.forEach((day) => {
            const key = formatDateKey(day);
            const h = horarios?.[key];
            if (h?.inicio || h?.fin) {
                items.push({ date: day, type, label, inicio: h.inicio, fin: h.fin });
            }
        });
    };

    addDays(setupDays, setupHorarios, "setup", t("s2.setup"));
    addDays(eventDays, eventHorarios, "event", t("s2.event"));
    addDays(teardownDays, teardownHorarios, "teardown", t("s2.teardown"));

    items.sort((a, b) => a.date - b.date);

    if (items.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 relative"
        >
            <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={15} className="text-[#208DCA]" />
                <h3 className="text-sm font-semibold text-slate-800">{t("s2.timeline")}</h3>
            </div>

            <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#253C87] via-[#208DCA] to-[#253C87] rounded-full" />

                <AnimatePresence>
                    {items.map((item, i) => (
                        <motion.div
                            key={`${item.type}-${formatDateKey(item.date)}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="relative mb-3 last:mb-0"
                        >
                            {/* Dot */}
                            <div className={`absolute -left-6 top-2.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                                item.type === "setup" ? "bg-amber-500" : item.type === "teardown" ? "bg-orange-600" : "bg-[#208DCA]"
                            }`} />

                            {/* Card */}
                            <div className={`rounded-lg border px-3 py-2 ${
                                item.type === "setup"
                                    ? "border-amber-200 bg-amber-50"
                                    : item.type === "teardown"
                                    ? "border-orange-200 bg-orange-50"
                                    : "border-[#208DCA]/20 bg-[#208DCA]/5"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                                            item.type === "setup" ? "text-amber-600" : item.type === "teardown" ? "text-orange-600" : "text-[#208DCA]"
                                        }`}>
                                            {item.label}
                                        </span>
                                        <span className="text-xs text-slate-600 ml-2">
                                            {formatDay(item.date, "es")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                                        <Clock size={11} className="text-slate-400" />
                                        {item.inicio || "--:--"}
                                        <ChevronRight size={10} className="text-slate-300" />
                                        {item.fin || "--:--"}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default function Seccion2({ plan, section }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        descripcion_general: "",
        objetivo_evento: "",
        fecha_inicio: "",
        fecha_fin: "",
        montaje_inicio: "",
        montaje_fin: "",
        desmontaje_inicio: "",
        desmontaje_fin: "",
        horarios_montaje: {},
        horarios_evento: {},
        horarios_desmontaje: {},
        aforo_previsto: "",
        aforo_espacio: "",
        ...section.form_data,
    });

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    });

    const setupDays = useMemo(() => getDaysBetween(form.montaje_inicio, form.montaje_fin), [form.montaje_inicio, form.montaje_fin]);
    const eventDays = useMemo(() => getDaysBetween(form.fecha_inicio, form.fecha_fin), [form.fecha_inicio, form.fecha_fin]);
    const teardownDays = useMemo(() => getDaysBetween(form.desmontaje_inicio, form.desmontaje_fin), [form.desmontaje_inicio, form.desmontaje_fin]);

    const updateHorario = (type, dateKey, field, value) => {
        const horKey = type === "setup" ? "horarios_montaje" : type === "teardown" ? "horarios_desmontaje" : "horarios_evento";
        setForm((prev) => ({
            ...prev,
            [horKey]: {
                ...prev[horKey],
                [dateKey]: {
                    ...prev[horKey]?.[dateKey],
                    [field]: value,
                },
            },
        }));
    };

    // Derived fields for the AI prompt
    const formConDerivados = useMemo(() => {
        const buildSchedule = (days, horarios) => days
            .map((d) => {
                const k = formatDateKey(d);
                const h = horarios?.[k];
                return h?.inicio ? `${formatDay(d, "es")}: ${h.inicio} - ${h.fin || "?"}` : null;
            })
            .filter(Boolean)
            .join("\n");

        return {
            ...form,
            fecha_evento: form.fecha_inicio && form.fecha_fin
                ? `${form.fecha_inicio} al ${form.fecha_fin}`
                : form.fecha_inicio || "",
            montaje: form.montaje_inicio && form.montaje_fin
                ? `${form.montaje_inicio} al ${form.montaje_fin}`
                : form.montaje_inicio || "",
            desmontaje: form.desmontaje_inicio && form.desmontaje_fin
                ? `${form.desmontaje_inicio} al ${form.desmontaje_fin}`
                : form.desmontaje_inicio || "",
            horario_montaje_detallado: buildSchedule(setupDays, form.horarios_montaje),
            horario_evento_detallado: buildSchedule(eventDays, form.horarios_evento),
            horario_desmontaje_detallado: buildSchedule(teardownDays, form.horarios_desmontaje),
        };
    }, [form, setupDays, eventDays, teardownDays]);

    return (
        <SectionShell plan={plan} section={section} formData={formConDerivados} onFormChange={setForm}>
            {/* Descripción */}
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("s2.event_desc")}</label>
                <Textarea {...field("descripcion_general")} placeholder={t("s2.event_desc_ph")} rows={4} />
            </div>

            {/* Objetivo */}
            <div>
                <label className="text-sm font-medium mb-1.5 block">{t("forms.event_objective")}</label>
                <Textarea {...field("objetivo_evento")} placeholder={t("s2.event_obj_ph")} rows={3} />
            </div>

            {/* Aforo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.capacity")}</label>
                    <Input type="number" {...field("aforo_previsto")} placeholder={t("s2.capacity_ph")} min={1} />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">{t("s2.venue_capacity")}</label>
                    <Input type="number" {...field("aforo_espacio")} placeholder={t("s2.venue_capacity_ph")} min={1} />
                </div>
            </div>

            {/* ── Montaje ─────────────────────────────────────────── */}
            <div className="mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <Wrench size={15} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-800">{t("s2.setup")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.setup_date_start")}</label>
                        <Input type="date" {...field("montaje_inicio")} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.setup_date_end")}</label>
                        <Input type="date" {...field("montaje_fin")} />
                    </div>
                </div>

                <AnimatePresence>
                    {setupDays.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                        >
                            {setupDays.map((day, i) => (
                                <DayScheduleCard
                                    key={formatDateKey(day)}
                                    day={day}
                                    index={i}
                                    label={`${t("s2.day")} ${i + 1}`}
                                    icon={Wrench}
                                    colorClass="bg-amber-500"
                                    horarios={form.horarios_montaje}
                                    onUpdate={(dateKey, f, v) => updateHorario("setup", dateKey, f, v)}
                                    t={t}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Fechas del evento ───────────────────────────────── */}
            <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={15} className="text-[#208DCA]" />
                    <h3 className="text-sm font-semibold text-slate-800">{t("s2.event_dates")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.date_start")}</label>
                        <Input type="date" {...field("fecha_inicio")} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.date_end")}</label>
                        <Input type="date" {...field("fecha_fin")} />
                    </div>
                </div>

                <AnimatePresence>
                    {eventDays.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                        >
                            {eventDays.map((day, i) => (
                                <DayScheduleCard
                                    key={formatDateKey(day)}
                                    day={day}
                                    index={i}
                                    label={`${t("s2.day")} ${i + 1}`}
                                    icon={Calendar}
                                    colorClass="bg-[#208DCA]"
                                    horarios={form.horarios_evento}
                                    onUpdate={(dateKey, f, v) => updateHorario("event", dateKey, f, v)}
                                    t={t}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Desmontaje ─────────────────────────────────────── */}
            <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Wrench size={15} className="text-orange-600" />
                    <h3 className="text-sm font-semibold text-slate-800">{t("s2.teardown")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.teardown_date_start")}</label>
                        <Input type="date" {...field("desmontaje_inicio")} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">{t("s2.teardown_date_end")}</label>
                        <Input type="date" {...field("desmontaje_fin")} />
                    </div>
                </div>

                <AnimatePresence>
                    {teardownDays.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                        >
                            {teardownDays.map((day, i) => (
                                <DayScheduleCard
                                    key={formatDateKey(day)}
                                    day={day}
                                    index={i}
                                    label={`${t("s2.day")} ${i + 1}`}
                                    icon={Wrench}
                                    colorClass="bg-orange-600"
                                    horarios={form.horarios_desmontaje}
                                    onUpdate={(dateKey, f, v) => updateHorario("teardown", dateKey, f, v)}
                                    t={t}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Línea temporal ──────────────────────────────────── */}
            <Timeline
                setupDays={setupDays}
                eventDays={eventDays}
                teardownDays={teardownDays}
                setupHorarios={form.horarios_montaje}
                eventHorarios={form.horarios_evento}
                teardownHorarios={form.horarios_desmontaje}
                t={t}
            />
        </SectionShell>
    );
}
