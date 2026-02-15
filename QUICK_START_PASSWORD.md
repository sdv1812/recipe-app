# Password Reset & Change Password - Quick Start

## ✅ Implementation Complete!

All password management features have been successfully implemented with Resend email service.

---

## 🚀 Quick Test Guide

### 1. Start Your Server (if not running)

```bash
cd /Users/sanskar/repo/RecipeApp/backend
npm run dev:local
```

### 2. Test Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{"email":"YOUR_EMAIL@example.com"}'
```

Expected response:

```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent."
}
```

### 3. Check Your Email

You'll receive an email with a password reset button. The link format is:

```
recipeapp://reset-password?token=<LONG_TOKEN>&email=<YOUR_EMAIL>
```

### 4. Extract Token and Test Reset

Copy the token from the email and run:

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{
    "email":"YOUR_EMAIL@example.com",
    "token":"PASTE_TOKEN_HERE",
    "newPassword":"mynewpassword123"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

You'll also receive a confirmation email!

### 5. Test Change Password (For Logged-in Users)

First, login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -d '{"email":"YOUR_EMAIL", "password":"YOUR_PASSWORD"}'
```

Then change password with the token from login:

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: sousai_secret_2026_mobile_app" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_FROM_LOGIN" \
  -d '{
    "currentPassword":"currentpass",
    "newPassword":"newpass123"
  }'
```

---

## 📁 What Was Created

### New Files:

- ✅ `backend/lib/email.ts` - Email service with Resend
- ✅ `backend/emails/PasswordResetEmail.tsx` - Beautiful reset email template
- ✅ `backend/emails/PasswordChangedEmail.tsx` - Confirmation email template
- ✅ `backend/api/auth/forgot-password.ts` - Request password reset
- ✅ `backend/api/auth/reset-password.ts` - Complete password reset
- ✅ `backend/api/auth/change-password.ts` - Change password (authenticated)
- ✅ `backend/scripts/test-password-reset.js` - Testing utility

### Modified Files:

- ✅ `backend/.env` - Added Resend API key and FROM_EMAIL
- ✅ `backend/lib/types.ts` - Added resetPasswordToken fields
- ✅ `backend/tsconfig.json` - Added JSX support
- ✅ `backend/package.json` - Added Resend dependencies

---

## 📱 Next Steps for Mobile App

1. **Add Forgot Password Screen**
   - Input field for email
   - Call `/api/auth/forgot-password`
   - Show success message

2. **Handle Deep Links**
   - Configure `recipeapp://` scheme
   - Parse token and email from URL
   - Navigate to Reset Password screen

3. **Add Reset Password Screen**
   - Pre-fill email from deep link
   - Input field for new password
   - Call `/api/auth/reset-password`
   - Navigate to login on success

4. **Add Change Password in Settings**
   - Current password input
   - New password input
   - Call `/api/auth/change-password` with auth token

---

## 🌐 For Production

### Verify Your Domain in Resend:

1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records (TXT, DKIM)
4. Update `.env`: `FROM_EMAIL=noreply@yourdomain.com`

### Update Reset Link:

In `backend/api/auth/forgot-password.ts` line 73:

```typescript
// Change from:
const resetLink = `recipeapp://reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

// To your production URL:
const resetLink = `https://app.yourdomain.com/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
```

---

## 📚 Documentation

- **Full Guide**: [PASSWORD_RESET_GUIDE.md](PASSWORD_RESET_GUIDE.md)
- **API Reference**: [PASSWORD_API_REFERENCE.md](PASSWORD_API_REFERENCE.md)

---

## 🎯 Features Included

✅ **Forgot Password** - Email with reset link  
✅ **Reset Password** - Token-based password reset  
✅ **Change Password** - For logged-in users  
✅ **Beautiful Email Templates** - React Email components  
✅ **Security** - Token hashing, expiration, single-use  
✅ **Confirmation Emails** - Users notified of changes  
✅ **Production Ready** - Error handling, validation

---

## 💰 Resend Cost

- **Free**: 3,000 emails/month (forever)
- **Paid**: $20/month for 50,000 emails

Your current setup uses the free tier!

---

## 🔗 Useful Links

- **Resend Dashboard**: https://resend.com/overview
- **View Sent Emails**: https://resend.com/emails
- **Domain Setup**: https://resend.com/domains
- **React Email Docs**: https://react.email/docs/introduction

---

## 🎉 You're All Set!

The password reset and change password features are fully implemented and ready to use. Test the endpoints, integrate with your mobile app, and you're good to go! 🚀
