export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

if (typeof window !== 'undefined') {
    console.log("🚀 [DEBUG] API_URL loaded as:", API_URL);
    console.log("🚀 [DEBUG] NEXT_PUBLIC_API_URL is:", process.env.NEXT_PUBLIC_API_URL);
}
