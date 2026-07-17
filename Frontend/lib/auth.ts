// Mock auth service - Replace with actual auth implementation
export class AuthService {
  static async login(email: string, password: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock validation
    if (email && password.length >= 8) {
      const token = btoa(JSON.stringify({ email, timestamp: Date.now() }))
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token)
        localStorage.setItem('user_email', email)
      }
      return { success: true, token }
    }
    
    throw new Error('Invalid credentials')
  }

  static async loginWithSSO(provider: 'microsoft' | 'google') {
    // Simulate SSO flow
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const token = btoa(JSON.stringify({ 
      provider, 
      timestamp: Date.now() 
    }))
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('sso_provider', provider)
    }
    
    return { success: true, token, provider }
  }

  static logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user_email')
      localStorage.removeItem('sso_provider')
      localStorage.removeItem('user')
      localStorage.removeItem('portal')
    }
  }

  static isAuthenticated() {
    if (typeof window === 'undefined') return false
    return isValidJwt(localStorage.getItem('token'))
  }

  static getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  static async requestPasswordReset(email: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true, message: `Password reset link sent to ${email}` }
  }
}
export const isAuthenticated = () => {

    if (typeof window === "undefined") {

        return false;
    }

    const token = localStorage.getItem("token");

    return isValidJwt(token);
};

const isValidJwt = (token: string | null) => {
    if (!token) {
        return false;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
        return false;
    }

    try {
        const payload = JSON.parse(
            atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        if (!payload.exp) {
            return true;
        }

        return payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};
