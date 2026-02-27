export type UploadType = 'post' | 'profile' | 'header';

export const uploadFile = async (file: File, type: UploadType = 'post'): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await response.json() : null;

        if (!response.ok || !data?.success) {
            const fallbackMessage = `Upload failed (${response.status})`;
            throw new Error(data?.error || data?.message || fallbackMessage);
        }

        return data.path;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};
