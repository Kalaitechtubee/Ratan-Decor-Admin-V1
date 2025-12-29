import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

/**
 * A reusable delete confirmation modal.
 * 
 * @param {boolean} isOpen - Whether the modal is open.
 * @param {function} onClose - Function to call when closing the modal.
 * @param {function} onConfirm - Function to call when the delete button is clicked.
 * @param {string} title - The title of the modal.
 * @param {string} message - The description or warning message.
 * @param {boolean} loading - Whether the delete action is currently processing.
 * @param {string} itemDisplayName - The name/ID of the item being deleted (optional for description).
 */
function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Confirmation",
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    loading = false,
    itemDisplayName = ""
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <AlertTriangle size={32} />
                </div>

                <div>
                    <p className="text-gray-900 font-medium text-lg">
                        {itemDisplayName ? `Confirm Delete for ${itemDisplayName}` : 'Are you sure?'}
                    </p>
                    <p className="text-gray-500 mt-2">
                        {message}
                    </p>
                </div>

                <div className="flex w-full gap-3 pt-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-red-400"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default DeleteConfirmationModal;
