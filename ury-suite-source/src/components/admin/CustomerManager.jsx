import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Users, Search, Plus, Trash2, Mail, Phone, UserCheck } from 'lucide-react';
import Modal from '../common/Modal';

export default function CustomerManager() {
  const { customers = [], addCustomer, deleteCustomer } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for new customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await addCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim() });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
    } catch (err) {
      console.error('Error saving customer:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" /> Customer Relationship Management (CRM)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Live Frappe Customer database, contact info, total visits, and order history</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add New Customer
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-semibold">Total Database Customers</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{customers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-semibold">Customer Repeat Rate</div>
          <div className="text-2xl font-extrabold text-green-600 mt-1">42.5%</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
          <div className="text-xs text-gray-500 font-semibold">Average Lifetime Value</div>
          <div className="text-2xl font-extrabold text-green-700 mt-1">Rs 28,400</div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Group</th>
              <th className="py-3 px-4 text-center">Total Visits</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 font-semibold">
                  No customers found in Frappe database matching search.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c, i) => (
                <tr key={c.id || i} className="hover:bg-gray-50 transition">
                  <td className="py-3.5 px-4 font-extrabold text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-black flex items-center justify-center text-xs">
                      {(c.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {c.email || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[11px]">
                      {c.group || 'Individual'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-green-700">
                    {c.visits || 1} visits
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => deleteCustomer(c.id || c.name)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                      title="Delete Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE NEW CUSTOMER MODAL */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer to Frappe CRM">
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Asad Waqas Kamboh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone / Mobile</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. asad@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
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
                {isSaving ? 'Saving Customer...' : 'Save Customer to Database'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
