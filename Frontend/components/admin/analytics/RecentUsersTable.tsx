"use client";

interface Props {
    users: any[];
}

export default function RecentUsersTable({
    users,
}: Props) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="mb-6">
                <h3 className="text-xl font-semibold text-white">
                    Recent Registrations
                </h3>

                <p className="text-sm text-slate-400">
                    Latest users registered on the platform
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="px-4 py-3 text-left text-slate-400">
                                Name
                            </th>

                            <th className="px-4 py-3 text-left text-slate-400">
                                Email
                            </th>

                            <th className="px-4 py-3 text-left text-slate-400">
                                Role
                            </th>

                            <th className="px-4 py-3 text-left text-slate-400">
                                Company
                            </th>

                            <th className="px-4 py-3 text-left text-slate-400">
                                Joined
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="border-b border-slate-800"
                            >
                                <td className="px-4 py-4 text-white">
                                    {user.name}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                    {user.email}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                    {user.role}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                    {user.company || "-"}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                    {new Date(
                                        user.created_at
                                    ).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}