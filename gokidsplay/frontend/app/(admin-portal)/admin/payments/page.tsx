import { Metadata } from "next";
import PaymentsListPage from "./PaymentsListPage";

export const metadata: Metadata = {
    title: "Payments | Admin Portal",
    description: "Manage payments and refunds",
};

export default function PaymentsPage() {
    return <PaymentsListPage />;
}
