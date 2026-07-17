"use client";

import { useRouter }
from "next/navigation";

export default function LogoutButton() {

    const router = useRouter();

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        router.push("/login");
    };

    return (

        <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition"
        >

            Logout

        </button>
    );
}