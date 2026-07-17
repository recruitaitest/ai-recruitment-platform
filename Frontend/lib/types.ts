// Authentication types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'candidate';
  avatar?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

// Navigation types
export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  children?: MenuItem[];
  requiredRoles?: Array<User['role']>;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success';
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

// Layout state types
export interface LayoutState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
}
