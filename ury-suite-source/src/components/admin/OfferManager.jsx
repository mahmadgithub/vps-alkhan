import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Tag, Plus, Trash2, Calendar, Percent, Banknote } from 'lucide-react';
import Modal from '../common/Modal';

export default function OfferManager() {
  const { offers = [], addOffer, toggleOfferStatus, deleteOffer } = useRestaurant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState('Fixed Amount');
  const [amount, setAmount] = useState(100);
  const [minOrder, setMinOrder] = useState(500);
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState('2026-12-31');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!code.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await addOffer({
        code: code.trim().toUpperCase(),
        title,
        discount_type: discountType,
        amount: Number(amount),
        min_order: Number(minOrder),
        valid_from: validFrom,
        valid_till: validTo
      });
      setIsModalOpen(false);
      setCode('');
      setTitle('');
    } catch (err) {
      console.error('Offer save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-green-600" /> Discounts & Promotional Offers
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Create, manage, and toggle promo coupon codes for online checkout and cashier POS</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm transition"
        >
          <Plus className="h-4 w-4" /> Create New Promo Code
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.length === 0 ? (
          <div className="col-span-full bg-white p-10 text-center rounded-2xl border border-gray-200 text-xs text-gray-400 font-bold">
            No discount promotional offers created yet.
          </div>
        ) : (
          offers.map(off => (
            <div key={off.code} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-green-400 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1.5 rounded-xl bg-green-50 border border-green-200 text-green-800 font-black text-xs uppercase tracking-wider">
                    {off.code}
                  </span>

                  <button
                    onClick={() => toggleOfferStatus(off.code, off.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      off.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {off.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-gray-900 line-clamp-1">{off.title || off.description || `Coupon ${off.code}`}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg border border-green-100">
                      {off.discount || (off.discount_type === 'Percentage' ? `${off.amount || off.discount_value}% OFF` : `Rs ${off.amount || off.discount_value} OFF`)}
                    </span>
                    {off.min_order > 0 && (
                      <span className="text-[11px] text-gray-500 font-semibold">
                        Min: Rs {off.min_order}
                      </span>
                    )}
                  </div>
                </div>

                {(off.valid_from || off.valid_to) && (
                  <div className="text-[11px] text-gray-400 flex items-center gap-1 font-medium pt-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    Valid: {off.valid_from || 'Now'} to {off.valid_to || 'Unlimited'}
                  </div>
                )}
              </div>

              {/* Footer Actions: Delete Icon */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                <button
                  onClick={() => deleteOffer(off.code)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                  title="Delete Offer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE NEW PROMO OFFER MODAL */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Promo Offer / Discount">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Coupon Promo Code</label>
              <input
                type="text"
                placeholder="e.g. FLAT500 or SAVE20"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 uppercase outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Offer Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Rs 500 Off On Weekend Orders"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
                >
                  <option value="Fixed Amount">Fixed Amount (Rs)</option>
                  <option value="Percentage">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Discount Value</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Min Order Requirement (Rs)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  required
                  min="0"
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Valid Till Date</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  required
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
                {isSaving ? 'Saving Offer...' : 'Publish Promo Offer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
