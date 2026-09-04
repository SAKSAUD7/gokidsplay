/**
 * Centralized API configuration for Go Kids Play Leicester
 * All backend API endpoints are defined here
 * 
 * IMPORTANT: This file now uses server-side authentication from lib/server-api.ts
 * to properly handle httpOnly cookies for admin operations.
 */

import { fetchAPI as serverFetchAPI, postAPI as serverPostAPI, putAPI as serverPutAPI, deleteAPI as serverDeleteAPI } from '@/app/lib/server-api';

import API_ENDPOINTS, { API_BASE_URL } from './api-endpoints';

export { API_ENDPOINTS };


/**
 * Helper function to fetch data from API
 * Uses server-side authentication with httpOnly cookies
 */
export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const response = await serverFetchAPI(endpoint, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

/**
 * Helper function to post data to API
 * Uses server-side authentication with httpOnly cookies
 */
export async function postAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverPostAPI(endpoint, data);

    if (result === null) {
        throw new Error('Authentication failed');
    }

    return result as T;
}

/**
 * Helper function to update data via API
 * Uses server-side authentication with httpOnly cookies
 */
export async function putAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverPutAPI(endpoint, data);

    if (result === null) {
        throw new Error('Authentication failed');
    }

    return result as T;
}

/**
 * Helper function to delete data via API
 * Uses server-side authentication with httpOnly cookies
 */
export async function deleteAPI(url: string, options?: RequestInit): Promise<void> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverDeleteAPI(endpoint);

    if (result === null || result === false) {
        throw new Error('Failed to delete resource');
    }
}

export default API_ENDPOINTS;
