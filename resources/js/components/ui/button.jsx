import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#208DCA]/50 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-white/10 text-white border border-white/10 shadow hover:bg-white/15 hover:border-white/20",
                destructive: "bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30",
                outline: "border border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white hover:border-white/25",
                secondary: "bg-white/8 text-white/80 border border-white/8 hover:bg-white/12",
                ghost: "text-white/50 hover:bg-white/8 hover:text-white",
                link: "text-[#208DCA] underline-offset-4 hover:underline",
                secon: "bg-[#253C87] text-white shadow-lg shadow-[#253C87]/25 hover:bg-[#253C87]/90 hover:shadow-[#253C87]/40",
                "secon-gradient": "bg-gradient-to-r from-[#253C87] to-[#208DCA] text-white border-0 shadow-lg shadow-[#253C87]/25 hover:shadow-[#253C87]/40 hover:opacity-90",
                "secon-outline": "border border-[#253C87]/50 text-[#208DCA] bg-transparent hover:bg-[#253C87]/10 hover:border-[#253C87]",
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
