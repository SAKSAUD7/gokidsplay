import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
    icon?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    breadcrumbs,
    actions,
    icon,
}: PageHeaderProps) {
    return (
        <div className="bg-white border-b border-slate-200 -mx-8 -mt-8 px-8 py-6 mb-6">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={index}>
                                    {crumb.href ? (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-700 font-medium">
                                            {crumb.label}
                                        </span>
                                    )}
                                    {index < breadcrumbs.length - 1 && (
                                        <ChevronRight size={14} className="text-slate-400" />
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                    <div className="flex items-center gap-3">
                        {icon && <div className="text-blue-600">{icon}</div>}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-base text-slate-600 mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}
