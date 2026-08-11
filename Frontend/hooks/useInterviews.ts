import { useState, useEffect } from "react";

export function useInterviews() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    Promise.all([
      fetch(`${apiUrl}/interviews/`).then((r) => r.json()),
      fetch(`${apiUrl}/candidates/`).then((r) => r.json()),
    ])
      .then(([intData, candData]) => {
        setInterviews(Array.isArray(intData) ? intData : []);
        setCandidates(Array.isArray(candData) ? candData : []);
      })
      .catch((err) => console.error("Failed to fetch dynamic interviews:", err));
  }, []);

  return {
    interviews,
    candidates,
  };
}
