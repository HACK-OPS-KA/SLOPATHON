# Slopario API Documentation

## Base URL
```
http://localhost:6969
```

---

## 1. REST-Endpunkt

### `GET /api/session` — Session erstellen

Erstellt eine neue Spiel-Session mit der angegebenen Bildschirmgröße. Der Game-Loop startet noch nicht – erst wenn das erste Display sich verbindet.

**Query-Parameter (optional):**

| Parameter | Typ | Optional | Default | Beschreibung |
|-----------|-----|----------|---------|-------------|
| `width` | `u32` | Ja | `1000` | Breite der Spielwelt |
| `height` | `u32` | Ja | `800` | Höhe der Spielwelt |

Beispiel: `GET /api/session?width=1920&height=1080`

Die Map-Größe kann nach dem Erstellen nicht mehr geändert werden.

**Response (JSON):**
```json
{
  "session_id": "ea66b2b5-6215-4ec7-8edb-523bcbd2e96b",
  "map_width": 1920,
  "map_height": 1080
}
```

---

## 2. WebSocket-Endpunkte

### 2.1 Controller WebSocket
```
GET /ws/controller/{session_id}
```

**Richtung:** Bidirektional (aber hauptsächlich Controller → Backend)

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

#### Nachricht vom Backend an Controller (Plain Text, newline-delimited):

Jede Nachricht ist eine einzelne Textzeile, terminiert mit `\n`.

| Nachricht | Bedeutung |
|-----------|-----------|
| `lobby` | Wird direkt nach Verbindungsaufbau gesendet. Controller ist in der Lobby |
| `ingame` | Das Spiel beginnt. Controller kann jetzt Richtungen senden |
| `message: {text}` | Allgemeine Nachricht, z.B. `message: rank 3` oder `message: game over` |

**Empfang auf dem Controller (JavaScript Beispiel):**
```javascript
ws.onmessage = (event) => {
  const lines = event.data.split('\n').filter(l => l);
  for (const line of lines) {
    if (line === 'lobby') { /* in lobby */ }
    else if (line === 'ingame') { /* game started */ }
    else if (line.startsWith('message: ')) {
      const msg = line.slice(9);
      // z.B. "rank 3" oder "game over"
    }
  }
};
```

#### Ablauf:
1. Controller verbindet sich mit `ws://localhost:6969/ws/controller/{session_id}`
2. Backend sendet `lobby\n`
3. Sobald Display "Spiel starten" klickt: Backend sendet `ingame\n`
4. Controller sendet regelmäßig `{"direction": {"x": 0.5, "y": -0.3}}`
5. Optional: `{"switch_color": true}` für zufälligen Farbwechsel
6. Bei Tod: Backend sendet `message: rank 3\n`, Verbindung wird geschlossen

---

### 2.2 Display WebSocket
```
GET /ws/view/{session_id}
```

**Richtung:** Server → Client (30fps Broadcast)

#### Nachricht 1 — Init (einmalig bei Verbindungsaufbau):
```json
{ "type": "init", "map_width": 1920, "map_height": 1080 }
```

#### Nachricht 2+ — GameState (JSON, ~30x pro Sekunde):
```json
{
  "players": [
    {
      "id": "player_1",
      "x": 215.3,
      "y": 341.7,
      "size": 20.0,
      "color": "#ff0000"
    },
    {
      "id": "player_4",
      "x": 502.1,
      "y": 612.9,
      "size": 20.0,
      "color": "#ffff00"
    }
  ],
  "food": [
    { "x": 125.4, "y": 89.2, "size": 7.2 },
    { "x": 456.1, "y": 723.8, "size": 5.8 },
    { "x": 834.0, "y": 156.3, "size": 9.1 }
  ]
}
```

#### PlayerInfo:
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `string` | Eindeutige Spieler-ID, z.B. `"player_1"` |
| `x` | `number` | X-Position in der Spielwelt |
| `y` | `number` | Y-Position in der Spielwelt |
| `size` | `number` | Durchmesser des Spielers |
| `color` | `string` | HTML RGB Hex, z.B. `"#ff0000"` |

#### FoodInfo:
| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `x` | `number` | X-Position |
| `y` | `number` | Y-Position |
| `size` | `number` | Größe/Durchmesser |

#### Ablauf:
1. Display verbindet sich mit `ws://localhost:6969/ws/view/{session_id}`
2. Backend sendet sofort die Init-Nachricht: `{"type":"init","map_width":1920,"map_height":1080}`
3. Backend sendet anschließend ~30 GameState-Updates pro Sekunde
4. Display rendert die aktuelle Spielwelt basierend auf den Daten

---

## 3. Kommunikationsmatrix

| Von → An | Medium | Format | Richtung | Frequenz |
|----------|--------|--------|----------|----------|
| Controller → Backend | WebSocket Text | JSON `{direction?, switch_color?}` | Hauptsächlich Input | Bei Eingabe |
| Backend → Controller | WebSocket Text | Plain `"lobby"`/`"ingame"`/`"message: ..."` + `\n` | Events | 2-3x pro Session |
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
  color: string,           // HTML RGB Hex, z.B. "#ff0000"
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
  map_width: number,       // Z.B. 1920
  map_height: number,      // Z.B. 1080
  player_count: number     // Anzahl verbundener Controller
}
```

---

## 5. Beispiel-Ablauf (komplett)

```
1. Display:         GET  /api/session?width=1920&height=1080
                    → { session_id: "abc-123", map_width: 1920, map_height: 1080 }

2. Display:         WS   /ws/view/abc-123
                    ← { "type": "init", "map_width": 1920, "map_height": 1080 }
                    ← { "players": [...], "food": [...] }  (30fps)

3. Controller (5x): WS   /ws/controller/abc-123
                    ← "lobby\n"

4. Display klickt "Spiel starten":
                    → (Lobby-Phase endet)
                    → Controller ← "ingame\n"
                    → Game-Loop startet

5. Controller:      WS   → {"direction":{"x":0.5,"y":-0.3}}

6. Controller:      WS   → {"switch_color":true}

7. Backend → Display:     GameState (aktualisiert alle 33ms)

8. Backend → Controller:  "message: rank 5\n" (wenn Spieler stirbt)
```

---

## 6. Server starten
```bash
cd backend
cargo run
# Läuft auf http://0.0.0.0:6969