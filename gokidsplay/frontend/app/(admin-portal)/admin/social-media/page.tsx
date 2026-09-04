import { getSocialLinks } from "@/app/actions/social-links";
import { getAdminSession } from "../../../lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Facebook, Instagram, Twitter, Youtube, Globe } from "lucide-react";
import { SocialLinkActions } from "../components/SocialLinkActions";

export default async function SocialMediaPage() {
    const session = await getAdminSession();
    if (!session) redirect("/admin/login");

    const links = await getSocialLinks();

    function getPlatformIcon(platform: string) {
        switch (platform.toUpperCase()) {
            case "FACEBOOK": return <Facebook size={20} />;
            case "INSTAGRAM": return <Instagram size={20} />;
            case "TWITTER": return <Twitter size={20} />;
            case "YOUTUBE": return <Youtube size={20} />;
            default: return <Globe size={20} />;
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Social Media Links</h1>
                    <p className="text-slate-500 mt-1">Manage social media profiles displayed on the website</p>
                </div>
                <Link
                    href="/admin/social-media/new"
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Plus size={20} />
                    Add Link
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(links as any[]).map((link: any) => (
                    <div key={link.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                    {getPlatformIcon(link.platform)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{link.platform}</h3>
                                    {link.active ? (
                                        <span className="text-xs text-green-600 font-medium">Active</span>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium">Inactive</span>
                                    )}
                                </div>
                            </div>
                            <SocialLinkActions link={link} />
                        </div>
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all"
                        >
                            {link.url}
                        </a>
                        <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500">Display Order: {link.order}</p>
                        </div>
                    </div>
                ))}
                {links.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No social media links configured. Add your first link to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
