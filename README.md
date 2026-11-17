# Project Orchid | Singapore shophouse edition

This is a build-free static website for GitHub Pages. The homepage uses a layered street scene with independently animated traffic and pedestrians. The ground-floor entrance goes to the research library and the upstairs window goes to the investment philosophy. The scene respects reduced-motion settings and has a pause control.

## Publish in a new repository

1. Extract the ZIP using **Extract All** in Windows File Explorer.
2. Sign in to GitHub and create a **Public** repository named `orchid-shophouse` (or another name you prefer). Turn on **Add README** when creating the repository.
3. In the repository, choose **Code → Add file → Upload files**. Upload the files from the extracted folder. Every file is at the top level, with `index.html` alongside `style.css`, `street.js`, and `shophouse.webp`. Commit to `main`. If prompted to create a pull request, merge it into `main`.
4. Open **Settings → Pages**. Set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then click **Save**. If the settings show that the site is already building from `main` and Save is greyed out, proceed to the next step.
5. Wait for the **pages build and deployment** run under **Actions** to succeed. In **Settings → Pages**, click **Visit site**. For a repo named `orchid-shophouse`, the address will look like `https://YOUR-USERNAME.github.io/orchid-shophouse/`.
6. Check the animated street, **Research library**, **Upstairs office**, and the sample PDF download.

[GitHub Pages publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Publish research

1. Export a report as a PDF and upload it to the repository's top level. Use a short filename such as `company-report.pdf`.
2. Open `research.json` on GitHub, click the pencil icon, and replace the sample with the following template. Edit the fields, including a unique `id` and the exact PDF filename.

```json
[
  {
    "id": "company-report",
    "title": "Your report title",
    "company": "Company name",
    "date": "2026-11-17",
    "summary": "Write two to four sentences on your research and what the reader will find in the report.",
    "pdf": "company-report.pdf"
  }
]
```

3. Commit to `main`. After GitHub Pages redeploys, check the new card and PDF link. For more reports, add more entries before the closing square bracket and put a comma between entries. To add a cover, upload it to the top level and add optional `cover` and `coverAlt` fields.
4. Upload only research and files you want to share publicly.

## Local preview

The design and street animation open directly in a browser. Serve it over HTTP to try the research library and downloads. From the extracted folder, run `python -m http.server 8000` and visit `http://localhost:8000` if you have Python installed.
