# Pilot Seniority — Interactive What‑If (List + Best View)

## What this site does
- Enter a Seniority #, choose Base/Seat, and see your hypothetical **Rank / Total / Base %**.
- See a **Best Base by Seat** table (sorted by best percentage).
- Browse the **full pilot list** for the chosen base/seat with **your row highlighted** and auto-scrolled into view.

## Publish on GitHub Pages
1. Create a new repo and upload `index.html`, `script.js`, `styles.css`, `data.json` to the repo root.
2. In Settings → Pages, set Source: *Deploy from a branch* (root).
3. Wait for the build, then open the Pages URL.

## Updating rosters
Regenerate `data.json` from your CSV (A320 filtered). All logic is client-side.
