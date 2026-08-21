# Diagramas de arquitectura

Esta carpeta es el "buzón" para los diagramas SVG que se muestran en la
página **Arquitectura** del portal (`/pages/arquitectura/index.html`).
No hay build ni subida por servidor: simplemente copiás los archivos aquí
y agregás una entrada en el manifiesto.

## Cómo agregar un diagrama nuevo

1. Copia el archivo `.svg` del diagrama a esta carpeta.
   (Opcional) Copia también un `.txt` con el código fuente que generó ese
   SVG (Mermaid, draw.io, PlantUML, etc.) — es solo una reserva descargable,
   no se muestra ni se interpreta.
2. Abre `/assets/data/architecture-diagrams.js` y agrega un objeto nuevo al
   arreglo `architectureDiagrams`, con el mismo nombre de archivo que
   copiaste. Ahí mismo hay un ejemplo comentado con el formato exacto.
3. Guarda y recarga la página — no hace falta ningún otro paso.

## Convención de nombres

Usa minúsculas y guiones, y el mismo nombre para el `.svg` y el `.txt` del
mismo diagrama, por ejemplo:

```
diagrama-red-servidores.svg
diagrama-red-servidores.txt
```
