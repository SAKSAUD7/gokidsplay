"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface AttractionCardProps {
    title: string;
    description: string;
    image: string;
    tags?: string[];
}

export const AttractionCard = ({ title, description, image, tags }: AttractionCardProps) => {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="group relative bg-white rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100"
        >
            <div className="relative h-72 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {tags?.map(tag => (
                        <span key={tag} className="text-xs font-bold bg-white/90 backdrop-blur text-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                    <h3 className="text-2xl font-display font-bold text-white mb-2 drop-shadow-md group-hover:text-accent transition-colors">{title}</h3>
                </div>
            </div>
            <div className="p-6 pt-4">
                <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {description}
                </p>
                <button className="flex items-center text-primary font-bold uppercase tracking-wide text-sm group-hover:text-primary-dark transition-colors">
                    Learn More <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};
