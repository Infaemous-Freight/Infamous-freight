# 📚 Documentation Standards

**Version**: 1.0  
**Last Updated**: February 19, 2026  
**Audience**: All developers and contributors

---

## 🎯 Purpose

This document establishes standards for maintaining clean, organized, and discoverable documentation in the Infamous Freight repository.

---

## 📋 Naming Convention

### Active Documentation

All active (current) documentation must follow this naming pattern:

```
{SUBJECT}-RECOMMENDED.{md|txt}
```

**Examples:**
- ✅ `DEPLOYMENT-RECOMMENDED.md`
- ✅ `SECURITY-RECOMMENDED.md`
- ✅ `FIREBASE-REFERENCE-RECOMMENDED.md`
- ✅ `QUICK-REFERENCE-CARD-RECOMMENDED.txt`

**NOT acceptable:**
- ❌ `DEPLOYMENT.md` (missing -RECOMMENDED suffix)
- ❌ `DEPLOYMENT_FINAL.md` (no version suffixes)
- ❌ `DEPLOYMENT_STATUS.md` (implies iteration/status tracking)

### Configuration Files

Configuration files use standard naming (unchanged):

- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `firebase.json`
- ✅ `vercel.json`
- ✅ `.env.example`

### Archived Documentation

Old/deprecated documentation stored in `/archive`:

```
archive/{SUBJECT}-v{VERSION}.md
```

**Examples:**
- ✅ `archive/DEPLOYMENT-v1.0.md`
- ✅ `archive/SECURITY-v2.1.md`

---

## 📂 Organization

### Root Level Files (Target: <30 files)

**Allowed in repository root:**
- Core files: README.md, CONTRIBUTING.md, LICENSE, COPYRIGHT, AUTHORS, OWNERS
- Active documentation: 23 files ending in `-RECOMMENDED.md`
- Configuration: package.json, pnpm-lock.yaml, tsconfig.base.json, etc.
- CI/CD: .github/, .husky/, .gitlab-ci.yml, etc.

**NOT allowed in repository root:**
- Build logs (*.log files)
- Status files (*_STATUS.md, *_COMPLETE.md, *_100.md)
- Intermediate build artifacts
- Temporary files

### Documentation Directory (`/docs`)

Topic-specific documentation organized by category:

```
docs/
├── architecture/           # System design & patterns
├── api/                    # API specifications
├── deployment/             # Deployment procedures
├── development/            # Development guides
├── guides/                 # User & developer guides
├── runbooks/               # Operational procedures
├── compliance/             # Compliance & audit
├── integration/            # Integration guides
├── marketplace/            # Marketplace documentation
└── README.md              # Documentation index
```

---

## ✅ Guidelines

### 1. One Canonical Version Per Topic

**Rule**: One active documentation file per subject.

- ❌ **Bad**: `DEPLOYMENT.md`, `DEPLOYMENT_FINAL.md`, `DEPLOYMENT_RECOMMENDED.md` (3 versions)
- ✅ **Good**: `DEPLOYMENT-RECOMMENDED.md` (single source of truth)

**If updating docs:**
1. Edit the existing `-RECOMMENDED` file
2. Archive old version with version number
3. Update RECOMMENDED-INDEX.md

### 2. No Build Logs in Version Control

**Rule**: Logs are temporary artifacts, not documentation.

- ❌ **Don't commit**: `build.log`, `deployment-2026-02-19.log`, `error.log`
- ✅ **Do**: Output to `/tmp` or `.gitignore`

**To prevent:**
```bash
# Add to .gitignore
*.log
build-*.txt
deployment-*.log
```

### 3. No Status/Progress Tracking Files

**Rule**: Use git tags and branches for versioning, not status files.

- ❌ **Don't create**: `DEPLOYMENT_STATUS_100_COMPLETE.md`, `PROJECT_100_PERCENT.md`
- ✅ **Do instead**:
  ```bash
  git tag -a v2.0.0-deployment-complete -m "Deployment phase complete"
  git branch release/2.0.0
  ```

### 4. Consistent Markdown Formatting

All `.md` files should follow this format:

```markdown
# Title

**Version**: X.X  
**Last Updated**: YYYY-MM-DD  
**Status**: [Active/Archived/Draft]

---

## 🎯 Purpose

Clear explanation of document purpose.

---

## 📋 Table of Contents (if >500 lines)

---

## Main Content

Organized with headers and sections.

---

## 📝 Changelog

Version history if tracking updates.

---

**Related docs**: Link to related documentation
```

### 5. Link All New Documentation

When creating new documentation:

1. **Update** `RECOMMENDED-INDEX.md` with entry
2. **Link** from relevant parent docs
3. **Cross-reference** related documents
4. **Use relative links**: `[link text](./DEPLOYMENT-RECOMMENDED.md)`

**Not acceptable:**
- Orphaned documentation (not linked from index)
- Broken links
- Link rot (links to deleted files)

### 6. Archive Old Documentation Properly

Before deleting documentation:

1. **Move** to `archive/{SUBJECT}-v{VERSION}.md`
2. **Add** entry to `archive/DEPRECATED_FILES_REMOVED.md`
3. **Note** why it was archived
4. **Link** to new replacement doc (if applicable)

