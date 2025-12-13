// src/components/Seo/SeoManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAllSeo, getAllPageNames, updateSeo, createSeo, deleteSeo } from '../../services/Api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const SeoManagement = () => {
  const [seoList, setSeoList] = useState([]);
  const [pageNames, setPageNames] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ pageName: '', title: '', description: '', keywords: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchSeoData();
    fetchPageNames();
  }, []);

  const fetchSeoData = async () => {
    try {
      setIsLoading(true);
      const result = await getAllSeo();
      const normalizedSeoList = result.seo.map((seo) => ({
        ...seo,
        keywords: Array.isArray(seo.keywords) ? seo.keywords : (seo.keywords ? seo.keywords.split(',') : []),
      }));
      setSeoList(normalizedSeoList);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch SEO data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPageNames = async () => {
    try {
      const result = await getAllPageNames();
      setPageNames(result.pageNames);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch page names');
    }
  };

  const handleEdit = (seo) => {
    setEditingId(seo.id);
    const normalizedKeywords = Array.isArray(seo.keywords) ? seo.keywords : (seo.keywords ? seo.keywords.split(',') : []);
    setFormData({
      pageName: seo.pageName,
      title: seo.title,
      description: seo.description,
      keywords: normalizedKeywords
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'keywords') {
      setFormData((prev) => ({ ...prev, keywords: value.split(',').map((k) => k.trim()) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const dataToSend = { ...formData, keywords: formData.keywords.join(', ') };
      await updateSeo(editingId, dataToSend);
      toast.success('SEO updated successfully');
      setEditingId(null);
      fetchSeoData();
    } catch (error) {
      toast.error(error.message || 'Failed to update SEO');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ pageName: '', title: '', description: '', keywords: [] });
  };

  const handleCreateNew = () => {
    setFormData({ pageName: '', title: '', description: '', keywords: [] });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.pageName || !formData.title) {
      toast.error('Page name and title are required');
      return;
    }

    try {
      setIsSaving(true);
      const dataToSend = {
        ...formData,
        keywords: Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords
      };
      await createSeo(dataToSend);
      toast.success('SEO entry created successfully');
      setIsCreateModalOpen(false);
      setFormData({ pageName: '', title: '', description: '', keywords: [] });
      fetchSeoData();
    } catch (error) {
      toast.error(error.message || 'Failed to create SEO entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (seo) => {
    setDeleteTarget(seo);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsSaving(true);
      await deleteSeo(deleteTarget.id);
      toast.success('SEO entry deleted successfully');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchSeoData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete SEO entry');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSeoList = seoList.filter(seo =>
    seo.pageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">SEO Management</h1>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-[#ff4742] text-white rounded-lg font-semibold hover:bg-[#e63d38] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New SEO Page
          </button>
        </div>

        {/* Header with search and stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search pages, titles or descriptions..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="text-gray-700 font-medium">
              {seoList.length} Pages
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Optimized Pages</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">{seoList.filter(seo => seo.title && seo.description).length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Needs Improvement</h3>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{seoList.filter(seo => !seo.title || !seo.description).length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Complete SEO</h3>
              <p className="text-2xl font-bold text-green-600 mt-1">{seoList.filter(seo => seo.title && seo.description && seo.keywords.length > 0).length}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSeoList.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No SEO data found</h3>
                <p className="text-gray-500">Try adjusting your search or check if any pages exist</p>
              </div>
            ) : (
              filteredSeoList.map((seo) => (
                <div key={seo.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className={`p-5 border-l-4 ${editingId === seo.id ? 'border-[#ff4742] bg-red-50' : 'border-transparent'}`}>
                    {editingId === seo.id ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Editing: {seo.pageName}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                            <select
                              name="pageName"
                              value={formData.pageName}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                            >
                              <option value="">Select a page</option>
                              {pageNames.map((page) => (
                                <option key={page} value={page}>{page}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title <span className="text-xs text-gray-500">({formData.title.length}/60 chars)</span>
                            </label>
                            <input
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                              placeholder="SEO Title"
                              maxLength="60"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-xs text-gray-500">({formData.description.length}/160 chars)</span>
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                            placeholder="Meta description"
                            maxLength="160"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
                          <input
                            name="keywords"
                            value={formData.keywords.join(', ')}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                            placeholder="keyword1, keyword2, keyword3"
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                        </div>

                        <div className="flex space-x-3 pt-2">
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 bg-[#ff4742] text-white rounded-lg font-medium hover:bg-[#e63d38] transition-all focus:ring-2 focus:ring-[#ff4742] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{seo.pageName}</h3>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Title</p>
                                <p className={`text-gray-800 ${!seo.title ? 'italic text-gray-400' : ''}`}>
                                  {seo.title || 'No title set'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Description</p>
                                <p className={`text-gray-800 ${!seo.description ? 'italic text-gray-400' : ''}`}>
                                  {seo.description || 'No description set'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Keywords</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {seo.keywords && seo.keywords.length > 0 ? (
                                    seo.keywords.map((keyword, index) => (
                                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                        {keyword}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="italic text-gray-400">No keywords set</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(seo)}
                              className="flex items-center px-4 py-2 bg-red-100 text-[#ff4742] rounded-lg font-medium hover:bg-red-200 transition-all"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(seo)}
                              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Create New SEO Page</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pageName"
                    value={formData.pageName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                    placeholder="e.g., home, about, contact"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Use lowercase, no spaces (use hyphens for multi-word pages)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">({formData.title.length}/60 chars)</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                    placeholder="SEO optimized page title"
                    maxLength="60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                    <span className="text-xs text-gray-500 ml-2">({formData.description.length}/160 chars)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                    placeholder="Meta description for search engines"
                    maxLength="160"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                  <input
                    name="keywords"
                    value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff4742] focus:border-transparent"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-[#ff4742] text-white rounded-lg font-semibold hover:bg-[#e63d38] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : 'Create SEO Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete SEO Entry</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete the SEO entry for <strong className="text-gray-900">"{deleteTarget?.pageName}"</strong>?
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeoManagement;