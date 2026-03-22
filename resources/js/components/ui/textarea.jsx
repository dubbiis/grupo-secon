import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 focus-visible:border-[#208DCA]/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                className
            )}
            {...props}
        />
    );
}
