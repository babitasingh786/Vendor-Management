/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, Mail, Layers, Search, 
  SlidersHorizontal, Plus, Database, RefreshCw, 
  AlertCircle, History, Sparkles, Trash2, Edit3, 
  FileText, Globe, Phone, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { Vendor, SyncLog } from './types';
import SimulatorPane from './components/SimulatorPane';
import AddVendorModal from './components/AddVendorModal';
import EditVendorModal from './components/EditVendorModal';
import ViewBrochureModal from './components/ViewBrochureModal';

export default function App() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<Vendor | null>(null);
  const [selectedVendorForView, setSelectedVendorForView] = useState<Vendor | null>(null);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');

  // Load vendors and sync logs from server
  const loadData = async () => {
    try {
      const vResponse = await fetch('/api/vendors');
      const lResponse = await fetch('/api/vendors/logs');
      
      if (vResponse.ok && lResponse.ok) {
        const vendorData = await vResponse.json();
        const logData = await lResponse.json();
        
        // Sort vendors so newest is first
        const sortedVendors = [...vendorData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setVendors(sortedVendors);
        setLogs(logData.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (err) {
      console.error('Error loading API data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll the server every 2.5 seconds to reflect real-time background additions
    const interval = setInterval(() => {
      loadData();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSyncComplete = (newVendor: Vendor) => {
    loadData();
    setIsSimulatorOpen(false); // Close simulator on successful sync
  };

  const handleAddComplete = (newVendor: Vendor) => {
    loadData();
  };

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendorForEdit(vendor);
    setIsEditModalOpen(true);
  };

  const handleViewClick = (vendor: Vendor) => {
    setSelectedVendorForView(vendor);
    setIsViewModalOpen(true);
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vendor record?')) return;
    try {
      const response = await fetch('/api/vendors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetAllDb = async () => {
    if (!confirm('Warning: This resets the local vendors list to original seeds. Proceed?')) return;
    try {
      const response = await fetch('/api/vendors/reset', { method: 'POST' });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search Heuristics
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.products || []).some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesIndustry = industryFilter === 'All' || vendor.industry === industryFilter;
    const matchesSource = sourceFilter === 'All' || vendor.source === sourceFilter;

    return matchesSearch && matchesIndustry && matchesSource;
  });

  // Calculate Metrics from raw list
  const metrics = {
    total: vendors.length,
    whatsapp: vendors.filter(v => v.source === 'WhatsApp').length,
    email: vendors.filter(v => v.source === 'Email').length,
    manual: vendors.filter(v => v.source === 'Manual').length,
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'WhatsApp': return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'Email': return <Mail className="w-3.5 h-3.5 text-indigo-600" />;
      default: return <Database className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      
      {/* Upper Navigation Bar */}
      <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-950 tracking-tight">VendorSync™</h1>
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">
              Automated Brochure Extraction & Centralized Registry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            id="reset-all-db-btn"
            onClick={resetAllDb}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            title="Reset data store to default seed values"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Seeds</span>
          </button>

          <button
            type="button"
            id="open-simulator-btn"
            onClick={() => setIsSimulatorOpen(true)}
            className="text-indigo-600 hover:text-indigo-750 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ring-offset-1 hover:ring-2 hover:ring-indigo-600/10"
            title="Open real-time WhatsApp & Email sync simulator"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
            <span>Simulate Channel Sync</span>
          </button>
          
          <button
            type="button"
            id="register-vendor-action"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-100 shadow-sm rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-8 py-4 sm:py-6 gap-4 sm:gap-6 max-w-8xl mx-auto w-full">
        
        {/* KPI metrics Bar */}
        <section id="kpi-metrics-row" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Box 1 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Registry</span>
              <span className="text-base sm:text-xl font-extrabold text-slate-900 leading-none">{metrics.total} Vendors</span>
            </div>
            <div className="p-2 sm:p-3 bg-slate-50 text-slate-600 rounded-xl shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Box 2 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Stream</span>
              <span className="text-base sm:text-xl font-extrabold text-emerald-600 leading-none">{metrics.whatsapp} Extracted</span>
            </div>
            <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Box 3 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Pipeline</span>
              <span className="text-base sm:text-xl font-extrabold text-indigo-600 leading-none">{metrics.email} Extracted</span>
            </div>
            <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Box 4 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4.5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Manual Registered</span>
              <span className="text-base sm:text-xl font-extrabold text-slate-700 leading-none">{metrics.manual} Profiles</span>
            </div>
            <div className="p-2 sm:p-3 bg-slate-100 text-slate-500 rounded-xl shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

        </section>

        {/* Filters & Command Controls Area */}
        <section id="filters-row" className="bg-white border border-slate-100 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 shadow-xs">
          
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="global-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl pl-10 pr-4 py-2 text-xs text-slate-700 font-medium placeholder-slate-400"
              placeholder="Search company name, products list, representative name or contact details..."
            />
          </div>

          {/* Filter dropdown selectors */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Filters:</span>
            </div>

            {/* Industry Selector */}
            <select
              id="filter-industry-select"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100/80 border border-slate-150 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Industries</option>
              <option value="IT Services">IT Services</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Metal Fabrication">Metal Fabrication</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Logistics">Logistics</option>
              <option value="Marketing">Marketing</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Construction">Construction</option>
              <option value="Agriculture">Agriculture</option>
            </select>

            {/* Source Selector */}
            <select
              id="filter-source-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-semibold focus:outline-hidden"
            >
              <option value="All">All Sources</option>
              <option value="WhatsApp">WhatsApp Stream</option>
              <option value="Email">Email Pipeline</option>
              <option value="Manual">Manual Entry</option>
            </select>
          </div>

        </section>

        {/* Directory List Table Area */}
        <section id="table-layout-container" className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[350px]">
          
          {/* Header */}
          <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Corporate Registry Directory</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-2.5 py-0.5 rounded-full">
              {filteredVendors.length} Profiles Found
            </span>
          </div>

          {/* Table Element */}
          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Querying active directory datastore...</span>
              </div>
            ) : filteredVendors.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Industry Vertical</th>
                    <th className="px-6 py-4">Contact Representative</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Mobile Number</th>
                    <th className="px-6 py-4">Added Date/Time</th>
                    <th className="px-6 py-4">Inbound Stream</th>
                    <th className="px-6 py-4">Attachments</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  {filteredVendors.map((vendor) => (
                    <tr 
                      key={vendor.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Company info */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{vendor.companyName}</p>
                          {vendor.website ? (
                            <a 
                              href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <Globe className="w-3 h-3" />
                              {vendor.website}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No web domain</span>
                          )}
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/50">
                          {vendor.industry}
                        </span>
                      </td>

                      {/* Representative */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {vendor.contactName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800">{vendor.contactName}</span>
                        </div>
                      </td>

                      {/* Email Address */}
                      <td className="px-6 py-4">
                        <a href={`mailto:${vendor.contactEmail}`} className="text-indigo-600 hover:underline text-[11px] font-semibold break-all">
                          {vendor.contactEmail}
                        </a>
                      </td>

                      {/* Mobile Number */}
                      <td className="px-6 py-4 text-slate-600 font-semibold text-[11px] whitespace-nowrap">
                        {vendor.contactPhone || <span className="text-slate-400 italic font-normal">—</span>}
                      </td>

                      {/* Added Date/Time */}
                      <td className="px-6 py-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {vendor.createdAt ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">
                              {new Date(vendor.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(vendor.createdAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unknown</span>
                        )}
                      </td>

                      {/* Source Channel */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                          {getSourceIcon(vendor.source)}
                          <span>{vendor.source}</span>
                        </div>
                      </td>

                      {/* Attachments */}
                      <td className="px-6 py-4">
                        {vendor.attachments && vendor.attachments.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleViewClick(vendor)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px] bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Brochure ({vendor.attachments.length})</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No documents</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(vendor)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition-all cursor-pointer"
                            title="Edit vendor profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                            title="Delete vendor record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mb-2.5" />
                <p className="text-sm font-bold text-slate-700">No Match Found</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-md">
                  Adjust company details search parameters or filter dropdowns to inspect corporate items. Or, launch simulation to import new data.
                </p>
              </div>
            )}
          </div>

        </section>

        {/* Live Sync Event Logs Drawer Panel - Collapsible */}
        <section id="sync-logs-drawer" className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden shrink-0">
          <div 
            onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
            className="bg-slate-950 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors select-none"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">Live Webhook Synced Log Console</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-sm border border-slate-700 font-bold uppercase tracking-widest">
                Live Feed Active
              </span>
              {isLogsCollapsed ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {!isLogsCollapsed && (
            <div className="p-4 max-h-[160px] overflow-y-auto flex flex-col gap-2 font-mono text-[10px] leading-relaxed text-slate-400 bg-slate-950/40">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-2 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                    <span className="text-slate-500 shrink-0 select-none">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold shrink-0 ${
                      log.channel === 'WhatsApp' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/40' : 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/40'
                    }`}>
                      {log.channel}
                    </span>
                    <span className="text-slate-300 shrink-0 font-semibold">
                      FROM: {log.sender}
                    </span>
                    <p className="text-slate-400 truncate flex-1 font-mono">
                      {log.rawPayload.replace(/\n/g, ' ')}
                    </p>
                    <span className={`px-1 rounded-sm text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 italic py-4">
                  No active payload sync logs detected. Trigger simulation transmissions using the "Simulate Channel Sync" tool.
                </div>
              )}
            </div>
          )}
        </section>

      </div>

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-950">WhatsApp & Email Sync Simulator</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-y-auto min-h-0 flex-1 bg-slate-50/30">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Send a sample mock WhatsApp file transmission or an email payload to simulate incoming webhooks. Watch Gemini automatically parse, run verification checks, and sync real-time directory items!
              </p>
              <SimulatorPane 
                onSyncComplete={handleSyncComplete} 
                logs={logs}
                refreshLogs={loadData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddComplete={handleAddComplete}
      />

      {/* Edit Vendor Modal */}
      <EditVendorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVendorForEdit(null);
        }}
        vendor={selectedVendorForEdit}
        onSaveComplete={loadData}
      />

      {/* View Brochure Details Modal */}
      <ViewBrochureModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedVendorForView(null);
        }}
        vendor={selectedVendorForView}
      />

    </div>
  );
}
