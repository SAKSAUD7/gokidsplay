import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Privacy Policy | Information",
    "Go Kids Play is Coventry's indoor play centre — soft play, laser arena, go karts, inflatable park and birthday parties.",
    true
);

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
