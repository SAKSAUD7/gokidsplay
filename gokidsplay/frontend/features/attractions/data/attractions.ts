import { Attraction } from "@repo/types";

// Go Kids Play Coventry — Soft Play, Laser Arena, Go Kart, Inflatable Park
export const attractions: Attraction[] = [
    {
        id: "soft-play",
        title: "Soft Play",
        description: "Our three tier soft play frame is designed to give your children a safe and fun environment to play and explore. With a dedicated toddler play area for under 5's, the whole family can enjoy the fun!",
        image: "https://s3-cloud.cr8tive-digital.com/gokidsplay/images/3a35a05c-7e7e-4357-a432-33193e0a4819.jpg",
        category: "kids",
        minAge: 0,
        intensity: "low",
    },
    {
        id: "laser-arena",
        title: "Laser Arena",
        description: "Experience the thrill of our laser arena! A multi-level interactive space to battle your friends. Grab your vest, pick up your blaster and enter the arena for an action packed game of laser tag.",
        image: "https://s3-cloud.cr8tive-digital.com/gokidsplay/images/a2b29616-9845-4b50-a6e9-5a034ff6ad71.jpg",
        category: "thrill",
        minAge: 5,
        intensity: "medium",
    },
    {
        id: "go-kart",
        title: "Go Kart",
        description: "Race your friends on our indoor go kart track! Specially designed for safe but exciting racing, our go karts are perfect for all ages. Put your foot down and race to the finish!",
        image: "https://s3-cloud.cr8tive-digital.com/gokidsplay/images/62636de7-f9d5-4fb7-8f5e-918419f8a3ec.jpeg",
        category: "thrill",
        minAge: 4,
        intensity: "high",
    },
    {
        id: "inflatable-park",
        title: "Inflatable Park",
        description: "Bounce and jump in our massive inflatable park! From giant bouncy castles to inflatable obstacle courses, our inflatable park has something for everyone. Fun for the whole family!",
        image: "https://s3-cloud.cr8tive-digital.com/gokidsplay/images/aec2aee9-9997-48b4-9b0c-b9a313274cba.jpeg",
        category: "family",
        minAge: 2,
        intensity: "medium",
    },
];

export const getAttractionsByCategory = (category: Attraction["category"]) => {
    return attractions.filter((a) => a.category === category);
};

export const getAttractionById = (id: string) => {
    return attractions.find((a) => a.id === id);
};
