/**
 * Compresses an image file using browser Canvas API.
 * Resizes to max 1920px width/height and compresses to JPEG quality 0.8.
 */
export async function compressImage(file: File): Promise<File> {
    // If it's not an image, return original
    if (!file.type.startsWith('image/')) return file;
    // If it's already small enough (< 500KB), return original
    if (file.size < 500 * 1024) return file;

    const compressionPromise = new Promise<File>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max dimension 1920px
                const MAX_DIMENSION = 1920;
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file); // Fallback
                        return;
                    }
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });

    // 10 second timeout race (increased from 5s)
    const timeoutPromise = new Promise<File>((resolve) => {
        setTimeout(() => {
            console.warn("Image compression timed out, using original");
            resolve(file);
        }, 10000);
    });

    return Promise.race([compressionPromise, timeoutPromise]);
}
