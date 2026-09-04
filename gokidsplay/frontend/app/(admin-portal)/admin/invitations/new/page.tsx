import InvitationTemplateForm from "../../components/InvitationTemplateForm";

export default function NewInvitationTemplatePage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Create New Template</h1>
            <InvitationTemplateForm />
        </div>
    );
}
