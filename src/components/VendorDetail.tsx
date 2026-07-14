/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Globe, Phone, Mail, User, Clock, 
  ExternalLink, ShieldCheck, ArrowRight, CheckCircle2, 
  XCircle, Send, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Vendor, VendorStatus } from '../types';

interface VendorDetailProps {
  vendor: Vendor;
  onStatusUpdate: (vendorId: string, status: VendorStatus, message?: string) => void;
  onDelete: (id: string) => void;
}

export default function VendorDetail({ vendor, onStatusUpdate, onDelete }: VendorDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBrochureViewer, setShowBrochureViewer] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState('');
  const [sendOutreachSuccess, setSendOutreachSuccess] = useState(false);

  const handleUpdateStatus = async (status: VendorStatus, customMsg?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/vendors/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor.id,
          status,
          message: customMsg
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const updated = await response.json();
      onStatusUpdate(vendor.id, status, customMsg);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendCustomOutreach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outreachMessage.trim()) return;
    
    setSendOutreachSuccess(true);
    setTimeout(() => {
      setSendOutreachSuccess(false);
      setOutreachMessage('');
    }, 2500);
  };

  // Status mapping for visual timeline colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'text-sky-600 bg-sky-50 border-sky-100';
      case 'Analyzing': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Verified': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Contacted': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Onboarded': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Rejected': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getTimelineDotColor = (isCompleted: boolean, isCurrent: boolean) => {
    if (isCurrent) return 'ring-4 ring-indigo-100 bg-indigo-600 border-indigo-600';
    if (isCompleted) return 'bg-emerald-500 border-emerald-500';
    return 'bg-white border-slate-200';
  };

  return (
    <div id="vendor-detail-panel" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full relative">
      
      {/* Detail Header */}
      <div className="border-b border-slate-100 p-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-base font-bold text-slate-800 tracking-tight">{vendor.companyName}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(vendor.status)}`}>
              {vendor.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">Source:</span> {vendor.source}
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">Industry:</span> {vendor.industry}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {vendor.status !== 'Onboarded' && (
            <button
              type="button"
              id="approve-vendor-btn"
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('Onboarded')}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
          )}
          {vendor.status !== 'Rejected' && (
            <button
              type="button"
              id="reject-vendor-btn"
              disabled={isUpdating}
              onClick={() => handleUpdateStatus('Rejected')}
              className="flex items-center gap-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Decline
            </button>
          )}
          <button
            type="button"
            id="delete-vendor-btn"
            onClick={() => onDelete(vendor.id)}
            className="text-slate-400 hover:text-red-500 text-xs font-medium hover:bg-slate-100 p-2 rounded-lg transition-colors cursor-pointer"
            title="Delete vendor record"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
        
        {/* Automated Status Timeline */}
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Automated Validation Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-100 flex flex-col gap-6">
            {vendor.statusHistory.map((history, idx) => (
              <div key={idx} className="relative">
                {/* Timeline dot */}
                <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  getTimelineDotColor(history.isCompleted, history.isCurrent)
                }`} />

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-xs font-semibold ${
                      history.isCurrent ? 'text-indigo-600 font-bold' : history.isCompleted ? 'text-slate-700' : 'text-slate-400'
                    }`}>
                      {history.label}
                    </h4>
                    {history.timestamp && (
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{history.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Profile Details Grid */}
        <div className="grid grid-cols-2 gap-5">
          {/* Contacts Box */}
          <div className="flex flex-col gap-3.5 border border-slate-100 rounded-xl p-4.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Representative Contact</h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{vendor.contactName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`mailto:${vendor.contactEmail}`} className="hover:text-indigo-600 transition-colors">{vendor.contactEmail}</a>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href={`tel:${vendor.contactPhone}`} className="hover:text-indigo-600 transition-colors">{vendor.contactPhone}</a>
              </div>
            </div>
          </div>

          {/* Business Core Box */}
          <div className="flex flex-col gap-3.5 border border-slate-100 rounded-xl p-4.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Identity</h4>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                {vendor.website ? (
                  <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-indigo-600 hover:underline">
                    {vendor.website.replace(/https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Website Not Provided</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="font-semibold text-slate-700">ISO Standards:</span> Pending Review
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700">Registered:</span> {new Date(vendor.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Description */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Corporate Profile Summary</h4>
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed">
            {vendor.description}
          </p>
        </div>

        {/* Core Solutions Catalog */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Core Products & Capabilities</h4>
          <div className="flex flex-wrap gap-1.5">
            {vendor.products && vendor.products.length > 0 ? (
              vendor.products.map((prod, pIdx) => (
                <span key={pIdx} className="text-xs font-semibold bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg">
                  {prod}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No specific products index. Ready for catalog sync.</span>
            )}
          </div>
        </div>

        {/* Attachments & Brochure Section */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-4.5 py-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Synced brochure Attachments</h4>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-sm">
              {vendor.attachments.length} Synced
            </span>
          </div>
          
          <div className="p-3 flex flex-col gap-2">
            {vendor.attachments.length > 0 ? (
              vendor.attachments.map((att, aIdx) => (
                <div key={aIdx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{att.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{att.size} | PDF Brochure Format</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    id={`open-brochure-viewer-${att.id}`}
                    onClick={() => setShowBrochureViewer(!showBrochureViewer)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors hover:underline cursor-pointer"
                  >
                    {showBrochureViewer ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Close Viewer
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        A.I. Brochure Reader
                      </>
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 italic">
                No brochure documents synced yet. Paste content into AI Import to generate corporate documents.
              </div>
            )}
          </div>
        </div>

        {/* Interactive Brochure Reader View */}
        {showBrochureViewer && vendor.attachments.length > 0 && (
          <div className="border border-slate-200 bg-slate-900 rounded-2xl p-6 shadow-xs text-slate-100 font-mono text-xs leading-relaxed animate-fadeIn h-[320px] overflow-y-auto flex flex-col gap-4 relative">
            <div className="absolute top-4 right-4 bg-slate-800 border border-slate-700 px-2 py-1 rounded-sm text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
              PDF READER LIVE PREVIEW
            </div>
            
            {/* Styled Brochure Contents */}
            <div className="bg-white text-slate-800 p-6 rounded-lg shadow-sm border border-slate-200">
              <div className="border-b-2 border-indigo-600 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase">{vendor.companyName}</h2>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest">Offical Procurement Profile</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm uppercase tracking-wide inline-block">{vendor.industry}</p>
                  <p className="text-[8px] text-slate-400 block mt-1">{vendor.website || 'No URL synced'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 font-sans">
                <div>
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Executive Value Statement</h3>
                  <p className="text-[11px] text-slate-600 italic leading-relaxed">"{vendor.description}"</p>
                </div>

                <div>
                  <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Identified Capabilities Catalog</h3>
                  <div className="flex flex-col gap-1">
                    {vendor.products && vendor.products.map((p, idx) => (
                      <p key={idx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                        {p}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>REF ID: {vendor.id}</span>
                  <span>CONTACT: {vendor.contactEmail}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Simulated Outreach Hub */}
        <div className="border border-slate-100 rounded-xl p-5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3.5">
            Real-Time Simulated Message outreach
          </h4>

          <form onSubmit={handleSendCustomOutreach} className="flex gap-2">
            <input
              type="text"
              id="outreach-msg-input"
              value={outreachMessage}
              onChange={(e) => setOutreachMessage(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
              placeholder={`Send outreach thread to ${vendor.contactName} via ${vendor.source === 'WhatsApp' ? 'WhatsApp' : 'Email'}...`}
            />
            <button
              type="submit"
              id="send-outreach-btn"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors cursor-pointer"
              title="Deliver message simulation"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {sendOutreachSuccess && (
            <div className="flex gap-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-emerald-700 mt-2 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="text-[11px] font-semibold">Simulated Outreach Sent Successfully! Log updated.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
