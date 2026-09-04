/**
 * Utility functions for exporting data to CSV
 */

export function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Create CSV header
    const headers = columns.map(col => col.label).join(',');

    // Create CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];

            // Handle nested objects (e.g., customer.name)
            if (col.key.includes('.')) {
                const keys = col.key.split('.');
                value = keys.reduce((obj, key) => obj?.[key], item);
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }

            // Handle dates
            if (value instanceof Date) {
                value = value.toLocaleDateString();
            }

            // Escape commas and quotes
            value = String(value).replace(/"/g, '""');

            // Wrap in quotes if contains comma, newline, or quote
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }

            return value;
        }).join(',');
    }).join('\n');

    // Combine header and rows
    const csv = `${headers}\n${rows}`;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportBookingsToCSV(bookings: any[], filename: string = 'bookings') {
    const columns = [
        { key: 'id', label: 'Booking ID' },
        { key: 'type', label: 'Type' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'customerEmail', label: 'Customer Email' },
        { key: 'customerPhone', label: 'Customer Phone' },
        { key: 'date', label: 'Date' },
        { key: 'time', label: 'Time' },
        { key: 'duration', label: 'Duration (mins)' },
        { key: 'adults', label: 'Adults' },
        { key: 'kids', label: 'Kids' },
        { key: 'spectators', label: 'Spectators' },
        { key: 'amount', label: 'Amount' },
        { key: 'bookingStatus', label: 'Status' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'createdAt', label: 'Created At' },
    ];

    exportToCSV(bookings, filename, columns);
}

export function exportCustomersToCSV(customers: any[], filename: string = 'customers') {
    const columns = [
        { key: 'id', label: 'Customer ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'totalBookings', label: 'Total Bookings' },
        { key: 'totalSpent', label: 'Total Spent' },
        { key: 'lastBooking', label: 'Last Booking' },
        { key: 'created_at', label: 'Created At' },
    ];

    exportToCSV(customers, filename, columns);
}
