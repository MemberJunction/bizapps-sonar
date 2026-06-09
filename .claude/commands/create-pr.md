# Create Pull Request

Create a GitHub pull request for the current branch targeting the `next` branch.

## Instructions

1. **Verify git status:**
   - Run: `git status`
   - Ensure current branch is not `next` or `main`
   - Check if branch tracks a remote and is up to date

2. **Analyze changes:**
   - Get commit history: `git log main...HEAD --oneline --no-merges`
   - Get file changes: `git diff main...HEAD --name-only`
   - Get detailed diff: `git diff main...HEAD --stat`

3. **Generate PR title:**
   - Create a concise, descriptive title based on the commit messages
   - Use conventional commit format if applicable (e.g., "feat:", "fix:", "docs:")
   - Keep it under 72 characters

4. **Generate PR description:**
   - Create a summary section with 2-4 bullet points describing the key changes
   - Add a "Test plan" section with checkboxes for testing the changes
   - Include the standard footer
   - Format:

```markdown
## Summary
- First key change or feature
- Second key change or feature
- Third key change if applicable

## Test plan
- [ ] Verify [specific functionality]
- [ ] Test [specific scenario]
- [ ] Confirm [expected behavior]

Generated with [Claude Code](https://claude.com/claude-code)
```

5. **Push to remote (if needed):**
   - If branch doesn't track remote: `git push -u origin <branch-name>`
   - If branch is behind remote, warn user and ask before force pushing

6. **Create PR:**
   - Use `gh pr create --base next --title "<title>" --body "$(cat <<'EOF'
<body content>
EOF
)"`
   - Ensure the base branch is `next`
   - After creation, display the PR URL

## Important Notes

- Always target `next` branch
- Never force push without explicit user approval
- If there are no commits compared to `next`, inform the user (nothing to create PR for)
- Use HEREDOC syntax for the body to handle multi-line content correctly
- The PR description should be concise but informative
- Test plan should be specific to the changes made