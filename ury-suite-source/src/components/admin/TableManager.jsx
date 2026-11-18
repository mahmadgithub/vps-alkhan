import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Plus, Building2, Home, Users, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import Modal from '../common/Modal';

export default function TableManager() {
  const {
    tables = [],
    addTable,
    editTable,
    deleteTable,
    rooms: contextRooms,
    addRoom,
    editRoom,
    deleteRoom,
    showToast
  } = useRestaurant();

  // Add Modals state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Edit Table Modal state
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [editTableName, setEditTableName] = useState('');
  const [editTableRoom, setEditTableRoom] = useState('Main Hall');
  const [editCapacity, setEditCapacity] = useState(4);

  // Delete Table Modal state
  const [isDeleteTableModalOpen, setIsDeleteTableModalOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);

  // Edit Room Modal state
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [newEditRoomName, setNewEditRoomName] = useState('');

  // Delete Room Modal state
  const [isDeleteRoomModalOpen, setIsDeleteRoomModalOpen] = useState(false);
  const [deletingRoomName, setDeletingRoomName] = useState('');

  // Saving loading states
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Dining Rooms list from context or fallback
  const rooms = contextRooms && contextRooms.length > 0
    ? contextRooms
    : ['Main Hall', 'Terrace', 'VIP Lounge', 'Rooftop', 'Family Hall'];

  const [selectedRoomFilter, setSelectedRoomFilter] = useState('All');

  // Form state for new table
  const [tableName, setTableName] = useState('');
  const [room, setRoom] = useState('Main Hall');
  const [capacity, setCapacity] = useState(4);

  // Form state for new room
  const [newRoomName, setNewRoomName] = useState('');

  // -------------------------------------------------------------
  // HANDLERS FOR NEW TABLE & ROOM
  // -------------------------------------------------------------
  const handleSaveTable = async (e) => {
    e.preventDefault();
    if (!tableName.trim() || isSavingTable) return;
    setIsSavingTable(true);
    try {
      await addTable({ name: tableName, room, capacity: Number(capacity) });
      setIsTableModalOpen(false);
      setTableName('');
    } catch (err) {
      console.error('Error saving table:', err);
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const cleanRoomName = newRoomName.trim();
    if (!cleanRoomName || isSavingRoom) return;

    if (rooms.some(r => r.toLowerCase() === cleanRoomName.toLowerCase())) {
      if (showToast) showToast(`Room "${cleanRoomName}" already exists!`, 'warning');
      return;
    }

    setIsSavingRoom(true);
    try {
      if (addRoom) {
        await addRoom(cleanRoomName);
      }
      setRoom(cleanRoomName);
      setNewRoomName('');
      setIsRoomModalOpen(false);
    } catch (err) {
      console.error('Error saving room:', err);
    } finally {
      setIsSavingRoom(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS FOR EDIT & DELETE TABLE
  // -------------------------------------------------------------
  const handleOpenEditTable = (table) => {
    setEditingTable(table);
    setEditTableName(table.name || '');
    setEditTableRoom(table.room || 'Main Hall');
    setEditCapacity(table.capacity || 4);
    setIsEditTableModalOpen(true);
  };

  const handleSaveEditTable = async (e) => {
    e.preventDefault();
    if (!editingTable || isSavingTable) return;
    setIsSavingTable(true);
    try {
      await editTable(editingTable.full_name || editingTable.name, {
        name: editTableName,
        room: editTableRoom,
        capacity: Number(editCapacity)
      });
      setIsEditTableModalOpen(false);
      setEditingTable(null);
    } catch (err) {
      console.error('Error editing table:', err);
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleOpenDeleteTable = (table) => {
    setDeletingTable(table);
    setIsDeleteTableModalOpen(true);
  };

  const handleConfirmDeleteTable = async () => {
    if (!deletingTable || isSavingTable) return;
    setIsSavingTable(true);
    try {
      await deleteTable(deletingTable.full_name || deletingTable.name);
      setIsDeleteTableModalOpen(false);
      setDeletingTable(null);
    } catch (err) {
      console.error('Error deleting table:', err);
    } finally {
      setIsSavingTable(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS FOR EDIT & DELETE ROOM
  // -------------------------------------------------------------
  const handleOpenEditRoom = (roomName) => {
    setEditingRoomName(roomName);
    setNewEditRoomName(roomName);
    setIsEditRoomModalOpen(true);
  };

  const handleSaveEditRoom = async (e) => {
    e.preventDefault();
    if (!editingRoomName || !newEditRoomName.trim() || isSavingRoom) return;
    setIsSavingRoom(true);
    try {
      await editRoom(editingRoomName, newEditRoomName);
      if (selectedRoomFilter === editingRoomName) {
        setSelectedRoomFilter(newEditRoomName.trim());
      }
      setIsEditRoomModalOpen(false);
      setEditingRoomName('');
    } catch (err) {
      console.error('Error editing room:', err);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleOpenDeleteRoom = (roomName) => {
    setDeletingRoomName(roomName);
    setIsDeleteRoomModalOpen(true);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!deletingRoomName || isSavingRoom) return;
    setIsSavingRoom(true);
    try {
      await deleteRoom(deletingRoomName);
      if (selectedRoomFilter === deletingRoomName) {
        setSelectedRoomFilter('All');
      }
      setIsDeleteRoomModalOpen(false);
      setDeletingRoomName('');
    } catch (err) {
      console.error('Error deleting room:', err);
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Filtered tables by selected room
  const filteredTables = tables.filter(t => {
    if (selectedRoomFilter === 'All') return true;
    return (t.room || '').toLowerCase() === selectedRoomFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-600" /> Restaurant Table & Room Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Configure dining rooms, edit seating capacities, and track real-time floor availability</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Dining Room Button */}
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs border border-gray-200 transition"
          >
            <Building2 className="h-4 w-4 text-green-600" /> Add Dining Room
          </button>

          {/* Add Table Button */}
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add New Table
          </button>
        </div>
      </div>

      {/* Dining Rooms Filter Bar with Edit/Delete Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {['All', ...rooms].map(r => {
            const count = r === 'All' ? tables.length : tables.filter(t => (t.room || '').toLowerCase() === r.toLowerCase()).length;
            const isActive = selectedRoomFilter === r;

            return (
              <div key={r} className="relative flex items-center group shrink-0">
                <button
                  onClick={() => setSelectedRoomFilter(r)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>{r === 'All' ? 'All Dining Rooms' : r}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>

                {/* Edit & Delete Action Icons on Room Pills */}
                {r !== 'All' && (
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1 bg-white border border-gray-200 p-0.5 rounded-lg shadow-sm">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEditRoom(r); }}
                      className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Edit Room Name"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {r !== 'Main Hall' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteRoom(r); }}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setIsRoomModalOpen(true)}
          className="text-xs font-extrabold text-green-700 hover:underline shrink-0 flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200"
        >
          + New Room
        </button>
      </div>

      {/* Tables Floor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredTables.length === 0 ? (
          <div className="col-span-full bg-white p-10 text-center rounded-2xl border border-gray-200 text-xs text-gray-400 font-bold">
            No tables configured in {selectedRoomFilter === 'All' ? 'restaurant' : selectedRoomFilter}
          </div>
        ) : (
          filteredTables.map(t => (
            <div key={t.full_name || t.name} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between gap-3 hover:border-green-400 transition">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-black text-gray-900">{t.name}</span>
                  <Badge status={t.status} />
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                    <Users className="h-3.5 w-3.5 text-green-600" /> {t.capacity} Seating Capacity
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-100 inline-block">
                    Room: {t.room || 'Main Hall'}
                  </div>
                </div>
              </div>

              {/* Table Action Buttons: ICON-ONLY */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditTable(t)}
                  className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition shadow-2xs"
                  title="Edit Table"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenDeleteTable(t)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-2xs"
                  title="Delete Table"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE NEW DINING ROOM MODAL */}
      {isRoomModalOpen && (
        <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Add New Dining Room / Area">
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Dining Room / Section Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Garden Patio, Rooftop Deck, Executive VIP"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
              <p className="text-[10.5px] text-gray-400 mt-1">This room will become available for table placements and waiter assignments.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingRoom}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingRoom && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingRoom ? 'Saving Room...' : 'Create Dining Room'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT DINING ROOM MODAL */}
      {isEditRoomModalOpen && (
        <Modal isOpen={isEditRoomModalOpen} onClose={() => setIsEditRoomModalOpen(false)} title="Edit Dining Room Name">
          <form onSubmit={handleSaveEditRoom} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Dining Room Name</label>
              <input
                type="text"
                required
                value={newEditRoomName}
                onChange={(e) => setNewEditRoomName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditRoomModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingRoom}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingRoom && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingRoom ? 'Updating Room...' : 'Update Room'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE DINING ROOM CONFIRMATION MODAL */}
      {isDeleteRoomModalOpen && (
        <Modal isOpen={isDeleteRoomModalOpen} onClose={() => setIsDeleteRoomModalOpen(false)} title="Delete Dining Room">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <p className="text-xs font-bold">
                Are you sure you want to delete <span className="underline font-extrabold">{deletingRoomName}</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteRoomModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoom}
                disabled={isSavingRoom}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingRoom && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingRoom ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE NEW TABLE MODAL */}
      {isTableModalOpen && (
        <Modal isOpen={isTableModalOpen} onClose={() => setIsTableModalOpen(false)} title="Add New Table">
          <form onSubmit={handleSaveTable} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Table Identifier / Code</label>
              <input
                type="text"
                placeholder="e.g. T11"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Dining Room</label>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
                >
                  {rooms.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTable}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingTable && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingTable ? 'Saving to Database...' : 'Save Table Configuration'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT TABLE MODAL */}
      {isEditTableModalOpen && (
        <Modal isOpen={isEditTableModalOpen} onClose={() => setIsEditTableModalOpen(false)} title="Edit Table Configuration">
          <form onSubmit={handleSaveEditTable} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Table Code / Identifier</label>
              <input
                type="text"
                required
                value={editTableName}
                onChange={(e) => setEditTableName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Dining Room</label>
                <select
                  value={editTableRoom}
                  onChange={(e) => setEditTableRoom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white cursor-pointer"
                >
                  {rooms.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-green-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsEditTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTable}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingTable && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingTable ? 'Updating Table...' : 'Update Table'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE TABLE CONFIRMATION MODAL */}
      {isDeleteTableModalOpen && (
        <Modal isOpen={isDeleteTableModalOpen} onClose={() => setIsDeleteTableModalOpen(false)} title="Delete Table">
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl text-red-800 border border-red-100">
              <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" />
              <p className="text-xs font-bold">
                Are you sure you want to delete table <span className="underline font-extrabold">{deletingTable?.name}</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsDeleteTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTable}
                disabled={isSavingTable}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-2"
              >
                {isSavingTable && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSavingTable ? 'Deleting Table...' : 'Delete Table'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
