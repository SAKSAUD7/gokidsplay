'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI } from '@/app/lib/server-api';

const ENDPOINT = '/cms/attraction-video/';

export async function getAttractionVideo() {
    try {
        const res = await fetchAPI(ENDPOINT, { next: { revalidate: 60 } });
        // The API returns 200 with null if no video, or 200 with object
        // If res is not ok, standard error handling
        if (!res || !res.ok) return null;

        // Handle empty response body if API returns 204 or empty
        const text = await res.text();
        if (!text) return null;

        return JSON.parse(text);
    } catch (error) {
        console.error('Failed to fetch attraction video:', error);
        return null;
    }
}

export async function updateAttractionVideo(data: any) {
    try {
        // We use POST for update/create as defined in backend view
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/attractions');
        revalidatePath('/admin/cms/attractions');
        return { success: true, item: result };
    } catch (error) {
        console.error('Failed to update attraction video:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update attraction video'
        };
    }
}
