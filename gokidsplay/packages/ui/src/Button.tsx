import * as React from "react";

export const Button = ({
    children,
    className = "",
    variant = "primary",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" }) => {
    const baseStyles = "font-bold py-3 px-8 rounded-full transition-all shadow-md hover:shadow-lg transform hover:scale-105";

    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white",
        secondary: "bg-accent hover:bg-accent-dark text-black",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
