export default function PartyBookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout intentionally does NOT include Navbar or Footer
    // Party booking page should be header-less for focused form experience
    return <>{children}</>;
}
