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

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Upload failed');
        }

        return data.path;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};
