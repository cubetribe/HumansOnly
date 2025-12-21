export const getFullURL = (url: string | null | undefined): string => {
    if (!url) return '';

    // Local uploads already have full path
    if (url.startsWith('/uploads/')) {
        return url;
    }

    // Already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Legacy Supabase paths - fallback
    const storageURL = process.env.NEXT_PUBLIC_STORAGE_URL;
    if (storageURL) {
        return `${storageURL}${url}`;
    }

    // Default: assume local path
    return `/uploads/${url}`;
};
