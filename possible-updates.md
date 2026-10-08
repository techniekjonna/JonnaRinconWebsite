# Possible Updates

Review van de repo op code-kwaliteit, security en performance/UX. Elk punt: wat + waar + waarom. Groepen = prioriteit. Implementatie nog niet uitgevoerd — dit is een werklijst.

---

## 🔴 Must fix voor live / productie

1. **Firestore security rules ontbreken.** Er is geen `firestore.rules` en geen `firebase.json` in de repo. Zonder rules is elke collection (users, orders, supportMessages, beats, tracks, …) world-readable én world-writable.
   - *Actie:* maak `firestore.rules` + `firebase.json` aan. Default deny. Sta `read` alleen toe op documenten met `status == 'published'` voor publieke collecties; `write` alleen voor admins / eigenaar.
   - *Deploy:* `firebase deploy --only firestore:rules`.

2. **Checkout accepteert ruwe kaartgegevens.** `src/pages/CheckoutPage.tsx:150–161` heeft `<input name="cardNumber">`, `expiryDate`, `cvv`. Dit raakt PCI-DSS en mag nooit op de client staan.
   - *Actie:* vervang door Stripe Elements of Mollie Checkout. Frontend krijgt alleen een token, server maakt de betaling.

3. **Order-totaal is client-controlled.** `src/contexts/CartContext.tsx` → `getTotalPrice()` somt `item.price` uit localStorage. Een aanvaller kan prijzen aanpassen vóór checkout.
   - *Actie:* server recomputeert totalen uit product-IDs (Firebase Function of backend). Client stuurt alleen IDs + qty.

4. **Role escalation mogelijk.** Zonder rule #1 kan een gebruiker `/users/{uid}.role` op `admin` zetten via Firestore SDK. `ProtectedRoute` vertrouwt `user.role` uit Firestore.
   - *Actie:* Firebase Custom Claims voor rol, óf rule die `request.resource.data.role == resource.data.role` afdwingt.

5. **Nextcloud share-tokens staan in publieke Firestore-documenten.** `audioUrl`, `artworkUrl`, `stemsUrl` worden rauw gerendeerd op `/tracks`, `/remixes`, `/releases`, `/shop/*`. Gedeeltelijk opgelost in `TrackDetailModal` (nu via `/download/:id`).
   - *Actie:* splits elke collectie in `*_public` (veilige velden) en `*_private` (met tokens). Rules geven private alleen aan geauthenticeerde kopers/admin. Download via gated `/download/:id` flow.

---

## 🟠 Strongly recommended

6. **`urlUtils.toDirectUrl` valideert hostname niet.** Een admin die `javascript:alert(1)` plakt, komt daarmee in een `<img src>` / `<a href>`.
   - *Actie:* whitelist toegestane domeinen (`cloud.internedata.nl`, `firebasestorage.googleapis.com`, …). Ongeldige URL → lege string.

7. **Geen code-splitting.** Nul `React.lazy`-aanroepen in de codebase; één JS-chunk van ~1,6 MB (345 KB gzip).
   - *Actie:* `lazy()` per zone — `pages/admin/*`, `pages/artist/*`, `pages/customer/*`, `pages/shop/*`. Verwachte winst: 30–40% kleinere initial bundle.

8. **Vite bundlingsstrategie.** Gebruik `build.rollupOptions.output.manualChunks` om `firebase/*`, `lucide-react` en route-groepen te splitsen.

9. **Zware afbeeldingen in `/public`.** `DJ Screenshot 3-2-26.png` (3,4 MB), `IMG_0316.heic` (3,3 MB — niet browser-native), `Vlog Foto.png` (2,8 MB), `Menu Foto 1.png` (2,4 MB), `JEIGHTENESIS.jpg` (2,3 MB).
   - *Actie:* converteer naar WebP met JPG-fallback, `loading="lazy"` op niet-kritieke images, verplaats grote assets naar Firebase Storage of Cloudinary.

10. **251 TypeScript errors bij strict-mode.** Strict staat al aan (goed) maar de errors zijn echte bugs.
    - *Quick wins:* unused imports en vars.
    - *Structureel:* `Beat`, `Art`, `Remix`, `Edit` types missen velden als `views`, `likes`, `sortOrder` die wel gebruikt worden.
    - *Duplicaten:* `CartItem` en `Track` bestaan dubbel in `lib/types.ts` en `lib/firebase/types.ts`. Consolideer naar één bron.

---

## 🟡 Nice to have

