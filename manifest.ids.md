# Extensie-ID's bij `manifest.json`

`manifest.json` is strikt JSON — **geen** `//`-comments mogelijk.
Dit bestand documenteert de ID's in `externally_connectable.ids`.

| ID | Extensie | Omgeving |
|----|----------|----------|
| `ebannlcfcakhaekmbeogkphbijghepbe` | **Bricks Infused** | Edge Add-ons (store, productie) |
| `mogkemhemedhcmoopdlfdjklgjlhgmnp` | **Bricks Infused** | Dev (unpacked + `key` in Bricks-manifest) |
| `maggacdmiigkoockdjdekdkflfochgbl` | **Bricks Infused** | Dev (unpacked zónder `key`; ID afgeleid van het pad in OneDrive — actueel dev-ID) |

## Deze extensie (Zorgdomein Infused)

| ID | Omgeving |
|----|----------|
| `dickknaonoknjbjcfmoafmkimkldeaef` | Dev (unpacked + `key` in dit manifest; private key: `../Zorgdomein Infused.pem`) |
| `mehfpjeblkfbobhimioegkflielbcemk` | Edge Add-ons (store, productie) — ook in `Bricks Infused/background.js` → `ZORGDOMEIN_EXT_IDS_PROD` |

Vóór store-upload: verwijder de dev-ID's van Bricks uit `externally_connectable.ids`
(alleen `ebannlcfcakhaekmbeogkphbijghepbe` laten staan) en haal `key` uit het manifest.
