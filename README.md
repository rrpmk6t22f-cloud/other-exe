# OTHER.EXE

Hatch Pip, a non-binary digital organism. Look after them, talk, find work, visit friends, and discover what they choose to become. The main game works offline after the first successful load.

## Run locally

Requires Node.js 22.13 or newer.

```sh
npm ci
npm test
npm run build
npm run preview
```

Use the production preview to test the service worker. `npm run dev` supports live editing without the worker. In Safari on iOS, open the game and choose **Share → Add to Home Screen**. In supported desktop and Android browsers, use **Settings → Install OTHER.EXE** or the browser’s install action.

## Play

Hatch, feed Pip, and open **New File** from the Home panel. Choose **Next day** when ready. Care and conversation are free. Visits, shifts, and games use activity points. The **Archive** contains the journal, saved readings, and the ending choices.

Saves live in IndexedDB on the current browser. **Settings → Export save** creates a portable JSON backup. Conversation history is stored locally by default and can be cleared or turned off separately from reading preferences. Outside and weather are opt-in. The game asks for a city from a fixed list and does not access the device’s location.

## Deploy

Set **Settings → Pages → Source** to **GitHub Actions**. The Pages workflow runs the game tests, builds the relative-path PWA, and publishes `dist`. No application data or provider secret is required to build.

For a Supabase weather proxy, deploy `supabase/functions/other-exe-weather` with JWT verification. Set these GitHub Actions repository variables before building:

- `VITE_WEATHER_ENDPOINT` — HTTPS URL of the deployed function.
- `VITE_WEATHER_ANON_KEY` — the project’s public legacy anon JWT, used by the function’s gateway. Never put a service-role key or provider secret in a Vite variable.

Without those variables, the browser uses Open-Meteo directly. Weather is an estimated condition with an attributed source and timestamp. The supplied function allows the production GitHub Pages origin and the documented local preview ports. Change its origin allowlist for other hosts.

## Release scope

This build includes five short acts with eight reachable endings, six untimed mini-games, eight contacts and jobs, ten locations, procedural evolution, a small wardrobe and room collection, and an attributed reading shelf. Conversation uses authored, state-aware local replies. The specification’s longer content library, AI-generated portraits, live news and economic feeds, cloud saves, and push notifications are future work.

A separately operated live conversation gateway can be enabled with `VITE_MIND_ENDPOINT`. It must accept the JSON request defined in `src/Conversation.tsx` and return an object with a bounded `utterance` string. Live use is opt-in and falls back to local dialogue on errors. The gateway operator is responsible for authentication, rate limits, provider access, and moderation. No live model gateway is deployed with this version.

Design is adapted from the supplied Figma reference. The living signal is drawn at runtime. Typography uses Google Fonts with system fallbacks. UI icons are from Lucide.

## The habitat

Tap or brush across Pip to pet them. Hold for a moment, or choose **Soothe**, to help them settle. **Catch sparks** starts a three-target game with a daily wellbeing bonus. The habitat also works with the keyboard.

The incubator previews six procedural families and four temperaments. Once hatched, the seed keeps that creature’s palette, silhouette, and disposition consistent across the game. Earlier saves retain the original appearance. Open **Settings → Switch habitat** to hatch a second creature while keeping your first save. Evolution can export a procedural PNG portrait of the current or previewed form.

## Dev Mode

Open **Settings → Open Dev Mode**, or add `?dev=1` to the game URL. **Quick hatch** skips the incubator. **Rehatch** starts over with a new character in the isolated test save. **Exit Dev Mode** returns to the regular game and its original save.
