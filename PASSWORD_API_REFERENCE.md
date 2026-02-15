# Password Management API Reference

## Base URL

- Local: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`

## Headers (Required for all endpoints)

```
x-api-key: <API_SECRET_KEY>
Content-Type: application/json
```

---

## 1. Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent."
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Email is required"
}
```

**Notes:**

- Always returns success even if email doesn't exist (security)
- Token expires in 1 hour
- Email contains deep link: `recipeapp://reset-password?token=<TOKEN>&email=<EMAIL>`

---

## 2. Reset Password

Reset password using token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Request:**

```json
{
  "email": "user@example.com",
  "token": "abc123xyz456...",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Responses:**

Invalid/expired token (400):

```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

Missing fields (400):

```json
{
  "success": false,
  "error": "Email, token, and new password are required"
}
```

Weak password (400):

```json
{
  "success": false,
  "error": "Password must be at least 6 characters long"
}
```

**Notes:**

- Token is single-use (deleted after successful reset)
- Sends confirmation email
- Clears any existing reset tokens

---

## 3. Change Password

Change password for authenticated user.

**Endpoint:** `POST /api/auth/change-password`

**Headers (Additional):**

```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

Unauthorized (401):

```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing authentication"
}
```

Incorrect current password (400):

```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

Same password (400):

```json
{
  "success": false,
  "error": "New password must be different from current password"
}
```

Weak password (400):

```json
{
  "success": false,
  "error": "New password must be at least 6 characters long"
}
```

**Notes:**

- Requires valid JWT token from login
- Verifies current password before changing
- Sends confirmation email
- Clears any existing reset tokens

---

## Example: Complete Password Reset Flow

### Step 1: User Requests Reset

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"email":"user@example.com"}'
```

### Step 2: User Receives Email

Email contains link like:

```
recipeapp://reset-password?token=abc123xyz&email=user@example.com
```

### Step 3: User Resets Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email":"user@example.com",
    "token":"abc123xyz",
    "newPassword":"newSecurePass123"
  }'
```

### Step 4: User Receives Confirmation Email

✅ Password changed successfully!

---

## Example: Change Password Flow

### Step 1: User Logs In

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "email":"user@example.com",
    "password":"currentPassword"
  }'
```

Response includes JWT token:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

### Step 2: User Changes Password

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "currentPassword":"currentPassword",
    "newPassword":"newSecurePassword456"
  }'
```

### Step 3: User Receives Confirmation Email

✅ Password changed successfully!

---

## Security Considerations

1. **Email Enumeration Prevention**: Forgot password always returns success
2. **Token Expiration**: Reset tokens expire after 1 hour
3. **Token Hashing**: Tokens stored as SHA256 hash in database
4. **Single-Use Tokens**: Tokens deleted after successful reset
5. **Password Requirements**: Minimum 6 characters (customize as needed)
6. **Confirmation Emails**: Users notified of all password changes
7. **Authentication Required**: Change password requires valid JWT token

---

## Rate Limiting (Recommended)

Consider adding rate limiting to prevent abuse:

- Forgot password: 3 requests per hour per email
- Reset password: 5 attempts per token
- Change password: 5 requests per hour per user

---

## Mobile App Integration

### React Native Deep Linking

1. **Configure deep link scheme** in app.json:

```json
{
  "expo": {
    "scheme": "recipeapp"
  }
}
```

2. **Handle deep links** in App.tsx:

```typescript
import * as Linking from "expo-linking";

// Parse reset password URL
const url = "recipeapp://reset-password?token=abc&email=user@example.com";
const { token, email } = Linking.parse(url).queryParams;

// Navigate to ResetPasswordScreen with params
navigation.navigate("ResetPassword", { token, email });
```

3. **Create ResetPasswordScreen**:

```typescript
const ResetPasswordScreen = ({ route }) => {
  const { token, email } = route.params;
  const [newPassword, setNewPassword] = useState('');

  const handleReset = async () => {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await response.json();
    if (data.success) {
      // Navigate to login
      navigation.navigate('Login');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Button title="Reset Password" onPress={handleReset} />
    </View>
  );
};
```

---

## Testing Tips

1. **Use a real email** for testing to see the actual emails
2. **Check Resend dashboard** to monitor email delivery
3. **Test token expiration** by waiting 1+ hour
4. **Test error cases** (wrong password, expired token, etc.)
5. **Verify confirmation emails** are sent and formatted correctly

---

## Support

For issues:

1. Check server logs for detailed errors
2. Verify environment variables are set
3. Check Resend dashboard for email delivery status
4. Ensure MongoDB is connected
5. Verify API keys are correct
