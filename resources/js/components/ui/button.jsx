import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-slate-200 text-slate-900 border border-slate-200 shadow hover:bg-slate-200 hover:border-slate-200",
                destructive: "bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30",
                outline: "border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-200 hover:text-slate-900 hover:border-white/25",
                secondary: "bg-slate-200 text-slate-900 border border-slate-200 hover:bg-white/12",
                ghost: "text-slate-900 hover:bg-slate-200 hover:text-slate-900",
                link: "text-[#208DCA] underline-offset-4 hover:underline",
                secon: "bg-[#273887] text-slate-900 shadow-lg shadow-[#273887]/25 hover:bg-[#273887]/90 hover:shadow-[#273887]/40",
                "secon-gradient": "bg-gradient-to-r from-[#273887] to-[#208DCA] text-white border-0 shadow-lg shadow-[#273887]/25 hover:shadow-[#273887]/40 hover:opacity-90",
                "secon-outline": "border border-[#273887]/50 text-[#208DCA] bg-transparent hover:bg-[#273887]/10 hover:border-[#273887]",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-lg px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export function Button({ className, variant, size, ...props }) {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { buttonVariants };
