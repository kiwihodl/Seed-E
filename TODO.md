# TODO: Dashboard Authentication Check

## Priority: High

### Issue

When users access dashboards, there's no validation to ensure they're accessing the correct dashboard for their account type.

### Problem

- Clients can access provider dashboard (causes 404 errors)
- Providers can access client dashboard (not intended)
- No proper authentication/authorization checks

### Solution Needed

1. **Add authentication middleware** to check user type on dashboard load
2. **Client Dashboard Check**: Verify user is a client before allowing access to `/client-dashboard`
3. **Provider Dashboard Check**: Verify user is a provider before allowing access to `/provider-dashboard`
4. **Auto-redirect**: If wrong dashboard, redirect to correct one or show error
5. **Logout on mismatch**: If user type doesn't match dashboard, log them out

### Implementation Points

- Add user type validation in dashboard page components
- Check session/token for user type
- Redirect to correct dashboard or show error message
- Log out user if authentication fails

### Files to Update

- `src/app/client-dashboard/page.tsx` - Add client validation
- `src/app/provider-dashboard/page.tsx` - Add provider validation
- `src/lib/auth.ts` - Add user type checking functions
- `src/middleware.ts` - Add route protection

### Current Workaround

Users need to manually log out and log in with correct account type.

---

# TODO: Session Management Improvements

## Priority: Medium

### Issue

Users are being logged out after key recovery and need to log back in.

### Problem

- Session state is being reset after key recovery
- Authentication state is not persisting properly
- Multiple login/logout cycles happening

### Solution Needed

1. **Improve session persistence** after key recovery
2. **Maintain authentication state** during recovery process
3. **Add session timeout handling**
4. **Implement proper session management**

### Implementation Points

- Review session management in key recovery flow
- Add session persistence after recovery
- Implement proper authentication state management
- Add session timeout handling

### Files to Update

- `src/app/api/auth/generate-recovery-key/route.ts` - Improve session handling
- `src/app/api/auth/login/route.ts` - Add session persistence
- Frontend authentication state management

### Current Workaround

Users need to log back in after key recovery.

---

_Created: 2025-01-20_
_Status: Pending_
