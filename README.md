# Ratan Decor Admin Panel

A modern, responsive admin dashboard for Ratan Decor built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean, professional design with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Role-based Access Control**: Different permissions for admin, manager, sales, and support roles
- **Real-time Dashboard**: Live statistics and charts
- **Comprehensive Management**:
  - User management (General, Architect, Dealer)
  - Product catalog management
  - Enquiry management system
  - Order tracking
  - Analytics and reporting

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1
- **Build Tool**: Vite 7.1.2
- **Styling**: Tailwind CSS 3.4.17
- **Icons**: Lucide React
- **Font**: Roboto (Google Fonts)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ratan-Decor-Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎨 Customization

### Colors
The primary color scheme is defined in `tailwind.config.js`:
- Primary: `#ff4747` (Red)
- Custom animations and transitions included

### Fonts
- Primary font: Roboto (loaded from Google Fonts)
- Applied throughout the application with `font-roboto` class

## 📁 Project Structure

```
src/
├── components/
│   ├── Common/           # Reusable components
│   │   ├── Modal.jsx
│   │   ├── StatusBadge.jsx
│   │   └── Table.jsx
│   ├── Dashboard/        # Dashboard components
│   ├── Enquiries/        # Enquiry management
│   ├── Layout/           # Layout components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── TopBar.jsx
│   ├── Products/         # Product management
│   └── Users/            # User management
├── types/                # Type definitions
├── utils/                # Utilities and mock data
└── index.css             # Global styles
```

## 🔐 Role-based Permissions

### Admin
- Full access to all features
- User management (CRUD operations)
- Product management
- Order management
- Analytics access

### Manager
- Limited user management (view, edit, export)
- Product management (view, create, edit)
- Order management (view, edit)
- Enquiry management

### Sales
- View users and products
- Order management (view, edit)
- Enquiry management (view, edit)
- Pricing access

### Support
- View users
- Enquiry management (view, edit)

## 🎯 Key Components

### Dashboard
- Real-time statistics
- Revenue charts
- Recent activity feed
- Quick action buttons

### User Management
- User registration approval
- Role assignment
- Status management
- Export functionality

### Product Management
- Product catalog
- Category management
- Stock tracking
- Visibility controls

### Enquiry Management
- Lead tracking
- Priority management
- Assignment system
- Status updates

## 🚀 Getting Started

1. The application will be available at `http://localhost:5173`
2. Use the sidebar navigation to explore different sections
3. Test responsive design by resizing the browser window
4. Try different user roles to see permission-based access

## 📱 Responsive Design

- **Desktop**: Full sidebar with all features
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu with overlay sidebar

## 🎨 Design System

- **Colors**: Consistent color palette with primary red theme
- **Typography**: Roboto font family
- **Spacing**: Tailwind's spacing scale
- **Animations**: Smooth fade-in animations
- **Shadows**: Subtle elevation system

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- ESLint configuration included
- Consistent component structure
- Proper prop validation
- Clean, readable code

## 📄 License

This project is proprietary software for Ratan Decor.

---

**Built with ❤️ for Ratan Decor**
