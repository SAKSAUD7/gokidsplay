export const formatCurrency = (amount: number | string): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "£0.00";

    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};
