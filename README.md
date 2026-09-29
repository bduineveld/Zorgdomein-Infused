# Zorgdomein Infused

Chromium MV3-extensie met snelkoppelingen naar ZorgDomein-formulieren. Werkt
**standalone** en kan gekoppeld worden aan een HIS-extensie (nu: Bricks Infused).
Voorheen onderdeel van Bricks Infused.

## Features

- **Snelkoppeling-knop** rechtsboven op ZorgDomein-formulieren (supply-matcher,
  protocol, choose-product, referral): voeg de huidige pagina toe als snelkoppeling.
  Op `/referral/transaction/` wordt de voorafgaande productkeuze-URL gebruikt
  (nooit de patiëntspecifieke transaction-URL) en verschijnt een knop
  **Productkeuze** om terug te gaan.
- **Dashboard**: snelkoppelingen bij "Direct naar diagnostiek" (uit te zetten).
- **Popup**: snelkoppelingen direct openen zonder HIS.
- **HIS-koppeling**: na een SSO-start vanuit het HIS landt ZorgDomein op het
  dashboard; deze extensie stuurt dan binnen 60 s door naar het gekozen formulier.

## Opslag (`chrome.storage.sync`)

| Key | Betekenis |
|-----|-----------|
| `zorgdomeinLinks` | `[{ name, link, episodelijstNodig }]` — `link` is pad na `https://www.zorgdomein.nl` |
| `zorgdomeinDashboardLinks` | snelkoppelingen tonen op dashboard (default `true`) |
| `lastClickedLink` / `lastClickedTimestamp` | formulier dat na dashboard-landing geopend wordt |
| `pendingChooseProductUrl` / `…Timestamp` | laatste productkeuze-pagina (voor transaction-pagina's) |

`episodelijstNodig` is HIS-specifiek (Bricks laat dan eerst de episodelijst kiezen);
andere HIS'en mogen het negeren.

## API voor HIS-extensies (`chrome.runtime.sendMessage(ZDI_ID, msg)`)

Alleen extensies in `manifest.json → externally_connectable.ids` mogen berichten sturen.

| `type` | Parameters | Antwoord |
|--------|-----------|----------|
| `zorgdomein.ping` | – | `{ ok, version }` |
| `zorgdomein.getLinks` | – | `{ ok, links, dashboardLinks }` |
| `zorgdomein.setPendingLink` | `link` | `{ ok }` — roep aan vlak vóór je HIS de SSO-POST naar `zdlogin` doet |
| `zorgdomein.openLink` | `link` | `{ ok }` — opent het formulier direct in een nieuwe tab (zonder SSO/patiënt) |
| `zorgdomein.importLinks` | `links`, `onlyIfEmpty` (default `true`) | `{ ok, imported }` |
| `zorgdomein.openOptions` | `focusTarget?` | `{ ok }` |

Typische flow vanuit een HIS:

1. `getLinks` → toon de snelkoppelingen in het verwijsmenu.
2. Bij klik: `setPendingLink(link)` → start de eigen ZorgDomein-verwijzing (SSO).
3. ZorgDomein opent het dashboard → Zorgdomein Infused navigeert naar het formulier.

## Nieuw HIS koppelen

1. Voeg het ID van de HIS-extensie toe aan `externally_connectable.ids` (en aan `manifest.ids.md`).
2. Zet in de HIS-extensie het ID van Zorgdomein Infused (dev: `dickknaonoknjbjcfmoafmkimkldeaef`).
3. Herlaad beide extensies.

## Installeren (developer mode)

1. `edge://extensions` → Developer mode aan → **Load unpacked** → deze map.
2. Controleer dat het ID `dickknaonoknjbjcfmoafmkimkldeaef` is (komt uit `key`).

## Migratie vanuit Bricks Infused

Bricks Infused kopieert bij de eerste succesvolle verbinding eenmalig zijn oude
`zorgdomeinLinks` hierheen (alleen als deze extensie nog geen snelkoppelingen heeft).
