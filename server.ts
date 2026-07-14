/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables
dotenv.config();

// Resolve paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily to handle cases where the key is missing or set up later
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Local Database Paths
const DB_DIR = path.join(__dirname, 'src', 'db');
const VENDORS_FILE = path.join(DB_DIR, 'vendors.json');
const LOGS_FILE = path.join(DB_DIR, 'sync_logs.json');

// Ensure DB directory and files exist with seed data
function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Check and seed vendors
  if (!fs.existsSync(VENDORS_FILE)) {
    const defaultVendors = [
      {
        id: 'v_1',
        companyName: 'Apex Tech Solutions',
        industry: 'IT Services',
        contactName: 'Sarah Jenkins',
        contactEmail: 'onboarding@apextech.com',
        contactPhone: '+1 (555) 019-2834',
        source: 'Email',
        description: 'Premium enterprise software development, cloud migration consulting, and 24/7 dedicated system support provider.',
        status: 'Onboarded',
        website: 'https://apextech.com',
        products: ['Cloud Architecture Migration', 'Enterprise Software Suite', 'System Support SLA'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        syncTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        statusHistory: [
          { status: 'Received', label: 'Brochure Received', message: 'Brochure synced automatically from inbound email contact@apextech.com', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Analyzing', label: 'AI Analyzed', message: 'Gemini AI extracted corporate details, contact profile, and catalog references', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Verified', label: 'Details Verified', message: 'Domain, email address MX records, and phone structure successfully verified', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Contacted', label: 'Contact Initiated', message: 'Automated introductory outreach sent to onboarding@apextech.com', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Vendor verified and successfully integrated into primary directory', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: true }
        ],
        attachments: [
          { id: 'att_1', name: 'Apex_Corporate_Brochure_2026.pdf', type: 'pdf', size: '2.4 MB', contentSummary: 'A 12-page presentation on server solutions, customized software development modules, and service-level support pricing.' }
        ]
      },
      {
        id: 'v_2',
        companyName: 'EcoLogix Packaging',
        industry: 'Manufacturing',
        contactName: 'Carlos Mendez',
        contactEmail: 'info@ecologixpack.com',
        contactPhone: '+1 (555) 014-9812',
        source: 'WhatsApp',
        description: 'Sustainable biodegradable shipping boxes, custom-designed honeycomb protective inserts, and recycled product wrappers.',
        status: 'Contacted',
        website: 'https://ecologixpack.com',
        products: ['Honeycomb Cardboard Shippers', 'Biodegradable Packing Peanuts', 'Custom Branded Mailers'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        syncTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        statusHistory: [
          { status: 'Received', label: 'Brochure Received', message: 'Brochure received via incoming WhatsApp business transmission', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Analyzing', label: 'AI Analyzed', message: 'Brochure analyzed with Gemini. Catalog details parsed', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Verified', label: 'Details Verified', message: 'Registered enterprise and active telephone channels validated', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Contacted', label: 'Contact Initiated', message: 'Automated introductory terms confirmation sent on WhatsApp', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: true },
          { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Onboarding criteria verification pending review', isCompleted: false, isCurrent: false }
        ],
        attachments: [
          { id: 'att_2', name: 'EcoLogix_Product_Catalog.pdf', type: 'pdf', size: '4.8 MB', contentSummary: 'Eco-friendly cardboard catalog with precise item measurements, structural stress-test specifications, and wholesale pricing tables.' }
        ]
      },
      {
        id: 'v_3',
        companyName: 'Global Food Supply Inc.',
        industry: 'Food & Beverage',
        contactName: 'Monica Geller',
        contactEmail: 'sales@globalfoodsupply.com',
        contactPhone: '+1 (555) 015-4321',
        source: 'Manual',
        description: 'Bulk agricultural ingredients, culinary oils, and organic grains supplier servicing restaurants and commercial packaging clients.',
        status: 'Verified',
        website: 'https://globalfoodsupply.com',
        products: ['Organic Canola Oil', 'Bulk Quinoa & Rice', 'Specialty Baking Flour'],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        statusHistory: [
          { status: 'Received', label: 'Brochure Received', message: 'Vendor added manually via administrator portal', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Analyzing', label: 'AI Analyzed', message: 'Data structural profile initialized. System logs updated', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Verified', label: 'Details Verified', message: 'Compliance clearance confirmed and contact channels validated', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: true },
          { status: 'Contacted', label: 'Contact Initiated', message: 'Schedule review check for email transmission', isCompleted: false, isCurrent: false },
          { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Onboarding criteria verification pending review', isCompleted: false, isCurrent: false }
        ],
        attachments: [
          { id: 'att_3', name: 'Wholesale_Grains_Oils_2026.pdf', type: 'pdf', size: '1.2 MB', contentSummary: 'Bulk ingredient supply sheet displaying organic certifications, volume price thresholds, and regional distribution routes.' }
        ]
      },
      {
        id: 'v_4',
        companyName: 'Vertex Steel Fabricators',
        industry: 'Metal Fabrication',
        contactName: 'Helen Vance',
        contactEmail: 'helen@vertexsteel.com',
        contactPhone: '+1 (555) 018-9900',
        source: 'Email',
        description: 'ISO-9001 certified metal fabrication shop offering high-tensile fasteners, heavy machine brackets, and customized CNC machining SLAs.',
        status: 'Onboarded',
        website: 'https://vertexsteel.com',
        products: ['Heavy Industrial Machinery Brackets', 'High-Tensile Fasteners', 'CNC Machining SLA'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        syncTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        statusHistory: [
          { status: 'Received', label: 'Brochure Received', message: 'Brochure synced automatically from inbound email helen@vertexsteel.com', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Analyzing', label: 'AI Analyzed', message: 'Gemini AI extracted corporate details, contact profile, and catalog references', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Verified', label: 'Details Verified', message: 'Basic identity verification completed. MX records and phone structure validated.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Contacted', label: 'Contact Initiated', message: 'Automated introductory outreach pack delivered', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: false },
          { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Vendor verified and successfully integrated into primary directory', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), isCompleted: true, isCurrent: true }
        ],
        attachments: [
          { id: 'att_4', name: 'Vertex_Steel_Capabilities.pdf', type: 'pdf', size: '3.1 MB', contentSummary: 'Heavy bracket welding, CNC machining toolings catalog, structural fasteners, and certified ISO compliance certifications.' }
        ]
      }
    ];
    defaultVendors.forEach(autoAddMetalFabricationServices);
    fs.writeFileSync(VENDORS_FILE, JSON.stringify(defaultVendors, null, 2));
  }

  // Check and seed logs
  if (!fs.existsSync(LOGS_FILE)) {
    const defaultLogs = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'Email',
        sender: 'onboarding@apextech.com',
        subject: 'Corporate Brochure & Collaboration Proposal',
        rawPayload: 'Hello Procurement Team,\n\nI hope this email finds you well. I am attaching our latest brochure showing our IT and software development capabilities. We specialize in robust cloud migration and system SLAs.\n\nWarm regards,\nSarah Jenkins\nApex Tech Solutions\nSarah@apextech.com\n+1 (555) 019-2834',
        status: 'success',
        extractedVendorId: 'v_1'
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'WhatsApp',
        sender: '+1 (555) 014-9812',
        rawPayload: 'Hi! Sending over the packaging catalog we discussed. EcoLogix produces cardboard Honeycomb Shippers and biodegradable mailers. Contact me here or at info@ecologixpack.com. - Carlos Mendez',
        status: 'success',
        extractedVendorId: 'v_2'
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'Email',
        sender: 'helen@vertexsteel.com',
        subject: 'B2B Proposal: Structural Steel & CNC Machining SLA',
        rawPayload: 'Dear Procurement Team,\n\nI am Helen Vance, the Business Development Manager at Vertex Steel Fabricators. I am writing to submit our structural engineering brochure for your vendor network.\n\nVertex Steel manufactures heavy industrial machinery brackets, high-tensile fasteners, and provides customized CNC machining SLAs. We hold full ISO-9001 certifications.\n\nOur facilities are fully detailed at https://vertexsteel.com. We welcome an audit of our manufacturing plant. For immediate RFQs, you can reach me directly at helen@vertexsteel.com or call +1 (555) 018-9900.\n\nSincerely,\nHelen Vance\nVertex Steel Fabricators',
        status: 'success',
        extractedVendorId: 'v_4'
      }
    ];
    fs.writeFileSync(LOGS_FILE, JSON.stringify(defaultLogs, null, 2));
  }
}

function autoAddMetalFabricationServices(vendor: any) {
  if (vendor && (vendor.industry === 'Metal Fabrication' || (vendor.industry || '').toLowerCase().includes('fabrication')) && Array.isArray(vendor.products)) {
    const servicesToAdd = new Set<string>();
    
    for (const p of vendor.products) {
      const pLwr = p.toLowerCase();
      if (pLwr.includes('bracket')) {
        servicesToAdd.add('Heavy Bracket Welding');
        servicesToAdd.add('Structural Bracket Installation');
        servicesToAdd.add('Machinery Assembly');
      }
      if (pLwr.includes('fastener') || pLwr.includes('bolt') || pLwr.includes('screw')) {
        servicesToAdd.add('Custom Fastener Threading');
        servicesToAdd.add('Corrosion Resistance Coating');
        servicesToAdd.add('Tensile Strength Testing');
      }
      if (pLwr.includes('steel') || pLwr.includes('beam') || pLwr.includes('tubing') || pLwr.includes('framing') || pLwr.includes('iron')) {
        servicesToAdd.add('Structural Steel Fabrication');
        servicesToAdd.add('Plasma Arc Cutting');
        servicesToAdd.add('Rigging & On-Site Erection');
      }
      if (pLwr.includes('machining') || pLwr.includes('cnc') || pLwr.includes('lathe') || pLwr.includes('mill') || pLwr.includes('part') || pLwr.includes('gear')) {
        servicesToAdd.add('CNC Tooling & Programming');
        servicesToAdd.add('Prototype Milling');
        servicesToAdd.add('Precision Tolerance Inspection');
      }
      if (pLwr.includes('sheet metal') || pLwr.includes('enclosure') || pLwr.includes('chassis') || pLwr.includes('panel') || pLwr.includes('box')) {
        servicesToAdd.add('Laser Cutting & Punching');
        servicesToAdd.add('Precision Bending & Press Brake');
        servicesToAdd.add('Custom Powder Coating');
      }
      if (pLwr.includes('aluminum') || pLwr.includes('copper') || pLwr.includes('weld')) {
        servicesToAdd.add('MIG/TIG Weld Certification');
        servicesToAdd.add('CAD Design & Metal Prototyping');
        servicesToAdd.add('Anodizing & Bead Blasting');
      }
    }
    
    if (servicesToAdd.size === 0) {
      servicesToAdd.add('Custom Prototyping & CAD Design');
      servicesToAdd.add('Deburring & Metal Finishing');
      servicesToAdd.add('Quality Assurance Reporting');
    }
    
    const currentProducts = new Set(vendor.products.map((x: string) => x.trim().toLowerCase()));
    for (const service of servicesToAdd) {
      if (!currentProducts.has(service.toLowerCase())) {
        vendor.products.push(service);
      }
    }
  }
}

initDatabase();

// Database read/write helpers
function getVendors(): any[] {
  try {
    return JSON.parse(fs.readFileSync(VENDORS_FILE, 'utf-8'));
  } catch (error) {
    return [];
  }
}

function saveVendors(vendors: any[]) {
  vendors.forEach(autoAddMetalFabricationServices);
  fs.writeFileSync(VENDORS_FILE, JSON.stringify(vendors, null, 2));
}

function getLogs(): any[] {
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
  } catch (error) {
    return [];
  }
}

function saveLogs(logs: any[]) {
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

// Generate a mock Brochure Summary text (mimics a professional brochure PDF preview)
function generateBrochureSummary(vendor: any): string {
  const productsList = (vendor.products || []).map((p: string) => `- ${p}`).join('\n');
  return `=========================================
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

CORE CAPABILITIES & SOLUTIONS
-----------------------------------------
${productsList || '- Standard custom products & service contracts'}

ONBOARDING STATUS REPORT
-----------------------------------------
This capability statement has been synced automatically from active messaging streams (${vendor.source} Channel) and verified by our real-time AI parser on ${new Date(vendor.createdAt).toLocaleDateString()}.
Reference ID: ${vendor.id}

For direct inquiries or bulk order requests, contact our onboarding manager at ${vendor.contactEmail}.`;
}

// REST API Endpoints

// 1. Get all vendors
app.get('/api/vendors', (req, res) => {
  res.json(getVendors());
});

// 2. Get all logs
app.get('/api/vendors/logs', (req, res) => {
  res.json(getLogs());
});

// 3. Clear database (Utility for testing)
app.post('/api/vendors/reset', (req, res) => {
  if (fs.existsSync(VENDORS_FILE)) fs.unlinkSync(VENDORS_FILE);
  if (fs.existsSync(LOGS_FILE)) fs.unlinkSync(LOGS_FILE);
  initDatabase();
  res.json({ message: 'Database reset to default seed data successfully.' });
});

// 4. Update vendor status or history
app.post('/api/vendors/update-status', (req, res) => {
  const { vendorId, status, message } = req.body;
  if (!vendorId || !status) {
    return res.status(400).json({ error: 'Vendor ID and Status are required' });
  }

  const vendors = getVendors();
  const index = vendors.findIndex(v => v.id === vendorId);
  if (index === -1) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  const vendor = vendors[index];
  vendor.status = status;

  // Mark previous as completed and add/update history
  vendor.statusHistory = vendor.statusHistory.map((h: any) => ({
    ...h,
    isCurrent: false,
    isCompleted: true
  }));

  const existingMilestoneIndex = vendor.statusHistory.findIndex((h: any) => h.status === status);
  if (existingMilestoneIndex !== -1) {
    vendor.statusHistory[existingMilestoneIndex] = {
      status,
      label: getStatusLabel(status),
      message: message || getStatusDefaultMessage(status, vendor.companyName),
      timestamp: new Date().toISOString(),
      isCompleted: true,
      isCurrent: true
    };
  } else {
    vendor.statusHistory.push({
      status,
      label: getStatusLabel(status),
      message: message || getStatusDefaultMessage(status, vendor.companyName),
      timestamp: new Date().toISOString(),
      isCompleted: true,
      isCurrent: true
    });
  }

  vendors[index] = vendor;
  saveVendors(vendors);

  res.json(vendor);
});

// 5. Delete a vendor
app.post('/api/vendors/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID is required' });

  const vendors = getVendors();
  const updated = vendors.filter(v => v.id !== id);
  saveVendors(updated);
  res.json({ success: true, message: 'Vendor removed successfully' });
});

// 5.5 Update a vendor details
app.post('/api/vendors/update', (req, res) => {
  const { id, companyName, industry, contactName, contactEmail, contactPhone, description, website, products } = req.body;
  if (!id) return res.status(400).json({ error: 'ID is required' });

  const vendors = getVendors();
  const index = vendors.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  const vendor = vendors[index];
  if (companyName) vendor.companyName = companyName;
  if (industry) vendor.industry = industry;
  if (contactName) vendor.contactName = contactName;
  if (contactEmail) vendor.contactEmail = contactEmail;
  if (contactPhone) vendor.contactPhone = contactPhone;
  if (description !== undefined) vendor.description = description;
  if (website !== undefined) vendor.website = website;
  if (products !== undefined) {
    vendor.products = Array.isArray(products) 
      ? products 
      : products ? products.split(',').map((p: string) => p.trim()) : [];
  }

  vendors[index] = vendor;
  saveVendors(vendors);
  res.json({ success: true, vendor });
});

// 6. Parse brochure text (Manual Quick Add tool) using Gemini API
app.post('/api/vendors/parse-brochure', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Brochure text is required' });
  }

  const result = await runGeminiBrochureParse(text);
  res.json(result);
});

