import re

file_path = 'c:\\Nithish\\Projects\\AI Resume Management Platform\\Frontend\\components\\candidates\\CandidateProfilePage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # 1. TalentOS -> Candidate Info
    (r'TalentOS', 'Candidate Info'),
    
    # 2. Fix header positioning and z-index
    (r'position:\s*"sticky"', 'position: "relative"'),
    (r'top:\s*0,', ''),
    (r'zIndex:\s*100,', 'zIndex: 10,'),
    
    # 3. Decrease brightness (increase transparency) in CSS variables
    # --bg-card: from 0.85 to 0.4
    (r'--bg-card:\s*\$\{isDark \? \"#111318\" : \"rgba\(255,255,255,0\.85\)\"\};', '--bg-card: ${isDark ? "#111318" : "rgba(255,255,255,0.4)"};'),
    
    # --border-strong: from 0.1 to 0.2 (just to keep it visible if bg is more transparent)
    (r'--border-strong:\s*\$\{isDark \? \"rgba\(0,0,0,0\.12\)\" : \"rgba\(0,0,0,0\.1\)\"\};', '--border-strong: ${isDark ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.1)"};'),
    
    # --bg-icon: from 0.7 to 0.3
    (r'--bg-icon:\s*\$\{isDark \? \"#1c2029\" : \"rgba\(255,255,255,0\.7\)\"\};', '--bg-icon: ${isDark ? "#1c2029" : "rgba(255,255,255,0.3)"};'),
    
    # --bg-darker: from 0.6 to 0.25 (used in quick stats)
    (r'--bg-darker:\s*\$\{isDark \? \"#0a0f1d\" : \"rgba\(255,255,255,0\.6\)\"\};', '--bg-darker: ${isDark ? "#0a0f1d" : "rgba(255,255,255,0.25)"};'),
    
    # --bg-header: from 0.6 to 0.3
    (r'--bg-header:\s*\$\{isDark \? \"rgba\(10,11,14,0\.88\)\" : \"rgba\(255,255,255,0\.6\)\"\};', '--bg-header: ${isDark ? "rgba(10,11,14,0.88)" : "rgba(255,255,255,0.3)"};'),
    
    # --hero-bg: from 0.95/0.8 to 0.5/0.3
    (r'--hero-bg:\s*\$\{isDark \? \"linear-gradient\(180deg,#111318,#0b0d12\)\" : \"linear-gradient\(180deg,rgba\(255,255,255,0\.95\),rgba\(255,255,255,0\.8\)\)\"\};', '--hero-bg: ${isDark ? "linear-gradient(180deg,#111318,#0b0d12)" : "linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.3))"};'),
    
    # --hero-top: from 0.8 to 0.4
    (r'--hero-top:\s*\$\{isDark \? \"#161a21\" : \"rgba\(255,255,255,0\.8\)\"\};', '--hero-top: ${isDark ? "#161a21" : "rgba(255,255,255,0.4)"};'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
