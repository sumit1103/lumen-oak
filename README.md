# Lumen & Oak Interiors

Plain static site: HTML, CSS and native ES modules. No Vite, no npm, no build step.

```
index.html          page + import map for three.js
css/style.css
js/main.js          entry point
js/config.js        Supabase + enquiry settings (edit here)
js/room3d.js, rooms.js, site-ui.js, inquiry-form.js
assets/             logo, favicon
vendor/three/       three.js 0.160.0 (local copy)
supabase/migrations SQL for the enquiries table
```

## Run locally
Modules need a server (not file://). From this folder:

    python3 -m http.server 8000      # then open http://localhost:8000

## Deploy on GitHub Pages
Repo -> Settings -> Pages -> Source: GitHub Actions (workflow included),
or Source: "Deploy from a branch" -> main -> / (root). All paths are relative,
so it works at https://USER.github.io/REPO/.
