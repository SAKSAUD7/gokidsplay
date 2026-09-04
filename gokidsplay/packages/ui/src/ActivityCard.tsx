"use client";

import { motion } from "framer-motion";
import { Clock, Users, Zap } from "lucide-react";

interface ActivityCardProps {
    title: string;
    description: string;
    image: string;
    category: string;
    duration?: string;
    difficulty?: string;
    minAge?: number;
    index?: number;
}

export const ActivityCard = ({
    title,
    description,
    image,
    category,
    duration = "Unlimited",
    difficulty = "All Levels",
    minAge = 1,
    index = 0
}: ActivityCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -15, scale: 1.02 }}
            className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
        >
            {/* Image Container */}
            <div className="relative h-80 overflow-hidden">
                {/* Category Badge */}
                <div className="absolute top-6 left-6 z-20">
                    <span className="inline-block bg-accent text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                        {category}
                    </span>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Image */}
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                />

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <h3 className="text-3xl font-display font-black text-white mb-2 drop-shadow-lg transform group-hover:translate-x-2 transition-transform duration-300">
                        {title}
                    </h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-8">
                <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-gray-700">{duration}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-bold text-gray-700">{minAge}+ yrs</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                        <div className="bg-yellow-50 p-2 rounded-lg">
                            <Zap className="w-4 h-4 text-accent-dark" />
                        </div>
                        <span className="font-bold text-gray-700">{difficulty}</span>
                    </div>
                </div>

                {/* Hover CTA */}
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    whileHover={{ opacity: 1, height: "auto" }}
                    className="mt-6 overflow-hidden"
                >
                    <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                        Learn More
                    </button>
                </motion.div>
            </div>

            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
};
