import React, { useState, useEffect } from 'react';
import { getCatalog, uploadCatalog, deleteCatalog } from '../../services/Api';
import {
  FaCloudUploadAlt,
  FaTrash,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt
} from 'react-icons/fa';
import dayjs from 'dayjs';
import DeleteConfirmationModal from '../Common/DeleteConfirmationModal';

const CatalogSettings = ({ currentUser, onToast }) => {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const response = await getCatalog();
      if (response?.success) {
        setCatalog(response.catalog);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onToast('Please select a file first', 'warning');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await uploadCatalog(formData);
      if (response?.success) {
        onToast('Catalog uploaded successfully', 'success');
        setCatalog(response.catalog);
        setSelectedFile(null);
        document.getElementById('catalog-file-input').value = '';
      }
    } catch (err) {
      onToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await deleteCatalog();
      if (response?.success) {
        onToast('Catalog deleted successfully', 'success');
        setCatalog(null);
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      onToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getFileIcon = (mime) => {
    if (!mime) return <FaFileAlt className="text-primary text-4xl" />;
    if (mime.includes('pdf')) return <FaFilePdf className="text-red-500 text-4xl" />;
    if (mime.includes('word')) return <FaFileWord className="text-blue-500 text-4xl" />;
    if (mime.includes('excel') || mime.includes('sheet'))
      return <FaFileExcel className="text-green-500 text-4xl" />;
    return <FaFileAlt className="text-primary text-4xl" />;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-primary/20">

        {/* Header */}
        <div className="px-6 py-4 border-b border-primary/20 bg-primary/5 rounded-t-xl">
          <h2 className="text-2xl font-bold text-primary">
            Catalog File Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage the downloadable catalog file for your website
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">

          {/* Upload Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h3 className="font-semibold text-primary mb-3">
              Upload / Replace Catalog
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <input
                id="catalog-file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-600
                file:mr-4 file:px-4 file:py-2
                file:rounded-md file:border-0
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20
                border border-primary/30 rounded-md p-2"
              />

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className={`flex items-center px-5 py-2 space-x-2 rounded-lg text-white shadow-sm transition-colors
                ${uploading || !selectedFile
                    ? 'bg-primary/60 cursor-not-allowed'
                    : 'bg-primary hover:bg-red-600'
                  }`}
              >
                <FaCloudUploadAlt />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
          </div>

          {/* Current Catalog */}
          <div>
            <h3 className="font-semibold text-primary mb-4">
              Current Catalog
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : catalog ? (
              <div className="flex items-center justify-between bg-white border border-primary/20 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  {getFileIcon(catalog.mimeType)}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {catalog.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(catalog.size / 1024 / 1024).toFixed(2)} MB •{' '}
                      {dayjs(catalog.updatedAt).format('MMM D, YYYY')}
                    </p>
                    <a
                      href={catalog.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      View / Download
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleDelete}
                  className="p-2 rounded-full text-red-600 hover:bg-red-50 transition"
                  title="Delete Catalog"
                >
                  <FaTrash />
                </button>
              </div>
            ) : (
              <div className="text-center py-10 bg-primary/5 border border-dashed border-primary/30 rounded-lg">
                <p className="text-gray-500">
                  No catalog file uploaded yet
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Catalog File"
        message="Are you sure you want to delete the current catalog file? This will remove the download link from the website."
        loading={deleteLoading}
        itemDisplayName={catalog?.originalName}
      />
    </div>
  );
};

export default CatalogSettings;
