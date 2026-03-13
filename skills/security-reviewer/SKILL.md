# Security Reviewer

**Description:**
Audit code for vulnerabilities (XSS, CSRF, SQLi, IDOR) and suggest robust access-control fixes.

**Behavior Checklist:**
- Audit Row Level Security (RLS) policies.
- Ensure inputs are sanitized before rendering or database insertion.
- Check for hardcoded secrets.

**How to trigger in Cascade / Windsurf:**
`Using the security-reviewer skill, audit this route for IDOR vulnerabilities` or `Use the security-reviewer skill to check my RLS policies`.
