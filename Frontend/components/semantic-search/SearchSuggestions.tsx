interface SearchSuggestionsProps {
    suggestions: string[];
    onSelect: (value: string) => void;
}

export default function SearchSuggestions({
    suggestions,
    onSelect,
}: SearchSuggestionsProps) {
    return (
        <div className="mt-5 flex flex-wrap gap-3">
            {suggestions.map((item) => (
                <button
                    key={item}
                    onClick={() => onSelect(item)}
                    className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-black hover:text-white"
                >
                    {item}
                </button>
            ))}
        </div>
    );
}