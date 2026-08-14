import { getBaseUrl } from './api';

export const API_URL = getBaseUrl();

if (typeof window !== 'undefined') {
    console.log("🚀 [DEBUG] API_URL loaded as:", API_URL);
    console.log("🚀 [DEBUG] NEXT_PUBLIC_API_URL is:", process.env.NEXT_PUBLIC_API_URL);
}
