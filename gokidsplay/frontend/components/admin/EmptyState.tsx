import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {icon && (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
            {description && (
                <p className="text-sm text-slate-600 text-center max-w-md mb-6">
                    {description}
                </p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
