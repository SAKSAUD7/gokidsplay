export type FieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'image'
    | 'url'
    | 'select'
    | 'json_list'
    | 'rich_text';

export interface FieldSchema {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    options?: { label: string; value: string }[]; // For select
    defaultValue?: any;
    min?: number;
    max?: number;
    readOnly?: boolean;
}

export interface ModelSchema {
    name: string; // Display name
    fields: FieldSchema[];
}

export type SchemaMap = Record<string, ModelSchema>;

// Model Interfaces
export interface PageSection {
    id: string;
    page: string;
    section_key: string;
    title?: string;
    subtitle?: string;
    content?: string;
    image_url?: string;
    video_url?: string;
    cta_text?: string;
    cta_link?: string;
    active: boolean;
    order: number;
}

export interface GalleryItem {
    id: string;
    title?: string;
    image_url: string;
    category?: string;
    active: boolean;
    order: number;
}

export interface InstagramReel {
    id: string;
    title?: string;
    reel_url: string;
    thumbnail_url: string;
    caption?: string; // Added to match usage in ReelsManager
    url?: string; // Added to match usage in ReelsManager (as alias for reel_url if needed, or fix component)
    active: boolean;
    order: number;
}

export interface Activity {
    id: string;
    name: string;
    description: string;
    image_url: string;
    active: boolean;
    order: number;
}
