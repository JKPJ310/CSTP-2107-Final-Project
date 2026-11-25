// Turns a picture someone chose into a small square JPEG, in the browser, before it's uploaded.
// Small means fast to load, and redrawing it drops hidden details such as the GPS location
// phones store inside photos.

export const PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PICTURE_MB = 15; // what people can choose; what's uploaded is far smaller

// file → Blob (JPEG, size × size, cropped to the middle). Throws if the browser can't read it.
export const squarePicture = async (file, size = 320) => {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    // JPEG has no transparency: a light background for see-through PNGs
    context.fillStyle = '#F8FAFB';
    context.fillRect(0, 0, size, size);
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('The picture couldn’t be prepared');
    return blob;
}
