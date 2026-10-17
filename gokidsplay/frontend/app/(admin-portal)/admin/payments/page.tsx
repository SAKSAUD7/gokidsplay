import { Metadata } from "next";
import PaymentsListPage from "./PaymentsListPage";

export const metadata: Metadata = {
    title: "Payments | Admin Portal",
    description: "Manage payments and refunds",
};

// ?search=GK482913 opens the list filtered to that booking's payments
export default function PaymentsPage({ searchParams }: { searchParams?: { search?: string } }) {
    return <PaymentsListPage initialSearch={searchParams?.search || ""} />;
}
