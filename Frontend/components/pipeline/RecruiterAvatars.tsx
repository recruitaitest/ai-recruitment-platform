"use client";

interface Recruiter {
    id: number;
    name: string;
    image: string;
}

interface RecruiterAvatarsProps {
    recruiters: Recruiter[];
}

export default function RecruiterAvatars({
    recruiters,
}: RecruiterAvatarsProps) {
    return (
        <div className="flex items-center">
            {recruiters.map((recruiter, index) => (
                <div
                    key={recruiter.id}
                    className="
            relative
            h-8
            w-8
            overflow-hidden
            rounded-full
            border-2
            border-[#0f172a]
          "
                    style={{
                        marginLeft: index === 0 ? "0px" : "-10px",
                        zIndex: recruiters.length - index,
                    }}
                >
                    <img
                        src={recruiter.image}
                        alt={recruiter.name}
                        className="h-full w-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
}