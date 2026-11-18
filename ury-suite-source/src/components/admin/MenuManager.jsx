import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Plus, Edit3, Trash2, Search, Upload, FolderPlus, Tag, Pencil, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';

export default function MenuManager() {
  const {
    menuItems,
    addMenuItem,
    editMenuItem,
    deleteMenuItem,
    categories,
    addCategory,
    editCategory,
    deleteCategory,
    showToast
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  
  // Modals state for Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Modals state for Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Edit Category Modal state
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  // Delete Category Modal state
  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [deletingCat, setDeletingCat] = useState(null);

  // Form states for item
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('burgers');
  const [price, setPrice] = useState(1000);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80');



  // Handle local image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // CATEGORY HANDLERS
  // -------------------------------------------------------------
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
    setIsCatModalOpen(false);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCat(cat);
    setEditCatName(cat.name || '');
    setIsEditCatModalOpen(true);
  };

  const handleSaveEditCat = (e) => {
    e.preventDefault();
    if (!editingCat || !editCatName.trim()) return;
    editCategory(editingCat.id, editCatName.trim());
    setIsEditCatModalOpen(false);
    setEditingCat(null);
  };

  const handleOpenDeleteCat = (cat) => {
    setDeletingCat(cat);
    setIsDeleteCatModalOpen(true);
  };

  const handleConfirmDeleteCat = () => {
    if (!deletingCat) return;
    deleteCategory(deletingCat.id);
    if (selectedCatFilter === deletingCat.id) {
      setSelectedCatFilter('all');
    }
    setIsDeleteCatModalOpen(false);
    setDeletingCat(null);
  };

  // Filtered menu items
  const filtered = menuItems.filter(i => {
    const matchesSearch =
      i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCatFilter === 'all' ||
      i.category.toLowerCase() === selectedCatFilter.toLowerCase() ||
      i.category.toLowerCase().includes(selectedCatFilter.toLowerCase());

    return matchesSearch && matchesCat;
  });

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addMenuItem({ item_name: itemName, category, price: Number(price), description, image });
    setIsAddModalOpen(false);
    setItemName('');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    editMenuItem(editingItem.item_code, { item_name: itemName, category, price: Number(price), description, image });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Menu & Category Manager</h2>
          <p className="text-xs text-gray-500">Create product categories, update dish prices & upload food images</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            />
          </div>

          {/* Add Category Button */}
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs border border-gray-200 transition"
          >
            <FolderPlus className="h-4 w-4 text-green-600" /> Add Category
          </button>

          {/* Add Dish Item Button */}
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setItemName('');
              setPrice(1000);
              setDescription('');
              setImage('');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add New Item
          </button>
        </div>
      </div>

      {/* Category Pills Filter Bar with Edit/Delete Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categories.map(cat => {
            const count = cat.id === 'all'
              ? menuItems.length
              : menuItems.filter(m => m.category.toLowerCase().includes(cat.id.toLowerCase())).length;
            const isActive = selectedCatFilter === cat.id;

            return (
              <div key={cat.id} className="relative flex items-center group shrink-0">
                <button
                  onClick={() => setSelectedCatFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>

                {/* Edit & Delete Action Icons on Category Pills */}
                {cat.id !== 'all' && (
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1 bg-white border border-gray-200 p-0.5 rounded-lg shadow-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEditCat(cat); }}
                      className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Edit Category Name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenDeleteCat(cat); }}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsCatModalOpen(true)}
          className="text-xs font-extrabold text-green-700 hover:underline shrink-0 flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200"
        >
          + New Category
        </button>
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.item_code} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-green-400 transition duration-150">
            <div className="flex gap-3">
              <img src={item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'} alt={item.item_name} className="w-20 h-20 rounded-xl object-cover border border-gray-100 shrink-0" />
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider px-2 py-0.5 bg-green-50 rounded-md border border-green-100 inline-block">{item.category}</span>
                <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.item_name}</h4>
                <div className="text-xs font-extrabold text-green-700">Rs {item.price.toLocaleString()}</div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 line-clamp-2">{item.description || 'Delicious restaurant dish made fresh with premium ingredients.'}</p>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-semibold">Code: {item.item_code}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setItemName(item.item_name);
                    setCategory(item.category);
                    setPrice(item.price);
                    setDescription(item.description || '');
                    setImage(item.image || '');
                  }}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMenuItem(item.item_code)}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE NEW CATEGORY MODAL */}
      {isCatModalOpen && (
        <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Create New Product Category">
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Seafood & Grills, Desserts, Beverages"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
              <p className="text-[10.5px] text-gray-400 mt-1">This category will immediately become available for assigning food dishes.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-xs transition"
              >
                Create Category
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT CATEGORY MODAL */}
      {isEditCatModalOpen && (
        <Modal isOpen={isEditCatModalOpen} onClose={() => setIsEditCatModalOpen(false)} title="Edit Category Name">
          <form onSubmit={handleSaveEditCat} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Category Name</label>
              <input
                type="text"
                required
                autoFocus
                value={editCatName}
                onChange={(e) => setEditCatName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditCatModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-xs transition"
              >
                Update Category
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {isDeleteCatModalOpen && (
        <Modal isOpen={isDeleteCatModalOpen} onClose={() => setIsDeleteCatModalOpen(false)} title="Delete Category">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <p className="text-xs font-bold">
                Are you sure you want to delete category <span className="underline font-extrabold">{deletingCat?.name}</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteCatModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCat}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs transition"
              >
                Delete Category
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD ITEM MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Menu Item">
        <form onSubmit={handleSaveAdd} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-0.5">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g. Special Pepperoni Pizza"
              className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-0.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-0.5">Price (PKR)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>
          </div>

          {/* File Upload Image Dropzone */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Dish Image (File Upload)</label>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <img
                src={image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  id="add-item-file"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="add-item-file"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-xs font-extrabold shadow-2xs transition"
                >
                  <Upload className="h-3.5 w-3.5 text-green-600" /> Choose Image File
                </label>
                <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Select photo from desktop or phone</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-0.5">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Short item description..."
              className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-xs transition"
          >
            Save New Menu Item
          </button>
        </form>
      </Modal>

      {/* EDIT ITEM MODAL */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Menu Item & Image">
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-0.5">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-0.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-0.5">Price (PKR)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>
          </div>

          {/* File Upload Image Dropzone */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Dish Image (Upload & Edit)</label>
            <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <img
                src={image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  id="edit-item-file"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="edit-item-file"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 text-xs font-extrabold shadow-2xs transition"
                >
                  <Upload className="h-3.5 w-3.5 text-green-600" /> Choose New Image File
                </label>
                <span className="text-[10px] text-gray-400 block mt-0.5 truncate">Upload photo to replace dish image</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-0.5">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-xs transition"
          >
            Update Item & Save Image
          </button>
        </form>
      </Modal>

    </div>
  );
}
