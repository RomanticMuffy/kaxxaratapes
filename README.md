  <h1>KAXXARATAPES</h1>
  <p><strong>Open-source alternative to <a href="https://untitled.stream/">untitled.stream</a> — runs entirely in your browser.</strong></p>

  <img width="100%" alt="Captura de tela 2026-04-25 131850" src="https://github.com/user-attachments/assets/5849d8e8-8b25-49c2-a30a-0be34486dd2a" />


</div>

---

## About

**Kaxxara Tapes** is a free, open-source catalog manager for music producers. It is directly inspired by and modeled after [untitled.stream](https://untitled.stream/), with the goal of providing an equivalent experience without accounts, subscriptions, or cloud dependency.

All files are stored locally via `localStorage` and `IndexedDB`. Nothing is uploaded to any server.

<div align="center" style="margin: 20px 0;">
  <a href="https://romanticmuffy.github.io/kaxxaratapes/" target="_blank">
    <img src="https://img.shields.io/badge/OPEN_KAXXARA_TAPES-launch_the_app_→-6366f1?style=for-the-badge" alt="Open App">
  </a>
</div>

---

## Features

- **Album management** - create, duplicate, archive, and delete albums, each with its own tracklist, cover art, and status
- **In-browser audio playback** - preview tracks via the Web Audio API, no external player needed
- **Cover art upload & crop** - built-in image editor using React Easy Crop
- **Drag & drop reordering** - reorder albums and tracks without friction
- **Dark / Light mode** - follows system preference, with a manual toggle
- **Multi-language** - English and Portuguese, open for community contribution
- **Full mobile support** - fully responsive layout with touch-friendly controls, works seamlessly on smartphones and tablets

---

## Visual Design

The UI is heavily inspired by [untitled.stream](https://untitled.stream/). The goal is a clean, catalog-focused layout that keeps audio and metadata front and center.

<center>
<img width="100%" alt="chrome-capture-2026-04-25 (1)" src="https://github.com/user-attachments/assets/2b689ad5-add1-4f63-a778-1379ed476aef" />
</center>

---

## Data Storage

Everything runs locally. No cloud, no accounts.

<div align="center">
<table>
  <thead>
    <tr>
      <th>Data</th>
      <th>Engine</th>
      <th>Persists</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Project names, status, settings</td>
      <td><code>localStorage</code></td>
      <td>across sessions</td>
    </tr>
    <tr>
      <td>Audio files &amp; cover art</td>
      <td><code>IndexedDB (idb)</code></td>
      <td>across sessions</td>
    </tr>
  </tbody>
</table>
</div>

> Files go straight from your folder to the browser's local cache — nothing touches a network.

---

## Tech Stack

<div align="left" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
  <img src="https://img.shields.io/badge/-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/-Tailwind_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/-Zustand-000000?style=for-the-badge&logo=react&logoColor=white" alt="Zustand">
  <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/-IndexedDB-FF6B35?style=for-the-badge&logo=databricks&logoColor=white" alt="IndexedDB">
  <img src="https://img.shields.io/badge/-React_Easy_Crop-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Easy Crop">
  <img src="https://img.shields.io/badge/-Mobile_Ready-34D399?style=for-the-badge&logo=android&logoColor=white" alt="Mobile Ready">
</div>

---

## Run Locally

```bash
git clone https://github.com/RomanticMuffy/kaxxaratapes.git
npm install
npm run dev
```

Open [http://localhost:XXXX](http://localhost:XXXX) in your browser.

---

## Deployment

Deploys automatically to **GitHub Pages** via **GitHub Actions** on every push to `main`.

---

## Contributing

Fork it, extend it. Contributions are open — anyone with React/JavaScript knowledge can clone and add features.
