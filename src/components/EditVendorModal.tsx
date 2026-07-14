/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Vendor } from '../types';

interface EditVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onSaveComplete: () => void;
}

export default function EditVendorModal({ isOpen, onClose, vendor, onSaveComplete }: EditVendorModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('IT Services');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [products, setProducts] = useState('');
  const [description, setDescription] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendor) {
      setCompanyName(vendor.companyName || '');
      setIndustry(vendor.industry || 'IT Services');
      setContactName(vendor.contactName || '');
      setContactEmail(vendor.contactEmail || '');
      setContactPhone(vendor.contactPhone || '');
      setWebsite(vendor.website || '');
      setProducts(Array.isArray(vendor.products) ? vendor.products.join(', ') : '');
      setDescription(vendor.description || '');
      setError(null);
    }
  }, [vendor, isOpen]);

  if (!isOpen || !vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim()) {
      setError('Company Name and Contact Representative Name are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/vendors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vendor.id,
          companyName,
          industry,
          contactName,
          contactEmail,
          contactPhone,
          website,
          products,
          description
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update vendor.');
      }

      onSaveComplete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Save className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-800">Edit Vendor Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="text-xs text-red-700 font-semibold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="Apex Technologies"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Industry Vertical *</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700"
              >
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
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Representative Name *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="Sarah Jenkins"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="sarah@apex.com"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="+1 (555) 012-3456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="https://apextech.com"
              />
            </div>

            <div className="col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Products & Services (Comma Separated)</label>
              <input
                type="text"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800"
                placeholder="Cloud Storage, Managed SLA, System Auditing"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Company Description / Summary</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 leading-relaxed resize-none"
              placeholder="Provide a high-level summary of capabilities and core offerings..."
            />
          </div>

          {/* Footer controls inside Form */}
          <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
