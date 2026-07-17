import AuthLayout from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="AI-Powered Recruitment Intelligence Platform"
        >
            <LoginForm />
        </AuthLayout>
    )
}