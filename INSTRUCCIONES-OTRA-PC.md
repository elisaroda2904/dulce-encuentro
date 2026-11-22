# Guía para publicar «Dulce Encuentro» desde tu otra PC y tu otro correo

Este paquete ya contiene la versión corregida (incluyendo el reproductor de video al pulsar **«Ver video del local»** y el **Menú QR** descargable) completamente limpia de cuentas anteriores.

---

## 1. Cómo verla de manera local en la nueva PC (opcional)
*(Requiere tener instalado **Node.js**).*
1. Descomprime esta carpeta `dulce-encuentro-web`.
2. Abre una terminal dentro de `dulce-encuentro-web` y ejecuta:
   ```powershell
   node server.mjs
   ```
3. Abre **`http://localhost:4173`** en tu navegador.

> Antes de publicar en cualquier opción, puedes editar `config.js` (o `google-sites/config-google-sites.js` si usas la Opción B) para agregar tu número de **WhatsApp**, **horarios**, **Facebook**, **Instagram** y **Google Forms**.

---

## 2. Elige cómo publicarla vinculada a tu nuevo correo

### Opción A (Recomendada — más simple y con video directo): GitHub Pages + Google Sites («Por URL»)
1. Inicia sesión en **[github.com](https://github.com)** con tu nuevo correo y crea un repositorio **público** y vacío (por ejemplo `dulce-encuentro`).
2. Sube el contenido de esta carpeta `dulce-encuentro-web` (asegurándote de que en la raíz del repositorio queden `index.html`, `styles.css`, `app.js`, `config.js`, `.nojekyll`, `vendor/` y `assets/`). No es necesario subir `server.mjs`, `build-google-sites.mjs` ni `google-sites/`.
3. En tu repositorio entra a **Settings** (*Configuración*) → **Pages** (*Páginas*) → en **Branch** elige **`main`** y carpeta **`/ (root)`** → **Save** (*Guardar*).
   - En ~1 minuto tendrás tu enlace: `https://TU-NUEVO-USUARIO.github.io/dulce-encuentro/`
4. Entra a **[sites.google.com](https://sites.google.com)** con tu nuevo correo:
   - Crea un **Sitio en blanco** → pestaña **Páginas** → botón **`+`** → **Incorporación de página completa** (*Full page embed*).
   - Pulsa **Agregar incorporación** → pestaña **Por URL** → pega tu enlace `https://TU-NUEVO-USUARIO.github.io/dulce-encuentro/` → elige **Página completa** → **Insertar**.
   - Márcala como página principal (`⋮` → **Establecer como página principal**) y elimina la página vacía anterior.
   - Pulsa **Publicar** arriba a la derecha.
5. **Hazlo visible para todos:** arriba a la derecha haz clic en el ícono de compartir (**👤+**) y cambia **Sitio web publicado** de *Restringido* a **Público**.
6. *(Para el Menú QR)*: una vez sepas tu enlace final de Google Sites, ponlo en `urlPublica` dentro de `config.js` y actualiza `config.js` en GitHub (o escríbelo directo en el recuadro del modal **Menú QR** antes de descargar la tarjeta PNG).

---

### Opción B (Todo en tu nueva cuenta de Google): Google Drive + YouTube + «Incorporar código»
*(Requiere **Node.js** instalado en la nueva PC).*

1. **Sube las fotos a tu nuevo Google Drive:**
   - Crea una carpeta (por ejemplo `Dulce Encuentro Web`), compártela como **«Cualquier persona con el enlace → Lector»** y sube las **5 fotografías**: `local-real.png`, `cafe-masitas.png`, `sandwiches-bebidas.png`, `espacio-infantil.png` y `familia-compartiendo.png`.
2. **Sube el video `assets/dulce-encuentro-promo.mp4` a YouTube** con tu nuevo correo en visibilidad **Oculto / No listado** (*Unlisted*) o **Público** *(no uses el visor `/preview` de Drive porque Google Sites lo bloquea dentro de «Incorporar código»; el código de esta web soporta enlaces de YouTube directamente)*.
3. Abre **`google-sites/config-google-sites.js`** y reemplaza:
   - Los 5 enlaces de Drive en `medios` por los nuevos enlaces de tu otro Drive.
   - `videoPromo` por el enlace de tu video en YouTube.
   - `urlPublica` por tu futuro enlace de Google Sites (y tus datos de WhatsApp/redes si deseas).
4. En la terminal, dentro de `dulce-encuentro-web`, ejecuta:
   ```powershell
   node build-google-sites.mjs
   ```
   Esto generará el archivo único **`google-sites/dulce-encuentro-google-sites.html`** (< 100 KB).
5. En el **Google Sites** de tu nuevo correo: **Páginas → `+` → Incorporación de página completa → Agregar incorporación → Incorporar código**, pega todo el contenido de `google-sites/dulce-encuentro-google-sites.html` → **Siguiente → Insertar → Publicar**, y en **👤+** cambia **Sitio web publicado** a **Público**.