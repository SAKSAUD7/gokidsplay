import { redirect } from "next/navigation";

// This page is consolidated into /terms which has a full Waiver tab
export default function WaiverTermsPage() {
    redirect("/terms");
}
