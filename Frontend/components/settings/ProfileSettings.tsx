"use client";

import { useState, useEffect } from "react";
import { Camera, Mail, User, Phone, Building2, Save, X, CheckCircle2 } from "lucide-react";
import {
    getProfile,
    updateProfile,
    removeProfilePhoto
} from "@/services/profileService";
import { uploadProfilePhoto }
    from "@/services/profileService";

/* ── shared tokens ── */
const accent = "#7c6af7";

interface FieldProps {
    fieldLabel: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    hint?: string;
}

function FormField({ fieldLabel, icon, children, hint }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {fieldLabel}
            </label>
            <div className="relative">{children}</div>
            {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
        </div>
    );
}

const inputCls =
    "w-full rounded-xl py-2.5 text-[13.5px] outline-none bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";

export default function ProfileSettings() {
    const [photo, setPhoto] =
        useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
    });

    const [originalForm, setOriginalForm] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
    });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {

            const user = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            if (!user?.id) {
                return;
            }

            const profile = await getProfile(
                user.id
            );

            setForm(profile);

            setOriginalForm(profile);

            if (profile.profile_photo) {
                setPhoto(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${profile.profile_photo}`
                );
            }

        } catch (error) {
            console.error(error);
        }
    }

    async function handleSave() {
        try {

            const user = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            await updateProfile(
                user.id,
                form
            );

            localStorage.setItem(
                "user",
                JSON.stringify({
                    ...user,
                    name: form.name,
                    email: form.email
                })
            );

            setSaved(true);

            setOriginalForm(form);

            setTimeout(() => {
                setSaved(false);
            }, 2500);

        } catch (error) {
            console.error(error);
        }
    }

    function handleDiscard() {
        setForm(originalForm);
    }

    async function handlePhotoUpload(
        e: React.ChangeEvent<HTMLInputElement>
    ) {

        const file =
            e.target.files?.[0];

        if (!file) return;

        const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        try {

            const result =
                await uploadProfilePhoto(
                    user.id,
                    file
                );

            setPhoto(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${result.profile_photo}`
            );

            const updatedUser = {
                ...user,
                profile_photo: result.profile_photo
            };

            localStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );

        } catch (error) {

            console.error(error);

            alert(
                "Failed to upload photo"
            );
        }
    }

    async function handleRemovePhoto() {

        const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        await removeProfilePhoto(user.id);

        setPhoto(null);

        const updatedUser = {
            ...user,
            profile_photo: null
        };

        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );
    }

    return (
        <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
            {/* Header */}
            <div className="px-7 py-5 border-b border-slate-800">
                <h2 className="text-[15px] font-bold tracking-tight text-slate-100">
                    Profile Settings
                </h2>
                <p className="mt-0.5 text-[12.5px] text-slate-500">
                    Update your personal information and profile details.
                </p>
            </div>

            <div className="px-7 py-6 space-y-6">
                {/* Avatar row */}
                <div className="flex items-center gap-5 rounded-xl p-4 bg-slate-950 border border-slate-800">
                    <div className="relative shrink-0">
                        {photo ? (
                            <img
                                src={photo}
                                alt="Profile"
                                className="h-16 w-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold bg-indigo-600 text-white">
                                {form.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        )}
                        <label
                            htmlFor="profile-photo"
                            className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-600"
                        >
                            <Camera className="h-3 w-3 text-white" />
                        </label>
                    </div>
                    <div>
                        <p className="text-[13.5px] font-bold text-slate-100">
                            {form.name}
                        </p>
                        <p className="text-[12px] mt-0.5 text-slate-500">{form.email}</p>
                        <span className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide bg-indigo-600/10 text-indigo-500 border border-indigo-600/20">
                            Recruiter
                        </span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="profile-photo"
                        onChange={handlePhotoUpload}
                    /><label
                        htmlFor="profile-photo"
                        className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-semibold text-slate-300 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 transition-colors border border-slate-800"
                    >
                        Upload Photo
                    </label>
                    <button
                        onClick={handleRemovePhoto}
                        className="text-red-400 hover:text-red-350 text-xs font-semibold transition-colors"
                    >
                        Remove Photo
                    </button>
                </div>

                {/* Form */}
                <div className="grid gap-5 sm:grid-cols-2">
                    {/* Name */}
                    <FormField fieldLabel="Full name" icon={<User className="h-3.5 w-3.5" />}>
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="h-3.5 w-3.5" />
                        </span>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Your full name"
                            className={`${inputCls} pl-9`}
                        />
                    </FormField>

                    {/* Email */}
                    <FormField fieldLabel="Email address">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                        </span>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="your@email.com"
                            className={`${inputCls} pl-9`}
                        />
                    </FormField>

                    {/* Phone */}
                    <FormField fieldLabel="Phone number">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Phone className="h-3.5 w-3.5" />
                        </span>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="+91 XXXXX XXXXX"
                            className={`${inputCls} pl-9`}
                        />
                    </FormField>

                    {/* Company */}
                    <FormField fieldLabel="Company">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <input
                            type="text"
                            value={form.company}
                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                            placeholder="Your organization"
                            className={`${inputCls} pl-9`}
                        />
                    </FormField>

                    {/* Role (disabled) */}
                    <FormField fieldLabel="Role" hint="Role is assigned by your administrator.">
                        <input
                            type="text"
                            value="Recruiter"
                            disabled
                            className={`${inputCls} pl-4 cursor-not-allowed opacity-50`}
                        />
                    </FormField>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-slate-800 bg-slate-950">
                <p className="text-[11.5px] text-slate-500">
                    Changes are encrypted and saved securely.
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDiscard}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-all bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-800"
                    >
                        <X className="h-3.5 w-3.5" /> Discard
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] bg-indigo-600 hover:bg-indigo-500 keep-white"
                    >
                        {saved
                            ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                            : <><Save className="h-3.5 w-3.5" /> Save changes</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}