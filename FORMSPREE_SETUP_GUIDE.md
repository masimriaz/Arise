# 📧 Formspree Setup Guide - Ramadan Journal

## 🎯 Quick Setup (5 Minutes)

Your form is configured to send orders to: **jiyafatim@gmail.com**

### Step 1: Create Formspree Account

1. Visit [https://formspree.io](https://formspree.io)
2. Click "Get Started" or "Sign Up"
3. **Use this email:** `jiyafatim@gmail.com`
4. Verify your email address

### Step 2: Create Your Form

1. After logging in, click **"+ New Form"**
2. Give it a name: `Ramadan Journal Orders`
3. Copy your **Form ID** (looks like: `xabc1234` or `mpqrs789`)

### Step 3: Update Your Website

1. Open `ramadan-journal.html`
2. Find line **~433** (search for `YOUR_FORM_ID`)
3. Replace `YOUR_FORM_ID` with your actual Form ID:

**Before:**

```html
<form
  id="shippingForm"
  action="https://formspree.io/f/YOUR_FORM_ID"
  method="POST"
></form>
```

**After (example):**

```html
<form
  id="shippingForm"
  action="https://formspree.io/f/xabc1234"
  method="POST"
></form>
```

4. Save the file
5. Commit and push to GitHub (if using GitHub Pages)

### Step 4: Test Your Form

1. Open your website
2. Fill out the order form with test data
3. Submit the form
4. Check `jiyafatim@gmail.com` inbox

---

## 📋 What's Included in Each Order Email

When someone submits the form, you'll receive an email with:

### Email Subject:

```
New Ramadan Journal Order – [Customer First Name] [Customer Last Name]
```

### Email Content (Table Format):

| Field               | Value                              |
| ------------------- | ---------------------------------- |
| **Order ID**        | RJ-20260202-A1B2C3                 |
| **Timestamp**       | 2026-02-02T15:30:00Z               |
| **First Name**      | Ahmed                              |
| **Last Name**       | Khan                               |
| **Email**           | customer@example.com               |
| **Phone**           | +92-300-1234567                    |
| **Address Line 1**  | House 123, Street 45               |
| **Address Line 2**  | Block A, Phase 2                   |
| **City**            | Karachi                            |
| **State/Province**  | Sindh                              |
| **Postal Code**     | 75500                              |
| **Country**         | Pakistan                           |
| **Price**           | Rs. 2,300                          |
| **Payment Method**  | Cash on Delivery (COD)             |
| **Product**         | Ramadan Journal v1 - Physical Copy |
| **Privacy Consent** | Yes                                |

---

## ⚙️ Formspree Configuration

Your form automatically includes:

### ✅ Hidden Fields (Already Set Up)

- `_subject` → Custom email subject with customer name
- `_template` → Table format for easy reading
- `_autoresponse` → Auto-reply to customer
- `_replyto` → Customer's email (for easy replies)
- `_gotcha` → Honeypot spam protection

### ✅ Form Features

- ✉️ **Email notifications** → jiyafatim@gmail.com
- 🤖 **Auto-responder** → Customer gets confirmation
- 🛡️ **Spam protection** → Honeypot field
- 📊 **Submission tracking** → Formspree dashboard
- 💌 **Reply-to enabled** → Click reply to respond to customer

---

## 🎨 Formspree Dashboard Features

After setup, you can:

1. **View all submissions** in your dashboard
2. **Export to CSV** for record-keeping
3. **Set up integrations** (Google Sheets, Slack, etc.)
4. **Customize auto-response** message
5. **Add reCAPTCHA** for extra security (optional)

---

## 📊 Pricing Plans

### Free Plan (Perfect to Start)

- ✅ 50 submissions per month
- ✅ Email notifications
- ✅ Basic spam filtering
- ✅ Dashboard access
- ✅ Auto-responses

### Paid Plans (If you grow)

- **Gold**: $10/month → 1,000 submissions
- **Platinum**: $40/month → Unlimited submissions

Most small businesses stay on the free plan!

---

## 🔧 Advanced Configuration (Optional)

### Add reCAPTCHA v3 (Anti-Spam)

1. Go to Formspree dashboard
2. Click on your form → Settings
3. Enable reCAPTCHA
4. Add the script to your HTML `<head>`:

```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
```

5. Add to your form tag:

```html
<form ... data-recaptcha="true"></form>
```

### Redirect After Submit (Alternative to Modal)

Instead of showing success modal, redirect to thank-you page:

Add this hidden field to your form:

```html
<input type="hidden" name="_next" value="https://yoursite.com/thank-you.html" />
```

### Send Copies to Multiple Emails

Add this hidden field:

```html
<input type="hidden" name="_cc" value="backup@example.com" />
```

---

## 🧪 Testing Checklist

Before going live, test:

- [ ] Form submits successfully
- [ ] Email arrives at jiyafatim@gmail.com
- [ ] Customer gets auto-response
- [ ] All fields appear in email
- [ ] Order ID is generated correctly
- [ ] Price calculates based on country (Pakistan vs Global)
- [ ] Payment method shows correctly (COD vs Bank Transfer)
- [ ] Success modal displays after submission
- [ ] Form resets after successful submission
- [ ] Spam protection works (try filling honeypot field)

### Test Countries:

1. **Pakistan** → Should show Rs. 2,300, COD
2. **United Kingdom** → Should show £30, Bank Transfer
3. **United States** → Should show £30, Bank Transfer

---

## 🐛 Troubleshooting

### Problem: "Formspree not configured" alert appears

**Solution:**

- You haven't replaced `YOUR_FORM_ID` yet
- Follow Step 3 above

### Problem: Email not arriving

**Solutions:**

1. Check spam/junk folder
2. Verify email in Formspree dashboard (Settings → Email)
3. Confirm form submission in Formspree dashboard

### Problem: Getting spam submissions

**Solutions:**

1. Enable reCAPTCHA in Formspree settings
2. Honeypot field (`_gotcha`) is already active
3. Block specific email domains in Formspree

### Problem: Need to change notification email

**Solution:**

1. Go to Formspree dashboard
2. Click your form → Settings
3. Update notification email
4. Save changes

---

## 📞 Support Resources

- **Formspree Docs:** https://help.formspree.io
- **Formspree Support:** support@formspree.io
- **Your Dashboard:** https://formspree.io/forms

---

## 🎉 You're Done!

After completing these steps:

1. ✅ Orders will arrive at jiyafatim@gmail.com
2. ✅ Customers will receive auto-confirmation
3. ✅ You can track all submissions in dashboard
4. ✅ Ready for production!

---

## 📝 Quick Reference

**Your Email:** jiyafatim@gmail.com  
**Form Location:** `ramadan-journal.html` line ~433  
**Test URL:** `http://localhost:8000/ramadan-journal.html` (local)  
**Live URL:** `https://yourusername.github.io/arise/ramadan-journal.html`

**Need Help?**  
The form shows a helpful setup message if Formspree isn't configured yet!
