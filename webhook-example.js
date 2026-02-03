/**
 * WEBHOOK EXAMPLE: Serverless Order Handler
 * 
 * This is a complete example of a serverless function for handling
 * Ramadan Journal orders. Works with Netlify Functions, Vercel, AWS Lambda, etc.
 * 
 * FEATURES:
 * - Validates form data
 * - Sends confirmation email to customer
 * - Sends fulfillment email to admin
 * - Logs order to Google Sheets (optional)
 * - Returns success/error response
 */

// ============================================
// DEPENDENCIES (install these)
// ============================================
// npm install @sendgrid/mail googleapis
// npm install dotenv (for local development)

const sgMail = require('@sendgrid/mail');
const { google } = require('googleapis');

// ============================================
// CONFIGURATION (use environment variables)
// ============================================
const CONFIG = {
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'orders@arise-platform.com',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@arise-platform.com',
  
  // Google Sheets (optional)
  useGoogleSheets: process.env.USE_GOOGLE_SHEETS === 'true',
  googleSheetId: process.env.GOOGLE_SHEET_ID,
  googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_JSON, // JSON string
  
  // Bank transfer details
  bankName: process.env.BANK_NAME || 'Example Bank',
  accountTitle: process.env.ACCOUNT_TITLE || 'ARISE Platform',
  accountNumber: process.env.ACCOUNT_NUMBER || '1234567890',
  iban: process.env.IBAN || 'PK00XXXX0000000000000000',
  branchCode: process.env.BRANCH_CODE || '0001',
  
  // Contact
  supportPhone: process.env.SUPPORT_PHONE || '+92-XXX-XXXXXXX',
  websiteUrl: process.env.WEBSITE_URL || 'https://arise-platform.com'
};

// Initialize SendGrid
sgMail.setApiKey(CONFIG.sendgridApiKey);

// ============================================
// VALIDATION HELPERS
// ============================================
const validators = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[\+]?[0-9\s\-\(\)]{10,20}$/.test(phone),
  name: (name) => name && name.length >= 2 && name.length <= 50,
  postalCode: (code) => /^[a-zA-Z0-9\s\-]{3,10}$/.test(code),
  required: (value) => value && value.trim() !== ''
};

