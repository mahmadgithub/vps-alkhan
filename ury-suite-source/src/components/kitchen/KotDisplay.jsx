import React, { useState, useEffect, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  ChefHat,
  Clock,
  Check,
  Play,
  AlertCircle,
  Utensils,
  Sparkles,
  Flame,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  Search,
  RefreshCw,
  Truck,
  ShoppingBag,
  Package
} from 'lucide-react';
import Modal from '../common/Modal';
import { callUryApi } from '../../api/client';

// Short spoken label for a KOT ticket, used by the voice alert below.
// Falls back gracefully across dine-in / takeaway / delivery order types.
function spokenLabelForKot(kot) {
  const orderType = (kot.order_type || '').toLowerCase();
  if (orderType.includes('delivery')) return 'Delivery order';
  if (orderType.includes('take') || orderType.includes('pickup')) return 'Takeaway order';
  if (kot.table && kot.table !== 'N/A') return `Table ${kot.table}`;
  return 'new order';
}

// Speaks a short voice announcement using the browser's built-in
// text-to-speech (no audio file needed). Silently no-ops on browsers
// without speech synthesis support.
function speakNewKot(kot) {
  try {
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`New order, ${spokenLabelForKot(kot)}`);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('KOT voice alert failed:', error);
  }
}

export default function KotDisplay() {
  const { kots = [], updateKotStatus, fetchLiveData, showToast } = useRestaurant();
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeKotModal, setActiveKotModal] = useState(null);
  const [timeString, setTimeString] = useState(new Date().toLocaleTimeString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalFetchedItems, setModalFetchedItems] = useState([]);
  const [loadingModalItems, setLoadingModalItems] = useState(false);

  const safeKots = Array.isArray(kots) ? kots : [];
  const currentModalKot = activeKotModal
    ? safeKots.find(k => k.name === activeKotModal.name) || activeKotModal
    : null;

  useEffect(() => {
    let isMounted = true;
    if (currentModalKot) {
      const existing = currentModalKot.items || [];
      if (existing.length > 0) {
        setModalFetchedItems(existing);
        setLoadingModalItems(false);
      } else {
        setLoadingModalItems(true);
        const fetchItems = async () => {
          let fetched = [];
          if (currentModalKot.invoice) {
            const invRes = await callUryApi('frappe.client.get', {
              doctype: 'POS Invoice',
              name: currentModalKot.invoice
            }, { silent: true });
            if (invRes?.success && invRes.data && Array.isArray(invRes.data.items)) {
              fetched = invRes.data.items.map(i => ({
                name: i.item_name || i.item_code,
                item_code: i.item_code,
                qty: i.qty,
                notes: i.description || i.comment || ''
              }));
            }
          }
          if (fetched.length === 0 && currentModalKot.name) {
            const kotRes = await callUryApi('frappe.client.get', {
              doctype: 'URY KOT',
              name: currentModalKot.name
            }, { silent: true });
            const childItems = kotRes?.data?.kot_items || kotRes?.data?.items || [];
            if (Array.isArray(childItems) && childItems.length > 0) {
              fetched = childItems.map(i => ({
                name: i.item_name || i.item || i.item_code,
                item_code: i.item || i.item_code,
                qty: i.quantity || i.qty || 1,
                notes: i.comments || i.notes || ''
              }));
            }
          }
          if (isMounted) {
            setModalFetchedItems(fetched);
            setLoadingModalItems(false);
          }
        };
        fetchItems();
      }
    } else {
      setModalFetchedItems([]);
      setLoadingModalItems(false);
    }
    return () => { isMounted = false; };
  }, [activeKotModal?.name, currentModalKot?.items]);

  // Voice alert for newly-arrived KOTs. This component's `kots` prop is
  // refreshed by RestaurantContext's 6s poll (see fetchLiveData), so we
  // diff against the previously-seen ticket names rather than relying on
  // a socket "new ticket" event. `null` means "not initialized yet" —
  // on the very first run we just record the baseline so existing
  // tickets already on screen don't all announce themselves at once.
  const previousKotNamesRef = useRef(null);
  useEffect(() => {
    const currentNames = new Set(safeKots.map(k => k.name));
    if (previousKotNamesRef.current === null) {
      previousKotNamesRef.current = currentNames;
      return;
    }
    if (soundEnabled) {
      const newlyArrived = safeKots.filter(
        k => k.status === 'NEW' && !previousKotNamesRef.current.has(k.name)
      );
      // Cap how many announce at once so a big backlog (e.g. after being
      // offline) doesn't queue a long chain of speech.
      newlyArrived.slice(0, 3).forEach(speakNewKot);
    }
    previousKotNamesRef.current = currentNames;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kots, soundEnabled]);

  const handleRefreshKots = async () => {
    setIsRefreshing(true);
    try {
      if (fetchLiveData) await fetchLiveData();
      if (showToast) showToast('Kitchen KOT tickets synced from server!', 'info');
    } catch (e) {
      console.error('Error syncing KOT tickets:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countAllActive = safeKots.filter(k => k && k.status !== 'SERVED').length;
  const countNew = safeKots.filter(k => k && k.status === 'NEW').length;
  const countPreparing = safeKots.filter(k => k && k.status === 'PREPARING').length;
  const countReady = safeKots.filter(k => k && k.status === 'READY').length;
  const countServed = safeKots.filter(k => k && k.status === 'SERVED').length;

  const allColumns = [
    {
      title: 'NEW ORDERS',
      status: 'NEW',
      icon: Sparkles,
      solidHeader: 'bg-sky-600 text-white',
      badgeBg: 'bg-white/20 text-white',
      cardHover: 'hover:border-sky-500 hover:bg-sky-50/20',
      pillBg: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    {
      title: 'PREPARING IN KITCHEN',
      status: 'PREPARING',
      icon: Flame,
      solidHeader: 'bg-amber-600 text-white',
      badgeBg: 'bg-white/20 text-white',
      cardHover: 'hover:border-amber-500 hover:bg-amber-50/20',
      pillBg: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      title: 'READY TO SERVE',
      status: 'READY',
      icon: CheckCircle2,
      solidHeader: 'bg-green-600 text-white',
      badgeBg: 'bg-white/20 text-white',
      cardHover: 'hover:border-green-500 hover:bg-green-50/20',
      pillBg: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'SERVED ORDERS',
      status: 'SERVED',
      icon: Check,
      solidHeader: 'bg-gray-700 text-white',
      badgeBg: 'bg-white/20 text-white',
      cardHover: 'hover:border-gray-400 hover:bg-gray-50/20',
      pillBg: 'bg-gray-100 text-gray-700 border-gray-200'
    }
  ];

  const displayedColumns = statusFilter === 'ALL'
    ? allColumns.filter(c => c.status !== 'SERVED')
    : allColumns.filter(c => c.status === statusFilter);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4 animate-fade-in">
      
      {/* KDS Header (Delivery Style White Card) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold shadow-xs">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900">Kitchen KOT Display (KDS)</h2>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-[10px] font-extrabold text-green-800 border border-green-200">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Click any card to view detailed ticket breakdown</p>
          </div>
        </div>

        {/* Refresh, Sound & Clock Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleRefreshKots}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1.5 shadow-2xs"
            title="Sync KOT tickets from server"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-green-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh KOTs</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-green-600" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
          </button>

          <div className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 font-extrabold">
            <Clock className="h-4 w-4 text-green-600" />
            <span>{timeString}</span>
          </div>
        </div>

      </div>

      {/* Search Bar & Status Filter Tabs (Delivery Style Bar) */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Left: Search Input + Station Dropdown */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket, table, item, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-8 py-2 rounded-xl text-xs outline-none focus:border-green-600 focus:bg-white transition font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-green-600 cursor-pointer shrink-0"
            >
              <option value="ALL">All Stations</option>
              <option value="Grill & Mains">Grill & Mains</option>
              <option value="Drinks & Bar">Drinks & Bar</option>
              <option value="Desserts">Desserts</option>
            </select>
          </div>

          {/* Right: Status Filter Tabs (All, New Orders, Preparing, Ready, Served) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Active', count: countAllActive },
              { id: 'NEW', label: 'New Orders', count: countNew },
              { id: 'PREPARING', label: 'Preparing', count: countPreparing },
              { id: 'READY', label: 'Ready', count: countReady },
              { id: 'SERVED', label: 'Served', count: countServed }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className={`grid gap-4 ${statusFilter === 'ALL' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
        {displayedColumns.map(col => {
          const colKots = safeKots.filter(k => {
            if (!k) return false;
            const matchesStatus = k.status === col.status;
            const searchLower = searchQuery.toLowerCase().trim();
            const matchesSearch =
              !searchLower ||
              (k.name || '').toLowerCase().includes(searchLower) ||
              String(k.table || '').toLowerCase().includes(searchLower) ||
              (k.order_type && k.order_type.toLowerCase().includes(searchLower)) ||
              (k.items && k.items.some(i => (i.name || '').toLowerCase().includes(searchLower) || (i.notes && i.notes.toLowerCase().includes(searchLower))));

            return matchesStatus && matchesSearch;
          });
          const HeaderIcon = col.icon;
          const isSingleColumn = statusFilter !== 'ALL';

          return (
            <div key={col.status} className="space-y-3">
              
              {/* Column Header (Flat Solid Color) */}
              <div className={`p-3 rounded-xl ${col.solidHeader} flex items-center justify-between shadow-xs`}>
                <div className="flex items-center gap-2">
                  <HeaderIcon className="h-4 w-4" />
                  <h3 className="text-xs font-black tracking-wider uppercase">{col.title}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${col.badgeBg}`}>
                  {colKots.length}
                </span>
              </div>

              {/* Cards List */}
              {colKots.length === 0 ? (
                <div className="bg-white p-8 text-center text-xs text-gray-400 font-medium rounded-xl border border-gray-200 shadow-2xs">
                  No tickets in {col.title.toLowerCase()}
                </div>
              ) : (
                <div className={isSingleColumn ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" : "space-y-2.5"}>
                  {colKots.map(kot => {
                      const isUrgent = kot.elapsed_minutes > 15;
                      const isWarning = kot.elapsed_minutes >= 8 && kot.elapsed_minutes <= 15;
                      const itemsList = Array.isArray(kot.items) ? kot.items : [];
                      const itemCount = itemsList.length > 0
                        ? itemsList.reduce((sum, i) => sum + (Number(i.qty) || 1), 0)
                        : 1;
                      const hasNotes = itemsList.some(i => i.notes);
                      const itemsPreviewText = itemsList.length > 0
                        ? itemsList.map(i => `${i.qty || 1}x ${i.name || i.item_name || i.item_code}`).join(', ')
                        : (kot.invoice ? `Order ${kot.invoice}` : 'Order Item');
                      const orderTypeStr = (kot.order_type || '').toLowerCase();
                      const isDeliveryOrder = orderTypeStr.includes('delivery');
                      const isTakeAwayOrder = !isDeliveryOrder && (orderTypeStr.includes('take') || orderTypeStr.includes('pickup'));
                      const isDineIn = Boolean(kot.restaurant_table) || orderTypeStr.includes('dine');

                      const isRunningOrder = isDineIn && (kot.is_running || (orderTypeStr.includes('running') || orderTypeStr.includes('modified')));

                      const isAddonOrder = isDineIn && !isRunningOrder && (kot.is_addon || (orderTypeStr.includes('add-on') || orderTypeStr.includes('addon') || orderTypeStr.includes('additional')));

                      return (
                        <div
                          key={kot.name}
                          onClick={() => setActiveKotModal(kot)}
                          className={`bg-white p-3.5 rounded-xl border-2 ${
                            isDeliveryOrder
                              ? 'border-purple-400 bg-purple-50/30 shadow-md ring-2 ring-purple-300/40'
                              : isTakeAwayOrder
                              ? 'border-teal-400 bg-teal-50/30 shadow-md ring-2 ring-teal-300/40'
                              : isRunningOrder
                              ? 'border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-400/30'
                              : isAddonOrder
                              ? 'border-sky-400 bg-sky-50/30 shadow-md ring-2 ring-sky-400/30'
                              : 'border-gray-200 shadow-xs'
                          } ${col.cardHover} transition cursor-pointer space-y-2.5 group relative`}
                        >
                          {/* Delivery Order Header Badge */}
                          {isDeliveryOrder && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-sm border border-purple-800">
                              <Truck className="h-4 w-4 shrink-0" />
                              <span>DELIVERY ORDER</span>
                            </div>
                          )}

                          {/* Take Away Order Header Badge */}
                          {isTakeAwayOrder && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-sm border border-teal-800">
                              <ShoppingBag className="h-4 w-4 shrink-0" />
                              <span>TAKE AWAY ORDER</span>
                            </div>
                          )}

                          {/* Priority Running Order Header Badge if applicable */}
                          {isRunningOrder && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10.5px] uppercase tracking-wider shadow-xs animate-pulse">
                              <Flame className="h-3.5 w-3.5 fill-white shrink-0" />
                              <span>🔥 RUNNING ORDER (PRIORITY)</span>
                            </div>
                          )}

                          {/* Add-on Order Header Badge if added to same table before food served */}
                          {isAddonOrder && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 text-white font-black text-[10.5px] uppercase tracking-wider shadow-xs">
                              <Zap className="h-3.5 w-3.5 fill-white shrink-0" />
                              <span>⚡ ADD-ON ORDER (SAME TABLE)</span>
                            </div>
                          )}

                          {/* Compact Top Header Row */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900 group-hover:text-green-700 transition">
                                {kot.name}
                              </span>
                              {kot.restaurant_table && kot.table && !String(kot.table).startsWith('GLB-') && kot.table !== 'N/A' && (
                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wide border bg-gray-100 text-gray-800 border-gray-200">
                                  T:{kot.table}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Elapsed Timer Pill */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${
                                  isUrgent
                                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                                    : isWarning
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                }`}
                              >
                                {kot.elapsed_minutes}m
                              </span>
                              <Maximize2 className="h-3.5 w-3.5 text-gray-400 group-hover:text-green-600 transition" />
                            </div>
                          </div>

                          {/* Compact Items Preview */}
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between text-gray-500 text-[11px] font-semibold">
                              <span>{itemCount} item{itemCount > 1 ? 's' : ''} ({kot.order_type})</span>
                              {hasNotes && (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Note
                                </span>
                              )}
                            </div>
                            
                            <div className="font-bold text-gray-800 text-[11.5px] line-clamp-1">
                              {itemsPreviewText}
                            </div>
                          </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveKotModal(kot);
                            }}
                            className="h-8 px-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-extrabold flex items-center gap-1 transition shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5 text-green-600" /> Details
                          </button>

                          {kot.status === 'NEW' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateKotStatus(kot.name, 'PREPARING');
                              }}
                              className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Play className="h-3.5 w-3.5 fill-white" /> Start Prep
                            </button>
                          )}

                          {kot.status === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateKotStatus(kot.name, 'READY');
                              }}
                              className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" /> Mark Ready
                            </button>
                          )}

                          {kot.status === 'READY' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateKotStatus(kot.name, 'SERVED');
                              }}
                              className="h-8 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-extrabold text-xs transition flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Served
                            </button>
                          )}

                          {kot.status === 'SERVED' && (
                            <div className="h-8 px-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-extrabold text-xs flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-green-600 stroke-[3]" /> Completed
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ticket Detail Popup Modal */}
      {currentModalKot && (
        <Modal
          isOpen={Boolean(currentModalKot)}
          onClose={() => setActiveKotModal(null)}
          title={`Ticket Detail: ${currentModalKot.name}`}
        >
          <div className="space-y-5">
            
            {/* Modal Top Metadata Box */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-base font-black text-gray-900">{currentModalKot.name}</div>
                <div className="text-xs text-green-700 font-extrabold mt-0.5">
                  Table: {currentModalKot.table} • Order Type: {currentModalKot.order_type}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Elapsed Time</span>
                <span className="text-base font-black text-amber-600 flex items-center gap-1 justify-end">
                  <Clock className="h-4 w-4" /> {currentModalKot.elapsed_minutes} minutes
                </span>
              </div>
            </div>

            {/* Detailed Line Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Order Items & Notes</h4>
              
              {loadingModalItems ? (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs font-semibold text-green-700 animate-pulse">
                  Loading ticket line items...
                </div>
              ) : modalFetchedItems && modalFetchedItems.length > 0 ? (
                <div className="space-y-2.5 divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                  {modalFetchedItems.map((item, idx) => (
                    <div key={idx} className="pt-2.5 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 font-black border border-green-200">
                            {item.qty || item.quantity || 1}×
                          </span>
                          <span className="font-extrabold text-gray-900 text-sm">
                            {item.name || item.item_name || item.item_code}
                          </span>
                        </div>
                      </div>

                      {item.notes && item.notes.trim() !== '' && item.notes !== item.name && item.notes !== item.item_code && (
                        <div className="ml-8 bg-amber-50 text-amber-900 border border-amber-200/90 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-2 shadow-2xs">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-900">Chef Instruction: </span>
                            <span>{item.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs font-semibold text-gray-500">
                  No items listed for this ticket.
                </div>
              )}
            </div>

            {/* Modal Bottom Action Button */}
            <div className="pt-3 border-t border-gray-100">
              {currentModalKot.status === 'NEW' && (
                <button
                  onClick={() => {
                    updateKotStatus(currentModalKot.name, 'PREPARING');
                    setActiveKotModal(null);
                  }}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4 fill-white" /> Start Preparing Order
                </button>
              )}

              {currentModalKot.status === 'PREPARING' && (
                <button
                  onClick={() => {
                    updateKotStatus(currentModalKot.name, 'READY');
                    setActiveKotModal(null);
                  }}
                  className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4 stroke-[3]" /> Mark Order Ready To Serve
                </button>
              )}

              {currentModalKot.status === 'READY' && (
                <button
                  onClick={() => {
                    updateKotStatus(currentModalKot.name, 'SERVED');
                    setActiveKotModal(null);
                  }}
                  className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs border border-gray-200 transition flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4 text-green-600" /> Served To Customer Table
                </button>
              )}
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}
