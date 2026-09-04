import { getFaq } from "@/app/actions/faqs";
import { FaqForm } from "../../components/FaqForm";
import { notFound } from "next/navigation";

export default async function EditFaqPage({ params }: { params: { id: string } }) {
    const faq = await getFaq(params.id);

    if (!faq) {
        notFound();
    }

    return <FaqForm initialData={faq} isEditing />;
}
