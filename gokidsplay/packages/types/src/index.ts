export interface Attraction {
    id: string;
    title: string;
    description: string;
    image: string;
    video?: string;
    category: 'thrill' | 'kids' | 'family' | 'obstacle';
    minHeight?: number;
    minAge?: number;
    intensity: 'low' | 'medium' | 'high';
}

export interface PricingTier {
    id: string;
    title: string;
    price: number;
    duration: number; // in minutes
    features: string[];
    isPopular?: boolean;
    type: 'weekday' | 'weekend' | 'special';
}

export interface Booking {
    id: string;
    customerName: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    guests: {
        adults: number;
        kids: number;
        spectators: number;
    };
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    addOns?: string[];
}

export interface PartyPackage {
    id: string;
    title: string;
    pricePerHead: number;
    minGuests: number;
    duration: number;
    includes: string[];
    theme: 'ninja' | 'princess' | 'superhero' | 'dino';
}

export type ThemeMode = 'light' | 'dark';

// Booking validation exports
export * from './booking';
