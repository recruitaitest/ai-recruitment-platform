# AI Recruitment Intelligence Platform - Development Instructions

## Project Overview
Modern enterprise login page for AI Recruitment Intelligence Platform built with Next.js, Tailwind CSS, Framer Motion, and shadcn/ui components.

## Features Implemented
- **Authentication**: Email/password login with validation
- **SSO Integration**: Microsoft OAuth button
- **UI Components**: Custom Button and Input components with glassmorphism
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion for smooth transitions and interactions
- **Design**: Split-screen layout with branding and login form sections
- **Dashboard**: Post-login dashboard with logout functionality
- **Security**: Token-based authentication with localStorage

## Project Structure
```
├── app/
│   ├── layout.tsx              # Root layout with global styles
│   ├── page.tsx                # Redirect to login
│   ├── globals.css             # Global styles and animations
│   ├── login/
│   │   └── page.tsx            # Login page with split-screen layout
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page (post-login)
│   └── api/
│       └── auth/               # Authentication endpoints (placeholder)
├── components/
│   ├── LoginForm.tsx           # Main login form component
│   ├── Button.tsx              # Reusable button component
│   └── Input.tsx               # Reusable input component
├── lib/
│   ├── auth.ts                 # Authentication utilities
│   ├── validation.ts           # Form validation schemas
│   └── utils.ts                # Helper utilities
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── next.config.js              # Next.js configuration
```

## Required Dependencies
- react & react-dom: UI library
- next: React framework
- tailwindcss: Utility-first CSS
- framer-motion: Animation library
- react-hook-form: Form management
- zod: Schema validation
- lucide-react: Icon library
- class-variance-authority: Utility for managing CSS variants
- clsx & tailwind-merge: CSS utility helpers

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
npm start
```

## Key Features Guide

### Login Page (`/login`)
- Split-screen layout with branding section
- Email and password input fields with icons
- Show/hide password toggle
- Remember me checkbox
- Error messages and validation
- Microsoft SSO button
- Loading states with spinners
- Sign up link

### Dashboard (`/dashboard`)
- Protected route (redirects to login if not authenticated)
- User profile display
- Feature cards showcasing platform capabilities
- Logout functionality
- Responsive design

### Components
- **LoginForm**: Handles form submission, validation, and authentication
- **Button**: Customizable button with variants (default, outline, ghost, secondary, destructive)
- **Input**: Glassmorphic input field with icons and error handling

### Validation
- Email format validation
- Password minimum 8 characters
- Custom error messages
- Real-time form validation feedback

### Authentication Flow
1. User enters credentials and submits form
2. Form validates using Zod schema
3. AuthService processes login or SSO
4. Token stored in localStorage
5. Redirect to dashboard on success
6. Error messages displayed on failure

## Customization

### Colors & Theming
- Edit `tailwind.config.ts` for custom colors
- Modify `app/globals.css` for global styles
- Update component classNames for specific styling

### Authentication Backend
- Replace mock `AuthService` in `lib/auth.ts` with actual API calls
- Update API endpoints in `app/api/auth/`
- Implement real token management (JWT, sessions)

### Form Fields
- Add new fields in `LoginForm.tsx`
- Update validation schema in `lib/validation.ts`
- Create corresponding form inputs

## Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance Tips
- Lazy load components with Next.js dynamic imports
- Use Image component for optimized images
- Enable SWC minification in production
- Implement code splitting for large features

## Security Considerations
- Validate all inputs server-side
- Implement CSRF protection for forms
- Use secure password hashing
- Implement rate limiting on auth endpoints
- Store sensitive data securely
- Use HTTPS in production

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, specify a different port:
```bash
npm run dev -- -p 3001
```

### Build Errors
Clear Next.js cache and rebuild:
```bash
rm -rf .next
npm run build
```

### Styling Issues
Ensure Tailwind CSS is properly configured:
- Check `tailwind.config.ts` content paths
- Verify `postcss.config.js` exists
- Clear browser cache

## Environment Variables
Create `.env.local` for environment configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Next Steps
- Implement real authentication backend
- Add password reset flow
- Integrate actual SSO providers
- Add 2FA support
- Implement user profile management
- Add role-based access control (RBAC)
- Set up monitoring and analytics
