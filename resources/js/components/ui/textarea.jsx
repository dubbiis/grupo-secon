import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-sm text-white shadow-sm transition-all placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                className
            )}
            {...props}
        />
    );
}
