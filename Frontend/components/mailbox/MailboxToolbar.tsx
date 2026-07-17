"use client";

import { useState } from "react";
import {
    RefreshCcw,
    Link,
    Unlink,
} from "lucide-react";

import {
    connectMailbox,
    disconnectMailbox,
    syncMailbox,
} from "@/services/mailboxService";

export default function MailboxToolbar() {
    const [loading, setLoading] = useState(false);

    async function handleConnect() {
        try {
            setLoading(true);

            const data = await connectMailbox();

            window.location.href = data.authorization_url;
        } catch (error) {
            console.error(error);
            alert("Failed to connect mailbox.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDisconnect() {
        try {
            setLoading(true);

            await disconnectMailbox();

            alert("Mailbox disconnected.");
        } catch (error) {
            console.error(error);
            alert("Failed to disconnect mailbox.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSync() {
        try {
            setLoading(true);

            const result = await syncMailbox();

            alert(
                `Sync completed.\nSynced: ${result.synced}\nSkipped: ${result.skipped}`
            );
        } catch (error) {
            console.error(error);
            alert("Mailbox sync failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="
                flex flex-wrap items-center justify-end gap-3
                rounded-2xl
                border border-white/10
                bg-white/5
                p-5
                backdrop-blur-md
            "
        >
            <button
                onClick={handleConnect}
                disabled={loading}
                className="
                    flex h-12 items-center gap-2
                    rounded-xl
                    bg-green-600
                    px-5
                    text-sm font-semibold text-white
                    hover:bg-green-700
                    disabled:opacity-50
                "
            >
                <Link className="h-4 w-4" />
                Connect Gmail
            </button>

            <button
                onClick={handleDisconnect}
                disabled={loading}
                className="
                    flex h-12 items-center gap-2
                    rounded-xl
                    bg-red-600
                    px-5
                    text-sm font-semibold text-white
                    hover:bg-red-700
                    disabled:opacity-50
                "
            >
                <Unlink className="h-4 w-4" />
                Disconnect
            </button>

            <button
                onClick={handleSync}
                disabled={loading}
                className="
                    flex h-12 items-center gap-2
                    rounded-xl
                    bg-blue-600
                    px-5
                    text-sm font-semibold text-white
                    hover:bg-blue-700
                    disabled:opacity-50
                "
            >
                <RefreshCcw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Sync Mailbox
            </button>
        </div>
    );
}