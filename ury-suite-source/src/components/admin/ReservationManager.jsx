import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  Calendar, Plus, Search, Filter, Phone, Check, Utensils, Pencil, Trash2,
  AlertTriangle, Users, Building2, Clock, CheckCircle, XCircle, UserCheck
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function ReservationManager() {
  const context = useRestaurant() || {};
  const {
    reservations = [],
    createReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    tables = [],
    branches = ['Gulberg III', 'DHA Phase 5', 'Johar Town'],
    selectedBranch = 'Gulberg III',
    showToast
  } = context;

  // Safe arrays
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeBranches = Array.isArray(branches) ? branches : ['Gulberg III', 'DHA Phase 5', 'Johar Town'];

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  // Reservation Modal States
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [resCustomer, setResCustomer] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resBranch, setResBranch] = useState(selectedBranch || 'Gulberg III');
  const [resDate, setResDate] = useState(new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState('19:30');
  const [resGuests, setResGuests] = useState(4);
  const [resOccasion, setResOccasion] = useState('General Dining');
  const [resStatus, setResStatus] = useState('Confirmed');
  const [resTable, setResTable] = useState('Unassigned');

  // Delete Confirmation State
  const [isDeleteResModalOpen, setIsDeleteResModalOpen] = useState(false);
  const [deletingResId, setDeletingResId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered reservations
  const filteredReservations = safeReservations.filter(r => {
    if (!r) return false;
    const q = (searchQuery || '').toLowerCase();
    const customerStr = String(r.customer || r.name || '').toLowerCase();
    const phoneStr = String(r.phone || '');
    const idStr = String(r.id || r.name || '').toLowerCase();

    const matchesSearch = !q || customerStr.includes(q) || phoneStr.includes(q) || idStr.includes(q);
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesBranch = branchFilter === 'All' || r.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Modal Handlers
  const handleOpenNew = () => {
    setEditingRes(null);
    setResCustomer('');
    setResPhone('');
    setResBranch(selectedBranch || 'Gulberg III');
    setResDate(new Date().toISOString().split('T')[0]);
    setResTime('19:30');
    setResGuests(4);
    setResOccasion('General Dining');
    setResStatus('Confirmed');
    setResTable(safeTables.length > 0 ? (safeTables[0].name || safeTables[0].full_name || 'Unassigned') : 'Unassigned');
    setIsResModalOpen(true);
  };

  const handleOpenEdit = (res) => {
    if (!res) return;
    setEditingRes(res);
    setResCustomer(res.customer || '');
    setResPhone(res.phone || '');
    setResBranch(res.branch || selectedBranch || 'Gulberg III');
    setResDate(res.date || new Date().toISOString().split('T')[0]);
    setResTime(res.time || '19:30');
    setResGuests(res.guests || 4);
    setResOccasion(res.occasion || 'General Dining');
    setResStatus(res.status || 'Confirmed');
    setResTable(res.table || 'Unassigned');
    setIsResModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!resCustomer.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (editingRes) {
        if (updateReservation) {
          await updateReservation(editingRes.id, {
            customer: resCustomer,
            phone: resPhone,
            branch: resBranch,
            date: resDate,
            time: resTime,
            guests: Number(resGuests),
            occasion: resOccasion,
            status: resStatus,
            table: resTable
          });
        } else if (updateReservationStatus) {
          await updateReservationStatus(editingRes.id, resStatus, resTable);
        }
      } else {
        if (createReservation) {
          await createReservation({
            name: resCustomer,
            customer: resCustomer,
            phone: resPhone,
            branch: resBranch,
            date: resDate,
            time: resTime,
            guests: Number(resGuests),
            occasion: resOccasion,
            status: resStatus,
            table: resTable
          });
        }
      }
      setIsResModalOpen(false);
    } catch (err) {
      console.error('Error saving reservation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (res) => {
    if (res && updateReservationStatus) {
      await updateReservationStatus(res.id, 'Confirmed', res.table || 'Unassigned');
    }
  };

  const handleSeat = async (res) => {
    if (res && updateReservationStatus) {
      const assigned = (res.table && res.table !== 'Unassigned') ? res.table : (safeTables[0]?.name || 'Table 1');
      await updateReservationStatus(res.id, 'Completed', assigned);
    }
  };

  const handleOpenDelete = (resId) => {
    setDeletingResId(resId);
    setIsDeleteResModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingResId) return;
    if (deleteReservation) {
      await deleteReservation(deletingResId);
    }
    setIsDeleteResModalOpen(false);
    setDeletingResId(null);
  };

  // Status Badge Styling Helper
  const getResBadgeStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & New Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-green-600" /> Table Reservations Manager
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Standalone customer table bookings management & live backend database audit</p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm transition shrink-0"
        >
          <Plus className="h-4 w-4" /> + New Table Reservation
        </button>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Bookings</span>
          <div className="text-2xl font-black text-gray-900">{safeReservations.length}</div>
          <span className="text-[11px] text-green-600 font-bold">Live database records</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Confirmed Bookings</span>
          <div className="text-2xl font-black text-green-700">
            {safeReservations.filter(r => r && r.status === 'Confirmed').length}
          </div>
          <span className="text-[11px] text-green-600 font-bold">Ready for guests</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Completed / Seated</span>
          <div className="text-2xl font-black text-blue-600">
            {safeReservations.filter(r => r && (r.status === 'Completed' || r.status === 'Seated')).length}
          </div>
          <span className="text-[11px] text-blue-600 font-bold">Finished or Seated</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Pending Approvals</span>
          <div className="text-2xl font-black text-amber-600">
            {safeReservations.filter(r => r && r.status === 'Pending').length}
          </div>
          <span className="text-[11px] text-amber-600 font-bold">Awaiting confirmation</span>
        </div>
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-xl text-xs flex-1 max-w-sm">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search guest name, phone, booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full text-xs font-semibold text-gray-800"
            />
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Branches</option>
              {safeBranches.map(b => {
                const label = typeof b === 'object' ? (b.name || b.code || String(b)) : String(b);
                return <option key={label} value={label}>{label}</option>;
              })}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Table Reservations Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                <th className="py-3 px-4">Res ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Party Size</th>
                <th className="py-3 px-4">Assigned Table</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredReservations.length > 0 ? (
                filteredReservations.map(res => {
                  const resId = typeof res.id === 'object' ? (res.id.name || String(res.id)) : (res.id || 'N/A');
                  const resCust = typeof res.customer === 'object' ? (res.customer.name || res.customer.customer_name || 'Guest') : (res.customer || 'Guest');
                  const resPhoneNum = typeof res.phone === 'object' ? (res.phone.phone || 'N/A') : (res.phone || 'N/A');
                  const resBranchName = typeof res.branch === 'object' ? (res.branch.name || res.branch.code || selectedBranch) : (res.branch || selectedBranch);
                  const resDateStr = typeof res.date === 'object' ? String(res.date) : (res.date || '');
                  const resTimeStr = typeof res.time === 'object' ? String(res.time) : (res.time ? `at ${res.time}` : '');
                  const resGuestsNum = typeof res.guests === 'object' ? (res.guests.guests || 1) : (res.guests || 1);
                  const resTableName = typeof res.table === 'object' ? (res.table.name || res.table.full_name || 'Unassigned') : (res.table || 'Unassigned');
                  const resStatusStr = typeof res.status === 'object' ? (res.status.status || 'Confirmed') : (res.status || 'Confirmed');

                  return (
                    <tr key={resId || Math.random()} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-black text-gray-500">{resId}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{resCust}</td>
                      <td className="py-3.5 px-4 text-gray-600 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-gray-400" /> {resPhoneNum}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">{resBranchName}</td>
                      <td className="py-3.5 px-4 text-gray-800 font-bold">
                        {resDateStr} <span className="text-gray-400 font-normal">{resTimeStr}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-900 font-extrabold">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{resGuestsNum} Guests</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-green-700">
                        {resTableName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${getResBadgeStyle(resStatusStr)}`}>
                          {resStatusStr}
                        </span>
                      </td>

                      {/* ICON-ONLY Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Confirm Button */}
                          {resStatusStr === 'Pending' && (
                            <button
                              onClick={() => handleConfirm(res)}
                              className="p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition shadow-2xs"
                              title="Approve & Confirm Reservation"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}

                          {/* Seat Guest Button */}
                          {(resStatusStr === 'Confirmed' || resStatusStr === 'Pending') && (
                            <button
                              onClick={() => handleSeat(res)}
                              className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-2xs"
                              title="Seat Guest at Table"
                            >
                              <Utensils className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(res)}
                            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-2xs"
                            title="Edit Reservation Details"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleOpenDelete(res.id)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                            title="Cancel / Delete Reservation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-gray-400 font-bold">
                    No table reservations found matching selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW / EDIT RESERVATION MODAL */}
      {isResModalOpen && (
        <Modal
          isOpen={isResModalOpen}
          onClose={() => setIsResModalOpen(false)}
          title={editingRes ? `Edit Table Reservation #${editingRes.id}` : 'Create New Table Reservation'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Customer / Guest Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Waqas"
                  value={resCustomer}
                  onChange={(e) => setResCustomer(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0302-8808967"
                  value={resPhone}
                  onChange={(e) => setResPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Branch</label>
                <select
                  value={resBranch}
                  onChange={(e) => setResBranch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 cursor-pointer"
                >
                  {safeBranches.map(b => {
                    const label = typeof b === 'object' ? (b.name || b.code || String(b)) : String(b);
                    return <option key={label} value={label}>{label}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Party Size (Guests)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={resGuests}
                  onChange={(e) => setResGuests(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Table</label>
                <select
                  value={resTable}
                  onChange={(e) => setResTable(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                  {safeTables.map(t => {
                    const tName = typeof t === 'object' ? (t.name || t.full_name) : String(t);
                    const tRoom = typeof t === 'object' ? (t.room || 'Main Hall') : 'Main Hall';
                    return <option key={t.full_name || tName} value={tName}>{tName} ({tRoom})</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                <select
                  value={resStatus}
                  onChange={(e) => setResStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 cursor-pointer font-bold"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Occasion / Special Notes</label>
              <input
                type="text"
                placeholder="e.g. Birthday Celebration, High Chair required"
                value={resOccasion}
                onChange={(e) => setResOccasion(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsResModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSaving ? 'Saving to Database...' : (editingRes ? 'Update Reservation' : 'Create Table Reservation')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE RESERVATION CONFIRMATION MODAL */}
      {isDeleteResModalOpen && (
        <Modal isOpen={isDeleteResModalOpen} onClose={() => setIsDeleteResModalOpen(false)} title="Cancel Table Reservation">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <p className="text-xs font-bold">
                Are you sure you want to cancel and remove reservation <span className="underline font-extrabold">#{deletingResId}</span> from the system?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteResModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs transition"
              >
                Cancel Reservation
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
