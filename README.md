# PlaySol Dashboard

Eigenstaendiges Dashboard fuer PlaySol mit:

- `web/`: Vite + React
- `api/`: Express API
- `shared/`: gemeinsame Konfiguration und Validierung
- `supabase/`: SQL-Migration fuer Tabellen und Trigger

## Schnellstart

1. `npm.cmd install`
2. `Copy-Item web\\.env.example web\\.env`
3. `Copy-Item api\\.env.example api\\.env`
4. Werte fuer Supabase und Free-Game-Link eintragen
5. `npm.cmd run dev`

## Wichtige Regeln

- Supabase ist die einzige Auth-Authority
- Frontend macht Signup/Login/OAuth direkt mit `supabase-js`
- API validiert nur den Supabase Bearer Token
- `Free Game` ist ein konfigurierter Frontend-Link und oeffnet im neuen Tab
- Match-Stats starten leer, bis das eigentliche Spiel spaeter nach Supabase schreibt
