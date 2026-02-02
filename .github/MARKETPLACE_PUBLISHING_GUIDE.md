# Publishing Custom Actions to GitHub Marketplace

This guide explains how to publish the custom actions to the GitHub Marketplace.

## Actions Available for Publishing

1. **Health Check with Retries** (`.github/actions/health-check/`)
2. **Performance Regression Detection** (`.github/actions/performance-baseline/`)

---

## Prerequisites

- Repository must be **public** to publish to Marketplace
- Actions must be in the root of the repository or in subdirectories
- Each action needs:
  - `action.yml` (or `action.yaml`) file
  - `README.md` with documentation
  - Proper branding (icon and color)

---

## Publishing Steps

### Option 1: Publish from This Repository

**If you want to keep actions in this monorepo:**

1. **Create a Release Tag for Each Action**

```bash
# For health-check action v1.0.0
git tag -a health-check-v1.0.0 -m "Release health-check action v1.0.0"
git push origin health-check-v1.0.0

# For performance-baseline action v1.0.0
git tag -a performance-baseline-v1.0.0 -m "Release performance-baseline action v1.0.0"
git push origin performance-baseline-v1.0.0
```

1. **Create GitHub Release**
   - Go to <https://github.com/MrMiless44/Infamous-freight-enterprises/releases/new>
   - Select the tag you just created
   - Add release notes
   - Check "Publish this Action to the GitHub Marketplace"
   - Select primary category (e.g., "Deployment", "Continuous integration")
   - Add secondary categories if applicable
   - Publish release

2. **Users Can Reference Your Actions**

```yaml
# From your repository
- uses: MrMiless44/Infamous-freight-enterprises/.github/actions/health-check@v1.0.0
  with:
    url: https://api.example.com/health
```

---

### Option 2: Publish as Separate Repositories (Recommended)

**For cleaner marketplace presence and easier discovery:**

#### Health Check Action

1. **Create New Repository:** `health-check-action`
2. **Copy Files:**

   ```bash
   # In the new repository
   cp action.yml .
   cp README.md .
   ```

3. **Update README.md usage example:**

   ```yaml
   - uses: MrMiless44/health-check-action@v1
     with:
       url: https://api.example.com/health
   ```

4. **Commit and Tag:**

   ```bash
   git add .
   git commit -m "Initial release"
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin main
   git push origin v1.0.0
   ```

5. **Create Release with Marketplace Publishing**

#### Performance Baseline Action

1. **Create New Repository:** `performance-baseline-action`
2. **Copy Files:**

   ```bash
   # In the new repository
   cp action.yml .
   cp ../performance-baselines.json ./example-baselines.json
   ```

3. **Create README.md** with usage examples
4. **Commit and Tag:**

   ```bash
   git add .
   git commit -m "Initial release"
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin main
   git push origin v1.0.0
   ```

5. **Create Release with Marketplace Publishing**

---

## Release Checklist

### Before Publishing

- [ ] Test action thoroughly in workflows
- [ ] Write comprehensive README with:
  - [ ] Clear description of what the action does
  - [ ] All inputs documented with defaults
  - [ ] All outputs documented
  - [ ] Multiple usage examples
  - [ ] Troubleshooting section
- [ ] Add LICENSE file (MIT recommended)
- [ ] Add branding (icon and color) in action.yml
- [ ] Add appropriate keywords in action.yml
- [ ] Verify action works with different inputs
- [ ] Check for security vulnerabilities
- [ ] Ensure no hardcoded secrets or credentials

### During Release

- [ ] Create semantic version tag (v1.0.0)
- [ ] Write clear release notes
- [ ] Select appropriate marketplace categories
- [ ] Add descriptive marketplace description
- [ ] Check "Publish to GitHub Marketplace"

### After Publishing

- [ ] Verify action appears in Marketplace
- [ ] Test installation from Marketplace
- [ ] Monitor for issues and feedback
- [ ] Update documentation with marketplace badge

---

## Marketplace Categories

### Health Check Action

**Primary:** Deployment
**Secondary:** Continuous integration, Monitoring

### Performance Baseline Action

**Primary:** Code quality
**Secondary:** Continuous integration, Monitoring

---

## Versioning Strategy

Use **Semantic Versioning** (semver):

- **Major (v2.0.0):** Breaking changes to inputs/outputs
- **Minor (v1.1.0):** New features, backward compatible
- **Patch (v1.0.1):** Bug fixes, backward compatible

**Create Major Version Tags:**

```bash
# After releasing v1.0.0, create v1 tag
git tag -fa v1 -m "Update v1 to v1.0.0"
git push origin v1 --force

# Users can reference with @v1 (auto-updates to latest v1.x.x)
- uses: MrMiless44/health-check-action@v1
```

---

## Marketing Your Actions

### Add Badges to README

```markdown
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Health%20Check%20Action-blue?logo=github)](https://github.com/marketplace/actions/health-check-with-retries)
[![Version](https://img.shields.io/github/v/release/MrMiless44/health-check-action)](https://github.com/MrMiless44/health-check-action/releases)
[![License](https://img.shields.io/github/license/MrMiless44/health-check-action)](LICENSE)
```

### Share on Social Media

- Twitter: Announce your action with use case examples
- Dev.to: Write blog post about building and publishing the action
- Reddit: Share in r/github, r/devops
- LinkedIn: Post about solving deployment verification problems

### Engage with Community

- Respond to issues quickly
- Accept pull requests
- Add examples repository
- Create video tutorial

---

## Maintenance

### Regular Updates

- **Monthly:** Check for dependency updates
- **Quarterly:** Review and improve documentation
- **Yearly:** Major version if needed

### Support Channels

- GitHub Issues: Bug reports and feature requests
- Discussions: Q&A and community support
- Sponsor: Optional GitHub Sponsors for maintenance

---

## Example Marketplace Listing

### Health Check with Retries

**Description:**

> Perform reliable health checks with configurable retries, timeout, and JSON validation. Perfect for deployment verification, ensuring your services are ready before proceeding with dependent steps.

**Why Use This Action:**

- ✅ Configurable retry logic with delays
- ✅ JSON response validation
- ✅ Detailed error messages and logging
- ✅ Response time measurement
- ✅ Works with any HTTP endpoint
- ✅ Zero dependencies, pure bash

**Use Cases:**

- Verify API deployment success
- Wait for database migrations
- Ensure service is healthy before tests
- Monitor external service availability
- Validate multi-service startup order

---

## Quick Start After Publishing

### For Users to Find Your Actions

1. **Search GitHub Marketplace:** <https://github.com/marketplace>
2. **Filter by:** Actions → Deployment/Code Quality
3. **Install:** Click "Use latest version"
4. **Copy-paste** usage example into workflow

### Your Published Actions URL

- Health Check: `https://github.com/marketplace/actions/health-check-with-retries`
- Performance Baseline: `https://github.com/marketplace/actions/performance-regression-detection`

---

## Resources

- **Marketplace Docs:** <https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace>
- **Action Metadata:** <https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions>
- **Best Practices:** <https://docs.github.com/en/actions/creating-actions/creating-a-composite-action>
- **Security:** <https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions>

---

**Ready to Publish?** Follow the steps above and share your actions with the community! 🚀
