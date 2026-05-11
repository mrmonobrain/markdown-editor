# Markdown Editor — Projektkonventionen

## Projektübersicht

Standalone Markdown-Editor als Single-Page Web-App. Öffnen/Bearbeiten/Speichern von `.md`-Dateien mit Live-Preview, visuellem Tabellen-Editor und PDF-Export. Kein Build-Step, kein Framework — reines HTML/CSS/JS.

## Tech-Stack

- **HTML/CSS/JS** — keine Dependencies, kein Bundler
- **Markdown-Parsing:** marked.js (CDN)
- **Fonts:** Euclid Circular A (Light, Regular, Medium, Semibold, Bold) als lokale OTF-Dateien
- **File I/O:** File System Access API (Chrome/Edge), Fallback Upload/Download
- **PDF-Export:** `window.print()` in neuem Fenster mit eigenem Print-Stylesheet
- **Deployment:** Statisch auf Netlify (oder lokal `index.html` öffnen)

## Dateistruktur

```
index.html        — HTML-Struktur: Toolbar, Editor, Preview, Tabellen-Modal
style.css         — Gesamtes Styling inkl. @font-face, Markdown-Preview, Modal
editor.js         — Gesamte Logik (IIFE): File-Handling, Formatting, Tabellen-Editor, Preview
fonts/            — Euclid Circular A (.otf, 5 Gewichte)
```

## Konventionen

### Code-Stil
- **Vanilla JS** — kein Framework, keine Module, alles in einer IIFE
- **Single Quotes**, 2 Spaces Einrückung
- Keine externen Dependencies ausser marked.js (CDN)
- CSS Custom Properties für alle Farben/Abstände (`--bg`, `--accent`, etc.)

### Sprache
- **UI-Sprache:** Deutsch (Schweizer Schreibweise: "ss" statt "ß")
- Code-Kommentare: Deutsch oder Englisch, sparsam
- Variablen/Funktionen: Englisch

### Design
- **Light Mode only** (vorerst)
- Font: Euclid Circular A für UI und Preview, Monospace für Editor-Textarea
- Farbpalette: Neutralgrau + Blau-Akzent (`--accent: #228be6`)
- Moderne UX: subtile Schatten, Micro-Animationen, abgerundete Ecken
- Toolbar: Icon + Label für Datei-Aktionen, nur Icons für Formatierung

### Architektur-Prinzipien
- **Alles in 3 Dateien** — kein Aufsplitten in Module solange nicht nötig
- Kein Build-Step — muss direkt im Browser laufen
- File System Access API mit graceful Fallback auf Input/Download
- PDF-Export via Print-Fenster mit eigenem Stylesheet (A4, Euclid Circular A)

## Features

- [x] Datei öffnen / speichern (File System Access API)
- [x] Upload / Download Fallback
- [x] Split-View Editor + Live-Preview (togglebar)
- [x] Formatting-Toolbar (Bold, Italic, Strikethrough, H1–H3, Listen, Blockquote, Code, Link, Bild, HR)
- [x] Visueller Tabellen-Editor (Zeilen/Spalten, Ausrichtung, Doppelklick zum Bearbeiten)
- [x] PDF-Export (Ctrl+P)
- [x] Keyboard Shortcuts (Ctrl+O, S, B, I, K, P)
- [x] Synchronized Scroll
- [x] Unsaved-Changes-Warnung
- [x] Browser-Kompatibilitäts-Hinweis

## Wichtige Befehle

```bash
# Lokal testen (beliebiger Static Server)
npx serve . -l 3456
# oder einfach index.html im Browser öffnen

# Netlify Deploy (Verzeichnis = Root)
# Build Command: (leer)
# Publish Directory: .
```

## Deployment

- **Netlify:** Repo-Root als Publish Directory, kein Build Command nötig
- **Lokal:** `index.html` direkt im Browser öffnen (File System Access API braucht Chrome/Edge)
