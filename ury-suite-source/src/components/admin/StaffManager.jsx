import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  UserCheck,
  Shield,
  Clock,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ChefHat,
  Truck,
  CreditCard,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function StaffManager() {
  const { staff = [], addStaff, updateStaff, deleteStaff } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState(null);

  // Saving loading state
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('Waiter');
  const [formShift, setFormShift] = useState('Evening (4PM - 12AM)');
  const [formStatus, setFormStatus] = useState('Active');

  const roleOptions = [
    { label: 'Waiter', icon: Clock },
    { label: 'Kitchen Chef', icon: ChefHat },
    { label: 'Delivery Rider', icon: Truck },
    { label: 'Cashier (POS)', icon: CreditCard },
    { label: 'Manager / Admin', icon: Shield }
  ];

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('0300-1234567');
    setFormRole('Waiter');
    setFormShift('Evening (4PM - 12AM)');
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setFormName(s.name);
    setFormEmail(s.email || s.id);
    setFormPhone(s.phone || '0300-1234567');
    setFormRole(s.role);
    setFormShift(s.shift || 'Evening (4PM - 12AM)');
    setFormStatus(s.status || 'Active');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, {
          name: formName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          shift: formShift,
          status: formStatus
        });
      } else {
        await addStaff({
          name: formName,
          email: formEmail,
          phone: formPhone,
          role: formRole,
          shift: formShift,
          status: formStatus
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Staff save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDelete = (s) => {
    setDeletingStaff(s);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff || isSaving) return;
    setIsSaving(true);
    try {
      await deleteStaff(deletingStaff.id);
      setIsDeleteModalOpen(false);
      setDeletingStaff(null);
    } catch (err) {
      console.error('Staff delete error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered staff members
  const filteredStaff = staff.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.role || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || (s.role || '').toLowerCase().includes(roleFilter.toLowerCase());

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-green-600" /> Staff Management & Role Assignment
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage team members, assign operational roles, shifts & permissions (Frappe User API)</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs transition shadow-sm self-start md:self-auto"
        >
          <UserPlus className="h-4 w-4" /> Add New Staff Member
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff name, ID or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
          />
        </div>

        {/* Role Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'Waiter', 'Chef', 'Rider', 'Cashier', 'Admin'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>

      </div>

      {/* Staff Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff User ID</th>
                <th className="py-3.5 px-4">Name & Contact</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Shift Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 font-bold">
                    No matching staff members found in Frappe database.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4 font-bold text-green-700 max-w-[160px] truncate">{s.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{s.name}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 font-semibold mt-0.5">
                        <Phone className="h-3 w-3" /> {s.phone || '0300-1234567'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 font-extrabold text-[11px] border border-gray-200 inline-flex items-center gap-1.5">
                        {s.role.includes('Chef') ? <ChefHat className="h-3.5 w-3.5 text-amber-600" /> :
                         s.role.includes('Rider') ? <Truck className="h-3.5 w-3.5 text-blue-600" /> :
                         s.role.includes('Cashier') ? <CreditCard className="h-3.5 w-3.5 text-purple-600" /> :
                         s.role.includes('Admin') || s.role.includes('Manager') ? <Shield className="h-3.5 w-3.5 text-red-600" /> :
                         <Clock className="h-3.5 w-3.5 text-green-600" />}
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-semibold">{s.shift}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {/* Icon-Only Action Buttons */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-2xs"
                          title="Edit Staff Member"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(s)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                          title="Remove Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStaff ? `Edit Staff Member: ${editingStaff.name}` : 'Add New Staff Member'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Name Input */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Staff Full Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. Faisal Khan"
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">User Email / ID</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. faisal@alkhan.com"
                  disabled={!!editingStaff}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                  placeholder="0300-1234567"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Role & Shift */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Operational Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
                >
                  <option value="Waiter">Waiter (URY Captain)</option>
                  <option value="Kitchen Chef">Kitchen Chef (URY Kitchen Staff)</option>
                  <option value="Delivery Rider">Delivery Rider (URY Rider)</option>
                  <option value="Cashier (POS)">Cashier POS (URY Cashier)</option>
                  <option value="Manager / Admin">Manager / Admin (URY Manager)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Shift Schedule</label>
                <select
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
                >
                  <option value="Morning (8AM - 4PM)">Morning (8AM - 4PM)</option>
                  <option value="Evening (4PM - 12AM)">Evening (4PM - 12AM)</option>
                  <option value="Night (12AM - 8AM)">Night (12AM - 8AM)</option>
                </select>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Account Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
              >
                <option value="Active">Active (Enabled)</option>
                <option value="Inactive">Inactive (Disabled)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSaving ? 'Saving Staff Member...' : (editingStaff ? 'Update Staff Member' : 'Create Staff Member')}
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* DELETE STAFF CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Staff Account">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <p className="text-xs font-bold">
                Are you sure you want to delete staff account <span className="underline font-extrabold">{deletingStaff?.name}</span> ({deletingStaff?.id})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSaving ? 'Deleting Staff...' : 'Delete Staff Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
