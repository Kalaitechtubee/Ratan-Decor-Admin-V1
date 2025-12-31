import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Image as ImageIcon, Link } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiFetchWithAuth as apiFetch } from '../../services/Api';
import DeleteConfirmationModal from '../Common/DeleteConfirmationModal';

const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Sliders = ({ currentUser, onToast }) => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    desc: '',
    cta: '',
    ctaUrl: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${BASE_API_URL}/sliders?activeOnly=false`, { method: 'GET' });
      if (response.success) setSliders(response.sliders || []);
    } catch (error) {
      console.error('Error fetching sliders:', error);
      toast.error('Failed to fetch sliders');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      if (!isValidType) {
        toast.error(`Invalid file type for ${file.name}`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`File ${file.name} is too large`);
        return false;
      }
      return true;
    });

    const totalFiles = existingImages.length + selectedFiles.length + validFiles.length;
    if (totalFiles > 5) {
      toast.error('Maximum 5 images allowed');
      const remaining = 5 - (existingImages.length + selectedFiles.length);
      setSelectedFiles(prev => [...prev, ...validFiles.slice(0, remaining)]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    const totalFiles = existingImages.length + selectedFiles.length + validFiles.length;
    if (totalFiles > 5) {
      toast.error('Maximum 5 images allowed');
      const remaining = 5 - (existingImages.length + selectedFiles.length);
      setSelectedFiles(prev => [...prev, ...validFiles.slice(0, remaining)]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const openModal = (slider = null) => {
    if (slider) {
      setEditingSlider(slider);
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        desc: slider.desc || '',
        cta: slider.cta || '',
        ctaUrl: slider.ctaUrl || '',
      });
      setExistingImages(slider.images || []);
      setSelectedFiles([]);
    } else {
      setEditingSlider(null);
      setFormData({
        title: '',
        subtitle: '',
        desc: '',
        cta: '',
        ctaUrl: '',
      });
      setExistingImages([]);
      setSelectedFiles([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlider(null);
    setFormData({
      title: '',
      subtitle: '',
      desc: '',
      cta: '',
      ctaUrl: '',
    });
    setExistingImages([]);
    setSelectedFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('subtitle', formData.subtitle.trim());
      submitData.append('desc', formData.desc.trim());
      submitData.append('cta', formData.cta.trim());
      submitData.append('ctaUrl', formData.ctaUrl.trim());

      if (editingSlider) {
        submitData.append('existingImages', JSON.stringify(existingImages.map(img => img.filename || img)));
      }

      selectedFiles.forEach(file => {
        submitData.append('images', file);
      });

      const endpoint = editingSlider
        ? `${BASE_API_URL}/sliders/${editingSlider.id}`
        : `${BASE_API_URL}/sliders`;

      const data = await apiFetch(endpoint, {
        method: editingSlider ? 'PUT' : 'POST',
        body: submitData,
      });

      if (data.success) {
        toast.success(editingSlider ? 'Slider updated successfully' : 'Slider created successfully');
        closeModal();
        fetchSliders();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving slider:', error);
      toast.error('Failed to save slider');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (slider) => {
    setDeleteTarget(slider);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const response = await apiFetch(`${BASE_API_URL}/sliders/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        toast.success('Slider deleted successfully');
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        fetchSliders();
      } else {
        toast.error(response.message || 'Failed to delete slider');
      }
    } catch (error) {
      console.error('Error deleting slider:', error);
      toast.error('Failed to delete slider');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image;
    }
    if (typeof image === 'object' && image.url) {
      return image.url;
    }
    const filename = typeof image === 'object' ? image.filename : image;
    return `${BASE_URL}/uploads/sliders/${filename}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Slider Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff4747] text-white rounded-lg hover:bg-[#dc2626] transition-all duration-200 shadow-md"
        >
          <Plus size={20} />
          Add New Slider
        </button>
      </div>

      {loading && !sliders.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4747] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sliders...</p>
        </div>
      ) : sliders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No sliders found</p>
          <button
            onClick={() => openModal()}
            className="mt-4 px-4 py-2 bg-[#ff4747] text-white rounded-lg hover:bg-[#dc2626] transition-all duration-200"
          >
            Create First Slider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((slider) => (
            <div key={slider.id} className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#ff4747]/20">
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {slider.images && slider.images.length > 0 ? (
                  <img
                    src={getImageUrl(slider.images[0])}
                    alt={slider.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-60" />
                      <p className="text-xs text-gray-500">No Image</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-[#ff4747] transition-colors">
                  {slider.title}
                </h3>
                {slider.subtitle && (
                  <p className="text-sm text-[#ff4747] font-medium mb-2 bg-red-50 px-2 py-1 rounded-md inline-block">
                    {slider.subtitle}
                  </p>
                )}
                {slider.desc && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                    {slider.desc}
                  </p>
                )}
                {slider.cta && (
                  <p className="text-sm font-medium text-[#ff4747] mb-2 bg-red-50 px-3 py-1.5 rounded-lg inline-block flex items-center gap-1">
                    <Link size={12} /> {slider.cta}
                  </p>
                )}
                {slider.ctaUrl && (
                  <p className="text-xs text-gray-500 mb-4 truncate">
                    Link: {slider.ctaUrl}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => openModal(slider)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-[#ff4747] rounded-lg hover:bg-red-100 hover:text-[#dc2626] transition-all duration-200 shadow-md font-medium"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(slider)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff4747] text-white rounded-lg hover:bg-[#dc2626] transition-all duration-200 shadow-md font-medium"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#ff4747] text-white p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingSlider ? 'Edit Slider' : 'Create New Slider'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., Bespoke Furniture"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Subtitle/Badge
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., Handcrafted Excellence"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Description
                </label>
                <textarea
                  name="desc"
                  value={formData.desc}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                  placeholder="Slider description text"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Call to Action (CTA) Text
                </label>
                <input
                  type="text"
                  name="cta"
                  value={formData.cta}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., Shop Now"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                  CTA Link <Link size={16} className="text-gray-500" />
                </label>
                <input
                  type="url"
                  name="ctaUrl"
                  value={formData.ctaUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ff4747] focus:border-[#ff4747] transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="e.g., /products or https://example.com"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Image
                </label>
                <div
                  className={`p-6 rounded-lg border-2 border-dashed ${isDragOver ? 'border-[#ff4747] bg-red-50' : 'border-gray-300'
                    }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className="mx-auto w-12 h-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="block mt-2 text-sm font-medium text-gray-900">
                          Click to upload or drag and drop images
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Existing Images:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {existingImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={getImageUrl(img)}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-[#ff4747] text-white rounded-full p-1 hover:bg-[#dc2626] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">New Images:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="absolute top-1 right-1 bg-[#ff4747] text-white rounded-full p-1 hover:bg-[#dc2626] transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                  Total images: {existingImages.length + selectedFiles.length}
                </p>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#ff4747] text-white rounded-lg hover:bg-[#dc2626] transition-all duration-200 disabled:opacity-50 font-semibold"
                >
                  {loading ? 'Saving...' : editingSlider ? 'Update Slider' : 'Create Slider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Slider"
        message={`Are you sure you want to delete the slider "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={loading}
        itemDisplayName={deleteTarget?.title}
      />
    </div>
  );
};

export default Sliders;