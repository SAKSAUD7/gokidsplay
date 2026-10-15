'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Gift, Tag, Package, Star, ArrowRight, Phone } from 'lucide-react';
import Link from 'next/link';
import { getMediaUrl } from "@/lib/media-utils";

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
    'Gift Card': {
        icon: <Gift className="w-5 h-5" />,
        color: 'text-brand-pink',
        gradient: 'from-brand-pink/20 to-rose-800/10 border-brand-pink/40'
    },
    'Merchandise': {
        icon: <Tag className="w-5 h-5" />,
        color: 'text-brand-cyan',
        gradient: 'from-brand-cyan/20 to-blue-800/10 border-brand-cyan/40'
    },
    'Party Extras': {
        icon: <Star className="w-5 h-5" />,
        color: 'text-brand-lime',
        gradient: 'from-brand-lime/20 to-yellow-800/10 border-brand-lime/40'
    },
};

const fallbackConfig = {
    icon: <Package className="w-5 h-5" />,
    color: 'text-white/60',
    gradient: 'from-white/5 to-white/0 border-white/10'
};

function getCategoryConfig(category: string) {
    return categoryConfig[category] || fallbackConfig;
}

// Group products by category
function groupByCategory(products: any[]) {
    return products.reduce((acc: Record<string, any[]>, product) => {
        const cat = product.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(product);
        return acc;
    }, {});
}

interface ShopContentProps {
    /** Resolved "shop" page content — see lib/cms/page-registry.ts */
    content: Record<string, Record<string, string> | null>;
    products: any[];
}

export default function ShopContent({ products, content }: ShopContentProps) {
    const { hero, buy, banner } = content;
    const phone = buy?.phone || "07349 110 865";
    const tel = `tel:${phone.replace(/\s/g, "")}`;
    const grouped = groupByCategory(products);
    const categories = Object.keys(grouped);

    return (
        <main className="min-h-screen bg-brand-dark pt-24 pb-20">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-brand-pink/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-brand-lime/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 pt-8"
                >
                    <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-brand-pink/20 text-brand-pink font-bold text-sm mb-6 tracking-wider uppercase border border-brand-pink/30">
                        <ShoppingCart className="w-4 h-4" /> {hero?.badge ?? "Go Kids Play Shop"}
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-6 uppercase leading-tight">
                        {hero?.title ?? "Gift Cards &"} <span className="text-brand-lime">{hero?.title_highlight ?? "Merchandise"}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                        {hero?.subtitle ?? "Give the gift of adventure! Browse our gift cards, branded merchandise, and party extras."}
                    </p>
                </motion.div>

                {/* Products by Category */}
                {categories.length === 0 ? (
                    <div className="text-center py-20 text-white/60">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-xl">{hero?.empty_text ?? "Shop items coming soon! Check back shortly."}</p>
                    </div>
                ) : (
                    categories.map((category, catIdx) => {
                        const config = getCategoryConfig(category);
                        const items = grouped[category];

                        return (
                            <section key={category} className="mb-16">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: catIdx * 0.1 }}
                                    className="flex items-center gap-3 mb-8"
                                >
                                    <div className={`p-2 rounded-full bg-white/10 ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <h2 className={`text-2xl md:text-3xl font-bold ${config.color}`}>{category}</h2>
                                    <div className="flex-1 h-px bg-white/10 ml-4" />
                                </motion.div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {items.map((product: any, idx: number) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.08 }}
                                            whileHover={{ y: -6, scale: 1.02 }}
                                            className={`bg-gradient-to-br ${config.gradient} border rounded-2xl p-6 flex flex-col backdrop-blur-sm cursor-pointer group transition-shadow hover:shadow-lg hover:shadow-brand-pink/10`}
                                        >
                                            {product.image_url && (
                                                <div className="relative -mx-6 -mt-6 mb-5 aspect-[4/3] overflow-hidden rounded-t-2xl bg-black/20">
                                                    <img
                                                        src={getMediaUrl(product.image_url)}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {/* Category badge */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${config.color} bg-white/10 px-3 py-1 rounded-full`}>
                                                    {product.category}
                                                </span>
                                                {product.stock <= 10 && product.stock > 0 && (
                                                    <span className="text-xs text-orange-400 font-bold">Only {product.stock} left!</span>
                                                )}
                                                {product.stock === 0 && (
                                                    <span className="text-xs text-red-400 font-bold">Out of Stock</span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-brand-lime transition-colors">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-white/60 mb-6 flex-1 leading-relaxed">
                                                {product.description}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-3xl font-black text-white">
                                                    £{Number(product.price).toFixed(2)}
                                                </span>
                                                <a
                                                    href={tel}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                                                        product.stock === 0
                                                            ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                                            : 'bg-brand-lime text-black hover:bg-white'
                                                    }`}
                                                    onClick={(e) => product.stock === 0 && e.preventDefault()}
                                                >
                                                    {product.stock === 0 ? 'Sold Out' : <>{buy?.button_text ?? "Buy"} <ArrowRight className="w-4 h-4" /></>}
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        );
                    })
                )}

                {/* Call us banner */}
                {banner && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8 bg-gradient-to-r from-brand-pink/20 via-brand-cyan/10 to-brand-lime/10 border border-white/10 rounded-3xl p-8 text-center"
                >
                    <h3 className="text-2xl font-bold text-white mb-2">{banner.title}</h3>
                    <p className="text-white/60 mb-6">
                        {banner.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <a
                            href={tel}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-lime text-black font-bold rounded-full hover:bg-white transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                            {phone}
                        </a>
                        <Link
                            href={banner.button_link || "/contact"}
                            className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-colors"
                        >
                            {banner.button_text} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
                )}
            </div>
        </main>
    );
}
