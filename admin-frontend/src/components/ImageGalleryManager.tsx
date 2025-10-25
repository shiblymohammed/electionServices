import { useState, useEffect, useRef } from 'react';
import { ProductImage } from '../types/product';
import {
  getProductImages,
  uploadProductImage,
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
  updateProductImage,
} from '../services/productService';

interface ImageGalleryManagerProps {
  productType: 'package' | 'campaign';
  productId: number;
}

const ImageGalleryManager = ({ productType, productId }: ImageGalleryManagerProps) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [productType, productId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await getProductImages(productType, productId);
      setImages(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', file);

      await uploadProductImage(productType, productId, formData);
      await fetchImages();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await deleteProductImage(imageId);
      await fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await setPrimaryImage(imageId);
      await fetchImages();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set primary image');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      const imageIds = images.map((img) => img.id);
      await reorderProductImages(imageIds);
      setDraggedIndex(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reorder images');
      fetchImages(); // Reload to reset order
    }
  };

  const handleEditAltText = (image: ProductImage) => {
    setEditingImage(image);
  };

  const handleSaveAltText = async (imageId: number, altText: string) => {
    try {
      await updateProductImage(imageId, { alt_text: altText });
      await fetchImages();
      setEditingImage(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update alt text');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer inline-block ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : '+ Upload Image'}
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">
        Maximum 10 images. Supported formats: JPG, PNG, GIF. Max size: 5MB per image.
      </p>

      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No images uploaded. Add images to showcase this product.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative border-2 rounded-lg overflow-hidden cursor-move ${
                image.is_primary ? 'border-blue-500' : 'border-gray-200'
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 bg-white bg-opacity-75 rounded px-2 py-1 text-xs text-gray-600">
                ☰
              </div>

              {/* Primary Badge */}
              {image.is_primary && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}

              {/* Image Preview */}
              <img
                src={image.thumbnail || image.image}
                alt={image.alt_text || 'Product image'}
                className="w-full h-48 object-cover"
              />

              {/* Image Actions */}
              <div className="p-2 bg-gray-50">
                {editingImage?.id === image.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue={image.alt_text}
                      placeholder="Alt text"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveAltText(image.id, e.currentTarget.value);
                        } else if (e.key === 'Escape') {
                          setEditingImage(null);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          handleSaveAltText(
                            image.id,
                            (document.querySelector('input[type="text"]') as HTMLInputElement)
                              ?.value || ''
                          )
                        }
                        className="flex-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingImage(null)}
                        className="flex-1 text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-600 truncate mb-2">
                      {image.alt_text || 'No alt text'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {!image.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAltText(image)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Edit Alt
                      </button>
                      <button
                        onClick={() => handleDelete(image.id)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length >= 10 && (
        <p className="text-sm text-amber-600 mt-4">
          Maximum number of images (10) reached. Delete an image to upload more.
        </p>
      )}
    </div>
  );
};

export default ImageGalleryManager;
