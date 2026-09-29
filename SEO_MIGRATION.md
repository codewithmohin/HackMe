# HackMe SEO: current work and migration plan

## A. Improvements in the current static prototype

HackMe is currently plain HTML, CSS and JavaScript. There is no build system, server, database or account service. The browser demo stores users, hackathons, teams, submissions and scores in localStorage.

The root landing page and the explanatory Explore page are the only pages included in the XML sitemap. They describe the browser demo and do not claim that local records are public listings.

The create, join, login, dashboard, host, hackathon detail, teams, submission, judging and leaderboard pages have unique titles and descriptions but use noindex,follow. This keeps query-string pages and personal demo state out of search results. noindex is a crawl/indexing hint, not an access-control mechanism; the prototype is not private or secure.

LocalStorage hackathons are not stable URLs, shared records or server-rendered pages. They therefore do not receive Event structured data or sitemap entries. The seed event is labeled as a sample in the user interface. There are no content images in the current app; the only image asset added here is the site favicon.

## B. Improvements that require Next.js and Supabase/PostgreSQL

The public directory and detail pages should read from persistent, server-side data and return complete HTML on the first response. Do not build indexable event pages from client-only localStorage.

### Target routes

| Route | Purpose and indexing rule |
| --- | --- |
| /hackathons | Server-rendered directory of published public events; index when it has useful listings. |
| /hackathons/[slug] | Server-rendered, stable event detail page for a published public event. |
| /hackathons/ai | Curated AI category page with its own useful description and canonical URL. |
| /hackathons/student | Curated student event page. |
| /hackathons/online | Curated online event page. |
| /hackathons/india | Curated India event page. |
| /projects/[slug] | Public project entry only when the author or organizer has published it. |
| /organizers/[slug] | Public organizer profile with a stable name, description and linked published events. |
| /guides/[slug] | Editorial guide with reviewed, original content and internal links. |

Do not publish a category route merely because a filter exists. Give it an indexable page only when it has a useful introduction and enough public records; otherwise return noindex or omit it from navigation and the sitemap.

### Data and rendering requirements

- Store hackathons, organizers, projects and guides in PostgreSQL. Give each public record a unique, immutable slug and publication status.
- Separate draft, published, completed and cancelled states from a public visibility setting. Only public, published records should be served without authentication.
- Render titles, descriptions, canonicals, Open Graph tags, breadcrumbs and visible page content on the server from the same database record.
- Use Supabase Row Level Security and server-side authorization for private records and mutations. Never expose drafts, submissions, scores, participant data or personal dashboards in the public sitemap.
- Generate sitemap.xml from the canonical published records. Exclude drafts, private events, filtered query strings, empty category pages and noindex routes. Keep robots.txt open to the public pages and point it at that sitemap.
- Return a real 404 for unknown or unpublished slugs. Add a not-found page that links back to the directory, without making the error page canonical to the home page.
- Build share-card images from real event or site branding and add descriptive alt text for meaningful in-page images. Do not add alt text to decorative images; mark them decorative instead.

### Structured data

- Keep Organization and WebSite entities tied to stable site facts. Add a logo or social profiles only after those public assets and accounts exist.
- Add BreadcrumbList to nested directory, event, project, organizer and guide pages where the visible page includes matching breadcrumbs.
- Add Event JSON-LD only to a public, persistent, published event detail page. Derive name, description, startDate, endDate, eventStatus, eventAttendanceMode, location, organizer and valid offers from the stored record. Omit unknown fields; do not create schema for drafts, browser-only demos, canceled events without accurate status, or placeholder data.
- Make each event JSON-LD url and @id match that page's canonical URL. Keep the rendered content and structured data consistent.
