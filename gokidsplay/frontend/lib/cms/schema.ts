import { SchemaMap } from "./types";

export const schemas: SchemaMap = {
    banner: {
        name: "Banner",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "image_url", label: "Image URL", type: "image", required: true },
            { name: "link", label: "Link URL", type: "url" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    activity: {
        name: "Activity",
        fields: [
            { name: "name", label: "Activity Name", type: "text", required: true },
            { name: "slug", label: "Slug (URL)", type: "text", helpText: "Leave empty to auto-generate" },
            { name: "short_description", label: "Short Summary", type: "textarea" },
            { name: "description", label: "Full Description", type: "rich_text", required: true },
            { name: "image_url", label: "Main Image", type: "image", required: true },
            { name: "gallery", label: "Image Gallery", type: "json_list" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    faq: {
        name: "FAQ",
        fields: [
            { name: "question", label: "Question", type: "text", required: true },
            { name: "answer", label: "Answer", type: "textarea", required: true },
            { name: "category", label: "Category", type: "text" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },

    social_link: {
        name: "Social Link",
        fields: [
            { name: "platform", label: "Platform Name", type: "text", required: true },
            { name: "url", label: "Profile URL", type: "url", required: true },
            { name: "icon", label: "Icon Name (Lucide)", type: "text" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    gallery_item: {
        name: "Gallery Item",
        fields: [
            { name: "title", label: "Title", type: "text" },
            { name: "image_url", label: "Image URL", type: "image", required: true },
            { name: "category", label: "Category", type: "text" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    stat_card: {
        name: "Stat Card",
        fields: [
            { name: "label", label: "Label", type: "text", required: true, helpText: "e.g., 'Happy Visitors'" },
            { name: "value", label: "Value", type: "text", required: true, helpText: "e.g., '5,000+'" },
            { name: "unit", label: "Unit", type: "text", required: true, helpText: "e.g., 'Happy Visitors'" },
            { name: "icon", label: "Icon Name", type: "text", required: true },
            { name: "color", label: "Color", type: "text", defaultValue: "primary" },
            { name: "page", label: "Page", type: "text", defaultValue: "home" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    instagram_reel: {
        name: "Instagram Reel",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "reel_url", label: "Reel URL", type: "url", required: true },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    menu_section: {
        name: "Menu Section",
        fields: [
            { name: "category", label: "Category Name", type: "text", required: true },
            { name: "items", label: "Menu Items", type: "json_list" },
            { name: "icon", label: "Icon Name", type: "text" },
            { name: "color", label: "Color", type: "text", defaultValue: "secondary" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    guideline_category: {
        name: "Guideline Category",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "icon", label: "Icon Name", type: "text", required: true },
            { name: "items", label: "Guidelines", type: "json_list" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    legal_document: {
        name: "Legal Document",
        fields: [
            {
                name: "document_type",
                label: "Type",
                type: "select",
                required: true,
                options: [
                    { label: "Terms & Conditions", value: "TERMS" },
                    { label: "Detailed Rules", value: "DETAILED_RULES" },
                    { label: "Participant Waiver", value: "WAIVER" },
                    { label: "Privacy Policy", value: "PRIVACY" },
                    { label: "Waiver Terms", value: "WAIVER_TERMS" },
                    { label: "Disclaimer", value: "DISCLAIMER" },
                    { label: "Cookies Policy", value: "COOKIES" },
                    { label: "Your Rights", value: "YOUR_RIGHTS" },
                    { label: "Security", value: "SECURITY" },
                ]
            },
            { name: "title", label: "Title", type: "text", required: true },
            { name: "intro", label: "Introduction Text", type: "textarea", helpText: "Optional intro paragraph shown above sections" },
            { name: "sections", label: "Sections (JSON)", type: "json_list", helpText: "List of {title, content} objects" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
        ],
    },
    page_section: {
        name: "Page Section",
        fields: [
            { name: "page", label: "Page ID", type: "text", required: true },
            { name: "section_key", label: "Section Key", type: "text", required: true },
            { name: "title", label: "Title", type: "text" },
            { name: "subtitle", label: "Subtitle", type: "textarea" },
            { name: "content", label: "Content", type: "textarea" },
            { name: "image_url", label: "Image URL", type: "image" },
            { name: "video_url", label: "Video URL", type: "url" },
            { name: "cta_text", label: "CTA Text", type: "text" },
            { name: "cta_link", label: "CTA Link", type: "text" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    pricing_plan: {
        name: "Pricing Plan",
        fields: [
            { name: "name", label: "Plan Name", type: "text", required: true },
            {
                name: "type",
                label: "Type",
                type: "select",
                required: true,
                options: [
                    { label: "Session", value: "SESSION" },
                    { label: "Party", value: "PARTY" }
                ]
            },
            { name: "age_group", label: "Age Group", type: "text" },
            { name: "price", label: "Price", type: "number", required: true },
            { name: "duration", label: "Duration (mins)", type: "number", required: true },
            { name: "period_text", label: "Period Text", type: "text", defaultValue: "/ 60 Mins" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "features", label: "Features", type: "json_list" },
            { name: "popular", label: "Popular", type: "boolean", defaultValue: false },
            { name: "variant", label: "Variant", type: "text", defaultValue: "primary" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    contact_info: {
        name: "Contact Info",
        fields: [
            { name: "key", label: "Unique Key", type: "text", required: true },
            { name: "label", label: "Label", type: "text", required: true },
            { name: "value", label: "Value", type: "text", required: true },
            {
                name: "category",
                label: "Category",
                type: "select",
                required: true,
                options: [
                    { label: "Phone", value: "PHONE" },
                    { label: "Email", value: "EMAIL" },
                    { label: "Address", value: "ADDRESS" },
                    { label: "Hours", value: "HOURS" },
                    { label: "Social", value: "SOCIAL" },
                    { label: "Other", value: "OTHER" },
                ]
            },
            { name: "icon", label: "Icon Name", type: "text" },
            { name: "link", label: "Link URL", type: "text" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    party_package: {
        name: "Party Package",
        fields: [
            { name: "name", label: "Package Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "price", label: "Price", type: "number", required: true },
            { name: "min_participants", label: "Min Participants", type: "number", required: true },
            { name: "max_participants", label: "Max Participants", type: "number" },
            { name: "duration", label: "Duration (mins)", type: "number", required: true },
            { name: "includes", label: "Includes", type: "json_list" },
            { name: "addons", label: "Add-ons", type: "json_list" },
            { name: "image_url", label: "Image URL", type: "image" },
            { name: "popular", label: "Popular", type: "boolean", defaultValue: false },
            { name: "variant", label: "Variant", type: "text", defaultValue: "accent" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    timeline_item: {
        name: "Timeline Item",
        fields: [
            { name: "year", label: "Year", type: "text", required: true },
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    value_item: {
        name: "Value Item",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "icon", label: "Icon Name", type: "text", required: true },
            { name: "color", label: "Color", type: "text", defaultValue: "primary" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    facility_item: {
        name: "Facility Item",
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
            { name: "icon", label: "Icon Name", type: "text", required: true },
            { name: "image_url", label: "Image URL", type: "image" },
            { name: "items", label: "Features", type: "json_list" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
    page: {
        name: "Page",
        fields: [
            { name: "slug", label: "Slug", type: "text", required: true },
            { name: "title", label: "SEO Title", type: "text", required: true },
            { name: "description", label: "SEO Description", type: "textarea" },
            { name: "keywords", label: "SEO Keywords", type: "textarea" },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
        ],
    },

    contact_message: {
        name: "Contact Message",
        fields: [
            { name: "name", label: "Name", type: "text", required: true, readOnly: true },
            { name: "email", label: "Email", type: "text", required: true, readOnly: true },
            { name: "phone", label: "Phone", type: "text", readOnly: true },
            { name: "message", label: "Message", type: "textarea", required: true, readOnly: true },
            { name: "created_at", label: "Submitted On", type: "text", readOnly: true },
            { name: "is_read", label: "Read Status", type: "boolean", defaultValue: false },
        ],
    },
    timing_card: {
        name: "Timing Card",
        fields: [
            { name: "day_label", label: "Day / Period", type: "text", required: true, helpText: "e.g. 'Monday – Friday' or 'Weekends'" },
            { name: "open_time", label: "Opening Time", type: "text", required: true, helpText: "e.g. '10:00 AM'" },
            { name: "close_time", label: "Closing Time", type: "text", required: true, helpText: "e.g. '9:00 PM'" },
            { name: "note", label: "Note (optional)", type: "text", helpText: "e.g. 'Last entry 8:30 PM'" },
            { name: "icon", label: "Icon Name (Lucide)", type: "text", defaultValue: "Clock" },
            {
                name: "color",
                label: "Color",
                type: "select",
                defaultValue: "primary",
                options: [
                    { label: "Primary", value: "primary" },
                    { label: "Secondary", value: "secondary" },
                    { label: "Accent", value: "accent" },
                ],
            },
            { name: "active", label: "Active", type: "boolean", defaultValue: true },
            { name: "order", label: "Order", type: "number", defaultValue: 0 },
        ],
    },
};
