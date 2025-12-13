# Routing Structure Documentation

## Overview
This document explains the routing structure of the Ratan Decor Admin application and how it handles authentication and navigation.

## Route Structure

### Public Routes
- `/login` - Login page (accessible without authentication)

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard page
- `/enquiries` - Enquiries management
- `/orders` - Orders management
- `/products` - Products management
- `/users` - Users management
- `/pricing` - Pricing management
- `/analytics` - Analytics and reports

### Default Routes
- `/` - Redirects to `/dashboard`
- `/*` - Catch-all route that redirects to `/dashboard`

## Authentication Flow

### 1. Initial Load
- App checks localStorage for existing authentication
- If valid user data exists, user is automatically logged in
- If no valid data, user is redirected to login page

### 2. Login Process
- User submits credentials
- API validates credentials
- On success, user data is stored in localStorage
- User is redirected to dashboard

### 3. Route Protection
- All protected routes check authentication status
- Unauthenticated users are redirected to login
- Authenticated users can access all protected routes

### 4. Page Refresh Handling
- Authentication state is preserved across page refreshes
- User remains logged in and on the same page
- No need to re-authenticate

## File Structure

```
src/
├── routes/
│   └── index.js          # Route definitions and navigation items
├── utils/
│   └── auth.js           # Authentication utility functions
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx    # Main layout wrapper
│   │   ├── Sidebar.jsx   # Navigation sidebar
│   │   └── TopBar.jsx    # Top navigation bar
│   └── Login/
│       └── Login.jsx     # Login component
└── App.jsx               # Main app with routing logic
```

## Key Features

### 1. Centralized Route Management
- All routes are defined in `src/routes/index.js`
- Easy to add/remove/modify routes
- Consistent route structure

### 2. Authentication Utilities
- `src/utils/auth.js` contains all auth-related functions
- Centralized localStorage management
- User data validation

### 3. Protected Route Component
- Automatically handles authentication checks
- Shows loading state while checking auth
- Redirects unauthenticated users

### 4. Navigation Integration
- Sidebar automatically reflects current route
- Active page highlighting
- Consistent navigation experience

## Adding New Routes

To add a new route:

1. **Add component to routes/index.js:**
```javascript
{
  path: '/new-route',
  element: NewComponent,
  title: 'New Route',
  icon: 'new-route',
  isPublic: false
}
```

2. **Add icon mapping in Sidebar.jsx:**
```javascript
const iconMap = {
  // ... existing icons
  'new-route': <NewIcon size={20} />
};
```

3. **Create the component file:**
```javascript
// src/components/NewRoute/NewComponent.jsx
import React from 'react';

const NewComponent = () => {
  return (
    <div>
      <h1>New Route Component</h1>
    </div>
  );
};

export default NewComponent;
```

## Troubleshooting

### Common Issues

1. **Route not working after refresh**
   - Check if authentication data is properly stored
   - Verify localStorage has valid user data

2. **Infinite redirect loop**
   - Check authentication state management
   - Verify route protection logic

3. **Sidebar not highlighting current page**
   - Check `getCurrentPageFromPath` function
   - Verify route path matching

### Debug Steps

1. Check browser console for errors
2. Verify localStorage contents
3. Check authentication state in React DevTools
4. Verify route definitions in routes/index.js

## Best Practices

1. **Always use the routes configuration** instead of hardcoding paths
2. **Use authentication utilities** for all auth-related operations
3. **Handle loading states** in protected routes
4. **Validate user data** before storing in localStorage
5. **Use consistent naming** for routes and components
6. **Test page refresh scenarios** for all routes
