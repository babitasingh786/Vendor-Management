/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Send, Sparkles, MessageSquare, Mail, AlertCircle, RefreshCw, CheckCircle, HelpCircle, Code } from 'lucide-react';
import { SyncLog, Vendor } from '../types';
import IntegrationGuide from './IntegrationGuide';

interface SimulatorPaneProps {
  onSyncComplete: (newVendor: Vendor) => void;
  logs: SyncLog[];
  refreshLogs: () => void;
}

const PRESETS = {
  whatsapp: [
    {
      label: 'Organic Harvest Ltd',
      sender: '+1 (555) 017-4422',
      payload: `Hey there! 🥦 Sharing our latest catalog for Organic Harvest Ltd. We supply bulk organic agricultural ingredients, avocados, mangos, and premium citrus oils to commercial kitchens and processors. 

Check out our primary website at https://organicharvest.com or contact our sales director Robert Diaz on this number or via robert@organicharvest.com. We can dispatch regional shipments within 48 hours! 

Let us know if you want a sample pack.`
    },
    {
      label: 'Zylog Creative Agency',
      sender: '+1 (555) 012-7711',
      payload: `Hello Procurement Lead,

Looking for a design and marketing partner? Zylog Creative Agency specializes in full-funnel corporate brand development, customized SEO growth programs, and high-engagement social content calendars. 

Check our portfolio at https://zylogcreative.com. You can reach our onboarding lead Leo Zhang at leo@zylogcreative.com or message us right here. Let us help elevate your brand presence!`
    }
  ],
  email: [
    {
      label: 'Vertex Steel Fabricators',
      sender: 'sales@vertexsteel.com',
      subject: 'B2B Proposal: Structural Steel & CNC Machining SLA',
      payload: `Dear Procurement Team,

I am Helen Vance, the Business Development Manager at Vertex Steel Fabricators. I am writing to submit our structural engineering brochure for your vendor network.

Vertex Steel manufactures heavy industrial machinery brackets, high-tensile fasteners, and provides customized CNC machining SLAs. We hold full ISO-9001 certifications.

Our facilities are fully detailed at https://vertexsteel.com. We welcome an audit of our manufacturing plant. For immediate RFQs, you can reach me directly at helen@vertexsteel.com or call +1 (555) 018-9900.

Sincerely,
Helen Vance
Vertex Steel Fabricators`
    }
  ]
};

export default function SimulatorPane({ onSyncComplete, logs, refreshLogs }: SimulatorPaneProps) {
  const [mode, setMode] = useState<'simulate' | 'guide'>('simulate');
  const [channel, setChannel] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [sender, setSender] = useState(PRESETS.whatsapp[0].sender);
  const [subject, setSubject] = useState('');
  const [payload, setPayload] = useState(PRESETS.whatsapp[0].payload);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [successVendor, setSuccessVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: any) => {
    setSender(preset.sender);
    setPayload(preset.payload);
    if (channel === 'Email') {
      setSubject(preset.subject || 'Vendor Brochure & Terms');
    } else {
      setSubject('');
    }
    setSuccessVendor(null);
    setError(null);
  };

  const handleChannelChange = (newChannel: 'WhatsApp' | 'Email') => {
    setChannel(newChannel);
    const presets = newChannel === 'WhatsApp' ? PRESETS.whatsapp : PRESETS.email;
    setSender(presets[0].sender);
    setPayload(presets[0].payload);
    setSubject(newChannel === 'Email' ? (presets[0] as any).subject : '');
    setSuccessVendor(null);
    setError(null);
  };

  const triggerSync = async () => {
    if (!sender.trim() || !payload.trim()) {
      setError('Sender and brochure message body are required.');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccessVendor(null);

    // Dynamic, high-fidelity loading messages to illustrate process steps
    const steps = [
      'Establishing secure inbound webhook connection...',
      'Analyzing brochure document using Gemini 3.5 Flash...',
      'Extracting corporate identity, contacts, and products...',
      'Simulating contact verification and validation...'
    ];

    let currentStep = 0;
    setStatusMessage(steps[0]);
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStatusMessage(steps[currentStep]);
      }
    }, 900);

    try {
      const response = await fetch('/api/vendors/sync-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          sender,
          subject: channel === 'Email' ? subject : undefined,
          rawPayload: payload
        })
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to sync brochure');
      }

      const data = await response.json();
      setStatusMessage('Synchronization complete!');
      setSuccessVendor(data.vendor);
      onSyncComplete(data.vendor);
      refreshLogs();
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'An error occurred during synchronization.');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="simulator-form" className="flex flex-col gap-5 h-full">
      {/* Mode Tabs */}
      <div className="flex border-b border-slate-100 pb-1">
        <button
          type="button"
          onClick={() => setMode('simulate')}
          className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            mode === 'simulate'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Simulator
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode('guide')}
          className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            mode === 'guide'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Code className="w-3.5 h-3.5" />
            Production Setup Guide
          </span>
        </button>
      </div>

      {mode === 'guide' ? (
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <IntegrationGuide />
        </div>
      ) : (
        <>
          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              id="sim-whatsapp-tab"
              onClick={() => handleChannelChange('WhatsApp')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                channel === 'WhatsApp'
                  ? 'bg-white text-emerald-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Chat
            </button>
            <button
              type="button"
              id="sim-email-tab"
              onClick={() => handleChannelChange('Email')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                channel === 'Email'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              Corporate Email
            </button>
          </div>

          {/* Presets Row */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Preset Documents</span>
            <div className="flex flex-wrap gap-1.5">
              {(channel === 'WhatsApp' ? PRESETS.whatsapp : PRESETS.email).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`preset-btn-${idx}`}
                  onClick={() => applyPreset(preset)}
                  className="text-xs border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-1.5 font-medium text-slate-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Interface Preview Form */}
          <div className="flex flex-col gap-3.5 bg-slate-50 border border-slate-100 p-4 rounded-xl relative">
            <div className="absolute top-2 right-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                Live Stream
              </span>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Sender {channel === 'WhatsApp' ? 'Mobile No.' : 'Address'}
              </label>
              <input
                type="text"
                id="sim-sender-input"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                placeholder={channel === 'WhatsApp' ? '+1 (555) 000-0000' : 'sender@company.com'}
              />
            </div>

            {channel === 'Email' && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  id="sim-subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  placeholder="Subject Proposal"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Brochure Message / Conversation Body
              </label>
              <textarea
                id="sim-payload-input"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={6}
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-mono leading-relaxed"
                placeholder="Paste flyer copy, business introduction, pricing tables..."
              />
            </div>
          </div>

          {/* Actions & Feedback */}
          <div className="mt-auto">
            {error && (
              <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 mb-4 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-xs font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {isSyncing && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center mb-4 animate-fadeIn">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-semibold text-indigo-800">{statusMessage}</p>
                <p className="text-[10px] text-indigo-600 mt-1">This takes only 2-3 seconds as Gemini processes the metadata structure.</p>
              </div>
            )}

            {successVendor && !isSyncing && (
              <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 mb-4 animate-fadeIn">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold leading-none mb-1">Successfully Synced!</p>
                  <p className="text-xs leading-relaxed">
                    Extracted <strong className="font-semibold">{successVendor.companyName}</strong> ({successVendor.industry}) into directory. Verification milestones triggered.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              id="sync-action-btn"
              disabled={isSyncing}
              onClick={triggerSync}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs shadow-xs transition-all ${
                isSyncing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : channel === 'WhatsApp'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-100'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Inbound Payload...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simulate Inbound {channel} Sync
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
