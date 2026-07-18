import { Candidate, Interview } from "@/types/interview";

export const candidates: Candidate[] = [
  {
    id: 1,
    name: "Sofia Reyas",
    role: "Senior Frontend Developer",
    email: "sofiareyas@example.com",
    phone: "+91 9876543210",
    location: "Bangalore, India",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    experience: "5 Years",
  },

  {
    id: 2,
    name: "John Carter",
    role: "Backend Engineer",
    email: "john@example.com",
    phone: "+91 9123456780",
    location: "Hyderabad, India",
    skills: ["Node.js", "PostgreSQL", "Docker"],
    experience: "4 Years",
  },

  {
    id: 3,
    name: "Emily Watson",
    role: "UI/UX Designer",
    email: "emily@example.com",
    phone: "+91 9988776655",
    location: "Chennai, India",
    skills: ["Figma", "UI Design", "UX Research"],
    experience: "3 Years",
  },
];

export const interviews: any[] = [
  {
    id: 1,
    candidateId: 1,
    candidateName: "Sofia Reyas",
    role: "Frontend Developer",
    type: "Technical",
    mode: "Online",
    status: "Scheduled",
    date: "2026-05-18",
    time: "10:00 AM",
  },

  {
    id: 2,
    candidateId: 2,
    candidateName: "John Carter",
    role: "Backend Engineer",
    type: "HR Round",
    mode: "Online",
    status: "Pending",
    date: "2026-05-19",
    time: "1:30 PM",
  },

  {
    id: 3,
    candidateId: 3,
    candidateName: "Emily Watson",
    role: "UI/UX Designer",
    type: "Final",
    mode: "Offline",
    status: "Completed",
    date: "2026-05-22",
    time: "4:00 PM",
  },
];