11. **Service-worker cache-naam is handmatig.** `public/service-worker.js` → `const CACHE_NAME = 'jonna-rincon-v1.5.0'`. Elke deploy vereist een handmatige bump.
    - *Actie:* inject build-hash via Vite `define`, of migreer naar `vite-plugin-pwa` / Workbox.

12. **`GlobalAudioPlayer` gebruikt module-level mutable store + handmatige subscribers.** Foutgevoelig (stale closures, cleanup), slecht te debuggen.
    - *Actie:* migreer naar Zustand (~1 KB). API blijft `useStore()` in componenten; cleanup is automatisch.

13. **278+ herhaalde "glass card" Tailwind-patronen** (`bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-3xl`).
    - *Actie:* extract `<GlassCard>`-component, of Tailwind `@apply` in `index.css`.

14. **Nul tests.** Geen vitest-config, geen test-bestanden.
    - *Actie:* minimaal smoke-tests op: login, cart → checkout-totaal, `toDirectUrl`-transform.

15. **Admin-tabellen overflow op mobiel.** `BeatsPage.tsx`, `EditsPage.tsx`, `ServicesPage.tsx` hebben `<table>` zonder `overflow-x-auto`-wrapper.

16. **Modals hebben geen focus-trap.** `TrackDetailModal`, `BeatDetailModal` — keyboard-gebruikers kunnen uit de modal tabben.
    - *Actie:* `focus-trap-react`, of eigen 10-regel `useEffect` die Tab-focus cycled.

17. **`alt=""` in `MusicPlayer.tsx`** (regels 131, 175, 261, 288). Of betekenisvolle `alt` toevoegen, of `role="presentation"` als puur decoratief.

---

## 🧹 Cleanup (geen gedragsverandering)

18. **Ongebruikte dependency: `@supabase/supabase-js`.** Wordt alleen geïmporteerd in `src/lib/supabase.ts` en `src/lib/initSupabase.ts` — beide dood code. `npm uninstall @supabase/supabase-js` + twee bestanden verwijderen.

19. **13 Markdown-bestanden in repo-root.**
    - *Houden:* `README.md`, `ADMIN_SETUP.md`, `README-ICONS.md`.
    - *Mergen naar één:* `ALBUM_FEATURE_INTEGRATION.md`, `ALBUM_IMPLEMENTATION_CHECKLIST.md`, `ALBUM_IMPLEMENTATION_SUMMARY.md`, `ALBUM_QUICKSTART.md` → `ALBUM_IMPLEMENTATION.md`.
    - *Mergen naar één:* `CUSTOM_BUTTONS_INTEGRATION.md`, `CUSTOM_BUTTONS_OVERVIEW.txt`, `CUSTOM_BUTTONS_QUICK_REF.md`, `CUSTOM_BUTTONS_SETUP.md`, `README_CUSTOM_BUTTONS.md` → `CUSTOM_BUTTONS.md`.
    - *Weg:* `IMPLEMENTATION_COMPLETE.md`, `TEST_INSTRUCTIONS.md` (stale checklists).
    - *Archiveren of verwijderen:* `ALBUM_TRACKS_PAGE_INTEGRATION.tsx`, `INTEGRATION_EXAMPLE.tsx` (voorbeelden in repo-root, horen in `src/` of in docs).

20. **`src/App.admin.tsx`** importeert `Suspense` zonder gebruik en `./pages/admin/LoginPage` die niet bestaat; refereert `BackgroundToolPage` zonder import. Of het dossier is dead code — opruimen.

21. **`src/App.main.tsx`** importeert `CustomerFreeDownloads` en `ArtistFreeDownloads` maar mount ze niet (comment zegt: "Free Downloads removed - merged into My Products"). Verwijder de imports.

22. **Dubbele Tracks-pagina's.** `src/pages/TracksPage.tsx` (1.221 regels) en `src/pages/admin/TracksPage.tsx` (1.327 regels) bevatten overlappende filter- en grouping-logica.
    - *Actie:* extract `useTrackFilters`-hook + `<TrackCard>`-component; laat beide pagina's die delen.

---

## Appendix — validatiecommando's

```bash
# TS-errors
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -c "error TS"

# Grote assets
du -k public/*.jpg public/*.png public/*.heic 2>/dev/null | sort -rn | head

# Supabase usage
grep -rln "@supabase/supabase-js" src

# XSS-checks (verwacht: geen output)
grep -rE "dangerouslySetInnerHTML|innerHTML\s*=" src

# Glass-card pattern count
grep -rhoE "bg-white/\[0\.04\]" src --include='*.tsx' | wc -l
```
