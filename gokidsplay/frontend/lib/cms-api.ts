// Client-side CMS API helper that uses the API route proxy
// This solves the httpOnly cookie authentication issue

export async function cmsGet(endpoint: string) {
    const response = await fetch(`/api/cms?endpoint=${encodeURIComponent(endpoint)}`, {
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch data');
    }

    return response.json();
}

export async function cmsPost(endpoint: string, data: any) {
    const response = await fetch('/api/cms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, data }),
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post data');
    }

    return response.json();
}

export async function cmsPut(endpoint: string, data: any) {
    const response = await fetch('/api/cms', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, data }),
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update data');
    }

    return response.json();
}

export async function cmsPatch(endpoint: string, data: any) {
    const response = await fetch('/api/cms', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint, data }),
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to patch data');
    }

    return response.json();
}

export async function cmsDelete(endpoint: string) {
    const response = await fetch(`/api/cms?endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete data');
    }

    return response.json();
}
