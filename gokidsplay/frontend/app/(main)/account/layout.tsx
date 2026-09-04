import { AccountProvider } from "@/state/account/AccountContext";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return (
        <AccountProvider>
            {children}
        </AccountProvider>
    );
}
