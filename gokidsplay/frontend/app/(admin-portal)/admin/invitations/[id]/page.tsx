"use client";

import InvitationTemplateForm from "../../components/InvitationTemplateForm";
import { useParams } from "next/navigation";

export default function EditInvitationTemplatePage() {
    const params = useParams();
    const id = parseInt(params.id as string);

    if (isNaN(id)) return <div>Invalid ID</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Edit Template</h1>
            <InvitationTemplateForm initialId={id} />
        </div>
    );
}