function validateOrderData(data) {
  const errors = [];
  
  // Check honeypot
  if (data.website && data.website.trim() !== '') {
    return { valid: false, errors: ['Spam detected'] };
  }
  
  // Required fields
  if (!validators.required(data.firstName)) errors.push('First name is required');
  if (!validators.required(data.lastName)) errors.push('Last name is required');
  if (!validators.email(data.email)) errors.push('Invalid email address');
  if (!validators.phone(data.phone)) errors.push('Invalid phone number');
  if (!validators.required(data.addressLine1)) errors.push('Address is required');
  if (!validators.required(data.city)) errors.push('City is required');
  if (!validators.required(data.state)) errors.push('State/Province is required');
  if (!validators.postalCode(data.postalCode)) errors.push('Invalid postal code');
  if (!validators.required(data.country)) errors.push('Country is required');
  if (!data.privacyConsent) errors.push('Privacy consent is required');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// EMAIL TEMPLATES
// ============================================
function getCustomerEmailHtml(data) {
  const paymentInstructions = data.country === 'Pakistan' 
    ? `<strong>Cash on Delivery (COD)</strong><br>
       Please have <strong>Rs. 2,300</strong> ready when the courier arrives.`
    : `<strong>Bank Transfer</strong><br>
       Bank transfer instructions have been sent in a separate email.`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0f766e 0%, #0d5a52 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #ffffff; }
        .order-box { background: #f5f5f4; border-left: 4px solid #0f766e; padding: 20px; margin: 20px 0; }
        .footer { background: #1c1917; color: #a8a29e; padding: 20px; text-align: center; font-size: 14px; }
        table { width: 100%; }
        td { padding: 8px; border-bottom: 1px solid #e7e5e4; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Order Confirmed! 🎉</h1>
        <p style="margin: 10px 0 0;">Thank you for your Ramadan Journal order</p>
      </div>
      
      <div class="content">
        <p>As-salamu alaykum ${data.firstName},</p>
        
        <p>We've received your order and are excited to help you on your spiritual journey!</p>
        
        <div class="order-box">
          <h2 style="margin-top: 0; color: #0f766e;">Order Details</h2>
          <table>
            <tr>
              <td><strong>Order ID:</strong></td>
              <td>${data.orderId}</td>
            </tr>
            <tr>
              <td><strong>Product:</strong></td>
              <td>Ramadan Journal v1</td>
            </tr>
            <tr>
              <td><strong>Price:</strong></td>
              <td><strong>${data.country === 'Pakistan' ? 'Rs. 2,300' : '£30'}</strong></td>
            </tr>
          </table>
        </div>
        
        <h3>Shipping Address</h3>
        <p style="background: #fafaf9; padding: 15px; border-radius: 8px;">
          ${data.firstName} ${data.lastName}<br>
          ${data.addressLine1}<br>
          ${data.addressLine2 ? data.addressLine2 + '<br>' : ''}
          ${data.city}, ${data.state} ${data.postalCode}<br>
          ${data.country}
        </p>
        
        <h3>What's Next?</h3>
        <ol style="line-height: 1.8;">
          <li><strong>Payment:</strong> ${paymentInstructions}</li>
          <li><strong>Processing:</strong> We'll prepare your journal within 3-5 business days</li>
          <li><strong>Shipping:</strong> You'll receive tracking details via email</li>
          <li><strong>Delivery:</strong> Estimated ${data.country === 'Pakistan' ? '5-10 business days' : '2-4 weeks'}</li>
        </ol>
        
        <p>Questions? Reply to this email or call us at <strong>${CONFIG.supportPhone}</strong></p>
        
        <p style="margin-top: 30px;">May this Ramadan be filled with blessings! 🌙</p>
        
        <p><strong>ARISE Platform Team</strong></p>
      </div>
      
      <div class="footer">
        <p>ARISE Platform | ${CONFIG.fromEmail} | ${CONFIG.supportPhone}</p>
      </div>
    </body>
    </html>
  `;
}

function getAdminEmailHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: monospace; line-height: 1.6; color: #333; }
        table { border-collapse: collapse; margin: 15px 0; background: #fafaf9; }
        th, td { padding: 12px; text-align: left; border: 1px solid #e7e5e4; }
        th { background: #0f766e; color: white; }
      </style>
    </head>
    <body>
      <h1>🚨 NEW ORDER - Ramadan Journal</h1>
      
      <div style="background: #fef3c7; padding: 15px; margin: 20px 0;">
        <strong>⏰ Action Required:</strong> Process within 24 hours
      </div>
      
      <h2>Order Information</h2>
      <table>
        <tr><td><strong>Order ID</strong></td><td>${data.orderId}</td></tr>
        <tr><td><strong>Timestamp</strong></td><td>${data.timestamp}</td></tr>
        <tr><td><strong>Product</strong></td><td>Ramadan Journal v1</td></tr>
        <tr><td><strong>Price</strong></td><td>${data.country === 'Pakistan' ? 'Rs. 2,300' : '£30'}</td></tr>
        <tr><td><strong>Payment</strong></td><td>${data.country === 'Pakistan' ? 'COD' : 'Bank Transfer'}</td></tr>
      </table>
      
      <h2>Customer Details</h2>
      <table>
        <tr><td><strong>Name</strong></td><td>${data.firstName} ${data.lastName}</td></tr>
        <tr><td><strong>Email</strong></td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
        <tr><td><strong>Phone</strong></td><td><a href="tel:${data.phone}">${data.phone}</a></td></tr>
      </table>
      
      <h2>📍 Shipping Address</h2>
      <div style="background: white; border: 2px dashed #0f766e; padding: 20px; margin: 15px 0;">
        <strong>${data.firstName} ${data.lastName}</strong><br>
        ${data.addressLine1}<br>
        ${data.addressLine2 ? data.addressLine2 + '<br>' : ''}
        ${data.city}, ${data.state} ${data.postalCode}<br>
        <strong>${data.country}</strong><br>
        <br>
        📞 ${data.phone}<br>
        ✉️ ${data.email}
      </div>
      
      <h2>Action Checklist</h2>
      <ul>
        <li>☐ Print shipping label</li>
        <li>☐ Prepare journal for shipping</li>
        <li>☐ Package securely</li>
        <li>☐ Hand to courier</li>
        <li>☐ Send tracking email to customer</li>
      </ul>
    </body>
    </html>
  `;
}

// ============================================
// GOOGLE SHEETS INTEGRATION (Optional)
// ============================================
async function logToGoogleSheets(data) {
  if (!CONFIG.useGoogleSheets) return;
  
  try {
    // Parse service account credentials
    const credentials = JSON.parse(CONFIG.googleServiceAccount);
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Append row to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: CONFIG.googleSheetId,
      range: 'Orders!A:M',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          data.orderId,
          data.timestamp,
          data.firstName,
          data.lastName,
          data.email,
          data.phone,
          data.addressLine1,
          data.addressLine2 || '',
          data.city,
          data.state,
          data.postalCode,
          data.country,
          data.country === 'Pakistan' ? 'Rs. 2,300' : '£30'
        ]]
      }
    });
    
    console.log('Order logged to Google Sheets');
  } catch (error) {
    console.error('Google Sheets error:', error);
    // Don't fail the entire request if Sheets fails
  }
}

