# Mis Préstamos

Página web para registrar préstamos (nombre, teléfono, monto, porcentaje, fecha del préstamo y fecha de vencimiento). Los datos se guardan en una hoja de Google.

- **Página:** https://thepantera.github.io/ManuPrestamos/
- **Hoja de Google:** la conecta el código de `apps-script/` (Google Apps Script).

## Cómo funciona
1. `apps-script/Codigo.gs` va dentro de tu hoja de Google (Extensiones › Apps Script). Guarda los préstamos, los lista y manda un correo diario cuando un préstamo está por vencer.
2. `index.html` es la página. En ⚙️ pegas el enlace `/exec` de tu Apps Script y tu clave secreta. Se guardan solo en tu celular, nunca en este repositorio.

## Abonos (pagos a cuotas)
Cada préstamo puede tener un número de cuotas. Con el botón **Abonar** registras pagos parciales; se guardan en la pestaña **Abonos** de la hoja. La página muestra cuánto se ha pagado y cuánto falta, y el préstamo se marca como **Pagado** solo cuando el saldo llega a $0.

La clave secreta (`CLAVE` en `Codigo.gs`) protege tu hoja: sin ella nadie puede leer ni guardar datos.
