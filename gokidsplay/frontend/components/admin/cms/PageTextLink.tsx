import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { getPageDef } from "@/lib/cms/page-registry";

/**
 * Points an older page screen at the unified Pages editor, which now owns all of
 * the page's text, images, videos and buttons (lib/cms/page-registry.ts).
 */
export function PageTextLink({ pageKey }: { pageKey: string }) {
    const page = getPageDef(pageKey);
    if (!page) return null;
    return (
        <Link
            href={`/admin/cms/pages/${page.key}`}
            className="flex items-center justify-between gap-4 p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
        >
            <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold text-blue-900">Edit the {page.label} page text, images & buttons</p>
                    <p className="text-sm text-blue-800/80">
                        {page.sections.map((s) => s.label).join(" · ")}
                    </p>
                </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-700 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
    );
}
