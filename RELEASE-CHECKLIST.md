# Release Checklist

Use this checklist when preparing for a new release.

## Pre-Release Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Linter passing (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] No console errors in production mode

### Version Update
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new version entry
- [ ] Date added to version in `CHANGELOG.md`
- [ ] All changes documented under correct categories (Added/Changed/Fixed/etc.)

### Documentation
- [ ] README.md up to date with new features
- [ ] API documentation updated (if API changed)
- [ ] Migration guide added (if breaking changes)
- [ ] Environment variables documented (if new vars added)

### Repository
- [ ] All changes committed
- [ ] Branch is up to date with main
- [ ] Repository URLs updated in `package.json` (first release only)
- [ ] Badge URLs updated in `README.md` (first release only)

## Release Process

### 1. Prepare Release
```bash
# Ensure on main branch with latest changes
git checkout main
git pull origin main

# Verify everything works
npm install
npm run build
npm test

# Check for uncommitted changes
git status
```

### 2. Update Version
```bash
# Update package.json version
npm version [patch|minor|major]

# This automatically:
# - Updates package.json and package-lock.json
# - Creates a git tag
# - Commits the version bump
```

### 3. Update Changelog
```bash
# Edit CHANGELOG.md manually
# Change [Unreleased] to [X.Y.Z] - YYYY-MM-DD
# Add release notes under appropriate categories

# Commit changelog
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for vX.Y.Z"
```

### 4. Create Release Tag
```bash
# Tag the release (if not done by npm version)
git tag vX.Y.Z

# Push commits and tags
git push origin main
git push origin vX.Y.Z
```

### 5. Monitor Release Workflow
- Go to GitHub Actions: `https://github.com/USERNAME/mi-ai-coding/actions`
- Find "Release" workflow run
- Verify it completes successfully
- Check that GitHub Release is created

### 6. Verify Release
- [ ] GitHub Release created with correct version
- [ ] Release notes match CHANGELOG.md
- [ ] Build artifacts attached
- [ ] Tag visible in repository
- [ ] CI workflow passing

## Post-Release Checklist

### Immediate
- [ ] Announce release (if applicable)
- [ ] Monitor for issues
- [ ] Respond to questions

### Next Development
- [ ] Create `[Unreleased]` section in CHANGELOG.md
- [ ] Plan next version features
- [ ] Create milestone for next version (optional)

## Version Types

### Patch (X.Y.Z+1)
- Bug fixes
- Documentation updates
- Small improvements
- No breaking changes
- No new features

### Minor (X.Y+1.0)
- New features
- Enhancements
- Deprecations
- No breaking changes
- Backward compatible

### Major (X+1.0.0)
- Breaking changes
- Major new features
- API redesign
- Requires migration

## Emergency Hotfix

If critical bug found in production:

```bash
# 1. Create hotfix branch from latest release tag
git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z

# 2. Fix the bug
# ... make changes ...
git add .
git commit -m "fix: critical bug description"

# 3. Update version (patch)
npm version patch

# 4. Update CHANGELOG.md
# Add hotfix entry

# 5. Push hotfix
git push origin hotfix/vX.Y.Z+1

# 6. Create PR to main
# 7. After merge, tag and release
git tag vX.Y.Z+1
git push --tags
```

## Rollback Procedure

If release has critical issues:

### Option 1: Quick Fix
- Fix issue
- Release new patch version
- Update CHANGELOG

### Option 2: Revert Release
```bash
# Revert to previous version
git revert vX.Y.Z

# Create new release
npm version patch
git push --tags
```

### Option 3: Delete Release (Last Resort)
- Go to GitHub Releases
- Delete problematic release
- Delete git tag locally: `git tag -d vX.Y.Z`
- Delete git tag remotely: `git push origin :refs/tags/vX.Y.Z`
- Fix issues and re-release

## Common Issues

### CI Workflow Failing
- Check Node.js version compatibility
- Verify PostgreSQL service is running
- Check for missing dependencies
- Review test failures

### Build Artifacts Missing
- Verify `npm run build` completes
- Check `.next/` directory exists
- Verify tar command in workflow

### Release Notes Empty
- Ensure CHANGELOG.md has section for version
- Check version format: `## [X.Y.Z] - YYYY-MM-DD`
- Verify changelog extraction logic in workflow

### Tag Already Exists
```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag
git push origin :refs/tags/vX.Y.Z

# Recreate tag
git tag vX.Y.Z
git push --tags
```

## Release Schedule

### Regular Releases
- **Minor releases**: Monthly or as needed
- **Patch releases**: As needed for bugs
- **Major releases**: Quarterly or when breaking changes required

### Security Releases
- Critical security issues: Immediate hotfix
- Non-critical security issues: Next patch release

## Communication

### Release Announcement Template
```markdown
# MI AI Coding Platform vX.Y.Z Released

We're excited to announce the release of MI AI Coding Platform vX.Y.Z!

## Highlights
- Feature 1
- Feature 2
- Bug fix 1

## Breaking Changes (if any)
- Change 1 with migration path

## Upgrade Instructions
```bash
git pull origin main
npm install
npm run build
npm start
```

## Full Changelog
See [CHANGELOG.md](CHANGELOG.md#vXYZ) for complete details.

## Download
- [GitHub Release](https://github.com/USERNAME/mi-ai-coding/releases/tag/vX.Y.Z)
- [Documentation](https://github.com/USERNAME/mi-ai-coding#readme)
```

---

**Last Updated**: 2025-10-12
**Maintained by**: GitHub Manager Agent
