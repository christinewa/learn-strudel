# Learn Strudel

An interactive course: 10 lessons from `s("bd")` to rebuilding a real song, with live Strudel editors,
a per-cycle "X-ray" of what the code plays, quizzes, a step-grid → code tool, tap tempo and a sound browser.

    python3 -m http.server 8642 -d docs
    open http://localhost:8642

- Needs internet: drum/instrument samples stream from Strudel's sample repos on first use.
- Progress, edited code and capstone notes are saved in the browser's localStorage.
- Click **Vim** in any code box to switch all code boxes to Vim keybindings. The choice is saved in the browser; press `Esc` for normal mode and `i` for insert mode.
- `?selftest` (http://localhost:8642/?selftest) evaluates every snippet in `lessons.js` and reports errors.
- Content lives in `lessons.js`; `app.js` renders it. `vendor/` is `@strudel/repl` 1.3.0 (AGPL-3.0).

## GitHub Pages

This folder is the Pages root: Settings → Pages → Deploy from a branch → `main` / `/docs`.
`.nojekyll` turns off Jekyll processing; all paths are relative, so it works under `/<repo>/`.
