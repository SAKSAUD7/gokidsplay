import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "destructive" | "warning" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md border border-blue-600",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md border border-red-600",
    warning: "bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md border border-amber-600",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
};

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    children,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2 
                font-medium rounded-lg
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
            disabled={isDisabled}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : icon ? (
                <span className="shrink-0">{icon}</span>
            ) : null}
            {children}
        </button>
    );
}
