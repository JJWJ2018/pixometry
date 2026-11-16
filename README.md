# Pixometry — Assets 10 panel-plugin

Prototype voor de webinar met Pixometry (3 dec 2026). Selecteer een beeld in Assets 10,
kies in het paneel een bewerking (bv. *Enhance*). Het origineel gaat naar Pixometry en
het resultaat komt terug in Assets 10:
- **zelfde bestandstype** → nieuwe versie van hetzelfde beeld, de vorige versie blijft bewaard;
- **ander bestandstype** (bv. JPEG → PNG, WebP, PDF) → nieuw bestand naast het origineel,
  met `_pixometry` achter de naam;
- **uitknippen** (kanalen in `SAVE_AS_NEW` in `config.js`) → altijd een nieuw bestand,
  ook als het type gelijk blijft. Een uitsnede is een ander beeld, geen beter origineel.

Zelfde opzet als de andere plugins in deze map: statisch paneel (geen build-stap) plus
een klein tussenstuk op Vercel dat de sleutels geheim houdt.
SDK: `@woodwing/a10-client-sdk@1.0.4`.

## Hoe het werkt
1. Paneel vraagt het tussenstuk welke Pixometry-kanalen er zijn en toont ze als knoppen.
2. Klik op een knop → `api/process`: haalt het origineel op uit Assets 10 en stuurt het
   naar het gekozen Pixometry-kanaal. Geeft een opdrachtnummer terug.
3. Paneel vraagt elke 2,5 seconde via `api/status` of Pixometry klaar is.
4. Klaar → `api/status` haalt het resultaat op en zet het in Assets 10 als nieuwe versie
   of als nieuw bestand (zie hierboven).
5. Paneel toont voor/na.

## Bestanden
- `index.html` — het paneel. `?demo=1` draait met voorbeelddata, zonder Assets of Pixometry.
- `config.js` — welke kanalen als knop, knopteksten, bestandstypen.
- `api/channels.js` — lijst met kanalen.
- `api/process.js` — origineel ophalen en insturen.
- `api/status.js` — status opvragen, resultaat terugzetten als nieuwe versie.
- `lib/shared.js` — inloggen bij Assets, aanroepen van Pixometry.
- `vercel.json` — geeft de functies 60 seconden de tijd.

## Inrichten
1. **Pixometry API-sleutel:** app.pixometry.com → API Keys → *New Key*. Wordt één keer getoond.
2. **Assets API-sleutel:** Management Console → API.
3. **GitHub-repo → Vercel** (preset *Other*, geen build).
4. **Vercel env-vars:**
   - `ASSETS_API_BASE` — regio-endpoint, bv. `https://api-eu-west-1.swivle.com`
   - `ASSETS_API_KEY`
   - `PIXOMETRY_API_KEY`
   - optioneel `PLUGIN_SECRET` (zelfde waarde in `config.js`), `ALLOWED_CHANNELS`,
     `PIXOMETRY_API_BASE` (standaard `https://app.pixometry.com`), `NEW_FILE_SUFFIX`
     (standaard `_pixometry`)
5. **Test het tussenstuk:** open `https://<vercel-url>/api/channels` → lijst met kanalen.
6. **Management Console → Plug-ins → Panel plug-ins → `+`:** naam `Pixometry`, URL de
   Vercel-URL, icoon (nog toe te voegen: `icon.png`, 20×20), Enable, rechten per usergroup.

## Bronnen
- Pixometry REST API (API-pagina in de app): `POST /api/v1/process` (velden `file`,
  `channel`), `GET /api/v1/jobs/{id}`, `GET /api/v1/jobs/{id}/download`,
  `GET /api/v1/channels`. Sleutel in de header `X-Api-Key`.
- Assets 10 API (api.swivle.com): `GET /api/asset/{id}/original` (download) en
  `POST /api/asset/{id}/original` met `file` + `createVersion` ("Create a version for an
  asset using multi-part POST"). Nieuw bestand: `POST /api/asset` (geeft een `uploadUrl`
  terug) en daarna het bestand met `PUT` naar die `uploadUrl`.