**Example:**
```markdown
## Deprecated Files Removed (2026-02-19)

### DEPLOYMENT_STATUS_100_COMPLETE.md (v1.0)
- **Reason**: Status tracking file, redundant with git tags
- **Replacement**: Use `git tag` for deployment milestones
- **Recovery**: `git show COMMIT_HASH:DEPLOYMENT_STATUS_100_COMPLETE.md`
```

### 7. Quarterly Documentation Review

**Schedule**: First Monday of each quarter (March, June, September, December)

**Review Checklist:**
- [ ] Count root-level .md files (target: <30)
- [ ] Check for orphaned documentation
- [ ] Verify all links are valid
- [ ] Look for status/progress files
- [ ] Check for build logs accidentally committed
- [ ] Archive outdated docs (>6 months without updates)
- [ ] Update RECOMMENDED-INDEX.md
- [ ] Report findings to team

### 8. Update Frequency Guidelines

| Document Type | Update Frequency | Owner |
|---------------|------------------|-------|
| Deployment procedures | When process changes | DevOps |
| API documentation | When APIs change | Backend team |
| Security policies | When policies change | Security |
| Contributing guidelines | Quarterly review | Maintainers |
| Roadmap/planning | As priorities change | Product |

---

## 🛡️ Prevention Mechanisms

### Pre-commit Hook

Prevents committing certain file patterns:

```bash
#!/bin/bash
# .githooks/pre-commit-docs

FORBIDDEN_PATTERNS=(
  "*_STATUS\.md"
  "*_100\.md"
  "*_COMPLETE\.md"
  "\.log$"
  "*DEPLOYMENT_.*\.md"
  "*_FINAL_\.md"
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if git diff --cached --name-only | grep -E "$pattern"; then
    echo "❌ ERROR: Attempting to commit file matching pattern: $pattern"
    echo "📖 Documentation Standards: See DOCUMENTATION_STANDARDS-RECOMMENDED.md"
    exit 1
  fi
done
```

### GitHub Actions Validation

Automated checks on pull requests:

- ✅ No status files
- ✅ No broken links
- ✅ Markdown lint validation
- ✅ Check for orphaned files

---

## 🎓 Common Scenarios

### Scenario 1: Need to Document a New Feature

1. Create file: `FEATURE_NAME-RECOMMENDED.md`
2. Follow format from section 4 (Markdown Formatting)
3. Add entry to `RECOMMENDED-INDEX.md`
4. Link from parent document (if applicable)
5. Commit with message: `docs: add FEATURE_NAME-RECOMMENDED.md`

### Scenario 2: Updating Existing Documentation

1. Edit the `-RECOMMENDED.md` file in place
2. Update "Last Updated" date
3. Add entry to changelog if significant
4. Commit with: `docs: update SUBJECT-RECOMMENDED.md - {summary}`

### Scenario 3: Document Becomes Outdated

1. Check if it should be archived or deleted
2. If archiving: Move to `archive/SUBJECT-vX.Y.md`
3. Add to `DEPRECATED_FILES_REMOVED.md`
4. Remove from `RECOMMENDED-INDEX.md`
5. Commit: `docs(archive): retire SUBJECT-RECOMMENDED.md`

### Scenario 4: Merge Duplicate Documentation

1. Decide which version to keep (usually the most recent)
2. Archive the other: `archive/SUBJECT-v{old_version}.md`
3. Update RECOMMENDED-INDEX.md
4. Commit: `docs: consolidate SUBJECT documentation`

---

## 📊 Documentation Health Metrics

Track these quarterly:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Root .md files | <30 | `ls -1 *.md \| wc -l` |
| Status files | 0 | `find . -maxdepth 1 -name "*_STATUS*"` |
| Build logs tracked | 0 | `find . -maxdepth 1 -name "*.log"` |
| Orphaned docs | 0 | Check RECOMMENDED-INDEX.md coverage |
| Link validity | 100% | Run markdown-link-check |
| Avg. doc age | <12 months | Check "Last Updated" dates |
| -RECOMMENDED convention | 100% | Verify all active docs use pattern |

---

## 🔗 Related Documentation

- [RECOMMENDED-INDEX.md](RECOMMENDED-INDEX.md) - Navigation guide
- [CLEANUP-SUMMARY-RECOMMENDED.md](CLEANUP-SUMMARY-RECOMMENDED.md) - Cleanup details
- [RECOMMENDATIONS-NEXT-STEPS.md](RECOMMENDATIONS-NEXT-STEPS.md) - Implementation steps

---

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-19 | Initial standards document after cleanup |

---

## ✅ Sign-Off Checklist

Team members should acknowledge understanding:

- [ ] Read and understood naming conventions
- [ ] Know where to find current documentation
- [ ] Understand what files to archive vs. delete
- [ ] Will follow standards for new documentation
- [ ] Understand quarterly review process

---

**Status**: ✅ **APPROVED & ACTIVE**

**Maintained By**: Development Team  
**Review Cycle**: Quarterly (March, June, September, December)  
**Last Reviewed**: February 19, 2026

---

*These standards ensure our documentation remains clean, organized, and maintainable.*
