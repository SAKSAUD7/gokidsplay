import type { Metadata } from 'next';
import { getMetadata } from '@/seo/seo.config';
import { getProducts } from '@/app/actions/shop';
import ShopContent from './components/ShopContent';
import { getPublicPageContent } from '@/lib/public-api';

export const metadata: Metadata = getMetadata(
    'Shop | Gift Cards & Merchandise',
    'Shop online at Go Kids Play — buy gift cards, branded merchandise, party extras, and more. The perfect present for kids who love adventure!'
);

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
    const [productsRaw, content] = await Promise.all([getProducts(), getPublicPageContent('shop')]);
    const products = productsRaw
        .filter((p: any) => p.active !== false)
        .sort((a: any, b: any) => (a.category || '').localeCompare(b.category || ''));

    return <ShopContent products={products} content={content} />;
}
