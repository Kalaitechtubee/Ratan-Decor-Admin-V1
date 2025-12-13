# Frontend Auth Flow Update

## Tasks
- [x] Update Api.js to properly handle token refresh in apiFetch function
- [ ] Ensure login stores both access and refresh tokens correctly
- [ ] Update logout to clear tokens and call backend logout endpoint
- [ ] Update auth.js utilities if needed for better token management
- [ ] Test the complete auth flow (login, token refresh, logout)

## Information Gathered
- Backend JWT service is implemented with access (15m) and refresh (7d) tokens
- Frontend has Api.js with apiFetch wrapper but token refresh logic needs improvement
- Login component uses login API and setAuthData utility
- auth.js provides utilities for token management

## Plan
1. Modify apiFetch in Api.js to properly retry requests after token refresh
2. Update login function to store refresh token in cookies if needed
3. Enhance logout to call backend logout and clear local storage
4. Add token expiration checks in auth utilities
5. Test login, protected routes, token refresh, and logout
