---
title: "FE-0003: MapLibre with VietMap raster tiles"
status: accepted
date: 2026-11-04
related: [../routing-and-access.md]
---

# FE-0003: MapLibre with VietMap raster tiles

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
`/stalls` needs a real map. VietMap's `tm` style points at vector tiles that MapLibre cannot parse: they are not plain Mapbox vector tiles, so every tile fails with "Unimplemented type".

## Decision
Use `maplibre-gl` with VietMap raster tiles (`maps/tiles/tm/{z}/{x}/{y}@2x.png`) and `VITE_VIETMAP_TILEMAP_KEY`. The page is lazy loaded, and the map worker is set with `setWorkerUrl` because Vite pre-bundling breaks the default worker path.

## Consequences
- The map works with no extra SDK.
- Labels are part of the image and do not rotate or restyle.
- Without a key the map shows a plain background and the pins still work.

## Alternatives considered
- The VietMap GL SDK for vector tiles: extra dependency for styling this page does not need.
