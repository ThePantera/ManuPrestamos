/**
 * App de Préstamos - Google Apps Script
 * Pega este código en Extensiones > Apps Script de tu hoja de Google.
 */

// ===== AJUSTES (puedes cambiarlos) =====
var NOMBRE_HOJA = 'Prestamos';
var DIAS_AVISO = 3;            // avisar cuando falten estos días o menos
var HORA_AVISO = 8;            // hora del correo diario (0-23)
var ZONA = Session.getScriptTimeZone();

// Clave secreta para la página web (GitHub). Cámbiala por una tuya,
// por ejemplo 'Manu-2026-segura'. La misma clave la escribes en la página.
var CLAVE = 'CAMBIA_ESTA_CLAVE';

var ENCABEZADOS = ['ID', 'Nombre', 'Teléfono', 'Monto', 'Porcentaje (%)',
                   'Fecha préstamo', 'Fecha vencimiento', 'Total a cobrar',
                   'Estado', 'Registrado'];

// ===== APP WEB =====
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Mis Préstamos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ===== API PARA LA PÁGINA WEB (GitHub) =====
function doPost(e) {
  var r;
  try {
    var req = JSON.parse(e.postData.contents);
    if (CLAVE === 'CAMBIA_ESTA_CLAVE') throw new Error('Primero cambia la CLAVE en Codigo.gs.');
    if (String(req.clave) !== CLAVE) throw new Error('Clave incorrecta.');
    if (req.accion === 'guardar') r = guardarPrestamo(req.datos);
    else if (req.accion === 'listar') r = listarPrestamos();
    else if (req.accion === 'estado') r = cambiarEstado(req.id, req.estado === 'Pagado' ? 'Pagado' : 'Pendiente');
    else if (req.accion === 'probar') r = 'ok';
    else throw new Error('Acción no válida.');
    r = { ok: true, data: r };
  } catch (err) {
    r = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(r))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerHoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length)
      .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('D:D').setNumberFormat('$#,##0.00');
    hoja.getRange('H:H').setNumberFormat('$#,##0.00');
    hoja.getRange('F:G').setNumberFormat('dd/mm/yyyy');
  }
  return hoja;
}

/** Guarda un préstamo nuevo. Lo llama el formulario. */
function guardarPrestamo(d) {
  if (!d || !String(d.nombre || '').trim()) throw new Error('Falta el nombre.');
  if (!d.fechaPrestamo || !d.fechaVencimiento) throw new Error('Faltan las fechas.');
  var fP = aFecha_(d.fechaPrestamo);
  var fV = aFecha_(d.fechaVencimiento);
  if (fV < fP) throw new Error('La fecha de vencimiento no puede ser antes del préstamo.');

  var monto = Number(d.monto) || 0;
  var pct = Number(d.porcentaje) || 0;
  var total = monto ? monto * (1 + pct / 100) : '';

  var hoja = obtenerHoja_();
  var id = Utilities.getUuid().slice(0, 8).toUpperCase();
  hoja.appendRow([id, String(d.nombre).trim(), "'" + String(d.telefono || '').trim(),
                  monto || '', pct, fP, fV, total, 'Pendiente', new Date()]);
  return { ok: true, id: id };
}

/** Lista los préstamos para mostrarlos en la app. */
function listarPrestamos() {
  var hoja = obtenerHoja_();
  var n = hoja.getLastRow() - 1;
  if (n < 1) return [];
  var filas = hoja.getRange(2, 1, n, ENCABEZADOS.length).getValues();
  var hoy = hoy_();
  return filas.filter(function (f) { return f[0]; }).map(function (f) {
    var venc = f[6] instanceof Date ? f[6] : null;
    return {
      id: String(f[0]),
      nombre: f[1],
      telefono: String(f[2]),
      monto: f[3],
      porcentaje: f[4],
      fechaPrestamo: f[5] instanceof Date ? Utilities.formatDate(f[5], ZONA, 'dd/MM/yyyy') : '',
      fechaVencimiento: venc ? Utilities.formatDate(venc, ZONA, 'dd/MM/yyyy') : '',
      dias: venc ? diasEntre_(hoy, venc) : null,
      total: f[7],
      estado: f[8]
    };
  }).sort(function (a, b) {
    if (a.estado !== b.estado) return a.estado === 'Pendiente' ? -1 : 1;
    return (a.dias === null ? 99999 : a.dias) - (b.dias === null ? 99999 : b.dias);
  });
}

/** Cambia el estado (Pendiente / Pagado). */
function cambiarEstado(id, estado) {
  var hoja = obtenerHoja_();
  var n = hoja.getLastRow() - 1;
  if (n < 1) return false;
  var ids = hoja.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      hoja.getRange(i + 2, 9).setValue(estado);
      return true;
    }
  }
  return false;
}

// ===== AVISOS POR CORREO =====
/** Ejecuta esta función UNA VEZ para activar el aviso diario. */
function activarAvisoDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'revisarVencimientos') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('revisarVencimientos')
    .timeBased().everyDays(1).atHour(HORA_AVISO).create();
  obtenerHoja_();
  revisarVencimientos(); // prueba inmediata
}

/** Revisa préstamos pendientes y manda un correo si alguno vence pronto o ya venció. */
function revisarVencimientos() {
  var lista = listarPrestamos().filter(function (p) {
    return p.estado === 'Pendiente' && p.dias !== null && p.dias <= DIAS_AVISO;
  });
  if (lista.length === 0) return;

  var vencidos = lista.filter(function (p) { return p.dias < 0; });
  var proximos = lista.filter(function (p) { return p.dias >= 0; });

  var html = '<h2>Préstamos por cobrar</h2>';
  if (proximos.length) {
    html += '<h3>Vencen pronto</h3><ul>' + proximos.map(function (p) {
      var cuando = p.dias === 0 ? '<b>HOY</b>' : (p.dias === 1 ? 'mañana' : 'en ' + p.dias + ' días');
      return '<li>' + linea_(p) + ' vence ' + cuando + ' (' + p.fechaVencimiento + ')</li>';
    }).join('') + '</ul>';
  }
  if (vencidos.length) {
    html += '<h3 style="color:#c5221f">Ya vencidos</h3><ul>' + vencidos.map(function (p) {
      return '<li>' + linea_(p) + ' venció hace ' + (-p.dias) + ' día(s) (' + p.fechaVencimiento + ')</li>';
    }).join('') + '</ul>';
  }
  html += '<p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Abrir mi hoja</a></p>';

  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Aviso: ' + lista.length + ' préstamo(s) por cobrar',
    htmlBody: html
  });
}

// ===== AYUDANTES =====
function linea_(p) {
  var s = '<b>' + p.nombre + '</b>';
  if (p.telefono) s += ' (' + p.telefono + ')';
  if (p.total) s += ' - cobrar $' + Number(p.total).toFixed(2);
  return s;
}

function aFecha_(texto) {
  var partes = String(texto).split('-'); // formato yyyy-mm-dd del formulario
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function hoy_() {
  var t = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  return aFecha_(t);
}

function diasEntre_(a, b) {
  var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}
