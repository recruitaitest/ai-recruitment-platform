import re

file_path = 'c:\\Nithish\\Projects\\AI Resume Management Platform\\Frontend\\components\\candidates\\CandidateProfilePage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add router and state
component_start = 'export default function CandidateProfilePage({ candidate: raw }: { candidate?: Candidate }) {'
component_new_start = '''export default function CandidateProfilePage({ candidate: raw }: { candidate?: Candidate }) {
    const router = useRouter();
    const [shortlistModalOpen, setShortlistModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!c.id) return;
        if (!window.confirm("Are you sure you want to delete this candidate?")) return;
        
        try {
            await api.delete(`/candidates/${c.id}`);
            toast.success("Candidate deleted successfully");
            router.push('/candidates');
        } catch (error) {
            console.error("Error deleting candidate:", error);
            toast.error("Failed to delete candidate");
        }
    };
'''

if 'const router = useRouter();' not in content:
    content = content.replace(component_start, component_new_start)

# Replace buttons in header
header_btn1 = '<button type="button" style={btn("ghost")}>← All Candidates</button>'
header_btn1_new = '<button type="button" style={btn("ghost")} onClick={() => router.push("/candidates")}>← All Candidates</button>'
content = content.replace(header_btn1, header_btn1_new)

header_btn2 = '<button type="button" style={btn("ghost")}>Shortlist</button>'
header_btn2_new = '<button type="button" style={btn("ghost")} onClick={() => setShortlistModalOpen(true)}>Shortlist</button>'
content = content.replace(header_btn2, header_btn2_new)

header_btn3 = '<button type="button" style={{ ...btn("ghost"), color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>Delete</button>'
header_btn3_new = '<button type="button" style={{ ...btn("ghost"), color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }} onClick={handleDelete}>Delete</button>'
content = content.replace(header_btn3, header_btn3_new)

# Replace buttons in main content (hero banner)
hero_btn = '<button type="button" style={btn("primary")}>Shortlist</button>'
hero_btn_new = '<button type="button" style={btn("primary")} onClick={() => setShortlistModalOpen(true)}>Shortlist</button>'
content = content.replace(hero_btn, hero_btn_new)

# Add modal at the end
modal_tag = '''            {noteModal && <NoteModal recruiter={c.recruiter} onClose={() => setNoteModal(false)} onSave={addNote} />}
            <ShortlistModal 
                open={shortlistModalOpen} 
                onClose={() => setShortlistModalOpen(false)} 
                candidateId={c.id} 
                candidateName={c.name} 
            />
        </div>
    );
}'''
if '<ShortlistModal' not in content:
    content = content.replace('            {noteModal && <NoteModal recruiter={c.recruiter} onClose={() => setNoteModal(false)} onSave={addNote} />}\n        </div>\n    );\n}', modal_tag)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success patched')
