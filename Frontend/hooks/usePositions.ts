import { useState, useEffect } from "react";

export function usePositions() {
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/positions/`)
      .then((res) => res.json())
      .then((data) => setPositions(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch dynamic positions:", err));
  }, []);

  return {
    positions,
  };
}
