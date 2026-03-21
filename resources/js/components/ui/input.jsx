import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }) {
    return (
        <input
            type={type}
            className={cn(
                "flex h-9 w-full rounded-lg border border-white/10 bg-white/6 px-3 py-1 text-sm text-white shadow-sm transition-all placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}
