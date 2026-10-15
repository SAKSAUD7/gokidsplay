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
    endpoint: string;      // e.g. "/shop/products/" (relative to NEXT_PUBLIC_API_URL)
    publicPath: string;    // public page to revalidate after a change
    titleField: string;
    subtitleField?: string;
    imageField?: string;
    schema: ModelSchema;
}

export const MANAGED_COLLECTIONS: ManagedCollection[] = [
    {
        key: "products",
        label: "Shop Products",
        description: "Gift cards, merchandise and party extras shown on the Shop page",
        endpoint: "/shop/products/",
        publicPath: "/shop",
        titleField: "name",
        subtitleField: "category",
        imageField: "image_url",
        schema: {
            name: "Product",
            fields: [
                { name: "name", label: "Product name", type: "text", required: true },
                { name: "description", label: "Description", type: "textarea", required: true },
                { name: "price", label: "Price (£)", type: "number", required: true, min: 0 },
                {
                    name: "category",
                    label: "Category",
                    type: "text",
                    helpText: "Products are grouped by category on the Shop page (e.g. Gift Cards, Merchandise, Party Extras)",
                },
                { name: "image_url", label: "Product photo", type: "image" },
                { name: "stock", label: "Stock", type: "number", defaultValue: 0, min: 0, helpText: "0 shows the product as Sold Out" },
                { name: "active", label: "Show on website", type: "boolean", defaultValue: true },
            ],
        },
    },
    {
        key: "memberships",
        label: "Membership Plans",
        description: "Plans shown on the Memberships page",
        endpoint: "/shop/membership-plans/",
        publicPath: "/memberships",
        titleField: "name",
        subtitleField: "price",
        imageField: "image_url",
        schema: {
            name: "Membership Plan",
            fields: [
                { name: "name", label: "Plan name", type: "text", required: true },
                { name: "price", label: "Price (£)", type: "number", required: true, min: 0 },
                {
                    name: "duration_days",
                    label: "Duration (days)",
                    type: "number",
                    defaultValue: 30,
                    min: 1,
                    helpText: "30 shows the price as /mo, 365 as /yr",
                },
                {
                    name: "description",
                    label: "Benefits",
                    type: "textarea",
                    required: true,
                    helpText: "One benefit per line — each line becomes a bullet on the plan card",
                },
                { name: "image_url", label: "Plan image (optional)", type: "image" },
                { name: "active", label: "Show on website", type: "boolean", defaultValue: true },
            ],
        },
    },
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
