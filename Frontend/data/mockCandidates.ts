import { Candidate } from "@/types/Candidate";

export const mockCandidates: Candidate[] = [
{
id: 1,
name: "Sophia Johnson",
role: "Frontend Developer",
experience: "4+ Years",
location: "Bangalore",
email: "sophia@example.com",
phone: "+91 9876543210",
matchScore: 92,
summary:
    "Frontend engineer with 4+ years experience building scalable SaaS applications using React, TypeScript, and REST APIs.",
skills: ["React", "TypeScript", "REST APIs", "Next.js", "Tailwind CSS"],
},

{
id: 2,
name: "Michael Chen",
role: "Backend Engineer",
experience: "5+ Years",
location: "Hyderabad",
email: "michael@example.com",
phone: "+91 9876543211",
matchScore: 88,
summary:
    "Backend engineer experienced in Node.js, microservices, cloud infrastructure, and scalable API systems.",
skills: ["Node.js", "Express", "AWS", "Docker", "PostgreSQL"],
},

{
id: 3,
name: "Aarav Sharma",
role: "AI Engineer",
experience: "3+ Years",
location: "Remote",
email: "aarav@example.com",
phone: "+91 9876543212",
matchScore: 95,
summary:
    "AI engineer specializing in LLM applications, semantic search systems, LangChain, and vector databases.",
skills: ["Python", "LangChain", "OpenAI", "Qdrant", "FastAPI"],
},
];
