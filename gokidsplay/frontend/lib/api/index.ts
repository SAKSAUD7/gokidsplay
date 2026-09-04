import { Stat, GalleryItem } from "./types";
import { unstable_noStore as noStore } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';

async function fetchFromAPI(endpoint: string) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return [];
    }
}

export const getStats = async (): Promise<Stat[]> => {
    noStore();

    const [customers, activities] = await Promise.all([
        fetchFromAPI('/bookings/customers/'),
        fetchFromAPI('/cms/activities/')
    ]);

    const customerCount = customers.length || 0;
    const activityCount = activities.filter((a: any) => a.active).length || 0;

    return [
        {
            id: "size",
            value: "20,000+",
            label: "Sq Ft of Fun",
            icon: "Zap",
        },
        {
            id: "visitors",
            value: `${(customerCount + 5000).toLocaleString()}+`,
            label: "Happy Visitors",
            icon: "Users",
        },
        {
            id: "attractions",
            value: `${activityCount}+`,
            label: "Attractions",
            icon: "Trophy",
        },
        {
            id: "safety",
            value: "100%",
            label: "Safe & Secure",
            icon: "Shield",
        },
    ];
};

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
    noStore();

    const items = await fetchFromAPI('/cms/gallery/');

    return items
        .filter((item: any) => item.active)
        .slice(0, 8)
        .map((item: any) => ({
            id: item.id,
            src: item.image_url,
            title: item.title || '',
            desc: item.category || ''
        }));
};
