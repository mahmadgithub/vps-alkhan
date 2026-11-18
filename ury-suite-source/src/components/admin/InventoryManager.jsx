import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Boxes, Edit3, Search, AlertTriangle, Plus } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function InventoryManager() {
  const { inventory = [], updateInventoryStock } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [newThreshold, setNewThreshold] = useState(5);
  const [isAvailable, setIsAvailable] = useState(true);

  const safeInventory = Array.isArray(inventory) ? inventory : [];

  const filteredInventory = safeInventory.filter(i => {
    const itemName = (i?.item_name || i?.name || '').toLowerCase();
    const itemCode = (i?.item_code || i?.code || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return itemName.includes(query) || itemCode.includes(query);
  });

  const handleOpenEdit = (item) => {
    if (!item) return;
    setEditingItem(item);
    setNewStock(item.stock ?? 0);
    setNewThreshold(item.threshold ?? 5);
    setIsAvailable(item.status === 'In Stock' || item.status === 'Available' || item.is_available === 1);
  };

  const handleSaveStock = () => {
    if (!editingItem) return;
    const code = editingItem.item_code || editingItem.code || editingItem.name;
    updateInventoryStock(code, newStock, newThreshold, isAvailable);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Inventory Stock Control</h2>
          <p className="text-xs text-gray-500">Track raw ingredient quantities, low stock alerts & threshold triggers</p>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search raw items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Item Code</th>
                <th className="py-3.5 px-4">Ingredient Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Low Threshold</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400 font-bold">
                    No inventory stock items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => (
                  <tr key={item.item_code || item.name} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4 font-bold text-green-700">{item.item_code || item.code || 'INV-RAW'}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{item.item_name || item.name || 'Ingredient'}</td>
                    <td className="py-3.5 px-4 text-gray-600">{item.category || 'General'}</td>
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">{item.stock ?? 0} {item.unit || 'units'}</td>
                    <td className="py-3.5 px-4 text-gray-500">{item.threshold ?? 5} {item.unit || 'units'}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={item.status || ((item.stock ?? 0) <= (item.threshold ?? 5) ? 'Low Stock' : 'In Stock')} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-green-600 hover:text-white text-gray-700 font-bold transition"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Edit Modal */}
      {editingItem && (
        <Modal isOpen={Boolean(editingItem)} onClose={() => setEditingItem(null)} title={`Update Stock — ${editingItem.item_name || editingItem.name}`}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600">Current Stock Quantity</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600">Low Stock Alert Threshold</label>
              <input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-900 mt-1 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="accent-green-600 h-4 w-4"
              />
              <span className="text-xs font-bold text-gray-900">Item Available For Orders</span>
            </label>

            <button
              onClick={handleSaveStock}
              className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition"
            >
              Save Stock Changes
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
