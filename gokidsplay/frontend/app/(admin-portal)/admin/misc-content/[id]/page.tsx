import { getGalleryItem } from "@/app/actions/gallery";
import { GalleryItemForm } from "../../components/GalleryItemForm";
import { notFound } from "next/navigation";

interface EditGalleryItemPageProps {
    params: {
        id: string;
    };
}

export default async function EditGalleryItemPage({ params }: EditGalleryItemPageProps) {
    const item = await getGalleryItem(params.id);

    if (!item) {
        notFound();
    }

    return <GalleryItemForm initialData={item} isEditing />;
}
