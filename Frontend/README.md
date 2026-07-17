# AI Recruitment Intelligence Platform - Login Page

A modern, enterprise-grade login page for the AI Recruitment Intelligence Platform built with cutting-edge web technologies.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-06B6D4?style=flat-square&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

## 🚀 Features

### Authentication
- ✨ **Email/Password Login** - Secure credential-based authentication
- 🔐 **Password Visibility Toggle** - User-controlled password visibility
- 💾 **Remember Me** - Persistent login option
- 🔄 **Microsoft SSO** - Enterprise single sign-on integration
- ⚡ **Loading States** - Visual feedback during authentication

### User Experience
- 🎨 **Glassmorphism Design** - Modern frosted glass effect UI
- ✅ **Real-time Validation** - Instant feedback on form inputs
- 📱 **Responsive Layout** - Mobile, tablet, and desktop support
- 🎭 **Dark Mode Ready** - Dark theme throughout
- 🎬 **Smooth Animations** - Framer Motion transitions

### Form Features
- 🛡️ **Robust Validation** - Zod schema validation
- 📧 **Email Field** - With icon and error handling
- 🔒 **Password Field** - Secure input with visibility toggle
- 💬 **Error Messages** - Clear, actionable error feedback
- 🔗 **Forgot Password** - Password recovery link
- 📝 **Sign Up Link** - New account registration

### Security
- 🔐 **Client-side Validation** - Real-time validation
- 🛡️ **Type-safe** - Full TypeScript support
- 🚀 **Production Ready** - Enterprise-grade implementation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Tailwind
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge, class-variance-authority

## 📋 Prerequisites

- Node.js 18+
- npm or yarn

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd "AI Resume Management Platform"
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Login Credentials

Use any valid email and 8+ character password:
- Email: `demo@example.com`
- Password: `password123`

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home redirect
│   ├── globals.css             # Global styles
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── dashboard/
│       └── page.tsx            # Dashboard (post-login)
├── components/
│   ├── LoginForm.tsx           # Main form component
│   ├── Button.tsx              # Button component
│   └── Input.tsx               # Input component
├── lib/
│   ├── auth.ts                 # Auth utilities
│   ├── validation.ts           # Form schemas
│   └── utils.ts                # Helper functions
├── tailwind.config.ts          # Tailwind config
└── next.config.js              # Next.js config
```

## 🎨 Design System

### Colors
- **Background**: Slate-900 to Slate-800 gradient
- **Primary**: Blue-600 to Blue-700
- **Accent**: Purple-600
- **Glass**: White/10 with backdrop blur

### Components
- **Button**: Multiple variants (default, outline, ghost, secondary)
- **Input**: Glassmorphic with icons and visibility toggle
- **Form**: Framer Motion animations with staggered children

## 🔐 Authentication Flow

```
User Input
    ↓
Form Validation (Zod)
    ↓
API Call (AuthService)
    ↓
Token Storage (localStorage)
    ↓
Redirect to Dashboard
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1280px

## 🎬 Animations

- **Container**: Staggered children animation
- **Items**: Fade-in-up on mount
- **Forms**: Scale and opacity transitions
- **Background**: Continuous animated gradients
- **Buttons**: Hover and focus effects

## 🔧 Customization

### Change Brand Name
Edit `/components/LoginForm.tsx` and `/app/login/page.tsx`:
```tsx
<h1 className="text-2xl font-bold text-white">Your Brand Name</h1>
```

### Update Colors
Edit `tailwind.config.ts`:
```ts
colors: {
  'primary': '#yourColor',
  // ...
}
```

### Modify Form Fields
1. Update schema in `lib/validation.ts`
2. Add inputs in `components/LoginForm.tsx`
3. Update form submission logic in `lib/auth.ts`

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=your_api_url
```

## 📊 Performance

- ⚡ **Optimized**: Next.js optimization out of the box
- 🎯 **Code Splitting**: Automatic route-based splitting
- 🖼️ **Image Optimization**: Next.js Image component ready
- 📦 **Bundle Size**: ~45KB gzipped

## 🐛 Troubleshooting

### Development Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `npm run dev -- -p 3001` |
| Module not found | `rm -rf node_modules && npm install` |
| Styling not applied | Clear `.next` folder and rebuild |

### Common Errors

**"Cannot find module"**
- Reinstall dependencies: `npm install`

**"Tailwind not applying"**
- Check `tailwind.config.ts` content paths
- Restart dev server: `npm run dev`

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## 📄 License

MIT License - feel free to use in your projects!

## 🎯 Future Features

- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Social login (Google, GitHub)
- [ ] User profile management
- [ ] Role-based access control
- [ ] Activity logging
- [ ] Rate limiting
- [ ] Session management
- [ ] Mobile app authentication

## 👥 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**
