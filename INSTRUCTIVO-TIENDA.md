# TCG TIMER — Guía de instalación y uso (PC de la tienda)

Guía completa para que cualquier persona pueda instalar y usar el programa en la PC de la tienda y la Smart TV.

---

## Parte 1 — Requisitos (hacer UNA sola vez)

### Paso 1: Instalar Node.js

1. En la PC de la tienda, abrí el navegador (Chrome o Edge).
2. Entrá a **https://nodejs.org**
3. Tocá el botón verde que dice **"LTS"** (el de la izquierda). Se baja un archivo tipo `node-v20.x.x-x64.msi`.
4. Abrí ese archivo descargado.
5. En el instalador: **Next → Next → Next → Install**.
6. Si pide permiso (ventana azul "¿Querés permitir...?"), tocá **Sí**.
7. Cuando diga "Completed", tocá **Finish**.
8. **Reiniciá la PC** (para que Windows reconozca Node.js).

> No hace falta instalar nada más. Es la única instalación de todo el proceso.

---

## Parte 2 — Llevar el programa a la PC (hacer UNA sola vez)

### Opción A) Con un pendrive (recomendada si no hay Git)

1. En tu PC, buscá la carpeta del proyecto (`timer`).
2. **BORRÁ la subcarpeta `node_modules` si está** (es pesada y se regenera sola).
3. Copiá la carpeta `timer` entera al pendrive.
4. En la PC de la tienda, pegá la carpeta en el Escritorio.

### Opción B) Clonando desde GitHub (si esa PC tiene Git)

```bash
git clone https://github.com/jesuscisco/tcgtimer.git
```

Esto crea la carpeta `timer` en la carpeta donde estés parado.

---

## Parte 3 — Primera puesta en marcha (hacer UNA sola vez)

### Paso 1: Abrir el puerto del firewall (como Administrador)

1. Entrá a la carpeta `timer`.
2. **Clic DERECHO** sobre `start-server.bat`.
3. Elegí **"Ejecutar como administrador"**.
4. Si aparece "¿Querés permitir que esta app haga cambios?" → tocá **Sí**.
5. La primera vez puede tardar unos minutos (instala componentes). Vas a ver texto blanco sobre fondo negro (una "consola"):
   - `Instalando componentes por primera vez...`
   - Líneas en inglés terminando en `added X packages`.
   - Al final: `TCG Timer ready on http://0.0.0.0:3000`
6. Cuando termines, cerrá esa ventana. El puerto ya quedó abierto para siempre.

> Esto del "administrador" es SOLO la primera vez. Después no hace falta.

---

## Parte 4 — El día del torneo (operación normal)

### Encender el programa

1. Doble clic en **`start-server.bat`**. Aparece la ventana negra — **¡NI LA CIERRES!**.
2. En la ventana negra vas a ver:

   ```
   La TELE tiene que entrar a esta direccion:
     [ http://192.168.X.X:3000/display ]
   ```

3. A los pocos segundos se abre **solo** el navegador de la PC con el **Panel de Control** (`http://localhost:3000/admin`).

### Encender la tele

1. En la tele (Smart TV), abrí el **navegador**.
2. Escribí exactamente la dirección del recuadro: `http://192.168.X.X:3000/display`.
3. Enter → aparece el display del timer esperando.

> ⚠️ La tele y la PC tienen que estar **en el mismo WiFi**.

### Usar el programa

- En el **Panel de Control** (PC): elegí el perfil, tocá **Start**, y el timer corre en la tele.
- Los cambios de apariencia (header, colores, tamaño) se aplican solos en la tele después de ~1 segundo.

### Apagar todo

1. Doble clic en **`stop-server.bat`** → se detiene el servidor.
2. (O simplemente cerrá la ventana negra.)

---

## Parte 5 — Problemas comunes y solución rápida

| Síntoma | Qué hacer |
| --- | --- |
| "No se pudo instalar. Revisa que haya internet" | La PC no tiene internet. Conectá el WiFi y probá de nuevo. |
| El navegador se abre pero dice error / no carga | Esperá 5 segundos y apretá **F5** (o Ctrl+R). |
| La tele no carga el display | Verificá que: (1) la ventana negra siga abierta, (2) la tele esté en el MISMO WiFi, (3) escribiste bien `:3000/display`. |
| El panel dice "Desconectado" | Tocá **F5** en el navegador del panel. |
| El puerto 3000 "está ocupado" al prender | Clic derecho en `stop-server.bat` → Ejecutar como administrador → y después abrí de nuevo `start-server.bat`. |
| Se cerró la ventana negra por accidente | Volvé a doble clic en `start-server.bat` (y F5 en tele y panel). |

---

## Parte 6 — Datos que se pierden y que no

- ✅ Se guardan solos: perfiles, configuración de apariencia, timers en curso (en la carpeta `data` de la PC).
- ✅ Se puede hacer backup: exportás perfiles desde el panel.
- ❌ Si borrás la carpeta `timer`, se pierde todo lo guardado.