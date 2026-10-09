# ConnecFriend

A responsive, locally simulated social network built with HTML, Bootstrap 5, Bootstrap Icons, and plain JavaScript. It uses a translucent violet, cyan, and coral palette on a softly tinted canvas with a compact icon rail and dashboard layout.

## Run it

From this folder, start the zero-dependency Node server:

```sh
node server.js
```

Open [http://localhost:3000](http://localhost:3000). Alternatives are `npx serve` and `python -m http.server 3000`. Opening `index.html` with `file://` also supports localStorage features. Cross-browser live chat needs the Node server because a `file://` page cannot connect to its WebSocket endpoint.

## Live chat across browser profiles

`server.js` serves the site and runs a WebSocket endpoint at `/socket`. Messages from connected members arrive immediately in other browser profiles and are saved in `messages.db.json`, so recipients also receive them after reconnecting. Open the site in two separate browser profiles, sign into different accounts, and start a conversation from **New message** or a profile's **Message** shortcut. Each browser stores its account and social data locally; the server stores chat delivery history for cross-profile messaging.

## Demo credentials

All seeded accounts use password `friend123`:

| Username | Name |
| --- | --- |
| maya | Maya Chen |
| omar | Omar Farooq |
| sana | Sana Malik |
| zain | Zain Ahmed |
| noor | Noor Ali |
| adam | Adam Khan |
| lina | Lina Shah |
| hadi | Hadi Raza |
| iman | Iman Yusuf |
| ray | Ray Hassan |

## Feature checklist

- Login validation, seeded members, last-login updates, session persistence, protected pages, and logout.
- Friend feed with the author's own new posts, audience filtering, post deletion, all-friend and selected-friend posts, time labels, and one-switchable reaction per member. The reaction detail action lists member names and reaction types.
- Friend list ordered by most recent login; editable personal profile; other profiles, friend invites, messages, and saved 1-3 ratings.
- Requests sent, accepted, declined, and cancelled; incoming and outgoing counts; ignore-list add/remove. Adam's ignore list contains Maya to demonstrate a blocked request.
- Private conversations with any member, unread counts, timestamps, quick emoji replies, new-message selection, profile shortcuts, and live cross-browser delivery.
- Shared navigation, live badges, action toasts, empty states, responsive layout, shared page footers, and a persistent light/dark theme toggle.

## Design and storage notes

The logo is an original inline SVG connection mark, and avatars are generated from initials with locally assigned colors. There are no external image URLs. The interface uses a violet, cyan, and coral palette, Inter typography, translucent glass surfaces, ambient pastel light (with violet and teal glows in dark mode), and short entrance and hover animations. Page changes use a brief fade, and lists and rating controls animate when they appear or update; reduced-motion preferences are respected. On the login page, selecting a demo member capsule fills that account's username and password. Friend ratings are displayed directly below the profile banner for easy access. A shared search field in the header finds members and news visible to the signed-in user; Ctrl/Command+K focuses it. Its light/dark toggle follows the system preference until a person chooses a theme, then saves that choice in localStorage. Bootstrap CSS and Bootstrap Icons are loaded from CDN. Browser state is kept in a versioned localStorage object and initialized from `assets/js/data.js`. The active account is saved in that state, so switching seeded users in the same browser shows each user's own relationships and messages.