// ============================================
// MAIN HANDLER
// ============================================
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const data = JSON.parse(event.body);
    
    // Validate data
    const validation = validateOrderData(data);
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation failed', 
          errors: validation.errors 
        })
      };
    }
    
    // Log order to Google Sheets (if enabled)
    await logToGoogleSheets(data);
    
    // Send confirmation email to customer
    await sgMail.send({
      to: data.email,
      from: CONFIG.fromEmail,
      subject: `Order Confirmation - Ramadan Journal #${data.orderId}`,
      html: getCustomerEmailHtml(data)
    });
    
    // Send fulfillment email to admin
    await sgMail.send({
      to: CONFIG.adminEmail,
      from: CONFIG.fromEmail,
      subject: `🚨 NEW ORDER - ${data.orderId}`,
      html: getAdminEmailHtml(data)
    });
    
    // If international order, send bank transfer instructions
    if (data.country !== 'Pakistan') {
      await sgMail.send({
        to: data.email,
        from: CONFIG.fromEmail,
        subject: `Payment Instructions - Order #${data.orderId}`,
        html: getBankTransferEmailHtml(data)
      });
    }
    
    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: data.orderId,
        message: 'Order received successfully'
      })
    };
    
  } catch (error) {
    console.error('Order processing error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

function getBankTransferEmailHtml(data) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0284c7; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .payment-box { background: #dbeafe; border: 3px solid #0284c7; padding: 20px; margin: 20px 0; border-radius: 10px; }
        table { width: 100%; }
        td { padding: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💳 Payment Instructions</h1>
      </div>
      
      <div class="content">
        <p>As-salamu alaykum ${data.firstName},</p>
        
        <p>Please complete payment using the details below:</p>
        
        <div class="payment-box">
          <h2>Bank Transfer Details</h2>
          <table>
            <tr><td>Bank Name:</td><td><strong>${CONFIG.bankName}</strong></td></tr>
            <tr><td>Account Title:</td><td><strong>${CONFIG.accountTitle}</strong></td></tr>
            <tr><td>Account Number:</td><td><strong>${CONFIG.accountNumber}</strong></td></tr>
            <tr><td>IBAN:</td><td><strong>${CONFIG.iban}</strong></td></tr>
            <tr><td>Branch Code:</td><td>${CONFIG.branchCode}</td></tr>
            <tr style="border-top: 2px solid #0284c7;">
              <td>Amount:</td><td><strong style="font-size: 20px;">£30</strong></td></tr>
          </table>
        </div>
        
        <p><strong>⚠️ Important:</strong> Use <strong>${data.orderId}</strong> as transfer reference</p>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Transfer £30 to account above</li>
          <li>Use Order ID as reference</li>
          <li>Send proof to ${CONFIG.fromEmail}</li>
          <li>We'll confirm within 24 hours</li>
        </ol>
        
        <p><strong>Payment Deadline:</strong> ${deadline.toLocaleDateString()}</p>
        
        <p>Questions? Reply to this email or call ${CONFIG.supportPhone}</p>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// DEPLOYMENT INSTRUCTIONS
// ============================================
/*

NETLIFY DEPLOYMENT:
===================
1. Create netlify/functions/submit-order.js with this code
2. Set environment variables in Netlify dashboard:
   - SENDGRID_API_KEY
   - FROM_EMAIL
   - ADMIN_EMAIL
   - (optional) GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON
3. Deploy: netlify deploy --prod
4. Endpoint: https://yoursite.netlify.app/.netlify/functions/submit-order

VERCEL DEPLOYMENT:
==================
1. Create api/submit-order.js with this code
2. Set environment variables in Vercel dashboard
3. Deploy: vercel --prod
4. Endpoint: https://yoursite.vercel.app/api/submit-order

AWS LAMBDA:
===========
1. Create Lambda function with this code
2. Add environment variables
3. Create API Gateway trigger
4. Use API Gateway URL as endpoint

ENVIRONMENT VARIABLES REQUIRED:
===============================
SENDGRID_API_KEY=SG.xxxxxx
FROM_EMAIL=orders@arise-platform.com
ADMIN_EMAIL=admin@arise-platform.com
SUPPORT_PHONE=+92-XXX-XXXXXXX
WEBSITE_URL=https://arise-platform.com

BANK_NAME=Your Bank Name
ACCOUNT_TITLE=ARISE Platform
ACCOUNT_NUMBER=1234567890
IBAN=PK00XXXX0000000000000000
BRANCH_CODE=0001

# Optional for Google Sheets
USE_GOOGLE_SHEETS=true
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

TESTING LOCALLY:
================
npm install netlify-cli -g
netlify dev
# Visit http://localhost:8888

*/
