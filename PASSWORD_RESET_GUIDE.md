# Password Reset & Change Password - Implementation Guide

## ✅ What's Been Implemented

### 1. **Email Service Integration (Resend)**

- Integrated Resend for sending transactional emails
- Created React Email templates for beautiful, responsive emails
- Templates: Password Reset & Password Changed Confirmation

### 2. **Database Schema Updates**

Updated `UserDocument` type with:

- `resetPasswordToken`: Hashed token for password reset
- `resetPasswordExpires`: Expiration timestamp (1 hour)

### 3. **API Endpoints**

#### **POST /api/auth/forgot-password**

Request a password reset link

- **Body**: `{ email: string }`
- **Response**: Success message (prevents email enumeration)
- **Action**: Sends email with reset link

#### **POST /api/auth/reset-password**

Reset password using token from email

- **Body**: `{ email: string, token: string, newPassword: string }`
- **Response**: Success/error message
- **Action**: Updates password, clears reset token, sends confirmation email

#### **POST /api/auth/change-password**

Change password for authenticated users

- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ currentPassword: string, newPassword: string }`
- **Response**: Success/error message
- **Action**: Verifies current password, updates to new password, sends confirmation email

---

## 🚀 How to Test

### **Option 1: Using cURL**

1. **Start your local server** (if not already running):

```bash
cd /Users/sanskar/repo/RecipeApp/backend
npm run dev:local
```

2. **Test Forgot Password**:

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{"email":"YOUR_TEST_EMAIL@example.com"}'
```

3. **Check your email** for the reset link and extract the token

4. **Test Reset Password**:

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{
    "email":"YOUR_TEST_EMAIL@example.com",
    "token":"TOKEN_FROM_EMAIL",
    "newPassword":"newpassword123"
  }'
```

5. **Test Change Password** (requires logged-in user):

```bash
# First login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{"email":"YOUR_EMAIL", "password":"YOUR_PASSWORD"}'

# Use the token from login response
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword":"currentpass123",
    "newPassword":"newpass456"
  }'
```

### **Option 2: Using the Test Script**

```bash
# Test forgot password
node scripts/test-password-reset.js

# After receiving email with token
node scripts/test-password-reset.js YOUR_TOKEN_HERE
```

---

## 📧 Email Templates

Two beautiful React Email templates are created:

### **PasswordResetEmail.tsx**

- Clean, professional design
- Reset button with link
- Expiration warning (1 hour)
- Security message

### **PasswordChangedEmail.tsx**

- Confirmation message
- Security alert if user didn't make the change
- Consistent branding

---

## 🔐 Security Features

1. **Token Hashing**: Reset tokens are SHA256 hashed before storage
2. **Token Expiration**: Tokens expire after 1 hour
3. **Email Enumeration Prevention**: Same response for existing/non-existing emails
4. **Password Requirements**: Minimum 6 characters
5. **Current Password Verification**: Required for change-password
6. **Automatic Token Cleanup**: Reset tokens cleared after use
7. **Confirmation Emails**: Users notified of password changes

---

## 🛠 Files Created/Modified

### **Created:**

- `backend/lib/email.ts` - Email sending utility
- `backend/emails/PasswordResetEmail.tsx` - Reset email template
- `backend/emails/PasswordChangedEmail.tsx` - Confirmation email template
- `backend/api/auth/forgot-password.ts` - Forgot password endpoint
- `backend/api/auth/reset-password.ts` - Reset password endpoint
- `backend/api/auth/change-password.ts` - Change password endpoint
- `backend/scripts/test-password-reset.js` - Test script

### **Modified:**

- `backend/.env` - Added Resend configuration
- `backend/lib/types.ts` - Added reset token fields to UserDocument
- `backend/package.json` - Added Resend and React Email dependencies

---

## 📱 Mobile App Integration

Update your mobile app to handle the reset flow:

### **Deep Link URL Format:**

```
recipeapp://reset-password?token=<TOKEN>&email=<EMAIL>
```

### **Suggested Flow:**

1. User taps "Forgot Password" in app
2. App calls `/api/auth/forgot-password` with user's email
3. User receives email with reset link
4. Clicking link opens app via deep link
5. App navigates to Reset Password screen with token pre-filled
6. User enters new password
7. App calls `/api/auth/reset-password`
8. User redirected to login

### **Change Password Flow:**

1. User goes to Settings > Change Password
2. Enters current password and new password
3. App calls `/api/auth/change-password` with auth token
4. User receives confirmation email
5. Success message shown in app

---

## 🎨 Customizing Email Templates

Edit the React Email templates in `backend/emails/`:

```typescript
// Customize colors
const button = {
  backgroundColor: "#5469d4", // Change to your brand color
  // ... other styles
};

// Customize text
<Heading>Your Custom Heading</Heading>
<Text>Your custom message</Text>
```

Preview emails during development:

```bash
npx react-email dev
```

---

## 🌐 Production Setup

### **Verify Your Domain in Resend:**

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain registrar:
   - TXT record for verification
   - DKIM records for authentication
5. Wait for verification (usually instant)

### **Update Environment Variables:**

```bash
# In production .env
FROM_EMAIL=noreply@yourdomain.com
```

### **Update Reset Link URL:**

In `backend/api/auth/forgot-password.ts`, line 73:

```typescript
// Replace with your production deep link or web URL
const resetLink = `https://app.yourdomain.com/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
```

---

## 🧪 Testing Checklist

- [ ] Forgot password with valid email
- [ ] Forgot password with invalid email (should still return success)
- [ ] Email received with reset link
- [ ] Reset password with valid token
- [ ] Reset password with expired token (test after 1 hour)
- [ ] Reset password with invalid token
- [ ] Change password with correct current password
- [ ] Change password with incorrect current password
- [ ] Change password with weak new password
- [ ] Confirmation emails received

---

## 📊 Resend Dashboard

Monitor your emails at:

- **Dashboard**: https://resend.com/overview
- **Emails**: https://resend.com/emails (See all sent emails)
- **API Keys**: https://resend.com/api-keys
- **Domains**: https://resend.com/domains

---

## 💰 Resend Pricing

- **Free Tier**: 3,000 emails/month (forever)
- **Pro Plan**: $20/month for 50,000 emails
- **Enterprise**: Custom pricing

Current usage: Check at https://resend.com/overview

---

## 🐛 Troubleshooting

### **Email not received:**

1. Check Resend dashboard for delivery status
2. Check spam/junk folder
3. Verify `FROM_EMAIL` is correct
4. Ensure `RESEND_API_KEY` is valid

### **Token errors:**

1. Check if token expired (1 hour limit)
2. Verify token wasn't already used
3. Check email matches the one that requested reset

### **Server errors:**

1. Check `.env` has all required variables
2. Verify MongoDB connection
3. Check server logs for detailed errors

---

## 📝 Next Steps

1. **Deploy to Vercel/Production**
2. **Update Mobile App** with password reset screens
3. **Verify Domain** in Resend for production emails
4. **Test end-to-end** with real users
5. **Monitor email delivery** in Resend dashboard
6. **Consider adding rate limiting** to prevent abuse

---

## 🎉 Summary

You now have a complete password reset and change password system with:

- ✅ Secure token-based password reset
- ✅ Beautiful email templates
- ✅ Change password for logged-in users
- ✅ Confirmation emails
- ✅ Production-ready code
- ✅ Easy to test and deploy

**Ready to test!** Start your local server and try the endpoints. 🚀
