// The (main) layout already wraps every page in AccountProvider; a second provider
// here would keep its own copy of the signed-in customer, out of sync with the navbar.
export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
