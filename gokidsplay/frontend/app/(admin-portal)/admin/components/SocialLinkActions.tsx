"use client";

import { deleteSocialLink, updateSocialLink } from "@/app/actions/social-links";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, Eye, EyeOff } from "lucide-react";

export function SocialLinkActions({ link }: { link: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleToggle() {
        setLoading(true);
        try {
            await updateSocialLink(link.id, { active: !link.active });
            toast.success(link.active ? "Link hidden" : "Link activated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update link");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm(`Delete ${link.platform} link?`)) return;

        setLoading(true);
        try {
            await deleteSocialLink(link.id);
            toast.success("Link deleted");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete link");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleToggle}
                disabled={loading}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title={link.active ? "Hide" : "Show"}
            >
                {link.active ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
