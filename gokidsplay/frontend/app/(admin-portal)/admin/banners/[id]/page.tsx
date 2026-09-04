import { getBanner } from "../../../../actions/banners";
import { BannerForm } from "../../components/BannerForm";
import { notFound } from "next/navigation";

export default async function EditBannerPage({ params }: { params: { id: string } }) {
    const banner = await getBanner(params.id);

    if (!banner) {
        notFound();
    }

    return <BannerForm initialData={banner} isEditing />;
}
