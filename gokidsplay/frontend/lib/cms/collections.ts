import type { ModelSchema } from "./types";

/**
 * Collections managed by the generic admin screens at /admin/cms/collections/[key].
 * Each entry maps a key to a Django REST endpoint, the form schema, and the public
 * page to refresh after a change. Only keys listed here can be edited — the server
 * actions never accept an arbitrary endpoint.
 */
export interface ManagedCollection {
    key: string;
    label: string;
    description: string;
    endpoint: string;      // e.g. "/cms/faqs/" (relative to NEXT_PUBLIC_API_URL)
    publicPath: string;    // public page to revalidate after a change
    titleField: string;
    subtitleField?: string;
    imageField?: string;
    schema: ModelSchema;
}

export const MANAGED_COLLECTIONS: ManagedCollection[] = [
];

MANAGED_COLLECTIONS.push({
    key: "testimonials",
    label: "Customer Reviews",
    description: "Genuine customer reviews shown on the Testimonies page. Only add real reviews.",
    endpoint: "/cms/testimonials/",
    publicPath: "/testimonies",
    titleField: "name",
    subtitleField: "platform",
    imageField: "image_url",
    schema: {
        name: "Review",
        fields: [
            { name: "name", label: "Reviewer name", type: "text", required: true, helpText: "As shown on the original review" },
            { name: "content", label: "Review text", type: "textarea", required: true },
            { name: "rating", label: "Star rating (1–5)", type: "number", defaultValue: 5, min: 1, max: 5 },
            {
                name: "platform",
                label: "Platform",
                type: "select",
                defaultValue: "Google",
                options: [
                    { label: "Google", value: "Google" },
                    { label: "Facebook", value: "Facebook" },
                    { label: "Tripadvisor", value: "Tripadvisor" },
                    { label: "Other", value: "Other" },
                ],
            },
            { name: "review_date", label: "Review date", type: "text", helpText: "Shown as written, e.g. August 2026" },
            { name: "image_url", label: "Reviewer photo (optional)", type: "image" },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
            { name: "active", label: "Show on website", type: "boolean", defaultValue: true },
        ],
    },
});

export function getManagedCollection(key: string): ManagedCollection | undefined {
    return MANAGED_COLLECTIONS.find((c) => c.key === key);
}
