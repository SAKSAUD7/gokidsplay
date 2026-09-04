import Link from "next/link";
import Image from "next/image";

interface LogoProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
    const dimensions = sizeMap[size];

    return (
        <Link href="/admin" className={`inline-block ${className}`}>
            <Image
                src="/gokidsplay-logo.png"
                alt="Go Kids Play Coventry"
                width={dimensions.width}
                height={dimensions.height}
                className="object-contain"
                priority
            />
        </Link>
    );
}
