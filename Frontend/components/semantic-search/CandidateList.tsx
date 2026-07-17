import CandidateCard from "./CandidateCard";
import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";

interface CandidateListProps {
    candidates: any[];
    loading: boolean;
    showMatchScore?: boolean;
    searchType?: "standard" | "advanced" | "jd" | "position";
}

export default function CandidateList({
    candidates,
    loading,
    showMatchScore = false,
    searchType = "standard",
}: CandidateListProps) {

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (candidates.length === 0) {
        return <EmptyState />;
    }

    return (
        <section className="flex-1">

            <div className="mb-5 flex items-center justify-between">

                <div>
                    <h2 className="text-xl font-semibold">
                        Search Results
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Showing AI-matched candidates
                    </p>
                </div>

                <div className="text-sm text-muted-foreground">
                    {candidates.length} Candidates Found
                </div>
            </div>

            <div className="space-y-5">
                {candidates.map((candidate) => (
                    <CandidateCard
                        key={candidate.candidate_id}
                        candidate={candidate}
                        showMatchScore={showMatchScore}
                        searchType={searchType}
                    />
                ))}
            </div>

        </section>
    );
}