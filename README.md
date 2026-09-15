# Database Normalization Visualiser

An interactive, single-page walkthrough that carries one Campus Connect student database from UNF through 5NF. Each stage appends below the last, with seeded sample data, highlighted dependencies, explicit primary-key labels, responsive HTML tables, and keyboard-friendly controls.

## Run locally

No installation or build is needed. Open `index.html` directly, or serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Push this repository to GitHub, with `index.html`, `styles.css`, and `app.js` at the repository root.
2. Open the repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/(root)` folder, then click **Save**.
5. GitHub will publish the site at `https://<your-name>.github.io/<repository>/`.

Every asset path is relative, so the app works correctly from a GitHub Pages project subpath. It makes no runtime network calls and works offline.
