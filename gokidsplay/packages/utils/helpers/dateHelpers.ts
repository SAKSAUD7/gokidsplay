export const formatDate = (date: Date | string): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const formatTime = (date: Date | string): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const isPastDate = (date: Date | string): boolean => {
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
};
