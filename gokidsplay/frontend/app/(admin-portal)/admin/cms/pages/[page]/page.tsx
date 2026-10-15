import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/app/lib/admin-auth";
import { getPageSections } from "@/app/actions/page-sections";
import { CMSBackLink } from "@/components/admin/cms/CMSBackLink";
import { getPageDef } from "@/lib/cms/page-registry";
import PageContentEditor from "./PageContentEditor";

export const dynamic = "force-dynamic";

export default async function PageContentPage({ params }: { params: { page: string } }) {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const page = getPageDef(params.page);
    if (!page) notFound();

    const rows = await getPageSections(page.key);

    return (
        <div className="p-4 md:p-8 max-w-5xl">
            <CMSBackLink href="/admin/cms" label="Back to CMS Dashboard" />

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">{page.label} page</h1>
                <p className="text-slate-500 mt-1">{page.description}</p>
                <p className="text-sm text-slate-400 mt-1">
                    Live at <span className="font-mono">{page.path}</span>
                </p>
            </div>

            <PageContentEditor pageKey={page.key} rows={rows} />
        </div>
    );
}
