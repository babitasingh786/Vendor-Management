/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, MessageSquare, Code, Terminal, Key, Database, RefreshCw, Server, ShieldCheck } from 'lucide-react';

export default function IntegrationGuide() {
  return (
    <div className="flex flex-col gap-6 text-slate-700 animate-fadeIn">
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
        <p className="text-xs text-indigo-800 leading-relaxed font-medium">
          Below is the blueprint and production architecture to transition from this developer simulation to receiving <strong>live, real-world WhatsApp messages</strong> and <strong>corporate emails</strong> on your production server.
        </p>
      </div>

      {/* WhatsApp Section */}
      <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
        <div className="bg-emerald-50/60 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600 animate-pulse" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">WhatsApp Business Cloud API Setup</h3>
        </div>
        <div className="p-4 flex flex-col gap-3.5 text-xs">
          <div>
            <span className="font-bold text-slate-800 block mb-1">1. Register on Meta Developers Portal</span>
            <p className="text-slate-500 leading-relaxed">
              Create an app at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5">Meta Developers <Server className="w-3 h-3" /></a>, select <strong>Business</strong>, and add the <strong>WhatsApp</strong> product. Link your Meta Business Account and register a test or production phone number.
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">2. Implement the Webhook Verification Route</span>
            <p className="text-slate-500 leading-relaxed mb-2">
              Meta requires your server to verify ownership via a GET handshake containing a Hub Challenge token. Add this endpoint to your backend:
            </p>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre leading-normal">
{`app.get('/api/webhooks/whatsapp', (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});`}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">3. Handle Incoming Message Payloads</span>
            <p className="text-slate-500 leading-relaxed mb-2">
              Whenever a vendor messages or uploads a PDF brochure to your number, Meta posts a JSON webhook. Handle it on your POST route, extract the message text/media, and forward to Gemini:
            </p>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre leading-normal">
{`app.post('/api/webhooks/whatsapp', async (req, res) => {
  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (message) {
    const sender = message.from; // Sender phone number
    let brochureText = '';

    if (message.type === 'text') {
      brochureText = message.text.body;
    } else if (message.type === 'document') {
      // 1. Download media file from Meta using message.document.id & Bearer Token
      // 2. Extract text / OCR the document or feed to Gemini Multimodal API
      brochureText = await extractTextFromPDF(message.document.id);
    }

    // Process via Gemini API & add to vendor directory
    await processInboundVendor(sender, 'WhatsApp', brochureText);
  }
  res.sendStatus(200);
});`}
            </div>
          </div>
        </div>
      </div>

      {/* Email Section */}
      <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
        <div className="bg-indigo-50/60 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Email Ingestion Pipe (Inbound Parse)</h3>
        </div>
        <div className="p-4 flex flex-col gap-3.5 text-xs">
          <div>
            <span className="font-bold text-slate-800 block mb-1">1. Configure a Parse Domain (e.g. MX Records)</span>
            <p className="text-slate-500 leading-relaxed">
              Use a cloud email handler like <strong>SendGrid Inbound Parse</strong>, <strong>Mailgun</strong>, or <strong>Postmark</strong>. Point your subdomain (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-600">sync.yourcompany.com</code>)'s MX records to the parser servers.
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">2. Map Webhook URL</span>
            <p className="text-slate-500 leading-relaxed">
              In your mailer console (e.g. SendGrid), set your inbound webhook target to: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">https://yourdomain.com/api/webhooks/email</code>.
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1">3. Ingest and Extract Message Payload</span>
            <p className="text-slate-500 leading-relaxed mb-2">
              The incoming emails are POSTed as multi-part form-data. Parse using `multer` or similar middleware to extract body content and uploaded attachments:
            </p>
            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre leading-normal">
{`import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

app.post('/api/webhooks/email', upload.array('attachments'), async (req, res) => {
  const fromEmail = req.body.from;      // sender email
  const subject = req.body.subject;    // email subject line
  const emailText = req.body.text;     // plain text content
  
  // Extract details from emailText and attachment PDFs using Gemini API
  await processInboundVendor(fromEmail, 'Email', emailText, req.files);

  res.sendStatus(200);
});`}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Token Storage */}
      <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Production Security Checklist</h3>
        </div>
        <div className="p-4 text-xs flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-indigo-600 shrink-0">✓</span>
            <p className="text-slate-600 leading-normal"><strong>Verify Webhook Signatures:</strong> Meta sends a <code className="bg-slate-100 px-1 rounded font-mono">X-Hub-Signature-256</code> header. Compute an HMAC SHA256 of the payload using your App Secret to verify authenticity.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-indigo-600 shrink-0">✓</span>
            <p className="text-slate-600 leading-normal"><strong>Secure Key Handling:</strong> Save credentials like `GEMINI_API_KEY`, `WHATSAPP_TOKEN`, and verify strings safely using environment secrets on Cloud Run or Secret Manager. Never push secrets to source control.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-indigo-600 shrink-0">✓</span>
            <p className="text-slate-600 leading-normal"><strong>Asynchronous Jobs:</strong> Webhook providers require response codes in &lt; 3 seconds. Return a fast HTTP 200/OK status immediately, and parse the PDFs asynchronously using a background queue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
