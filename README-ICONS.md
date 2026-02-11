# PWA Icon Generator

## Quick Start

Als je Logo.png in de `public` folder hebt geplaatst, voer dan de volgende stappen uit:

### Optie 1: Met Sharp (Aanbevolen)

```bash
# Installeer sharp
npm install sharp

# Genereer de iconen
node generate-icons.js
```

### Optie 2: Online Tool

Als je geen Node packages wilt installeren, gebruik dan:
1. Open https://realfavicongenerator.net/
2. Upload je Logo.png
3. Download de gegenereerde iconen
4. Hernoem ze naar:
   - icon-152x152.png
   - icon-192x192.png
   - icon-512x512.png
5. Plaats ze in de `public` folder

### Optie 3: Handmatig met Photoshop/GIMP

Maak drie versies van Logo.png:
- 152x152 pixels → save as `icon-152x152.png`
- 192x192 pixels → save as `icon-192x192.png`
- 512x512 pixels → save as `icon-512x512.png`

Plaats alle bestanden in de `public` folder.

## Verificatie

Na het genereren van de iconen, controleer of de volgende bestanden bestaan:
- ✅ public/Logo.png
- ✅ public/icon-152x152.png
- ✅ public/icon-192x192.png
- ✅ public/icon-512x512.png

De manifest.json en index.html zijn al geconfigureerd om deze bestanden te gebruiken!