// 7. Manual addition of vendor
app.post('/api/vendors/manual', (req, res) => {
  const {
    companyName,
    industry,
    contactName,
    contactEmail,
    contactPhone,
    description,
    website,
    products,
    rawBrochureText,
    attachments
  } = req.body;

  if (!companyName || !industry || !contactName) {
    return res.status(400).json({ error: 'Company Name, Industry, and Contact Name are required.' });
  }

  const vendors = getVendors();
  const id = `v_manual_${Date.now()}`;
  
  const formattedProducts = Array.isArray(products) 
    ? products 
    : products ? products.split(',').map((p: string) => p.trim()) : [];

  const newVendor: any = {
    id,
    companyName,
    industry,
    contactName,
    contactEmail: contactEmail || 'N/A',
    contactPhone: contactPhone || 'N/A',
    source: 'Manual',
    description: description || 'No summary description provided.',
    status: 'Received',
    website: website || '',
    products: formattedProducts,
    createdAt: new Date().toISOString(),
    rawBrochureText: rawBrochureText || '',
    attachments: attachments || [],
    statusHistory: [
      { status: 'Received', label: 'Brochure Received', message: 'Vendor created manually through portal administration panel', timestamp: new Date().toISOString(), isCompleted: true, isCurrent: true },
      { status: 'Analyzing', label: 'AI Analyzed', message: 'Vendor details processed and indexed by system intelligence', isCompleted: false, isCurrent: false },
      { status: 'Verified', label: 'Details Verified', message: 'Check domain integrity, verification of telephone channels', isCompleted: false, isCurrent: false },
      { status: 'Contacted', label: 'Contact Initiated', message: 'Outreach and introduction message queued', isCompleted: false, isCurrent: false },
      { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Onboard process finalized', isCompleted: false, isCurrent: false }
    ]
  };

  if (rawBrochureText && rawBrochureText.trim() !== '') {
    newVendor.attachments.push({
      id: `att_manual_${Date.now()}`,
      name: `${companyName.replace(/\s+/g, '_')}_Brochure.pdf`,
      type: 'pdf',
      size: `${Math.ceil(rawBrochureText.length / 300) || 50} KB`,
      contentSummary: rawBrochureText.length > 250 ? rawBrochureText.substring(0, 250) + '...' : rawBrochureText
    });
  }

  vendors.push(newVendor);
  saveVendors(vendors);

  // Simulate automated status progression for Manual additions
  runAutomatedVerification(id);

  res.json(newVendor);
});

// 8. Simulate inbound real-time WhatsApp or Email transmission
app.post('/api/vendors/sync-simulate', async (req, res) => {
  const { channel, sender, subject, rawPayload } = req.body;

  if (!channel || !sender || !rawPayload) {
    return res.status(400).json({ error: 'Channel, sender, and rawPayload are required.' });
  }

  const logId = `log_${Date.now()}`;
  const logs = getLogs();
  
  try {
    // 1. Call Gemini to parse and extract Structured JSON
    const parsedData = await runGeminiBrochureParse(rawPayload);

    // 2. Formulate New Vendor ID
    const vendors = getVendors();
    const vendorId = `v_sync_${Date.now()}`;

    // 3. Complete structural status timelines
    const newVendor: any = {
      id: vendorId,
      companyName: parsedData.companyName,
      industry: parsedData.industry,
      contactName: parsedData.contactName,
      contactEmail: parsedData.contactEmail,
      contactPhone: parsedData.contactPhone,
      source: channel,
      description: parsedData.description,
      status: 'Received',
      website: parsedData.website || '',
      products: parsedData.products || [],
      createdAt: new Date().toISOString(),
      syncTimestamp: new Date().toISOString(),
      rawBrochureText: rawPayload,
      attachments: [
        {
          id: `att_sync_${Date.now()}`,
          name: `${parsedData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Brochure.pdf`,
          type: 'pdf',
          size: `${Math.floor(Math.random() * 4) + 1}.${Math.floor(Math.random() * 9)} MB`,
          contentSummary: parsedData.description
        }
      ],
      statusHistory: [
        { status: 'Received', label: 'Brochure Received', message: `Brochure synced in real-time from inbound ${channel} sent by ${sender}`, timestamp: new Date().toISOString(), isCompleted: true, isCurrent: true },
        { status: 'Analyzing', label: 'AI Analyzed', message: 'Brochure and structural profiles extracted successfully using Gemini 3.5 Flash', isCompleted: false, isCurrent: false },
        { status: 'Verified', label: 'Details Verified', message: 'Checks verification of telephone, email syntax, and business record', isCompleted: false, isCurrent: false },
        { status: 'Contacted', label: 'Contact Initiated', message: 'Outreach and introduction message queued', isCompleted: false, isCurrent: false },
        { status: 'Onboarded', label: 'Approved & Onboarded', message: 'Onboard process finalized', isCompleted: false, isCurrent: false }
      ]
    };

    vendors.push(newVendor);
    saveVendors(vendors);

    // 4. Record Successful Log
    logs.push({
      id: logId,
      timestamp: new Date().toISOString(),
      channel,
      sender,
      subject: subject || '',
      rawPayload,
      status: 'success',
      extractedVendorId: vendorId
    });
    saveLogs(logs);

    // 5. Trigger Async Simulated Auto-Verification
    runAutomatedVerification(vendorId);

    res.json({
      success: true,
      logId,
      vendor: newVendor
    });

  } catch (error: any) {
    console.error('Inbound Sync Error:', error);

    // Write failed log
    logs.push({
      id: logId,
      timestamp: new Date().toISOString(),
      channel,
      sender,
      subject: subject || '',
      rawPayload,
      status: 'failed',
      error: error.message || 'Parsing failure'
    });
    saveLogs(logs);

    res.status(500).json({
      error: 'Failed to process brochure message',
      details: error.message
    });
  }
});

// Helper: Status default info
function getStatusLabel(status: string): string {
  switch (status) {
    case 'Received': return 'Brochure Received';
    case 'Analyzing': return 'AI Analyzed';
    case 'Verified': return 'Details Verified';
    case 'Contacted': return 'Contact Initiated';
    case 'Onboarded': return 'Approved & Onboarded';
    case 'Rejected': return 'Vendor Rejected';
    default: return status;
  }
}

function getStatusDefaultMessage(status: string, companyName: string): string {
  switch (status) {
    case 'Received': return `Vendor application received and added to system.`;
    case 'Analyzing': return `AI parsing completed. Extracted services catalog.`;
    case 'Verified': return `Identity verified. Contact routes validated.`;
    case 'Contacted': return `Automated introductory outreach message successfully delivered.`;
    case 'Onboarded': return `Vendor validated, finalized, and onboarding complete.`;
    case 'Rejected': return `Vendor declined due to non-compliance or category mismatch.`;
    default: return `Vendor state updated.`;
  }
}

// Background Simulated Automated Status Progression
// Mimics a real-time system working asynchronously to verify and progress
function runAutomatedVerification(vendorId: string) {
  setTimeout(() => {
    // Stage 1: AI Analyzed
    const vendors = getVendors();
    const idx = vendors.findIndex(v => v.id === vendorId);
    if (idx === -1) return;

    let v = vendors[idx];
    v.status = 'Analyzing';
    v.statusHistory = v.statusHistory.map((h: any) => {
      if (h.status === 'Received') return { ...h, isCompleted: true, isCurrent: false };
      if (h.status === 'Analyzing') return { ...h, isCompleted: true, isCurrent: true, timestamp: new Date().toISOString() };
      return h;
    });
    vendors[idx] = v;
    saveVendors(vendors);

    setTimeout(() => {
      // Stage 2: Details Verified
      const vendorsCurrent = getVendors();
      const currentIdx = vendorsCurrent.findIndex(vd => vd.id === vendorId);
      if (currentIdx === -1) return;

      let currentV = vendorsCurrent[currentIdx];
      // Do not overwrite if user changed it in between
      if (currentV.status !== 'Analyzing') return;

      currentV.status = 'Verified';
      currentV.statusHistory = currentV.statusHistory.map((h: any) => {
        if (h.status === 'Analyzing') return { ...h, isCompleted: true, isCurrent: false };
        if (h.status === 'Verified') {
          // Verify details logic
          const hasEmail = currentV.contactEmail && currentV.contactEmail.includes('@');
          const hasPhone = currentV.contactPhone && currentV.contactPhone.length > 5;
          const statusMsg = (hasEmail && hasPhone) 
            ? 'Automatic background lookup verified email address domain and mobile connectivity route.'
            : 'Basic identity verification completed. Some details are pending manual validation.';

          return { ...h, isCompleted: true, isCurrent: true, message: statusMsg, timestamp: new Date().toISOString() };
        }
        return h;
      });
      vendorsCurrent[currentIdx] = currentV;
      saveVendors(vendorsCurrent);

      setTimeout(() => {
        // Stage 3: Contact Initiated
        const vFinal = getVendors();
        const fIdx = vFinal.findIndex(vd => vd.id === vendorId);
        if (fIdx === -1) return;

        let finalV = vFinal[fIdx];
        if (finalV.status !== 'Verified') return;

        finalV.status = 'Contacted';
        finalV.statusHistory = finalV.statusHistory.map((h: any) => {
          if (h.status === 'Verified') return { ...h, isCompleted: true, isCurrent: false };
          if (h.status === 'Contacted') {
            const platform = finalV.source === 'WhatsApp' ? 'WhatsApp' : 'Email';
            const textMsg = `Automated onboarding introduction packet sent to ${finalV.contactName} via ${platform} (${platform === 'WhatsApp' ? finalV.contactPhone : finalV.contactEmail}).`;
            return { ...h, isCompleted: true, isCurrent: true, message: textMsg, timestamp: new Date().toISOString() };
          }
          return h;
        });
        vFinal[fIdx] = finalV;
        saveVendors(vFinal);
      }, 5000); // 5 seconds to contact initiation
    }, 4000); // 4 seconds to verify details
  }, 2500); // 2.5 seconds to AI analysis
}

// Actual Gemini API implementation for parsing vendor details from brochure text
async function runGeminiBrochureParse(text: string): Promise<any> {
  const client = getGeminiClient();

  if (!client) {
    console.log('Gemini API client not initialized. Using fallback brochure parser.');
    return runFallbackParser(text);
  }

  try {
    const prompt = `You are a high-performance procurement intelligence parser. Take the following unstructured vendor brochure text, communication, or marketing document, and extract critical corporate profile metrics.
    Be thorough and extract real names, products, phone numbers, and emails if present. If something is completely absent, guess or synthesize a reasonable value based on the context (do not leave empty or say N/A).

    INPUT DOCUMENT TEXT:
    """
    ${text}
    """`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You extract structured vendor information from raw files or messages. Always supply reasonable, complete values for fields based on context. Guess standard industries (e.g., IT Services, Manufacturing, Marketing, Logistics, Professional Services, Food & Beverage, Metal Fabrication) if not specified.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { 
              type: Type.STRING, 
              description: 'The name of the vendor company' 
            },
            industry: { 
              type: Type.STRING, 
              description: 'Primary industry category. e.g., IT Services, Manufacturing, Professional Services, Food & Beverage, Logistics, Marketing, Construction, Agriculture, Metal Fabrication' 
            },
            contactName: { 
              type: Type.STRING, 
              description: 'Primary representative or contact person name. Formulate a suitable name if missing.' 
            },
            contactEmail: { 
              type: Type.STRING, 
              description: 'Primary business email address' 
            },
            contactPhone: { 
              type: Type.STRING, 
              description: 'Telephone or WhatsApp contact number' 
            },
            description: { 
              type: Type.STRING, 
              description: 'A polished, 1-2 sentence corporate description detailing their core business value.' 
            },
            website: { 
              type: Type.STRING, 
              description: 'Company website URL' 
            },
            products: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2 to 4 major products, services, or catalog solutions mentioned.'
            }
          },
          required: ['companyName', 'industry', 'contactName', 'contactEmail', 'contactPhone', 'description', 'products']
        }
      }
    });

    const parsedText = response.text || '';
    return JSON.parse(parsedText);

  } catch (error) {
    console.error('Gemini parsing failed, falling back to local heuristic extraction:', error);
    return runFallbackParser(text);
  }
}

