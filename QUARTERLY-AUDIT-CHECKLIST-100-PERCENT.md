# Documentation Quarterly Audit Checklist

**Schedule**: March, June, September, December (first Monday of each month)

---

## 🎯 Pre-Audit Preparation

- [ ] Assign audit lead (rotate among team members)
- [ ] Set up meeting with team (30-45 min)
- [ ] Download current audit template
- [ ] Review previous audit results
- [ ] Create audit branch: `docs-audit-{quarter}-{year}`

---

## ✅ Audit Checklist (Sections 1-4)

### Section 1: File Organization & Naming (5-10 minutes)

**Root Level Documentation**
- [ ] Count total `.md` files in root directory
- [ ] Verify all active docs follow `-RECOMMENDED` naming pattern
- [ ] No files match forbidden patterns: `*_STATUS.md`, `*_COMPLETE.md`, `*_100.md`
- [ ] Core files present: `README.md`, `CONTRIBUTING.md`
- [ ] View: `ls -la *.md | wc -l` (target: < 30 files)

**Subdirectory Organization**
- [ ] `archive/` contains all deprecated files
- [ ] `archive/DEPRECATED_FILES_REMOVED.md` is current
- [ ] `docs/` subdirectories organized by topic
- [ ] `.github/` contains workflows and contributing guides
- [ ] Check subdirs: `find . -maxdepth 1 -type d -name "docs" -o -name "archive"`

**Naming Convention Compliance**
- [ ] Search for violations: `grep -r "_STATUS\|_COMPLETE\|_100" --include="*.md" . --exclude-dir=archive`
- [ ] Result should return ZERO matches (only archive references OK)
- [ ] Document any exceptions with rationale

### Section 2: Documentation Quality (10-15 minutes)

**Content Accuracy**
- [ ] README.md is current (last updated < 3 months ago)
- [ ] CONTRIBUTING.md reflects current workflow
- [ ] All RECOMMENDED docs have clear purpose statements
- [ ] API documentation matches current API routes
- [ ] Deployment documentation matches current infrastructure

**Broken Links & References**
- [ ] Search for references to deleted files in RECOMMENDED docs
- [ ] Check common deleted files: `grep -r "DEPLOYMENT_STATUS\|QUICKSTART_100\|AI_ACTIONS_100" --include="*.md"`
- [ ] Fix any broken links found
- [ ] Test 3-5 important links manually (click/open)

**Markdown Quality**
- [ ] Run markdown linter: `npx markdownlint-cli2 "**/*.md" --ignore node_modules --ignore archive`
- [ ] Check for consistent heading hierarchy (H1, H2, H3, etc.)
- [ ] Verify code blocks have language identifiers
- [ ] Check lists are properly formatted
- [ ] Document any linting errors that need fixing

### Section 3: Process & Prevention (5-10 minutes)

**Git Hooks Status**
- [ ] Verify `.githooks/pre-commit-docs` exists and is executable
- [ ] Verify hook is installed: `git config core.hooksPath`
- [ ] Test hook by attempting to commit a forbidden file
- [ ] Expected result: commit should fail with helpful message

**CI/CD Validation**
- [ ] Check if `.github/workflows/doc-validation.yml` exists
- [ ] Verify workflow runs on PR with `.md` changes
- [ ] Review workflow logs from recent PRs
- [ ] Ensure validation is passing in CI

**Team Awareness**
- [ ] Review team documentation of naming conventions
- [ ] Check if new team members know the standards
- [ ] Verify link to DOCUMENTATION_STANDARDS-RECOMMENDED.md in README
- [ ] Note any training needs

### Section 4: Archive & Recovery (5 minutes)

**Archive Integrity**
- [ ] `archive/DEPRECATED_FILES_REMOVED.md` is readable and organized
- [ ] Recovery procedures are clear and tested
- [ ] File recovery window documented (default: 1 year)
- [ ] Sample recovery: `git show {commit-hash}:DEPLOYMENT_STATUS_100.md`

