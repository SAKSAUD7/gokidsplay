import { redirect } from 'next/navigation';

// Group bookings have been retired. Redirect to contact page.
export default function GroupsPage() {
    redirect('/contact');
}
