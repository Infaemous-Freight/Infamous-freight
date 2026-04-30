# Quickstart for GitHub Pages

This quickstart explains how to create and publish a GitHub Pages site from a repository.

## Create your Pages repository

1. Create a new repository named `<username>.github.io` (replace `username` with your GitHub username).
2. Choose visibility and enable **Add README**.
3. Open **Settings** in the new repository.
4. Go to **Pages**.
5. Under **Build and deployment**:
   - Set **Source** to **Deploy from a branch**.
   - Select the branch/folder to publish.
6. Commit content updates to `README.md` (or other pages) and wait up to ~10 minutes for publishing.

## Customize title and description

Edit `_config.yml` and add `title` and `description`, for example:

```yaml
theme: jekyll-theme-minimal
title: Your site title
description: Short site description
```

Commit the change; Pages will republish automatically.

## Next steps

- Add more pages/content using Jekyll.
- Configure a custom domain if needed.
- Keep your Pages branch protected if publishing project documentation.