**Retention Policy**
- [ ] Document current retention policy
- [ ] Review archived files for candidates to delete permanently
- [ ] Archive files older than 1 year can be deleted if no longer needed
- [ ] Update recovery documentation with any deletions

---

## 📊 Metrics & Reporting (10 minutes)

### Key Metrics to Track

| Metric                 | Target   | Current | Status |
| ---------------------- | -------- | ------- | ------ |
| Root .md files         | < 30     | ___     |        |
| Forbidden patterns     | 0        | ___     |        |
| Broken links           | 0        | ___     |        |
| Markdown lint errors   | < 5      | ___     |        |
| Documentation coverage | 100%     | ___     |        |
| Git hooks active       | ✅ Yes    | ___     |        |
| CI doc validation      | ✅ Active | ___     |        |

### Documentation Inventory

Count by category:
- [ ] Security & Compliance: ___ files
- [ ] Deployment & Operations: ___ files
- [ ] API & Integration: ___ files
- [ ] Development & Contributing: ___ files
- [ ] Architecture & Infrastructure: ___ files

### Coverage Assessment

- [ ] Critical docs present and current
- [ ] API documentation up-to-date
- [ ] Deployment runbooks tested
- [ ] Security guidelines documented
- [ ] Incident response procedures documented

---

## 🔧 Action Items & Follow-ups

### Issues Found
```
1. Issue: [description]
   - Fix: [action]
   - Owner: [person]
   - Deadline: [date]

2. Issue: [description]
   - Fix: [action]
   - Owner: [person]
   - Deadline: [date]
```

### Improvements to Implement
```
1. Improvement: [description]
   - Implementation: [how]
   - Owner: [person]
   - Deadline: [date]

2. Improvement: [description]
   - Implementation: [how]
   - Owner: [person]
   - Deadline: [date]
```

### Team Feedback
```
- [Feedback item 1]
- [Feedback item 2]
- [Feedback item 3]
```

---

## 📝 Sign-off

**Audit Date**: ___________

**Audit Lead**: ___________

**Participants**:
- [ ] Lead
- [ ] Developer 1
- [ ] Developer 2
- [ ] Tech Lead

**Overall Status**:
- [ ] ✅ PASSED - All checks completed, issues documented
- [ ] ⚠️ PASSED WITH ISSUES - Minor issues found, action items assigned
- [ ] ❌ FAILED - Critical issues found, follow-up audit scheduled

**Next Audit Date**: ___________

**Notes**: 
```
[Additional notes, decisions, or discussion items]
```

---

## 📅 Quarterly Schedule

| Quarter        | Date         | Audit Lead | Status   |
| -------------- | ------------ | ---------- | -------- |
| Q1 (March)     | First Monday | ___        | [ ] Todo |
| Q2 (June)      | First Monday | ___        | [ ] Todo |
| Q3 (September) | First Monday | ___        | [ ] Todo |
| Q4 (December)  | First Monday | ___        | [ ] Todo |

---

## 🔗 Related Documentation

- [DOCUMENTATION_STANDARDS-RECOMMENDED.md](DOCUMENTATION_STANDARDS-RECOMMENDED.md) - Standards guide
- [CLEANUP-SUMMARY-RECOMMENDED.md](CLEANUP-SUMMARY-RECOMMENDED.md) - Previous cleanup details
- [archive/DEPRECATED_FILES_REMOVED.md](archive/DEPRECATED_FILES_REMOVED.md) - Removed files archive
- [.github/workflows/doc-validation.yml](.github/workflows/doc-validation.yml) - Automated validation

---

## 💡 Tips for Audit Success

1. **Set Time Blocks**: Allocate specific time for each section
2. **Use Shell Commands**: Copy & run provided commands for consistency
3. **Document Everything**: Note all findings in this checklist
4. **Team Participation**: Rotate leads quarterly for knowledge sharing
5. **Follow Up**: Assign owners and deadlines for all action items
6. **Review Metrics**: Track trends across quarters

---

**Last Updated**: 2025-02-19  
**Version**: 1.0  
**Maintained By**: Documentation Team
