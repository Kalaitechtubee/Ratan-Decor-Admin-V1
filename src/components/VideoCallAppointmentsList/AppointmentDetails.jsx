import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Common/Modal';
import { Loader2, Plus, Edit, Trash2, Clock, AlertTriangle, User, Calendar } from 'lucide-react';
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

const InternalNotesModal = ({ isOpen, onClose, appointment, onNotesUpdated, showToast }) => {
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

  const fetchNotes = useCallback(async () => {
    if (appointment?.id) {
      setLoading(true);
      try {
        const response = await appointmentApi.getInternalNotes(appointment.id, { page: 1, limit: 20 });
        setNotes(response.data || []);
      } catch (err) {
        console.error('Error fetching internal notes:', err);
        showToast('Failed to fetch internal notes.', 'error');
      } finally {
        setLoading(false);
      }
    }
  }, [appointment?.id, showToast]);

  useEffect(() => {
    if (isOpen && appointment?.id) {
      fetchNotes();
    }
  }, [isOpen, fetchNotes, appointment?.id]);

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
      showToast('Note content is required.', 'error');
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

      const response = await appointmentApi.addInternalNote(appointment.id, noteData);
      setNotes((prev) => [response.data, ...prev]);
      resetNewNote();
      showToast('Note added successfully!');
      onNotesUpdated();
    } catch (err) {
      console.error('Error adding note:', err);
      showToast(err.message || 'Failed to add note.', 'error');
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
      showToast('Note content is required.', 'error');
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
      showToast('Note updated successfully!');
      onNotesUpdated();
    } catch (err) {
      console.error('Error updating note:', err);
      showToast(err.message || 'Failed to update note.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      const originalNotes = [...notes];
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      
      await appointmentApi.deleteInternalNote(noteId);
      showToast('Note deleted successfully!');
      onNotesUpdated();
    } catch (err) {
      setNotes(originalNotes);
      console.error('Error deleting note:', err);
      showToast(err.message || 'Failed to delete note.', 'error');
    }
  };

  const handleClose = () => {
    if (!submitting) {
      resetNewNote();
      setEditingNote(null);
      setEditNoteData({ note: '', noteType: 'Follow-up', isImportant: false, followUpDate: '' });
      onClose();
    }
  };

  if (!appointment) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Internal Notes - Appointment ${appointment.id}`} size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Add New Note Section */}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Note Type</label>
                <select
                  value={newNote.noteType}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, noteType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                >
                  <option value="Follow-up">Follow-up</option>
                  <option value="Contact Attempt">Contact Attempt</option>
                  <option value="Meeting Notes">Meeting Notes</option>
                  <option value="Status Update">Status Update</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Follow-up Date (Optional)</label>
                <input
                  type="date"
                  value={newNote.followUpDate}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, followUpDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                  min="2025-09-01"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Important</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newNote.isImportant}
                  onChange={(e) => setNewNote((prev) => ({ ...prev, isImportant: e.target.checked }))}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700">Mark as important</span>
              </div>
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

        {/* Existing Notes Section */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Existing Notes</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="text-primary" />
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${
                    note.isImportant ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editNoteData.note}
                        onChange={(e) => setEditNoteData((prev) => ({ ...prev, note: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                      />
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <select
                          value={editNoteData.noteType}
                          onChange={(e) => setEditNoteData((prev) => ({ ...prev, noteType: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                        >
                          <option value="Follow-up">Follow-up</option>
                          <option value="Contact Attempt">Contact Attempt</option>
                          <option value="Meeting Notes">Meeting Notes</option>
                          <option value="Status Update">Status Update</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="date"
                          value={editNoteData.followUpDate}
                          onChange={(e) => setEditNoteData((prev) => ({ ...prev, followUpDate: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                          min="2025-09-01"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editNoteData.isImportant}
                          onChange={(e) => setEditNoteData((prev) => ({ ...prev, isImportant: e.target.checked }))}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">Important</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={submitting}
                          className="flex items-center px-3 py-1 space-x-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {submitting && <LoadingSpinner size="small" className="text-white" />}
                          <span>{submitting ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          disabled={submitting}
                          className="px-3 py-1 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <NoteTypeIcon type={note.noteType} />
                          <span className="font-medium text-sm">{note.noteType}</span>
                          {note.isImportant && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                              Important
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Note"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{note.note}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          By {note.staffUser?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleString()}
                        </div>
                        {note.followUpDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Follow-up: {note.followUpDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No internal notes available.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex pt-4 space-x-3 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InternalNotesModal;