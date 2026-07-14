/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, FileText, Globe, Mail, Phone, Calendar, Download } from 'lucide-react';
import { Vendor } from '../types';

interface ViewBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
}

export default function ViewBrochureModal({ isOpen, onClose, vendor }: ViewBrochureModalProps) {
  if (!isOpen || !vendor) return null;

  // Render a mock PDF capability statement download
  const handleDownloadMockPDF = () => {
    const productsList = (vendor.products || []).map((p: string) => `- ${p}`).join('\n');
    const pdfText = `=========================================
OFFICIAL COMPANY BROCHURE & CAPABILITY STATEMENT
=========================================

COMPANY PROFILE
-----------------------------------------
Name:      ${vendor.companyName}
Industry:  ${vendor.industry}
Website:   ${vendor.website || 'N/A'}
Contact:   ${vendor.contactName} (${vendor.contactEmail} | ${vendor.contactPhone})

EXECUTIVE SUMMARY
-----------------------------------------
${vendor.description}

CORE CAPABILITIES & PRODUCTS
-----------------------------------------
${productsList || '- Standard custom products & service contracts'}

Reference ID: ${vendor.id}
Generated via VendorSync on ${new Date(vendor.createdAt).toLocaleDateString()}`;

    const blob = new Blob([pdfText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vendor.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Capability_Statement.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Extracted Brochure & Capabilities</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* Company Brief Header */}
          <div className="bg-indigo-50/40 rounded-2xl p-5 border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  {vendor.industry}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Synced {new Date(vendor.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1.5">{vendor.companyName}</h3>
              {vendor.website && (
                <a 
                  href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-1 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {vendor.website}
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={handleDownloadMockPDF}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Download Capability PDF
            </button>
          </div>

          {/* Details split */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Info Column */}
            <div className="md:col-span-1 flex flex-col gap-4 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Contact Person</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {vendor.contactName.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{vendor.contactName}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
                <a href={`mailto:${vendor.contactEmail}`} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1.5 break-all">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {vendor.contactEmail}
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</span>
                <a href={`tel:${vendor.contactPhone}`} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {vendor.contactPhone}
                </a>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Inbound Channel</span>
                <span className="text-xs font-bold text-slate-700 capitalize">
                  {vendor.source} Channel Sync
                </span>
              </div>
            </div>

            {/* Right Detailed Capability Column */}
            <div className="md:col-span-2 flex flex-col gap-5">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-xs font-medium text-slate-600 leading-relaxed bg-slate-50/20 border border-slate-100 rounded-xl p-3.5">
                  {vendor.description || "No company description provided."}
                </p>
              </div>

              {vendor.products && vendor.products.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Products & Capabilities</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {vendor.products.map((product, index) => (
                      <span 
                        key={index} 
                        className="bg-slate-100 text-slate-800 border border-slate-200/60 px-3 py-1 rounded-lg text-[11px] font-semibold"
                      >
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {vendor.attachments && vendor.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Brochure Attachments ({vendor.attachments.length})</h4>
                  <div className="flex flex-col gap-2">
                    {vendor.attachments.map((att) => (
                      <div 
                        key={att.id} 
                        onClick={handleDownloadMockPDF}
                        className="border border-slate-100 bg-white hover:bg-slate-50 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{att.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">{att.type} • {att.size}</p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 hover:text-indigo-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Done Viewing
          </button>
        </div>

      </div>
    </div>
  );
}