// Fallback robust heuristic parser when Gemini is unavailable
function runFallbackParser(text: string): any {
  const lines = text.split('\n');
  let companyName = '';
  let industry = 'IT Services';
  let contactName = 'Onboarding Lead';
  let contactEmail = 'contact@vendor.com';
  let contactPhone = '+1 (555) 012-3456';
  let description = 'Custom professional products provider specializing in optimized business solutions.';
  let website = 'https://vendor.com';
  let products = ['Strategic Consulting Services', 'Enterprise Products Group'];

  // Basic regexes to sniff details
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const phoneRegex = /(\+?[0-9][\d\s()+-]{7,15}\d)/;
  const webRegex = /((https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;

  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    contactEmail = emailMatch[1];
    // Sniff domain for company name candidate
    const domain = contactEmail.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain.toLowerCase())) {
      const parts = domain.split('.')[0];
      companyName = parts.charAt(0).toUpperCase() + parts.slice(1) + ' Inc.';
      website = `https://${domain}`;
    }
  }

  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    contactPhone = phoneMatch[1];
  }

  const webMatch = text.match(webRegex);
  if (webMatch && !companyName) {
    website = webMatch[1];
    const cleanDomain = website.replace(/https?:\/\//, '').replace('www.', '').split('.')[0];
    companyName = cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1) + ' Corp';
  }

  // Sniffing Industry
  const txtLower = text.toLowerCase();
  if (txtLower.includes('pack') || txtLower.includes('box') || txtLower.includes('cardboard') || txtLower.includes('plastic')) {
    industry = 'Manufacturing';
    products = ['Custom Box Shippers', 'Eco Protection Sleeves'];
    description = 'High-grade packaging fabrication and shipping materials supplier.';
  } else if (txtLower.includes('food') || txtLower.includes('oil') || txtLower.includes('grain') || txtLower.includes('beverage') || txtLower.includes('catering')) {
    industry = 'Food & Beverage';
    products = ['Commercial Kitchen Supplies', 'Direct Crop Logistics'];
    description = 'Premium wholesale food and agricultural ingredients provisioning enterprise.';
  } else if (txtLower.includes('cloud') || txtLower.includes('software') || txtLower.includes('it') || txtLower.includes('developer') || txtLower.includes('tech')) {
    industry = 'IT Services';
    products = ['Custom API Nodes', 'SaaS Platform Support', 'Tech Advisory Services'];
    description = 'Next-generation tech integration, infrastructure optimization, and software development agency.';
  } else if (txtLower.includes('marketing') || txtLower.includes('ad') || txtLower.includes('social') || txtLower.includes('seo') || txtLower.includes('design')) {
    industry = 'Marketing';
    products = ['Brand Development Suite', 'SEO Growth Package', 'Social Content Calendar'];
    description = 'Full-funnel branding and growth agency delivering targeted commercial visibility.';
  } else if (txtLower.includes('metal') || txtLower.includes('fabrication') || txtLower.includes('steel') || txtLower.includes('weld') || txtLower.includes('machining') || txtLower.includes('bracket') || txtLower.includes('fastener')) {
    industry = 'Metal Fabrication';
    products = ['Heavy Industrial Machinery Brackets', 'High-Tensile Fasteners', 'CNC Machining SLA'];
    description = 'ISO-9001 certified precision metal fabrication workshop delivering custom machinery assemblies, heavy brackets, and fasteners.';
  }

  // Pick first line for company name if not set yet
  if (!companyName) {
    const firstLine = lines.find(l => l.trim().length > 3 && l.trim().length < 35);
    companyName = firstLine ? firstLine.trim() : 'Global Solutions Ltd';
  }

  // Contact name sniffer
  const nameSigners = ['regards', 'sincerely', 'thanks', 'best', 'from'];
  for (let i = 0; i < lines.length; i++) {
    const lineLwr = lines[i].toLowerCase();
    const hasSigner = nameSigners.some(s => lineLwr.startsWith(s));
    if (hasSigner && i + 1 < lines.length) {
      const nextL = lines[i + 1].trim();
      if (nextL.length > 2 && nextL.length < 25 && !nextL.includes('@')) {
        contactName = nextL;
        break;
      }
    }
  }

  // Use raw paragraph snippet as description if reasonable
  const paragraphs = text.split('\n\n').map(p => p.trim()).filter(p => p.length > 30 && p.length < 250);
  if (paragraphs.length > 0) {
    description = paragraphs[0];
  }

  return {
    companyName,
    industry,
    contactName,
    contactEmail,
    contactPhone,
    description,
    website,
    products
  };
}

// ----------------------------------------------------
// Express and Vite Dev Server Integration Middleware
// ----------------------------------------------------
async function startServer() {
  // Vite integration for dev server or production asset serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
