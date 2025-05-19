// This service handles file uploads for student photos and payment screenshots

export async function uploadImage(file: File): Promise<string> {
  try {
    // Create a FormData instance
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload to your storage service (e.g., Cloudinary, AWS S3, etc.)
    // Replace this URL with your actual upload endpoint
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url; // Return the URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}