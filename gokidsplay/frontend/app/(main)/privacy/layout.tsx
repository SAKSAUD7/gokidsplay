import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Privacy Policy | Information",
    "Go Kids Play is Leicester's go-to destination for fun and entertainment, offering rollerskating, bowling, party bookings and more.",
    true
);

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
