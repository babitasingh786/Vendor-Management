/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, RefreshCw, Plus, CheckCircle, HelpCircle, UploadCloud, Paperclip, FileText, Trash2 } from 'lucide-react';
import { Vendor } from '../types';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComplete: (vendor: Vendor) => void;
}

export default function AddVendorModal({ isOpen, onClose, onAddComplete }: AddVendorModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // Traditional form states
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('IT Services');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [products, setProducts] = useState('');
  const [description, setDescription] = useState('');
  const [rawBrochureText, setRawBrochureText] = useState('');

  // Manual Attachments states
  const [manualAttachments, setManualAttachments] = useState<{ id: string; name: string; type: string; size: string; url?: string; contentSummary?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // File processors
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        let formattedSize = `${(file.size / 1024).toFixed(1)} KB`;
        if (file.size > 1024 * 1024) {
          formattedSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const newAtt = {
          id: `att_man_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: file.name,
          type: ext,
          size: formattedSize,
          url: base64Url,
          contentSummary: `Manually attached ${file.name} document for vendor capabilities verification.`
        };
        setManualAttachments(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id: string) => {
    setManualAttachments(prev => prev.filter(att => att.id !== id));
  };

  // AI Paste state
  const [aiPasteText, setAiPasteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);

  // General submission states
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAiAnalyze = async () => {
    if (!aiPasteText.trim()) {
      setAiError('Please paste some text content to let Gemini analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    setAiSuccess(false);

    try {
      const response = await fetch('/api/vendors/parse-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPasteText })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze brochure copy.');
      }

      const parsed = await response.json();
      
      // Auto-fill states
      setCompanyName(parsed.companyName || '');
      setIndustry(parsed.industry || 'IT Services');
      setContactName(parsed.contactName || '');
      setContactEmail(parsed.contactEmail || '');
      setContactPhone(parsed.contactPhone || '');
      setWebsite(parsed.website || '');
      setProducts(Array.isArray(parsed.products) ? parsed.products.join(', ') : '');
      setDescription(parsed.description || '');
      setRawBrochureText(aiPasteText);

      setAiSuccess(true);
      // Automatically switch to manual tab so user can review and edit
      setTimeout(() => {
        setActiveTab('manual');
        setAiSuccess(false);
      }, 1000);

    } catch (err: any) {
      setAiError(err.message || 'Error occurred while analyzing document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim()) {
      setFormError('Company Name and Contact Representative Name are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const response = await fetch('/api/vendors/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          industry,
          contactName,
          contactEmail,
          contactPhone,
          website,
          products: products.split(',').map(p => p.trim()).filter(Boolean),
          description,
          rawBrochureText,
          attachments: manualAttachments
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to register vendor.');
      }

      const savedVendor = await response.json();
      onAddComplete(savedVendor);
      
      // Reset forms
      resetForm();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setIndustry('IT Services');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setWebsite('');
    setProducts('');
    setDescription('');
    setRawBrochureText('');
    setAiPasteText('');
    setAiError(null);
    setFormError(null);
    setManualAttachments([]);
    setIsDragging(false);
    setActiveTab('ai');
  };

  return (
    <div id="add-vendor-backdrop" className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div id="add-vendor-modal" className="bg-white rounded-2xl w-full max-w-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-800">Register New Vendor</h2>
          </div>
          <button 
            type="button" 
            id="close-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Selector Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            type="button"
            id="tab-ai-import"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            A.I. Brochure Import (Quick)
          </button>
          <button
            type="button"
            id="tab-manual-form"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual Profile Form
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'ai' ? (
            /* AI Analyzer Panel */
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 mb-1">Instant Metadata Extraction</h4>
                  <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                    Paste raw text content from a vendor brochure, corporate email, flyer, or website catalog. Gemini will extract corporate names, contact details, product categories, and compile a formatted PDF copy automatically.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Unstructured Flyer / Brochure Content
                </label>
                <textarea
                  id="ai-paste-textarea"
                  value={aiPasteText}
                  onChange={(e) => setAiPasteText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-xl p-4 text-xs font-mono leading-relaxed text-slate-700"
                  placeholder="Example:
Acme BioTech Labs is a leader in clinical services. Contact our director David Miller at david@acmebiotech.com or dial +1 555-019-3388. We manufacture sterile assays and provide lab consulting..."
                />
              </div>

              {aiError && (
                <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium leading-relaxed">{aiError}</span>
                </div>
              )}

              {aiSuccess && (
                <div className="flex gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-700">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold leading-relaxed">Success! Profile parsed. Transferring to edit form...</span>
                </div>
              )}

              <button
                type="button"
                id="ai-parse-btn"
                disabled={isAnalyzing}
                onClick={handleAiAnalyze}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gemini Extrapolating Details...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Fill Profile Form
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Traditional Form */
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 animate-fadeIn">
              
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="form-company-name"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="e.g. Sterling Industries"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    id="form-industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700 bg-white"
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

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Contact Rep Name *
                  </label>
                  <input
                    type="text"
                    id="form-contact-name"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    id="form-contact-email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="rep@company.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    id="form-contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="+1 (555) 012-3456"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Company Website
                  </label>
                  <input
                    type="text"
                    id="form-website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="https://sterling.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Core Solutions / Products (comma separated)
                  </label>
                  <input
                    type="text"
                    id="form-products"
                    value={products}
                    onChange={(e) => setProducts(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-slate-700"
                    placeholder="e.g. Steel Columns, Structural Bracing, Custom Castings"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Business Value Description
                </label>
                <textarea
                  id="form-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg p-3 text-xs text-slate-700"
                  placeholder="Provide a 1-2 sentence description summarizing what they offer..."
                />
              </div>

              {/* Brochure Text Log */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  Archived Brochure Source Text
                  <span className="text-[9px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm normal-case">
                    Auto-generated Brochure PDF
                  </span>
                </label>
                <textarea
                  id="form-brochure-text"
                  value={rawBrochureText}
                  onChange={(e) => setRawBrochureText(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden rounded-lg p-3 text-xs font-mono text-slate-500"
                  placeholder="Optional: raw text brochure context..."
                />
              </div>

              {/* Document Attachments Field */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  Documents & Brochures Attachments
                  <span className="text-[9px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm normal-case">
                    PDF, DOCX, PNG, TXT
                  </span>
                </label>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    id="manual-file-upload"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Drag & drop files here, or{' '}
                    <label
                      htmlFor="manual-file-upload"
                      className="text-indigo-600 hover:text-indigo-700 cursor-pointer hover:underline font-bold"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Attach sales decks, technical specifications sheets, or product list catalogs.
                  </p>
                </div>

                {/* Staged Attachments List */}
                {manualAttachments.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Staged Files ({manualAttachments.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {manualAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl shadow-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate" title={att.name}>
                                {att.name}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">
                                {att.type} • {att.size}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="text-xs font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  id="form-cancel-btn"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="form-submit-btn"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Vendor Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
