import { getMetadata } from "@/seo/seo.config";

export const metadata = getMetadata(
    "Terms, Waiver & Rights | Information",
    "Go Kids Play is Leicester's go-to destination for fun and entertainment, offering rollerskating, bowling, party bookings and more.",
    true
);

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
