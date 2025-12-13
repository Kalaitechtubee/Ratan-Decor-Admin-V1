import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import appointmentApi from './appointmentApi';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  const sizeClass = size === 'small' ? 'w-4 h-4' : 'w-6 h-6';
  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />;
};

const InternalNotes = ({ enquiryId, currentUser, onToast }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    note: '',
    noteType: 'Follow-up',
    isImportant: false,
  });
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteData, setEditNoteData] = useState({ note: '', noteType: 'Follow-up', isImportant: false });

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

  const handleAddNote = async () => {
    if (!newNote.note.trim()) {
      onToast('Note content is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const response = await appointmentApi.addInternalNote(enquiryId, {
        note: newNote.note.trim(),
        noteType: newNote.noteType,
        isImportant: newNote.isImportant,
      });
      setNotes((prev) => [...prev, response.data]);
      setNewNote({ note: '', noteType: 'Follow-up', isImportant: false });
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
    setEditNoteData({ note: note.note, noteType: note.noteType, isImportant: note.isImportant });
  };

  const handleSaveEdit = async () => {
    if (!editNoteData.note.trim()) {
      onToast('Note content is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await appointmentApi.updateInternalNote(editingNote, editNoteData);
      setNotes((prev) =>
        prev.map((note) => (note.id === editingNote ? { ...note, ...editNoteData } : note))
      );
      setEditingNote(null);
      setEditNoteData({ note: '', noteType: 'Follow-up', isImportant: false });
      onToast('Note updated successfully!');
    } catch (err) {
      console.error('Error updating note:', err);
      onToast(err.message || 'Failed to update note.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setSubmitting(true);
        await appointmentApi.deleteInternalNote(noteId);
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        onToast('Note deleted successfully!');
      } catch (err) {
        console.error('Error deleting note:', err);
        onToast(err.message || 'Failed to delete note.', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto font-roboto" role="region" aria-label="Internal Notes">
      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Add New Note</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Note</label>
            <textarea
              value={newNote.note}
              onChange={(e) => setNewNote((prev) => ({ ...prev, note: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              placeholder="Enter your note..."
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Note Type</label>
            <select
              value={newNote.noteType}
              onChange={(e) => setNewNote((prev) => ({ ...prev, noteType: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            >
              {NOTE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Important</label>
            <input
              type="checkbox"
              checked={newNote.isImportant}
              onChange={(e) => setNewNote((prev) => ({ ...prev, isImportant: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
          </div>
          <button
            onClick={handleAddNote}
            disabled={submitting || !newNote.note.trim()}
            className="flex items-center px-4 py-2 space-x-2 text-white rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting && <LoadingSpinner size="small" className="text-white" />}
            <span>{submitting ? 'Adding...' : 'Add Note'}</span>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Existing Notes</h3>
        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner className="text-primary" />
          </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editNoteData.note}
                      onChange={(e) => setEditNoteData((prev) => ({ ...prev, note: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    />
                    <select
                      value={editNoteData.noteType}
                      onChange={(e) => setEditNoteData((prev) => ({ ...prev, noteType: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                    >
                      {NOTE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <div>
                      <input
                        type="checkbox"
                        checked={editNoteData.isImportant}
                        onChange={(e) => setEditNoteData((prev) => ({ ...prev, isImportant: e.target.checked }))}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="ml-2 text-sm">Important</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={submitting}
                        className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                      <p className="text-xs text-gray-500">
                        {note.noteType} by {note.staffUser?.name || 'Unknown'} on{' '}
                        {new Date(note.createdAt).toLocaleString()}
                        {note.isImportant && <span className="ml-2 text-red-500">★ Important</span>}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Note"
                        aria-label={`Edit Note ${note.id}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Note"
                        aria-label={`Delete Note ${note.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No internal notes available.</p>
        )}
      </div>
    </div>
  );
};

export default InternalNotes;