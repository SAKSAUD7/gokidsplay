import React from "react";
import { AlertTriangle, AlertCircle, Info, XCircle } from "lucide-react";

type Severity = "info" | "warning" | "danger" | "success";

interface WarningBannerProps {
    severity?: Severity;
    children: React.ReactNode;
    className?: string;
}

const severityConfig = {
    info: {
        icon: Info,
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        iconColor: "text-blue-600",
        textColor: "text-blue-900",
    },
    warning: {
        icon: AlertCircle,
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        iconColor: "text-amber-600",
        textColor: "text-amber-900",
    },
    danger: {
        icon: AlertTriangle,
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        iconColor: "text-red-600",
        textColor: "text-red-900",
    },
    success: {
        icon: XCircle,
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        iconColor: "text-emerald-600",
        textColor: "text-emerald-900",
    },
};

export function WarningBanner({
    severity = "warning",
    children,
    className = "",
}: WarningBannerProps) {
    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
        <div
            className={`
                ${config.bgColor} 
                border-2 ${config.borderColor} 
                rounded-xl p-5 
                flex items-start gap-4
                shadow-sm
                ${className}
            `}
        >
            <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
            <div className={`flex-1 ${config.textColor}`}>{children}</div>
        </div>
    );
}

WarningBanner.Title = function WarningBannerTitle({
    children,
}: {
    children: React.ReactNode;
}) {
    return <p className="font-bold text-base mb-1">{children}</p>;
};

WarningBanner.Description = function WarningBannerDescription({
    children,
}: {
    children: React.ReactNode;
}) {
    return <p className="text-sm leading-relaxed">{children}</p>;
};
