import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { callUryApi } from '../../api/client';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Printer,
  Calendar,
  CreditCard,
  Award,
  Building2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ShoppingBag,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt,
  Clock,
  Ban,
  Gauge,
  Package,
  Repeat,
  UserPlus,
  ClipboardList,
  Factory,
  CheckCircle2,
  Filter,
  Phone,
  ExternalLink
} from 'lucide-react';

export default function ReportsHub() {
  const { selectedBranch = 'Gulberg III' } = useRestaurant();
  
  // Category & Sub-Report State
  const [activeCategory, setActiveCategory] = useState('sales'); // 'sales', 'items', 'employees', 'financial'
  const [activeReportId, setActiveReportId] = useState('daywise-sales');

  // Filters
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month'
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemGroup, setSelectedItemGroup] = useState('');
  const [page, setPage] = useState(1);

  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [itemGroups, setItemGroups] = useState([]);

  // Category definitions matching Frappe /ury/reports/
  const categories = [
    {
      id: 'sales',
      label: 'Sales Summary',
      icon: TrendingUp,
      reports: [
        { id: 'daywise-sales', label: 'Daywise Sales', icon: Calendar },
        { id: 'daywise-invoices', label: 'Daywise Invoices', icon: Receipt },
        { id: 'month-wise-sales', label: 'Month Wise Sales', icon: BarChart3 },
        { id: 'time-wise-sales', label: 'Time Wise Sales', icon: Clock },
        { id: 'service-wise-sales', label: 'Service Wise Sales', icon: PieChart },
        { id: 'cancelled-invoices', label: 'Cancelled Invoices', icon: Ban },
        { id: 'average-bill-value', label: 'Average Bill Value', icon: Gauge },
      ]
    },
    {
      id: 'items',
      label: 'Customers & Items',
      icon: Package,
      reports: [
        { id: 'item-wise-sales', label: 'Item Wise Sales', icon: Package },
        { id: 'item-wise-purchase-history', label: 'Item Purchase History', icon: ShoppingBag },
        { id: 'customer-data', label: 'Customer Purchase Data', icon: Users },
        { id: 'daywise-customer-details', label: 'Daywise Customer Details', icon: UserPlus },
        { id: 'repeated-customers', label: 'Repeated Customers', icon: Repeat },
      ]
    },
    {
      id: 'employees',
      label: 'Employees & Operations',
      icon: Award,
      reports: [
        { id: 'employee-sales', label: 'Employee Sales', icon: UserCheck },
        { id: 'employee-item-wise-sales', label: 'Employee Item Wise Sales', icon: ClipboardList },
        { id: 'completed-work-orders', label: 'Completed Work Orders', icon: Factory },
      ]
    },
    {
      id: 'financial',
      label: 'Financial P&L',
      icon: DollarSign,
      reports: [
        { id: 'daily-pnl', label: 'Daily P&L Statement', icon: DollarSign },
      ]
    }
  ];

  // Helper for Start & End Dates
  const calculateDates = useCallback(() => {
    const end = new Date();
    const start = new Date();
    if (dateRange === 'today') {
      // Same day
    } else if (dateRange === 'week') {
      start.setDate(end.getDate() - 6);
    } else if (dateRange === 'month') {
      start.setDate(end.getDate() - 29);
    }
    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    return { start_date: formatDate(start), end_date: formatDate(end) };
  }, [dateRange]);

  // Load Item Groups dropdown once
  useEffect(() => {
    callUryApi('ury.ury.report_api.items.get_item_groups', {}, { silent: true }).then(res => {
      if (res?.success && Array.isArray(res.data)) {
        setItemGroups(res.data.map(ig => ig.name));
      }
    });
  }, []);

  // Main Report Fetcher
  const loadActiveReport = useCallback(async () => {
    setLoading(true);
    const { start_date, end_date } = calculateDates();
    const branchParam = selectedBranchFilter === 'All' ? null : selectedBranchFilter;

    let res = null;
    try {
      switch (activeReportId) {
        case 'daywise-sales':
          res = await callUryApi('ury.ury.report_api.sales.get_daywise_sales', {
            start_date, end_date, branch: branchParam
          });
          break;
        case 'daywise-invoices':
          res = await callUryApi('ury.ury.report_api.sales.get_daywise_invoices', {
            start_date, end_date, branch: branchParam, page, page_size: 50
          });
          break;
        case 'month-wise-sales':
          res = await callUryApi('ury.ury.report_api.sales.get_month_wise_sales', {
            branch: branchParam, months_back: 6
          });
          break;
        case 'time-wise-sales':
          res = await callUryApi('ury.ury.report_api.sales.get_time_wise_sales', {
            date: singleDate, branch: branchParam, bucket_size_hours: 2
          });
          break;
        case 'service-wise-sales':
          res = await callUryApi('ury.ury.report_api.sales.get_service_wise_sales', {
            start_date, end_date, branch: branchParam
          });
          break;
        case 'cancelled-invoices':
          res = await callUryApi('ury.ury.report_api.sales.get_cancelled_invoices', {
            start_date, end_date, branch: branchParam, page, page_size: 50
          });
          break;
        case 'average-bill-value':
          res = await callUryApi('ury.ury.report_api.sales.get_average_bill_value', {
            start_date, end_date, branch: branchParam
          });
          break;
        case 'item-wise-sales':
          res = await callUryApi('ury.ury.report_api.items.get_item_wise_sales', {
            start_date, end_date, branch: branchParam,
            item_group: selectedItemGroup || null,
            search: searchQuery || null,
            page, page_size: 50
          });
          break;
        case 'item-wise-purchase-history':
          res = await callUryApi('ury.ury.report_api.items.get_item_wise_purchase_history', {
            start_date, end_date, branch: branchParam, page, page_size: 50
          });
          break;
        case 'customer-data':
          res = await callUryApi('ury.ury.report_api.customers.get_customer_data', {
            customer: searchQuery || 'Cash Customer', start_date, end_date, branch: branchParam, page, page_size: 50
          });
          break;
        case 'daywise-customer-details':
          res = await callUryApi('ury.ury.report_api.customers.get_daywise_customer_details', {
            start_date, end_date, branch: branchParam
          });
          break;
        case 'repeated-customers':
          res = await callUryApi('ury.ury.report_api.customers.get_repeated_customers', {
            start_date, end_date, branch: branchParam
          });
          break;
        case 'employee-sales':
          res = await callUryApi('ury.ury.report_api.employees.get_employee_sales', {
            start_date, end_date, branch: branchParam, sort_by: 'sales_amount'
          });
          break;
        case 'employee-item-wise-sales':
          res = await callUryApi('ury.ury.report_api.employees.get_employee_item_wise_sales', {
            employee: searchQuery || 'Administrator', start_date, end_date, branch: branchParam
          });
          break;
        case 'completed-work-orders':
          res = await callUryApi('ury.ury.report_api.operations.get_completed_work_orders', {
            start_date, end_date
          });
          break;
        case 'daily-pnl':
          res = await callUryApi('ury.ury.report_api.financial.get_daily_pnl', {
            date: singleDate, branch: branchParam || 'Gulberg III'
          });
          break;
        default:
          break;
      }
      if (res?.success && res?.data) {
        setReportData(res.data);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Report fetch error:', err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeReportId, calculateDates, selectedBranchFilter, singleDate, searchQuery, selectedItemGroup, page]);

  useEffect(() => {
    loadActiveReport();
  }, [loadActiveReport]);

  // Handle Category Switch
  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    const catObj = categories.find(c => c.id === catId);
    if (catObj && Array.isArray(catObj.reports) && catObj.reports.length > 0) {
      setActiveReportId(catObj.reports[0].id);
      setPage(1);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!reportData) return;
    let csvRows = [];

    const activeReport = categories
      .flatMap(c => c.reports)
      .find(r => r.id === activeReportId);

    csvRows.push([`Report: ${activeReport?.label || activeReportId}`]);
    csvRows.push([`Branch: ${selectedBranchFilter}`, `Date Range: ${dateRange}`]);
    csvRows.push([]);

    if (activeReportId === 'daywise-sales' && Array.isArray(reportData.rows)) {
      csvRows.push(['Date', 'Invoices', 'Item Total (PKR)', 'Taxes (PKR)', 'Grand Total (PKR)', 'Cash Discounts (PKR)']);
      reportData.rows.forEach(r => csvRows.push([r.date, r.total_invoices, r.item_total, r.total_taxes, r.grand_total, r.cash_discount]));
    } else if (activeReportId === 'item-wise-sales' && Array.isArray(reportData.items)) {
      csvRows.push(['Item Code', 'Item Name', 'Category', 'Avg Price (PKR)', 'Qty Sold', 'Gross Amount (PKR)', 'Contribution %']);
      reportData.items.forEach(r => csvRows.push([r.item_code, `"${r.item_name}"`, r.item_group, r.avg_price, r.qty, r.amount, `${r.pct_of_total_amount}%`]));
    } else if (activeReportId === 'service-wise-sales' && Array.isArray(reportData.by_service_type)) {
      csvRows.push(['Service Channel', 'Order Count', 'Revenue (PKR)', 'Avg Order Value (PKR)', 'Share %']);
      reportData.by_service_type.forEach(r => csvRows.push([r.order_type, r.order_count, r.revenue, r.avg_order_value, `${r.percentage_of_total}%`]));
    } else if (activeReportId === 'employee-sales' && Array.isArray(reportData.employees)) {
      csvRows.push(['Rank', 'Staff Member', 'Invoices', 'Sales Amount (PKR)', 'Avg Invoice Value (PKR)']);
      reportData.employees.forEach(r => csvRows.push([`#${r.rank}`, `"${r.employee_name}"`, r.total_invoices, r.sales_amount, r.average_invoice_value]));
    } else if (activeReportId === 'employee-item-wise-sales' && Array.isArray(reportData.items)) {
      csvRows.push(['Item Code', 'Item Name', 'Category', 'Qty Sold', 'Total Amount (PKR)']);
      reportData.items.forEach(r => csvRows.push([r.item_code, `"${r.item_name}"`, r.item_group, r.qty, r.amount]));
    } else {
      csvRows.push(['Summary Field', 'Value']);
      if (reportData.summary && typeof reportData.summary === 'object' && !Array.isArray(reportData.summary)) {
        Object.entries(reportData.summary).forEach(([k, v]) => csvRows.push([k, v]));
      }
    }

    const csvString = csvRows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeReportId}_report_${selectedBranchFilter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCategoryObj = categories.find(c => c.id === activeCategory);
  const currentReportObj = currentCategoryObj?.reports.find(r => r.id === activeReportId);

  return (
    <div className="space-y-6 animate-fade-in printable-area">
      
      {/* Printable Official Frappe Letterhead Header (Only Visible in Print Mode) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
              URY RESTAURANT SUITE
            </h1>
            <h2 className="text-sm font-extrabold text-green-800 uppercase tracking-wide">
              {currentReportObj?.label || 'OFFICIAL REPORT STATEMENT'}
            </h2>
            <p className="text-[11px] text-gray-600 font-semibold">
              Official Frappe ERPNext Business Performance & Audit Statement
            </p>
          </div>
          <div className="text-right text-[11px] text-gray-800 space-y-0.5 font-medium">
            <p><span className="font-extrabold">Branch:</span> {selectedBranchFilter}</p>
            <p><span className="font-extrabold">Date Filter:</span> {dateRange.toUpperCase()} ({singleDate})</p>
            <p><span className="font-extrabold">Printed On:</span> {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString()}</p>
            <p><span className="font-extrabold">Printed By:</span> Administrator</p>
          </div>
        </div>
      </div>

      {/* Header & Category Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-green-600" /> Reports & Business Analytics Hub
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Live Frappe ERPNext Backend Reporting (`http://194.60.87.92:8090/app` Query Reports format)</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition border border-gray-200"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-green-700" /> Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs transition shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" /> Print Report
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sub-Reports Selector Pills */}
        {currentCategoryObj && Array.isArray(currentCategoryObj.reports) && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
            {currentCategoryObj.reports.map(rep => {
              const Icon = rep.icon;
              const isActive = activeReportId === rep.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => { setActiveReportId(rep.id); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {rep.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="Gulberg III">Gulberg III</option>
              <option value="DHA Phase 5">DHA Phase 5</option>
              <option value="Johar Town">Johar Town</option>
            </select>
          </div>

          {/* Date Selector (Single vs Range) */}
          {['time-wise-sales', 'daily-pnl'].includes(activeReportId) ? (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="today">Today</option>
                <option value="week">This Week (7 Days)</option>
                <option value="month">This Month (30 Days)</option>
              </select>
            </div>
          )}

          {/* Item Group Filter for Item Sales */}
          {activeReportId === 'item-wise-sales' && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={selectedItemGroup}
                onChange={(e) => { setSelectedItemGroup(e.target.value); setPage(1); }}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="">All Item Groups</option>
                {Array.isArray(itemGroups) && itemGroups.map((ig, i) => <option key={i} value={ig}>{ig}</option>)}
              </select>
            </div>
          )}

          {/* Search Bar for Searchable Reports */}
          {['item-wise-sales', 'customer-data', 'employee-item-wise-sales'].includes(activeReportId) && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeReportId === 'item-wise-sales' ? "Search dish name..." :
                  activeReportId === 'customer-data' ? "Search customer name..." : "Search staff name..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-green-600"
              />
            </div>
          )}

        </div>

        {/* Live Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-green-700 font-bold">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" /> Querying Frappe ERPNext API...
          </div>
        )}
      </div>

      {/* REPORT CONTENT VIEW */}
      <div className="min-h-[400px]">
        {loading && !reportData ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
            <p className="text-xs font-bold text-gray-500">Querying Frappe Live API for {currentReportObj?.label}...</p>
          </div>
        ) : !reportData ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-extrabold text-gray-900">No Records Found</h3>
            <p className="text-xs text-gray-500 font-medium">No backend data available for the selected filters.</p>
          </div>
        ) : (
          renderReportDetails(activeReportId, reportData, page, setPage)
        )}
      </div>

      {/* Printable Official Signature & Stamp Footer (Only Visible in Print Mode) */}
      <div className="hidden print:block pt-12 mt-8 border-t border-gray-300">
        <div className="grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-gray-400 pb-1 mb-2 font-mono">___________________</div>
            <p className="font-bold text-gray-800">Prepared By</p>
            <p className="text-[10px] text-gray-500">Staff / Accountant Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-1 mb-2 font-mono">___________________</div>
            <p className="font-bold text-gray-800">Checked By Manager</p>
            <p className="text-[10px] text-gray-500">Branch Operations Manager</p>
          </div>
          <div>
            <div className="border-b border-gray-400 pb-1 mb-2 font-mono">___________________</div>
            <p className="font-bold text-gray-800">Official Stamp & Authorization</p>
            <p className="text-[10px] text-gray-500">URY Suite Verified Audit</p>
          </div>
        </div>
        <div className="text-center text-[10px] text-gray-400 mt-6 pt-2 border-t border-gray-200">
          This report is generated directly from Frappe ERPNext Backend database (`http://194.60.87.92:8090/`). Page 1 of 1
        </div>
      </div>

    </div>
  );
}

// Sub-render function safely guarded against non-array map errors
function renderReportDetails(reportId, data, page, setPage) {
  if (!data) return null;

  switch (reportId) {

    // 1. Daywise Sales
    case 'daywise-sales': {
      const summary = data.summary || {};
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const totalItemVal = rows.reduce((acc, r) => acc + (r.item_total || 0), 0);
      const totalTaxVal = rows.reduce((acc, r) => acc + (r.total_taxes || 0), 0);
      const totalDiscVal = rows.reduce((acc, r) => acc + (r.cash_discount || 0), 0);
      const totalGrandVal = rows.reduce((acc, r) => acc + (r.grand_total || 0), 0);
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Period Total Sales</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.period_total || 0).toLocaleString()}</div>
              <span className="text-[11px] text-green-600 font-bold">Gross Completed Sales</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Avg Daily Sales</span>
              <div className="text-2xl font-black text-emerald-600">Rs {(summary.period_avg_daily || 0).toLocaleString()}</div>
              <span className="text-[11px] text-gray-500 font-medium">Per day average</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Completed Invoices</span>
              <div className="text-2xl font-black text-gray-900">{(summary.total_invoices || 0).toLocaleString()}</div>
              <span className="text-[11px] text-gray-500 font-medium">Invoices count</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Peak Sales Day</span>
              <div className="text-2xl font-black text-amber-600">{summary.peak_day || 'N/A'}</div>
              <span className="text-[11px] text-amber-600 font-bold">Rs {(summary.peak_day_total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Daywise Sales History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Invoices</th>
                    <th className="py-3 px-4">Item Total</th>
                    <th className="py-3 px-4">Taxes</th>
                    <th className="py-3 px-4">Discounts</th>
                    <th className="py-3 px-4 text-right">Grand Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{r.date}</td>
                      <td className="py-3.5 px-4 text-gray-700 font-semibold">{r.total_invoices} invoices</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(r.item_total || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(r.total_taxes || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-amber-600 font-bold">Rs {(r.cash_discount || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(r.grand_total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-300">
                  <tr>
                    <td className="py-3 px-4">TOTAL SUMMARY</td>
                    <td className="py-3 px-4">{summary.total_invoices || 0} Invoices</td>
                    <td className="py-3 px-4">Rs {totalItemVal.toLocaleString()}</td>
                    <td className="py-3 px-4">Rs {totalTaxVal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-amber-600">Rs {totalDiscVal.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-green-800 text-sm">Rs {totalGrandVal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 2. Daywise Invoices
    case 'daywise-invoices': {
      const invoices = Array.isArray(data.invoices) ? data.invoices : [];
      const pag = data.pagination || {};
      const grandTotalSum = invoices.reduce((acc, inv) => acc + (inv.grand_total || 0), 0);
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">POS Invoices Audit Log</h3>
            <span className="text-xs text-gray-500 font-bold">Total Invoices: {pag.total || invoices.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Posting Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Table / Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-bold text-blue-600">{inv.name}</td>
                    <td className="py-3.5 px-4 text-gray-800">{inv.posting_date}</td>
                    <td className="py-3.5 px-4 text-gray-500">{inv.posting_time}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{inv.restaurant_table || inv.order_type || 'Takeaway'}</td>
                    <td className="py-3.5 px-4 text-gray-700">{inv.customer_name || inv.customer || 'Walk-in'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-extrabold">
                        {inv.status || 'Paid'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(inv.grand_total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="6" className="py-3 px-4">TOTAL AUDITED INVOICES AMOUNT ({invoices.length} Rows)</td>
                  <td className="py-3 px-4 text-right text-green-800 text-sm">Rs {grandTotalSum.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }

    // 3. Month Wise Sales
    case 'month-wise-sales': {
      const monthRows = Array.isArray(data.data) ? data.data : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_revenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Monthly Average</span>
              <div className="text-2xl font-black text-emerald-600">Rs {(summary.average_monthly_revenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Best Month</span>
              <div className="text-2xl font-black text-amber-600">{summary.best_month || 'N/A'}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Item Total</th>
                    <th className="py-3 px-4">Taxes</th>
                    <th className="py-3 px-4 text-right">Grand Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {monthRows.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{m.month || m.month_name}</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(m.item_total || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(m.taxes || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(m.grand_total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 4. Time Wise Sales
    case 'time-wise-sales': {
      const intervals = Array.isArray(data.intervals) ? data.intervals : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Daily Sales ({data.date})</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_sales || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Bills Served</span>
              <div className="text-2xl font-black text-gray-900">{(summary.total_bills || 0)} bills</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Peak Hour Slot</span>
              <div className="text-2xl font-black text-amber-600">{summary.peak_interval || 'N/A'}</div>
              <span className="text-[11px] text-amber-600 font-bold">Rs {(summary.peak_interval_sales || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Hourly Revenue Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {intervals.map((int, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-center">
                  <span className="text-[10px] text-gray-400 font-bold block">{int.interval_label}</span>
                  <div className="text-sm font-extrabold text-gray-900">Rs {(int.sales || 0).toLocaleString()}</div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-600 h-full" style={{ width: `${int.pct_of_daily_total || 0}%` }} />
                  </div>
                  <span className="text-[9.5px] text-green-700 font-bold">{int.pct_of_daily_total}% ({int.bills} bills)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 5. Service Wise Sales
    case 'service-wise-sales': {
      const byServiceType = Array.isArray(data.by_service_type) ? data.by_service_type : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_revenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Orders</span>
              <div className="text-2xl font-black text-gray-900">{summary.total_orders || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Avg Order Value</span>
              <div className="text-2xl font-black text-emerald-600">Rs {(summary.avg_order_value || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Service Type Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Service Channel</th>
                    <th className="py-3 px-4">Order Count</th>
                    <th className="py-3 px-4">Avg Order Value</th>
                    <th className="py-3 px-4">Revenue</th>
                    <th className="py-3 px-4 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {byServiceType.map((st, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{st.order_type}</td>
                      <td className="py-3.5 px-4 text-gray-700">{st.order_count} orders</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(st.avg_order_value || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-extrabold text-green-700">Rs {(st.revenue || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">{st.percentage_of_total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 6. Cancelled Invoices
    case 'cancelled-invoices': {
      const invoices = Array.isArray(data.invoices) ? data.invoices : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Cancelled Invoices</span>
              <div className="text-2xl font-black text-rose-600">{summary.total_count || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Lost Amount</span>
              <div className="text-2xl font-black text-rose-700">Rs {(summary.total_amount || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Unique Cancellers</span>
              <div className="text-2xl font-black text-gray-900">{summary.unique_cancellers || 0}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Cancelled Invoices Audit Table</h3>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Cancelled By</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold text-rose-600">{inv.invoice}</td>
                        <td className="py-3.5 px-4 text-gray-800">{inv.date} {inv.time}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{inv.cancelled_by}</td>
                        <td className="py-3.5 px-4 text-gray-500 italic">{inv.cancellation_reason || 'No reason provided'}</td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-700">Rs {(inv.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-bold text-center py-6">No cancelled invoices found for this date range.</p>
            )}
          </div>
        </div>
      );
    }

    // 7. Average Bill Value
    case 'average-bill-value': {
      const abvRows = Array.isArray(data.data) ? data.data : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Average Bill Value (ABV)</span>
              <div className="text-2xl font-black text-emerald-600">Rs {(summary.average_abv || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Bills Served</span>
              <div className="text-2xl font-black text-gray-900">{(summary.total_bills || 0)}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Sales</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_sales || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Daily ABV Trend</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Bill Count</th>
                    <th className="py-3 px-4">Total Sales</th>
                    <th className="py-3 px-4 text-right">Daily ABV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {abvRows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{r.date}</td>
                      <td className="py-3.5 px-4 text-gray-700">{r.bill_count} bills</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(r.total_sales || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">Rs {(r.abv || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 8. Item Wise Sales
    case 'item-wise-sales': {
      const items = Array.isArray(data.items) ? data.items : [];
      const summary = data.summary || {};
      const totalQtySum = items.reduce((acc, i) => acc + (i.qty || 0), 0);
      const totalAmountSum = items.reduce((acc, i) => acc + (i.amount || 0), 0);
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Top Selling Dishes & Revenue Ranking</h3>
            <span className="px-3 py-1 rounded-xl bg-green-50 text-green-700 text-xs font-bold border border-green-200">
              {summary.unique_items || items.length} Dishes Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Dish Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit Avg Price</th>
                  <th className="py-3 px-4">Qty Sold</th>
                  <th className="py-3 px-4">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-black text-gray-400">#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{item.item_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-700">{item.item_group || 'General'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 font-bold">Rs {(item.avg_price || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-black text-gray-900">{item.qty} units</td>
                    <td className="py-3.5 px-4 font-extrabold text-green-700">Rs {(item.amount || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-black text-gray-900">{item.pct_of_total_amount}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="4" className="py-3 px-4">TOTAL SUMMARY</td>
                  <td className="py-3 px-4">{totalQtySum} units</td>
                  <td className="py-3 px-4 text-green-800">Rs {totalAmountSum.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      );
    }

    // 9. Item Purchase History
    case 'item-wise-purchase-history': {
      const items = Array.isArray(data.items) ? data.items : [];
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Item Purchase & Procurement History</h3>
          {items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Qty Purchased</th>
                    <th className="py-3 px-4">Avg Rate</th>
                    <th className="py-3 px-4 text-right">Total Purchase Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-500">{item.item_code}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{item.item_name}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{item.qty}</td>
                      <td className="py-3.5 px-4 text-gray-800">Rs {(item.avg_rate || 0).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-bold text-center py-6">No purchase records found for this date range.</p>
          )}
        </div>
      );
    }

    // 10. Customer Purchase Data
    case 'customer-data': {
      const invoices = Array.isArray(data.invoices) ? data.invoices : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Customer Name</span>
              <div className="text-xl font-black text-gray-900">{summary.customer_name || data.customer || 'Walk-in'}</div>
              <span className="text-[11px] text-gray-500 font-medium">{summary.mobile_number || 'No phone'}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Customer Spend</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_spend || 0).toLocaleString()}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Visits Count</span>
              <div className="text-2xl font-black text-emerald-600">{summary.visit_count || 0} visits</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Avg Spend per Visit</span>
              <div className="text-2xl font-black text-amber-600">Rs {(summary.avg_spend || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Customer Invoices History</h3>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4 text-right">Invoice Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{inv.date}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-600">{inv.invoice}</td>
                        <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(inv.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-bold text-center py-6">No order invoices found for this customer.</p>
            )}
          </div>
        </div>
      );
    }

    // 11. Daywise Customer Details
    case 'daywise-customer-details': {
      const customers = Array.isArray(data.customers) ? data.customers : [];
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Visiting Customers Directory</h3>
            <span className="text-xs font-bold text-green-700">Total Customers: {data.total_count || customers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Visits Count</th>
                  <th className="py-3 px-4">First Visit</th>
                  <th className="py-3 px-4 text-right">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {customers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{c.customer_name || c.customer_id}</td>
                    <td className="py-3.5 px-4 text-gray-700 font-mono">{c.mobile_number || 'N/A'}</td>
                    <td className="py-3.5 px-4 font-black text-green-700">{c.visit_count} visits</td>
                    <td className="py-3.5 px-4 text-gray-600">{c.first_visit}</td>
                    <td className="py-3.5 px-4 text-right text-gray-800 font-semibold">{c.last_visit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 12. Repeated Customers
    case 'repeated-customers': {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Customer Visits</span>
              <div className="text-2xl font-black text-gray-900">{summary.total_customers || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">New Customers</span>
              <div className="text-2xl font-black text-blue-600">{summary.new_customers || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Repeat Customers</span>
              <div className="text-2xl font-black text-green-700">{summary.repeat_customers || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Avg Repeat Rate %</span>
              <div className="text-2xl font-black text-amber-600">{summary.avg_repeat_rate_percent || 0}%</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Daily Retention History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Total Customers</th>
                    <th className="py-3 px-4">New Customers</th>
                    <th className="py-3 px-4">Repeat Customers</th>
                    <th className="py-3 px-4 text-right">Repeat Rate %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{r.date}</td>
                      <td className="py-3.5 px-4 text-gray-700">{r.total_customers}</td>
                      <td className="py-3.5 px-4 text-blue-600 font-bold">{r.new_customers}</td>
                      <td className="py-3.5 px-4 text-green-600 font-bold">{r.repeat_customers}</td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">{r.repeat_rate_percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 13. Employee Sales
    case 'employee-sales': {
      const employees = Array.isArray(data.employees) ? data.employees : [];
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Staff Performance Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Invoices Processed</th>
                  <th className="py-3 px-4">Total Revenue Generated</th>
                  <th className="py-3 px-4">Avg Invoice Value</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {employees.map((emp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-black text-gray-400">#{emp.rank || (idx + 1)}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{emp.employee_name || emp.employee_id}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-700">{emp.total_invoices} invoices</td>
                    <td className="py-3.5 px-4 font-extrabold text-green-700">Rs {(emp.sales_amount || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-gray-800 font-bold">Rs {(emp.average_invoice_value || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10.5px] font-extrabold">
                        {idx === 0 ? 'Top Performer' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 14. Employee Item Wise Sales
    case 'employee-item-wise-sales': {
      const items = Array.isArray(data.items) ? data.items : [];
      const summary = data.summary || {};
      const totalQtySum = items.reduce((acc, item) => acc + (item.qty || 0), 0);
      const totalAmountSum = items.reduce((acc, item) => acc + (item.amount || 0), 0);
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Staff Member</span>
              <div className="text-xl font-black text-gray-900">{data.employee_name || data.employee || 'Administrator'}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Quantity Sold</span>
              <div className="text-2xl font-black text-emerald-600">{summary.total_qty || totalQtySum} units</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Revenue Generated</span>
              <div className="text-2xl font-black text-green-700">Rs {(summary.total_amount || totalAmountSum).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Items Sold By Staff Member</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Dish Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Qty Sold</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-black text-gray-400">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">{item.item_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-700">{item.item_group || 'General'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-gray-900">{item.qty} units</td>
                      <td className="py-3.5 px-4 text-right font-black text-green-700">Rs {(item.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-black text-gray-900 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan="3" className="py-3 px-4">STAFF TOTAL DISHES SUMMARY</td>
                    <td className="py-3 px-4">{totalQtySum} units</td>
                    <td className="py-3 px-4 text-right text-green-800 text-sm">Rs {totalAmountSum.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 15. Completed Work Orders
    case 'completed-work-orders': {
      const orders = Array.isArray(data.work_orders) ? data.work_orders : (Array.isArray(data.rows) ? data.rows : []);
      const summary = data.summary || {};
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Completed Work Orders</span>
              <div className="text-2xl font-black text-green-700">{summary.total_completed || orders.length}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
              <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider">Total Quantity Produced</span>
              <div className="text-2xl font-black text-emerald-600">{summary.total_qty_produced || 0} units</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Kitchen & Production Completed Orders</h3>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                      <th className="py-3 px-4">Work Order #</th>
                      <th className="py-3 px-4">Production Item</th>
                      <th className="py-3 px-4">Qty Produced</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {orders.map((wo, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3.5 px-4 font-bold text-blue-600">{wo.name || wo.work_order}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{wo.production_item || wo.item_name}</td>
                        <td className="py-3.5 px-4 font-black text-gray-900">{wo.qty || wo.produced_qty}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-extrabold">Completed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-gray-500 font-bold text-center py-6">No completed kitchen work orders found for this date range.</p>
            )}
          </div>
        </div>
      );
    }

    // 16. Daily P&L Statement
    case 'daily-pnl': {
      if (data.exists === false) {
        return (
          <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center space-y-3 max-w-xl mx-auto">
            <DollarSign className="h-10 w-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-extrabold text-gray-900">No Submitted Daily P&L Document</h3>
            <p className="text-xs text-gray-500 font-medium">
              No submitted P&L entry found for {data.branch || 'Branch'} on {data.date}. Create and submit a "URY Daily P and L" document in Frappe Desk to view official audit figures.
            </p>
          </div>
        );
      }
      const summary = Array.isArray(data.summary) ? data.summary : [];
      return (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="text-center border-b border-gray-200 pb-5">
            <h3 className="text-lg font-black text-gray-900 uppercase">Official Daily Profit & Loss Statement</h3>
            <p className="text-xs text-gray-500 font-medium">Branch: {data.branch} • Date: {data.date}</p>
          </div>

          <div className="space-y-3 text-xs">
            {summary.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 font-semibold">
                <span className="text-gray-700">{item.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 font-normal">{item.percent}%</span>
                  <span className={`font-extrabold ${item.amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    Rs {(item.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default Fallback: Structured Summary Table
    default: {
      return (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Report Audit Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase bg-gray-50">
                  <th className="py-3 px-4">Metric / Property</th>
                  <th className="py-3 px-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {Object.entries(data).map(([key, val], idx) => {
                  if (typeof val === 'object' && val !== null) return null;
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-bold text-gray-800 capitalize">{key.replace(/_/g, ' ')}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-green-700">{String(val)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

  }
}
