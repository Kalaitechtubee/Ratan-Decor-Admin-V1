import React, { useMemo } from 'react';
import { Loader2, Calendar, Clock, Mail, Phone, User, Video, FileText, X } from 'lucide-react';
import Modal from '../Common/Modal';
import StatusBadge from '../Common/StatusBadge';
import { getCurrentUser } from '../../utils/auth';

const AppointmentDetails = ({
  isOpen,
  onClose,
  appointment,
  isStaff
}) => {
  const user = useMemo(() => getCurrentUser(), []);

  if (!isOpen) return null;

  if (!appointment) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
        <div className="text-center py-8">
          <p className="text-gray-500">Appointment not found</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Appointment Details - #${appointment.id}`} size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Header Status Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
              <Video size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Video Call Request</h3>
              <p className="text-sm text-gray-500">Created on {new Date(appointment.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={appointment.status} type="appointment" />
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {appointment.source || 'VideoCall'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Customer Information</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.name}</p>
                  <p className="text-xs text-gray-500">Customer Name</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.email}</p>
                  <p className="text-xs text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.phoneNo}</p>
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Schedule Details</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.videoCallDate}</p>
                  <p className="text-xs text-gray-500">Scheduled Date</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{appointment.videoCallTime}</p>
                  <p className="text-xs text-gray-500">Scheduled Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {appointment.notes && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Notes
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{appointment.notes}</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AppointmentDetails;