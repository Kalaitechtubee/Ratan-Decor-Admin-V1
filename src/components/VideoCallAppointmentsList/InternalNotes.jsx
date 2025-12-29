import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Plus, Edit, Trash2, Clock, User, Calendar, FileText, AlertTriangle } from 'lucide-react';
import DeleteConfirmationModal from '../Common/DeleteConfirmationModal';
import appointmentApi from './appointmentApi';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const NoteTypeIcon = ({ type }) => {
  const icons = {
    'Follow-up': <Clock size={16} className="text-blue-500" />,
    'Contact Attempt': <User size={16} className="text-green-500" />,
    'Meeting Notes': <Calendar size={16} className="text-purple-500" />,
    'Status Update': <AlertTriangle size={16} className="text-orange-500" />,
    'Other': <AlertTriangle size={16} className="text-gray-500" />,
  };
  return icons[type] || <AlertTriangle size={16} className="text-gray-500" />;
};

const InternalNotes = ({ enquiryId, currentUser, onToast }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    note: '',
    noteType: 'Follow-up',
    isImportant: false,
    followUpDate: '',
  });
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteData, setEditNoteData] = useState({
    note: '',
    noteType: 'Follow-up',
    isImportant: false,
    followUpDate: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const NOTE_TYPES = ['Follow-up', 'Contact Attempt', 'Meeting Notes', 'Status Update', 'Other'];

  // Add ref to track last fetched enquiryId
  const lastFetchedEnquiryId = useRef(null);

  const fetchNotes = useCallback(async () => {
    if (enquiryId && enquiryId !== lastFetchedEnquiryId.current) {
      lastFetchedEnquiryId.current = enquiryId;
      setLoading(true);
      try {
        const response = await appointmentApi.getInternalNotes(enquiryId);
        setNotes(response.data || []);
      } catch (err) {
        console.error('Error fetching internal notes:', err);
        onToast('Failed to fetch internal notes.', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [enquiryId, onToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const resetNewNote = () => {
    setNewNote({
      note: '',
      noteType: 'Follow-up',
      isImportant: false,
      followUpDate: '',
    });
  };

  const handleAddNote = async () => {
    if (!newNote.note.trim()) {
      onToast('Note content is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const noteData = {
        note: newNote.note.trim(),
        noteType: newNote.noteType,
        isImportant: newNote.isImportant,
        ...(newNote.followUpDate && { followUpDate: newNote.followUpDate }),
      };

      const response = await appointmentApi.addInternalNote(enquiryId, noteData);
      setNotes((prev) => [response.data, ...prev]);
      resetNewNote();
      onToast('Note added successfully!');
    } catch (err) {
      console.error('Error adding note:', err);
      onToast(err.message || 'Failed to add note.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setEditNoteData({
      note: note.note,
      noteType: note.noteType,
      isImportant: note.isImportant,
      followUpDate: note.followUpDate || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editNoteData.note.trim()) {
      onToast('Note content is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const noteData = {
        note: editNoteData.note.trim(),
        noteType: editNoteData.noteType,
        isImportant: editNoteData.isImportant,
        ...(editNoteData.followUpDate && { followUpDate: editNoteData.followUpDate }),
      };

      await appointmentApi.updateInternalNote(editingNote, noteData);
      setNotes((prev) =>
        prev.map((note) => (note.id === editingNote ? { ...note, ...noteData } : note))
      );
      setEditingNote(null);
      setEditNoteData({ note: '', noteType: 'Follow-up', isImportant: false, followUpDate: '' });
      onToast('Note updated successfully!');
    } catch (err) {
      console.error('Error updating note:', err);
      onToast(err.message || 'Failed to update note.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      setDeleting(true);
      await appointmentApi.deleteInternalNote(noteToDelete.id);
      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete.id));
      onToast('Note deleted successfully!');
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting note:', err);
      onToast(err.message || 'Failed to delete note.', 'error');
    } finally {
      setDeleting(false);
      setNoteToDelete(null);
    }
  };

  if (!enquiryId) return null;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2  " role="region" aria-label="Internal Notes">
      {/* Add New Note Section */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
          <Plus size={18} className="text-green-600" />
          Add New Note
        </h3>
        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Note Content</label>
            <textarea
              value={newNote.note}
              onChange={(e) => setNewNote((prev) => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              placeholder="Enter details about customer conversation, requirements, etc..."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Note Type</label>
              <select
                value={newNote.noteType}
                onChange={(e) => setNewNote((prev) => ({ ...prev, noteType: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all bg-white"
              >
                {NOTE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Follow-up Date (Optional)</label>
              <input
                type="date"
                value={newNote.followUpDate}
                onChange={(e) => setNewNote((prev) => ({ ...prev, followUpDate: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={newNote.isImportant}
                onChange={(e) => setNewNote((prev) => ({ ...prev, isImportant: e.target.checked }))}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors font-medium">Mark as important</span>
            </label>
            <button
              onClick={handleAddNote}
              disabled={submitting || !newNote.note.trim()}
              className="flex items-center px-6 py-2.5 space-x-2 text-white rounded-lg bg-primary hover:bg-red-600 disabled:opacity-50 transition-all font-medium shadow-sm active:scale-95"
            >
              {submitting ? <LoadingSpinner size="small" className="text-white" /> : <Plus size={18} />}
              <span>{submitting ? 'Adding...' : 'Add Note'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Existing Notes Section */}
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          Conversation History
        </h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <LoadingSpinner className="text-primary mb-2" />
            <p>Fetching notes...</p>
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-xl border transition-all ${note.isImportant ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white hover:border-primary/30'
                  }`}
              >
                {editingNote === note.id ? (
                  <div className="space-y-4">
                    <textarea
                      value={editNoteData.note}
                      onChange={(e) => setEditNoteData((prev) => ({ ...prev, note: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary transition-all"
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <select
                        value={editNoteData.noteType}
                        onChange={(e) => setEditNoteData((prev) => ({ ...prev, noteType: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary bg-white"
                      >
                        {NOTE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editNoteData.followUpDate}
                        onChange={(e) => setEditNoteData((prev) => ({ ...prev, followUpDate: e.target.value }))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editNoteData.isImportant}
                          onChange={(e) => setEditNoteData((prev) => ({ ...prev, isImportant: e.target.checked }))}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm font-medium">Important</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={submitting}
                          className="flex items-center px-4 py-2 space-x-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                        >
                          {submitting && <LoadingSpinner size="small" className="text-white" />}
                          <span>{submitting ? 'Saving...' : 'Update'}</span>
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          disabled={submitting}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          <NoteTypeIcon type={note.noteType} />
                        </div>
                        <span className="font-semibold text-gray-900">{note.noteType}</span>
                        {note.isImportant && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full uppercase tracking-wider">
                            Important
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit Note"
                          aria-label={`Edit Note ${note.id}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete Note"
                          aria-label={`Delete Note ${note.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed text-sm">{note.note}</p>
                    <div className="flex flex-wrap gap-4 items-center justify-between pt-3 border-t border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <span>Added by: <span className="text-gray-900">{note.staffUser?.name || 'System Operator'}</span></span>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* <span>Created {new Date(note.createdAt).toLocaleString()}</span> */}
                        {note.followUpDate && (
                          <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Calendar size={12} />
                            <span>Follow-up: {note.followUpDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No conversation history found for this enquiry.</p>
            <p className="text-gray-400 text-sm mt-1">Start by adding a note about your latest interaction.</p>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteNote}
        title="Delete Internal Note"
        message="Are you sure you want to delete this internal note? This interaction record will be permanently removed from the history."
        loading={deleting}
        itemDisplayName="Internal Note"
      />
    </div>
  );
};

export default InternalNotes;