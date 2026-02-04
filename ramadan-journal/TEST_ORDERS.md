# Test Orders - Ramadan Journal

Use these sample orders to test form validation and Formspree submission.

---

## Test Order 1: Pakistan - Complete

```
SHIPPING INFORMATION:
First Name: Fatima
Last Name: Ahmed
Email: fatima.ahmed.test@example.com
Phone: +92-300-1234567

ADDRESS:
Address Line 1: House 123, Street 45, Gulshan-e-Iqbal
Address Line 2: (leave blank)
City: Karachi
State: Sindh
Postal Code: 75300
Country: Pakistan

CONSENT: ✓ Checked

EXPECTED OUTCOME:
- All validations pass
- Form submits successfully
- Order ID generated (format: RJ-[timestamp]-[random])
- Confirmation modal shows
- Email sent to jiyafatim@gmail.com
```

---

## Test Order 2: UK - Complete with Address Line 2

```
SHIPPING INFORMATION:
First Name: Sarah
Last Name: Khan
Email: sarah.khan.test@example.com
Phone: +44-20-7946-0958

ADDRESS:
Address Line 1: 10 Downing Street
Address Line 2: Westminster
City: London
State: Greater London
Postal Code: SW1A 2AA
Country: United Kingdom

CONSENT: ✓ Checked

EXPECTED OUTCOME:
- All validations pass
- Optional Address Line 2 field populated
- International phone format accepted
- Form submits successfully
- Email contains all fields including Address Line 2
```

---

## Test Order 3: Pakistan - Long Names

```
SHIPPING INFORMATION:
First Name: Muhammad Hamza
Last Name: Abdullah Al-Rahman
Email: muhammad.test@example.com
Phone: +92-321-9876543

ADDRESS:
Address Line 1: Flat 5, Block A, Gulshan-e-Maymar Society
Address Line 2: Near Jamia Masjid, Opposite Central Park
City: Lahore
State: Punjab
Postal Code: 54000
Country: Pakistan

CONSENT: ✓ Checked

EXPECTED OUTCOME:
- Longer names (with spaces) validated correctly
- Hyphenated last name accepted
- Multi-word address fields work
- All data preserved in email
```

---

## Test Order 4: UAE - Special Characters

```
SHIPPING INFORMATION:
First Name: Aisha
Last Name: Al-Mansoori
Email: aisha.test@example.com
Phone: +971-50-123-4567

ADDRESS:
Address Line 1: Villa 23, Al Wasl Road
Address Line 2: Jumeirah 1
City: Dubai
State: Dubai
Postal Code: 12345
Country: United Arab Emirates

CONSENT: ✓ Checked

EXPECTED OUTCOME:
- Hyphenated last name with apostrophe works
- UAE phone format validated
- Country selection from dropdown works
```

---

## Test Order 5: USA - Validation Edge Cases

```
SHIPPING INFORMATION:
First Name: John
Last Name: O'Brien
Email: john.test@example.com
Phone: +1-555-123-4567

ADDRESS:
Address Line 1: 123 Main Street, Apt 4B
Address Line 2: (leave blank)
City: New York
State: NY
Postal Code: 10001
Country: United States

CONSENT: ✓ Checked

EXPECTED OUTCOME:
- Apostrophe in name (O'Brien) accepted
- US phone format validated
- Short state code (NY) works
```

---

## Validation Error Tests

### Test 6: Invalid Email

```
Email: invalid-email-no-at-sign
EXPECTED: Error message "Please enter a valid email address"
```

### Test 7: Invalid Phone

```
Phone: 12345 (too short)
EXPECTED: Error message "Please enter a valid phone number"
```

### Test 8: Missing Required Field

```
First Name: (leave blank)
EXPECTED: Error message "This field is required"
```

### Test 9: Missing Consent

```
Privacy Consent: (unchecked)
EXPECTED:
- Submit button disabled or error shown
- Error message "You must consent to data usage to proceed"
```

### Test 10: Special Characters in Name

```
First Name: Test@123
EXPECTED: Error message "Please enter a valid name (2-50 characters, letters only)"
```

---

## Spam Prevention Test

### Test 11: Honeypot Triggered

```
Fill form normally, BUT:
1. Open browser DevTools (F12)
2. Find hidden field: <input name="_gotcha">
3. Change style from display:none to display:block
4. Fill honeypot field with: "spam text"
5. Submit form

EXPECTED OUTCOME:
- Form appears to submit (no error shown to user)
- BUT no email sent (spam caught by honeypot)
- Check browser console for: "Honeypot triggered - potential spam"
```

---

## Performance Test

### Test 12: Rapid Submissions

```
1. Fill form with Test Order 1 data
2. Submit
3. Immediately click "Order Full Journal" again
4. Resubmit same data

EXPECTED OUTCOME:
- First submission processes normally
- Second submission may be rate-limited by Formspree (429 error)
- User sees error message
- No duplicate orders created
```

---

## Accessibility Test

### Test 13: Keyboard Navigation

```
1. Load page
2. Press Tab key repeatedly (do NOT use mouse)
3. Navigate entire form using only keyboard:
   - Tab: Move forward
   - Shift+Tab: Move backward
   - Enter: Submit
   - Escape: Close modal

EXPECTED OUTCOME:
- All fields reachable via keyboard
- Focus visible on each element (gold outline)
- Can fill and submit form without mouse
- Modal can be closed with Escape key
```

### Test 14: Screen Reader (Optional)

```
Use NVDA (Windows) or VoiceOver (Mac):
1. Enable screen reader
2. Navigate form with keyboard
3. Listen to announcements

EXPECTED OUTCOME:
- Field labels read aloud
- Required fields announced
- Error messages announced
- Success message announced
```

---

## Email Verification Checklist

After submitting any test order, check email at **jiyafatim@gmail.com**:

✅ Email received within 60 seconds  
✅ Subject line: "New Ramadan Journal Order"  
✅ Email format: Table (neat rows)  
✅ All fields present:

- Order ID (format: RJ-[timestamp]-[random])
- First Name
- Last Name
- Email
- Phone
- Address Line 1
- Address Line 2 (if filled)
- City
- State
- Postal Code
- Country
- Privacy Consent: "on"
- Timestamp (ISO format)
- Product: "Ramadan Journal v1"

✅ Reply-to address: Customer's email (not formspree@...)  
✅ No \_gotcha field in email (spam field hidden)

---

## Quick Copy-Paste Data

For fast testing, copy this block:

```
First Name: Test
Last Name: User
Email: test@example.com
Phone: +92-300-1111111
Address Line 1: Test Address 123
City: Karachi
State: Sindh
Postal Code: 75000
Country: Pakistan
Privacy Consent: ✓
```

---

## Notes

- **Email addresses:** Use `test@example.com` or your own test address
- **Phone numbers:** Test numbers provided (won't receive SMS)
- **Addresses:** Fictional addresses for testing only
- **Formspree limit:** Free tier allows 50 submissions/month
- **Cleanup:** Delete test submissions from Formspree dashboard

---

**Happy Testing! 🧪**