## Getest
Alleen tegen een nagebootste Assets- en Pixometry-API (16 nov 2026): kanalen ophalen,
verkeerd secret → 401, onbekend kanaal → 400, insturen, wachten, nieuwe versie opslaan,
ander bestandstype of uitknippen → nieuw bestand naast het origineel.
In de echte omgeving werkt *Enhance* als nieuwe versie (16 nov 2026, PNG-testbeeld).
**Opslaan als nieuw bestand is nog niet getest tegen de echte systemen.**

## Te verifiëren in de echte omgeving
1. **Antwoord van Pixometry op een opdracht.** Opgelost op 16 nov 2026: de status staat
   in `results[0].status` (waarde `completed`), niet bovenaan in het antwoord. De eerste
   versie keek op de verkeerde plek en bleef daardoor hangen. Hoe een mislukte opdracht
   eruitziet (`failed`? `error`?) is nog niet gezien; de code herkent beide.
2. **Nieuwe versie met een API-sleutel.** Mag de API-sleutel `POST /api/asset/{id}/original`
   aanroepen, en is de vorige versie daarna terug te vinden in de versiegeschiedenis?
3. **Bestandsnaam van het resultaat.** De code leest het type uit de download
   (`Content-Disposition` / `Content-Type`). Geeft Pixometry dat niet mee, dan wordt het
   type niet gecontroleerd.
4. **Preview na de nieuwe versie.** Het paneel wacht 3 seconden en haalt dan de nieuwe
   preview op. Is die nog niet klaar, dan staat bij "After" nog het oude beeld of niets.
5. **Grote bestanden.** Het tussenstuk houdt het hele bestand in het geheugen en heeft
   60 seconden. Test met een groot origineel (bv. 50 MB TIFF).

## Extra knoppen
`EXTRA_BUTTONS` in `config.js` maakt een knop van een bestaand kanaal plus vaste
instellingen voor die ene opdracht. De eerste is *Ready for web*: kanaal *Image
Enhancement*, langste zijde maximaal 2000 pixels, JPEG op kwaliteit 0,92. Die
instellingen zijn het voorbeeld van de API-pagina van Pixometry. Het resultaat wordt
altijd een nieuw bestand naast het origineel, met `_web` achter de naam.

## Bestandstype van het resultaat
Het kanaal *Enhancement+background removal* staat in Pixometry ingesteld op een TIFF met
lagen. Dat gaf bij de eerste test een bestand van 167 MB. Het paneel vraagt daarom per
opdracht om een PNG (`OVERRIDES` in `config.js`, veld `output.fileFormat`). De waarde
`PNG` is niet uit de documentatie overgenomen maar afgeleid: de API-pagina noemt alleen
`JPEG`, en in de kanalen staan `TIFF` en `ORIGINAL`. Komt er toch een TIFF terug, zet dan
het bestandstype in het kanaal zelf in Pixometry om, of vraag John naar de juiste waarde.

## Bekende beperkingen
- **Nieuw bestand heeft geen metadata van het origineel.** Het krijgt alleen de naam
  `<naam>_pixometry.<type>` in dezelfde map. Er is geen koppeling tussen origineel en
  nieuw bestand, behalve de naam.
- **Geen herkomst vastgelegd.** In de metadata staat niet dat de versie door Pixometry is
  gemaakt (zie punt 9 in `sdk-verbeterpunten.md`).
- **Het tussenstuk weet niet wie de gebruiker is.** Het werkt met één API-sleutel en kan
  dus elk beeld vervangen waar die sleutel bij mag, ongeacht de rechten van de gebruiker
  in het paneel. `PLUGIN_SECRET` houdt alleen toevallige bezoekers van de URL tegen; de
  waarde is in de browser leesbaar. Prima voor een demo, niet voor productie.
- **Eén beeld tegelijk.** Bij meerdere geselecteerde beelden pakt het paneel het eerste.
- **Elke klik kost Pixometry-credits** (1 of 2 per beeld, staat op de knop).
