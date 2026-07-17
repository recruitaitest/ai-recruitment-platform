"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import CandidateList from "@/components/semantic-search/CandidateList";
import QuickPreviewDrawer from "@/components/semantic-search/QuickPreviewDrawer";
import SearchHeader from "@/components/semantic-search/SearchHeader";
import { AppLayout } from "@/components/AppLayout";
import {
    getPositions,
    getRankedCandidates
} from "@/services/positionService";
import {
    getCandidates,
    searchCandidatesComprehensive
} from "@/services/candidateService";
import {
    getAISettings
} from "@/services/adminService";
import { hasPermission } from "@/utils/permissions";
import { Search, Sparkles, Sliders, FileText, ArrowUpDown, Briefcase, MapPin } from "lucide-react";

// ---------------------------------------------------------------------------
// Helper: safely extract a candidate array from any API response shape.
// Handles:
//   - new paginated shape  → { total, page, page_size, results: [...] }
//   - legacy plain array   → [...]
//   - anything else        → []
// ---------------------------------------------------------------------------
function extractCandidateArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.results)) return response.results;
    return [];
}

export default function SemanticSearchPage() {
    const router = useRouter();

    // Tab State
    const [searchTab, setSearchTab] = useState<"standard" | "advanced" | "jd" | "position">("standard");

    // Search Input States
    const [standardQuery, setStandardQuery] = useState("");

    const [advQuery, setAdvQuery] = useState("");
    const [advSkills, setAdvSkills] = useState("");
    const [advMinExp, setAdvMinExp] = useState("");
    const [advMaxExp, setAdvMaxExp] = useState("");
    const [advLocation, setAdvLocation] = useState("");

    const [jdText, setJdText] = useState("");

    const [positions, setPositions] = useState<any[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
    const [selectedPositionData, setSelectedPositionData] = useState<any>(null);

    // Results & Loading
    const [candidates, setCandidates] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [hasSearched, setHasSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(true);
    const [requiredSkills, setRequiredSkills] = useState<string[]>([]);

    // Top Filter & Sort States
    const [filters, setFilters] = useState({
        location: "All Locations",
        experienceRange: "all",
        sortBy: "experience",
        sortOrder: "desc" as "asc" | "desc"
    });

    // Auto-update sort criteria when tab changes
    useEffect(() => {
        if (searchTab === "jd" || searchTab === "position") {
            setFilters(prev => ({ ...prev, sortBy: "match_score", sortOrder: "desc" }));
        } else {
            setFilters(prev => ({ ...prev, sortBy: "experience", sortOrder: "desc" }));
        }
    }, [searchTab]);

    // Normalise a raw candidate item into a consistent shape
    const normaliseCandidate = (item: any) => ({
        ...item,
        id: item.candidate_id || item.id,
        candidate_id: item.candidate_id || item.id,
        full_name: item.candidate_name || item.full_name,
        candidate_name: item.candidate_name || item.full_name,
        matched_skills: item.matched_skills ?? [],
        missing_skills: item.missing_skills ?? [],
        // Explicitly carry breakdown fields so hasBreakdown check works in CandidateCard
        ai_score: item.ai_score ?? item.score_breakdown?.ai_score ?? undefined,
        semantic_score: item.semantic_score ?? item.score_breakdown?.semantic ?? undefined,
        skills_score: item.skills_score ?? item.score_breakdown?.skills ?? undefined,
        experience_score: item.experience_score ?? item.score_breakdown?.experience ?? undefined,
    });

    // Safely set candidates — always guarantees state is an array
    const safSetCandidates = (response: any) => {
        const arr = extractCandidateArray(response).map(normaliseCandidate);
        setCandidates(arr);
        // Store total from paginated response if available
        if (response && typeof response.total === "number") {
            setTotalCount(response.total);
        } else {
            setTotalCount(arr.length);
        }
    };

    const loadSettingsAndPositions = async () => {
        try {
            let isSemanticSearchEnabled = true;
            try {
                const settings = await getAISettings();
                isSemanticSearchEnabled = settings.semantic_search !== false;
            } catch (settingsError) {
                console.error("Failed to load AI settings:", settingsError);
            }

            setSemanticSearchEnabled(isSemanticSearchEnabled);

            if (!isSemanticSearchEnabled) return;

            const positionsData = await getPositions();
            setPositions(Array.isArray(positionsData) ? positionsData : []);

            // Initial candidate load — also safe against paginated response
            const candidatesData = await getCandidates();
            safSetCandidates(candidatesData);

        } catch (error) {
            console.error("Failed to load semantic search data:", error);
        } finally {
            setSettingsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }
        if (!hasPermission("ai_search.view")) {
            router.push("/dashboard");
            return;
        }
        loadSettingsAndPositions();
    }, [router]);

    // -------------------------------------------------------------------------
    // Search handlers — all use safSetCandidates so shape never matters
    // -------------------------------------------------------------------------

    const handleStandardSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await searchCandidatesComprehensive({
                query: standardQuery || undefined,
            });
            safSetCandidates(response);
        } catch (error) {
            console.error(error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdvancedSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const skillsArray = advSkills
                ? advSkills.split(",").map(s => s.trim()).filter(Boolean)
                : [];
            const response = await searchCandidatesComprehensive({
                query: advQuery || undefined,
                skills: skillsArray.length > 0 ? skillsArray : undefined,
                min_experience: advMinExp ? parseInt(advMinExp) : undefined,
                max_experience: advMaxExp ? parseInt(advMaxExp) : undefined,
                location: advLocation || undefined,
            });
            safSetCandidates(response);
        } catch (error) {
            console.error(error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJdSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await searchCandidatesComprehensive({
                job_description: jdText,
            });
            safSetCandidates(response);
            setHasSearched(true);
        } catch (error) {
            console.error(error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePositionChange = async (positionId: number) => {
        setLoading(true);
        setSelectedPosition(positionId);
        try {
            const position = positions.find((p) => p.id === positionId);
            if (position) setSelectedPositionData(position);

            const data = await getRankedCandidates(positionId);
            setRequiredSkills(data.required_skills || []);
            safSetCandidates(data);
        } catch (error) {
            console.error(error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // Derived display data — safe because candidates is always an array
    // -------------------------------------------------------------------------

    const distinctLocations = Array.from(
        new Set(candidates.map((c) => c.location).filter(Boolean))
    ) as string[];

    const filteredAndSortedCandidates = candidates
        .filter((candidate) => {
            // Frontend safety net: exclude 0% JD matches even if backend sends them
            if (searchTab === "jd" && candidate.match_score !== undefined && candidate.match_score !== null) {
                if (candidate.match_score === 0) return false;
            }
            if (filters.location && filters.location !== "All Locations") {
                if (!candidate.location || candidate.location !== filters.location) return false;
            }
            if (filters.experienceRange && filters.experienceRange !== "all") {
                const exp = candidate.experience || 0;
                if (filters.experienceRange === "entry" && exp > 2) return false;
                if (filters.experienceRange === "mid" && (exp < 3 || exp > 5)) return false;
                if (filters.experienceRange === "senior" && exp < 6) return false;
            }
            return true;
        })
        .sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;
            if (filters.sortBy === "match_score") {
                valA = a.match_score ?? 0;
                valB = b.match_score ?? 0;
            } else if (filters.sortBy === "experience") {
                valA = a.experience ?? 0;
                valB = b.experience ?? 0;
            } else if (filters.sortBy === "name") {
                valA = (a.full_name || a.candidate_name || "").toLowerCase();
                valB = (b.full_name || b.candidate_name || "").toLowerCase();
            }
            if (valA < valB) return filters.sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return filters.sortOrder === "asc" ? 1 : -1;
            return 0;
        });

    // Shared input classes
    const inputCls = "w-full bg-white/5 border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all";
    const selectCls = "bg-white/5 border border-white/[0.08] text-white/80 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500/30";
    const labelCls = "block text-[11px] text-white/40 uppercase tracking-widest mb-1 font-semibold";

    if (settingsLoading) {
        return (
            <AppLayout>
                <main className="min-h-screen p-6">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/5 p-12 text-center">
                        <h3 className="text-lg font-semibold text-white">Loading AI Search</h3>
                    </div>
                </main>
            </AppLayout>
        );
    }

    if (!semanticSearchEnabled) {
        return (
            <AppLayout>
                <main className="min-h-screen p-6">
                    <div className="rounded-2xl border border-white/[0.06] bg-white/5 p-12 text-center">
                        <h3 className="text-lg font-semibold text-white">AI Search Disabled</h3>
                        <p className="mt-2 text-white/50">
                            Semantic AI Search is currently disabled by an administrator.
                        </p>
                    </div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <main className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <SearchHeader />

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-white/[0.06] mb-6 overflow-x-auto gap-1">
                        {[
                            { key: "standard" as const, label: "Standard Search", icon: <Search className="h-4 w-4" /> },
                            { key: "advanced" as const, label: "Advanced Search", icon: <Sliders className="h-4 w-4" /> },
                            { key: "jd" as const, label: "Search by Job Description", icon: <FileText className="h-4 w-4" /> },
                            { key: "position" as const, label: "Position Match", icon: <Briefcase className="h-4 w-4" /> },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setSearchTab(tab.key); setCandidates([]); setTotalCount(0); }}
                                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${searchTab === tab.key
                                    ? "border-blue-500 text-blue-300 bg-blue-500/[0.07]"
                                    : "border-transparent text-white/40 hover:text-white/70"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Forms */}
                    <div className="mb-6">
                        {searchTab === "standard" && (
                            <form onSubmit={handleStandardSearch} className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06]">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-white/30" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, role, skills, location... e.g. Frontend Developer"
                                            value={standardQuery}
                                            onChange={(e) => setStandardQuery(e.target.value)}
                                            className={`${inputCls} !pl-10`}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all"
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>
                        )}

                        {searchTab === "advanced" && (
                            <form onSubmit={handleAdvancedSearch} className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelCls}>Keywords / Role</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Full Stack Developer, HR Manager"
                                            value={advQuery}
                                            onChange={(e) => setAdvQuery(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Skills (comma separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. react, python, node"
                                            value={advSkills}
                                            onChange={(e) => setAdvSkills(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Hyderabad"
                                            value={advLocation}
                                            onChange={(e) => setAdvLocation(e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Min Experience (Years)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 2"
                                            min={0}
                                            value={advMinExp}
                                            onChange={(e) => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setAdvMinExp(String(val));
                                            }}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Max Experience (Years)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 10"
                                            min={0}
                                            value={advMaxExp}
                                            onChange={(e) => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setAdvMaxExp(String(val));
                                            }}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl transition-all"
                                    >
                                        Run Advanced Search
                                    </button>
                                </div>
                            </form>
                        )}

                        {searchTab === "jd" && (
                            <form onSubmit={handleJdSearch} className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                                <div>
                                    <label className={labelCls}>Paste Job Description</label>
                                    <textarea
                                        placeholder="Paste full job description text here. We will calculate candidate compatibility by matching candidate skills against this text..."
                                        value={jdText}
                                        onChange={(e) => setJdText(e.target.value)}
                                        rows={6}
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={!jdText.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Analyze & Match Candidates
                                    </button>
                                </div>
                            </form>
                        )}

                        {searchTab === "position" && (
                            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] space-y-4">
                                <div>
                                    <label className={labelCls}>Select Active Job Position</label>
                                    <select
                                        value={selectedPosition || ""}
                                        onChange={(e) => handlePositionChange(Number(e.target.value))}
                                        className={inputCls}
                                    >
                                        <option value="" disabled>-- Select a position --</option>
                                        {positions.map((p) => (
                                            <option key={p.id} value={p.id}>{p.title} - {p.department || "General"}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPositionData && (
                                    <div className="pt-4 border-t border-white/[0.06] animate-in fade-in duration-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-blue-400" />
                                            <span className={`${labelCls} !mb-0`}>Required Skills</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedPositionData.required_skills
                                                ? selectedPositionData.required_skills
                                                    .split(",")
                                                    .map((s: string) => s.trim())
                                                    .filter(Boolean)
                                                    .map((skill: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 shadow-sm transition-all hover:bg-blue-500/20 hover:border-blue-500/30"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))
                                                : (
                                                    <span className="text-sm text-white/30 italic">
                                                        No required skills specified for this position.
                                                    </span>
                                                )
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results count bar */}
                    {(candidates.length > 0 || totalCount > 0) && (
                        <div className="flex items-center justify-between px-1">
                            <p className="text-sm text-white/40">
                                Showing <span className="text-white/70 font-medium">{filteredAndSortedCandidates.length}</span>
                                {totalCount > candidates.length && (
                                    <> of <span className="text-white/70 font-medium">{totalCount}</span> total</>
                                )} candidates
                            </p>
                        </div>
                    )}

                    {/* Top Filtering & Sorting Panel */}
                    {candidates.length > 0 && (
                        <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.06] flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex flex-wrap gap-4 items-center">
                                {/* Location filter */}
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-white/30" />
                                    <span className="text-[11px] text-white/40 uppercase tracking-widest">Location:</span>
                                    <select
                                        value={filters.location}
                                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                                        className={selectCls}
                                    >
                                        <option value="All Locations">All Locations</option>
                                        {distinctLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Experience Filter */}
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-white/30" />
                                    <span className="text-[11px] text-white/40 uppercase tracking-widest">Experience:</span>
                                    <select
                                        value={filters.experienceRange}
                                        onChange={(e) => setFilters(prev => ({ ...prev, experienceRange: e.target.value }))}
                                        className={selectCls}
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="entry">Entry (0–2 yrs)</option>
                                        <option value="mid">Mid (3–5 yrs)</option>
                                        <option value="senior">Senior (6+ yrs)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Sorting controls */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4 text-white/30" />
                                    <span className="text-[11px] text-white/40 uppercase tracking-widest">Sort:</span>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className={selectCls}
                                    >
                                        {(searchTab === "jd" || searchTab === "position") && (
                                            <option value="match_score">Match Score</option>
                                        )}
                                        <option value="experience">Experience</option>
                                        <option value="name">Candidate Name</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" }))}
                                    className="bg-white/5 border border-white/[0.08] hover:bg-white/10 text-white/60 rounded-lg px-2.5 py-1.5 transition-all text-xs font-semibold uppercase"
                                >
                                    {filters.sortOrder}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Candidates Display */}
                    <div className="flex flex-col gap-6 lg:flex-row">
                        {!loading && searchTab === "jd" && hasSearched && candidates.length === 0 ? (
                            <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
                                <Sparkles className="h-8 w-8 text-white/20 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-white/60">No Matching Candidates</h3>
                                <p className="mt-1 text-sm text-white/30">
                                    None of your candidates have skills that match this job description.
                                    Try broadening the JD or check that candidate skills are up to date.
                                </p>
                            </div>
                        ) : (
                            <CandidateList
                                candidates={filteredAndSortedCandidates}
                                loading={loading}
                                showMatchScore={searchTab === "jd" || searchTab === "position" || searchTab === "advanced"}
                                searchType={searchTab}
                            />
                        )}
                    </div>
                </div>

                <QuickPreviewDrawer />
            </main>
        </AppLayout>
    );
}