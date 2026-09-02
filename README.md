# WAD2 Coursework Portfolio

This repository contains the coursework for Web Application Development 2.

## Structure

- [index.html](index.html) — the main personal portfolio homepage
- [assets/css/style.css](assets/css/style.css) — shared styling for the portfolio
- [assets/js/script.js](assets/js/script.js) — shared JavaScript for the portfolio
- [week1/fanpage.html](week1/fanpage.html) — Week 1 fanpage assignment
- [week1/css/fanpage.css](week1/css/fanpage.css) — Week 1 page styling
- [week1/js/fanpage.js](week1/js/fanpage.js) — Week 1 interaction logic

## GitHub Pages

GitHub Pages serves the repo root directly, so the portfolio homepage is the site homepage.

To publish:

1. Push this repository to GitHub.
2. Open the repository settings.
3. Go to Pages.
4. Set the source to GitHub Actions.
5. Use the included workflow file in [.github/workflows/pages.yml](.github/workflows/pages.yml).

This keeps the portfolio as the main site and allows each assignment to live in its own folder without conflicting with the root site.
