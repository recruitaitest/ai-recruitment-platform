interface EducationSectionProps {
 candidate?: any;
}

export default function EducationSection({
 candidate,
}: EducationSectionProps) {

 if (!candidate?.education) {
 return (
 <div className="rounded-2xl border border-border bg-surface p-6">
 <h3 className="text-xl font-semibold">
 Education
 </h3>

 <p className="text-muted mt-4">
 Education not found
 </p>
 </div>
 );
 }

  const blocks = Array.isArray(candidate.education)
    ? candidate.education
    : typeof candidate.education === "string"
    ? candidate.education.split(/\n\s*\n/).filter((block: string) => block.trim())
    : [];

 return (
 <div className="rounded-2xl border border-border bg-surface p-6">

 <h3 className="text-xl font-semibold mb-4">
 Education
 </h3>

 <div className="space-y-4">

 {blocks.map(
 (block: string, index: number) => (
 <div
 key={index}
 className="rounded-2xl border border-border bg-card p-5"
 >
 <div className="whitespace-pre-line text-text-primary">
 {block}
 </div>
 </div>
 )
 )}

 </div>

 </div>
 );
}