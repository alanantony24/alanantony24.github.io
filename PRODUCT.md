# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary:** Technical recruiters, engineering hiring managers, and university professors/instructors evaluating front-end engineering competence, UI/UX craft, and problem-solving capability.
- **Secondary:** Peers, classmates, and tech community members exploring coursework demos, side builds, and interactive experiments.

## Product Purpose
Serves as Alan Antony James's personal digital presence and developer portfolio. It demonstrates hands-on front-end design and software engineering craft, presenting selected software projects, personal interests, and academic coursework for Web Application Development 2 (WAD2) in an engaging, production-grade format.

## Positioning
A distinctive, high-craft hybrid portfolio that seamlessly integrates university coursework (WAD2 assignments) with personal software builds and creative identity—demonstrating both rigorous engineering execution and creative interactive flair without sacrificing usability or clarity.

## Operating Context
- Deployed statically via GitHub Pages (`alanantony24.github.io`) using GitHub Actions.
- Viewed on modern desktop and mobile browsers across a wide spectrum of screen sizes and input methods.
- Evaluators and visitors typically spend 1–3 minutes scanning selected projects, reviewing code or live demos, checking student credentials, and verifying technical and design aptitude.

## Capabilities and Constraints
- **Stack & Architecture:** Vanilla HTML5, CSS3, and JavaScript; fully static with no runtime build dependency, served directly from the repository root.
- **Routing & Sub-modules:** Root `index.html` represents the primary portfolio landing; coursework deliverables (e.g. `fanpage/`, future assignments) reside in dedicated subdirectories linked from the main site.
- **Deployment:** Zero-friction deployment to GitHub Pages.
- **Performance:** Lightweight, fast initial paint, responsive across mobile and desktop.

## Brand Commitments
- **Owner:** Alan Antony James (SMU Student, Design + Code focus).
- **Voice:** Direct, thoughtful, capable, unpretentious, and craft-focused ("turning rough concepts into something people actually enjoy using").
- **Visual Identity:** Existing implementation features an interactive Windows XP desktop environment (window management, start menu, taskbar, system clock, boot screen, ASCII art elements). Future design decisions may refine, preserve, or deliberately redesign this visual world per explicit direction.

## Evidence on Hand
- Current root homepage at [`index.html`](index.html).
- Shared styles at [`assets/css/style.css`](assets/css/style.css) and script at [`assets/js/script.js`](assets/js/script.js).
- WAD2 coursework module in [`fanpage/`](fanpage/).
- Real project narratives: "Campus Connect", "Flux Studio", and "After Hours".
- Real interest areas: Sketching, Coffee & Thinking, Music, Rides & Walks.

## Product Principles
1. **Credible Engineering & Craft:** Every interaction, animation, and responsive behavior must feel deliberate, responsive, and robust—never a fragile gimmick.
2. **Immediate Clarity:** Core value—who Alan is, what he builds, and proof of capability—must be scannable and accessible within seconds.
3. **Harmonious Coexistence:** Coursework assignments and personal showcases must feel integrated into a unified digital home rather than disjointed silos.
4. **Resilient Performance:** Zero heavy framework dependencies, minimal load overhead, fast page rendering, and standard semantic HTML under the hood.

## Accessibility & Inclusion
- Full keyboard navigation for interactive widgets (windows, buttons, carousels).
- Meaningful ARIA labels, live regions, and semantic landmark elements.
- Adherence to WCAG 2.1 AA standards for color contrast, touch target sizes (minimum 44x44px), and reduced-motion preferences (`prefers-reduced-motion`).
