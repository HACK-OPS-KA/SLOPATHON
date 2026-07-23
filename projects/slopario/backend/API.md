# Slopario API Documentation

## Base URL
```
http://localhost:6969
```

---

## 1. REST-Endpunkt

### `GET /api/session` — Session erstellen
Erstellt eine neue Spiel-Session. Der Game-Loop (30fps) startet automatisch.

**Response (JSON):**
```json
{
  "session_id": "ea66b2b5-6215-4ec7-8edb-523bcbd2e96b"
}
```

**Verwendung:**
- **Display-Frontend**: Ruft diesen Endpunkt (z.B. nach dem Laden von `/`) auf und leitet den Benutzer auf eine Session-Seite weiter
- **Controller-Frontend**: Erhält die Session-ID über den Display-Session-Link (URL-Pfad)

---

## 2. WebSocket-Endpunkte

### 2.1 Controller WebSocket
```
GET /ws/controller/{session_id}
```

**Richtung:** Client → Server (unidirektional Input)

#### Nachricht vom Controller an Backend (JSON):
```json
{
  "direction": { "x": 0.5, "y": -0.3 },
  "switch_color": true
}
```

| Feld | Typ | Optional | Beschreibung |
|------|-----|----------|-------------|
| `direction` | `{ x: number, y: number }` | Ja | 2D-Vektor der relativen Bewegung. Wertebereich typischerweise [-1..1] |
| `switch_color` | `boolean` | Ja | `true` = Spielerfarbe wechseln |

Beide Felder sind optional. Es kann auch nur ein Feld gesendet werden:
```json
{ "direction": { "x": 1.0, "y": 0.0 } }
```
```json
{ "switch_color": true }
```

#### Nachricht vom Backend an Controller (Plain Text):
| Text | Zeitpunkt |
|------|-----------|
| `"start"` | Direkt nach Verbindungsaufbau (Mock: sofort) |
| `"rank: {position}"` | Bei Tod des Spielers, z.B. `"rank: 3"` (dritter Platz) |

Es gibt keine weiteren Nachrichten vom Backend an den Controller.

#### Ablauf:
1. Controller verbindet sich mit `ws://host:3000/ws/controller/{session_id}`
2. Backend sendet `"start"` (bei echter Logik: erst wenn Display "Spiel starten" klickt)
3. Controller sendet regelmäßig `{"direction": {"x": 0.5, "y": -0.3}}`
4. Optional: `{"switch_color": true}` für zufälligen Farbwechsel
5. Bei Tod: Backend sendet `"rank: 2"`, Verbindung wird geschlossen

---

### 2.2 Display WebSocket
```
GET /ws/view/{session_id}
```

**Richtung:** Server → Client (30fps Broadcast)

#### Nachricht vom Backend an Display (JSON, ~30x pro Sekunde):
```json
{
  "map_width": 1000.0,
  "map_height": 800.0,
  "players": [
    {
      "id": "player_1",
      "x": 215.3,
      "y": 341.7,
      "size": 20.0,
      "color": [255, 0, 0]
    },
    {
      "id": "player_4",
      "x": 502.1,
      "y": 612.9,
      "size": 20.0,
      "color": [255, 255, 0]
    }
  ],
  "food": [
    { "x": 125.4, "y": 89.2, "size": 7.2 },
    { "x": 456.1, "y": 723.8, "size": 5.8 },
    { "x": 834.0, "y": 156.3, "size": 9.1 }
  ]
}
```

#### Felder:

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `map_width` | `number` | Weltbreite in Spiel-Einheiten |
| `map_height` | `number` | Welthöhe in Spiel-Einheiten |
| `players` | `PlayerInfo[]` | Alle lebenden Spieler (gestorbene werden entfernt) |
| `food` | `FoodInfo[]` | Alle aktuellen Nahrungsobjekte |

#### PlayerInfo:
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `string` | Eindeutige Spieler-ID, z.B. `"player_1"` |
| `x` | `number` | X-Position in der Spielwelt |
| `y` | `number` | Y-Position in der Spielwelt |
| `size` | `number` | Durchmesser des Spielers |
| `color` | `[number, number, number]` | RGB-Farbe `[r, g, b]` jeweils 0-255 |

#### FoodInfo:
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `x` | `number` | X-Position |
| `y` | `number` | Y-Position |
| `size` | `number` | Größe/Durchmesser |

#### Ablauf:
1. Display verbindet sich mit `ws://host:3000/ws/view/{session_id}`
2. Backend sendet sofort den initialen Game-State
3. Backend sendet anschließend ~30 Updates pro Sekunde
4. Display rendert die aktuelle Spielwelt basierend auf den Daten

---

## 3. Kommunikationsmatrix

| Von → An | Medium | Format | Richtung | Frequenz |
|----------|--------|--------|----------|----------|
| Controller → Backend | WebSocket Text | JSON `{direction?, switch_color?}` | Unidirektional Input | Bei Eingabe |
| Backend → Controller | WebSocket Text | Plain `"start"` oder `"rank: N"` | Seltene Events | 2x pro Session max. |
| Backend → Display | WebSocket Text | JSON `GameState` | Unidirektional Output | ~30 Hz |
| Display → Backend | — | — | Keine Kommunikation | — |

---

## 4. Datenstrukturen (Backend-Intern)

### Player
```typescript
{
  id: string,              // Z.B. "player_1"
  x: number,               // Position X
  y: number,               // Position Y
  size: number,            // Start: 20.0
  color: [number, number, number],  // RGB [r, g, b]
  direction?: {            // Aktuelle Richtung vom Controller
    x: number,             // -1.0 bis 1.0
    y: number              // -1.0 bis 1.0
  },
  alive: boolean,          // Lebt der Spieler noch?
  score: number            // Anzahl gefressener Einheiten
}
```

### Food
```typescript
{
  id: number,              // Eindeutige ID
  x: number,               // Position X
  y: number,               // Position Y
  size: number             // Größe, z.B. 5.0 - 10.0
}
```

### Session
```typescript
{
  id: string,              // UUID v4
  state: "Waiting" | "Running",
  map_width: number,       // Z.B. 1000.0
  map_height: number,      // Z.B. 800.0
  player_count: number     // Anzahl verbundener Controller
}
```

---

## 5. Beispiel-Ablauf (komplett)

```
1. Display:         GET  /api/session               → { session_id: "abc-123" }
2. Display:         WS   /ws/view/abc-123          → GameState (30fps)
3. Controller (5x): WS   /ws/controller/abc-123    → "start"
4. Controller:      WS   → {"direction":{"x":0.5,"y":-0.3}}
5. Controller:      WS   → {"switch_color":true}
6. Backend → Display:     GameState (aktualisiert alle 33ms)
   ...
7. Backend → Controller:  "rank: 5" (wenn Spieler stirbt)
```

---

## 6. Server starten
```bash
cd backend
cargo run
# Läuft auf http://0.0.0.0:6969
