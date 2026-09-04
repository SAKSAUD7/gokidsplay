import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CMSBackLinkProps {
    href?: string;
    label?: string;
}

export function CMSBackLink({ href = "/admin/cms", label = "Back to Dashboard" }: CMSBackLinkProps) {
    return (
        <div className="mb-6">
            <Link
                href={href}
                className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {label}
            </Link>
        </div>
    );
}
