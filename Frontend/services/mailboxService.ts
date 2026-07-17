const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse(response: Response) {
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Request failed");
    }

    return response.json();
}

export async function connectMailbox() {
    const response = await fetch(`${API_BASE_URL}/mailbox/connect`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function disconnectMailbox() {
    const response = await fetch(`${API_BASE_URL}/mailbox/disconnect`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function syncMailbox() {
    const response = await fetch(`${API_BASE_URL}/mailbox/sync`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function getMailboxAccounts() {
    const response = await fetch(`${API_BASE_URL}/mailbox/accounts`);

    return handleResponse(response);
}

export async function getMailboxMessages() {
    const response = await fetch(`${API_BASE_URL}/mailbox/messages`);

    return handleResponse(response);
}

export async function getMailboxMessage(id: number) {
    const response = await fetch(
        `${API_BASE_URL}/mailbox/messages/${id}`
    );

    return handleResponse(response);
}

export async function getMailboxStats() {
    const response = await fetch(`${API_BASE_URL}/mailbox/stats`);

    return handleResponse(response);
}

export async function sendEmail(data: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
}) {
    const response = await fetch(`${API_BASE_URL}/mailbox/send`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return handleResponse(response);
}

export async function getMailboxAttachments() {
    const response = await fetch(
        `${API_BASE_URL}/mailbox/attachments`
    );

    return response.json();
}

export async function getSyncHistory(params?: {
    limit?: number;
    status?: string;
}) {
    const url = new URL(`${API_BASE_URL}/mailbox/sync-history`);
    if (params?.limit) url.searchParams.set("limit", String(params.limit));
    if (params?.status) url.searchParams.set("status", params.status);

    const response = await fetch(url.toString());
    return handleResponse(response);
}