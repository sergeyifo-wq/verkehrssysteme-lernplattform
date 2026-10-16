# Verkehrssysteme Lernplattform

Selbstlern-Website zur Lehrveranstaltung **Grundlagen der Verkehrssysteme** (WS 2026/27, berufsbegleitende Gruppe), im Neon-Brass-Design.

**Live:** https://sergeyifo-wq.github.io/verkehrssysteme-lernplattform/

## Bereiche

| Bereich | Inhalt |
|---|---|
| Lernen | 35 Kapitel (Teile A–G) im **Detail**- oder **Kompakt**-Modus, mit Abbildungen, Rechenbeispielen und Check-up-Fragen pro Kapitel |
| Videos | 7 vertonte Erklärvideos (ca. 17 min) mit Untertiteln, Kapitelmarken und klickbarem Transkript |
| Test | Schnelltest, Kapitel-Test, Fehler-Training und 60-Minuten-Klausur-Simulation (100 Punkte, Note nach Notenschlüssel) |
| Glossar | 125 Fachbegriffe mit Suche und A–Z-Filter |
| Karteikarten | 166 Karten mit 3D-Flip-Animation und Leitner-System |
| Labor | 11 interaktive Werkzeuge: Netz-Rechner, Fundamentaldiagramm, Modal-Split-Explorer, Elastizität, Volumengewicht, Auslastung, Reisezeit, Affinitäts-Matcher, Freiheiten der Luft, zwei Lernspiele |

## Technik

- Statische Seite ohne Build-Schritt: `index.html`, Vanilla JavaScript, CSS.
- Inhalte in `data/*.js`, Videos in `videos/` (MP4 + WebVTT).
- Lernfortschritt wird nur lokal im Browser gespeichert (`localStorage`).
- Lokal starten: `python -m http.server 8000` im Projektordner, dann `http://localhost:8000` öffnen.

## Quellen

Foliensatz *Grundlagen der Verkehrssysteme* (WS 2026/27) und Kummer, S. (2010): *Einführung in die Verkehrswirtschaft*, 2. Aufl., ergänzt um recherchierte Aktualisierungen (Stand 10/2026). Lernhilfe ohne Gewähr; maßgeblich ist der Prüfungsstoff der Lehrveranstaltung.
