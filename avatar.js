/* Avatar pixelado de Manu con expresiones e iconos.
 * Dibuja avatar.png (44x44) en un canvas y le pinta encima ojos, boca e iconos.
 * Uso: Avatar.init(canvas, burbuja); Avatar.decir('feliz', 'Texto', 'monedas');
 */
(function () {
  var N = 44;
  var C = {
    piel: '#c98e6b', barba: '#221713', oscuro: '#1e120c', blanco: '#ece4dc',
    labio: '#80463a', boca: '#3b1a14', lengua: '#b06858', ceja: '#1d1614',
    oro: '#facc15', oroOsc: '#b45309', rojo: '#ef4444', rojoOsc: '#991b1b',
    gota: '#bae6fd', gotaOsc: '#38bdf8', verde: '#22c55e', verdeOsc: '#166534',
    negro: '#0b0f1a', brillo: '#ffffff', zz: '#e0f2fe'
  };

  // Iconos pixelados: cada letra es un color, '.' es transparente.
  var ICONOS = {
    moneda: { m: ['.ooo.', 'oyOyo', 'oyOyo', 'oyOyo', '.ooo.'], c: { o: C.oroOsc, y: C.oro, O: C.oroOsc } },
    corazon: { m: ['.r.r.', 'rRrrr', 'rrrrr', '.rrr.', '..r..'], c: { r: C.rojo, R: C.brillo } },
    gota: { m: ['.g.', '.g.', 'ggg', 'gGg', '.g.'], c: { g: C.gotaOsc, G: C.gota } },
    alerta: { m: ['yy', 'yy', 'yy', '..', 'yy'], c: { y: C.oro } },
    duda: { m: ['www', '..w', '.ww', '...', '.w.'], c: { w: C.brillo } },
    zeta: { m: ['zzz', '..z', '.z.', 'z..', 'zzz'], c: { z: C.zz } },
    billete: { m: ['ggggggg', 'gGGvGGg', 'gGvvvGg', 'gGGvGGg', 'ggggggg'], c: { g: C.verdeOsc, G: C.verde, v: C.verdeOsc } },
    estrella: { m: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'], c: { y: C.oro } },
    reloj: { m: ['.ooo.', 'owbwo', 'owbbo', 'owwwo', '.ooo.'], c: { o: C.oroOsc, w: C.brillo, b: C.negro } }
  };

  // Cambios de la cara para cada expresión: [x, y, color]
  function filas(x0, y, colores) { return colores.map(function (c, i) { return [x0 + i, y, c]; }); }
  var P = C;
  var OJOS = {
    cerrados: filas(16, 17, [P.oscuro, P.oscuro, P.oscuro, P.oscuro]).concat(filas(24, 17, [P.oscuro, P.oscuro, P.oscuro, P.oscuro])),
    felices: [[17, 16, P.oscuro], [18, 16, P.oscuro], [16, 17, P.oscuro], [17, 17, P.piel], [18, 17, P.piel], [19, 17, P.oscuro],
              [25, 16, P.oscuro], [26, 16, P.oscuro], [24, 17, P.oscuro], [25, 17, P.piel], [26, 17, P.piel], [27, 17, P.oscuro]],
    abiertos: [[17, 16, P.blanco], [18, 16, P.blanco], [25, 16, P.blanco], [26, 16, P.blanco]],
    lentes: (function () {
      var r = [];
      for (var x = 15; x <= 28; x++) r.push([x, 16, P.negro]);
      [15, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27, 28].forEach(function (x) { r.push([x, 17, P.negro]); });
      [16, 17, 18, 19, 24, 25, 26, 27].forEach(function (x) { r.push([x, 18, P.negro]); });
      r.push([17, 17, '#475569'], [25, 17, '#475569']);
      return r;
    })(),
    preocupados: [[16, 15, P.piel], [17, 15, P.ceja], [19, 14, P.piel], [24, 14, P.piel], [26, 15, P.ceja], [27, 15, P.piel]]
  };
  var BOCAS = {
    sonrisa: filas(19, 25, [P.labio, P.blanco, P.blanco, P.blanco, P.blanco, P.labio])
      .concat(filas(20, 26, [P.lengua, P.lengua, P.lengua, P.lengua])).concat([[18, 24, P.labio], [25, 24, P.labio]]),
    triste: filas(19, 25, [P.barba, P.labio, P.labio, P.labio, P.labio, P.barba]).concat([[19, 26, P.labio], [24, 26, P.labio]]),
    o: [[21, 25, P.boca], [22, 25, P.boca], [21, 26, P.boca], [22, 26, P.boca], [20, 25, P.labio], [23, 25, P.labio]],
    mueca: filas(19, 25, [P.labio, P.labio, P.labio, P.blanco, P.blanco, P.labio])
  };

  // Brazo levantado señalando hacia arriba (lado derecho del dibujo). sube = 0 o 1 para que se mueva.
  function brazo(sube) {
    var r = [], y0 = 22 - sube;
    for (var y = y0; y <= 36; y++) r.push([36, y, P.negro], [37, y, '#374151'], [38, y, '#1f2937'], [39, y, '#1f2937'], [40, y, P.negro]);
    for (var y2 = y0 - 4; y2 < y0; y2++) r.push([36, y2, P.negro], [37, y2, P.piel], [38, y2, P.piel], [39, y2, '#ac7150'], [40, y2, P.negro]);
    for (var y3 = y0 - 9; y3 < y0 - 4; y3++) r.push([37, y3, P.negro], [38, y3, P.piel], [39, y3, P.negro]);
    r.push([38, y0 - 10, P.negro], [36, y0 - 5, P.negro], [40, y0 - 5, P.negro]);
    return r;
  }

  var CARAS = {
    normal: [],
    parpadeo: [OJOS.cerrados],
    feliz: [OJOS.felices, BOCAS.sonrisa],
    triste: [OJOS.preocupados, BOCAS.triste],
    sorpresa: [OJOS.abiertos, BOCAS.o],
    pensando: [OJOS.preocupados, BOCAS.mueca],
    cool: [OJOS.lentes, BOCAS.mueca],
    dormido: [OJOS.cerrados, BOCAS.o]
  };

  var POS = [[34, 6], [5, 8], [36, 16], [3, 18]];
  var FRASES_PASEO = ['¡Vamos, hay que cargar los préstamos!', '¡El tiempo apremia, campeón!', '¿Quién nos debe hoy? ¡A trabajar!', '¡Arriba, Manu! Esos préstamos no se anotan solos.'];
  var cabecera, paseo = null, cargando = 0;
  var cv, ctx, bubble, base, recorte, cara = 'normal', icono = null, t = 0, reloj = null, ultimo = Date.now();
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pintar() {
    ctx.clearRect(0, 0, N, N);
    var img = paseo && recorte.complete && recorte.naturalWidth ? recorte : base;
    if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, N, N);
    var capas = (CARAS[cara] || []).slice();
    if (paseo) capas.push(brazo(Math.floor(t / 3) % 2));
    capas.forEach(function (capa) {
      capa.forEach(function (p) { ctx.fillStyle = p[2]; ctx.fillRect(p[0], p[1], 1, 1); });
    });
    if (icono && ICONOS[icono]) {
      var ic = ICONOS[icono];
      var cuantos = icono === 'zeta' ? 2 : (icono === 'alerta' || icono === 'duda' ? 1 : (paseo ? 2 : 4));
      for (var k = 0; k < cuantos; k++) {
        var dy = quieto ? 0 : Math.round(Math.sin(t / 2 + k * 1.7) * 1.5);
        dibujarIcono(ic, POS[k][0], POS[k][1] + dy);
      }
    }
  }

  function dibujarIcono(ic, x0, y0) {
    ic.m.forEach(function (fila, y) {
      for (var x = 0; x < fila.length; x++) {
        var ch = fila[x];
        if (ch === '.') continue;
        ctx.fillStyle = ic.c[ch]; ctx.fillRect(x0 + x, y0 + y, 1, 1);
      }
    });
  }

  function animar() {
    t++;
    // Parpadeo natural cuando está en reposo.
    if (cara === 'normal' && t % 28 === 0) { cara = 'parpadeo'; setTimeout(function () { if (cara === 'parpadeo') cara = 'normal'; }, 160); }
    // Si nada pasa en 10 s, se pone a caminar y a apurarte.
    if (!paseo && cara === 'normal' && cargando === 0 && Date.now() - ultimo > 10000) empezarPaseo();
    if (paseo) moverPaseo();
    pintar();
  }

  function texto(msg) {
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }

  function empezarPaseo() {
    paseo = { x: 0, dir: 1, ticks: 0, frase: 0 };
    cara = 'feliz'; icono = 'reloj';
    cabecera.classList.add('paseo');
    texto(FRASES_PASEO[0]);
  }

  function moverPaseo() {
    paseo.ticks++;
    var max = Math.max(0, cabecera.clientWidth - cv.offsetWidth - 32);
    if (!quieto) {
      paseo.x += paseo.dir * 6;
      if (paseo.x >= max) { paseo.x = max; paseo.dir = -1; }
      if (paseo.x <= 0) { paseo.x = 0; paseo.dir = 1; }
    }
    var salto = (!quieto && Math.floor(paseo.ticks / 2) % 2) ? -3 : 0;
    cv.style.left = (16 + paseo.x) + 'px';
    cv.style.transform = 'translateY(' + salto + 'px) scaleX(' + paseo.dir + ')';
    cara = Math.floor(paseo.ticks / 14) % 2 ? 'sorpresa' : 'feliz';
    if (paseo.ticks % 30 === 0) { paseo.frase = (paseo.frase + 1) % FRASES_PASEO.length; texto(FRASES_PASEO[paseo.frase]); }
    // Después de unos 40 s caminando se cansa y se duerme.
    if (paseo.ticks > 285) { terminarPaseo(); cara = 'dormido'; icono = 'zeta'; texto('Zzz... avísame cuando haya otro préstamo.'); }
  }

  function terminarPaseo() {
    if (!paseo) return;
    paseo = null;
    cabecera.classList.remove('paseo');
    cv.style.left = ''; cv.style.transform = '';
    cara = 'normal'; icono = null;
  }

  function actividad() {
    ultimo = Date.now();
    if (paseo) { terminarPaseo(); texto('¡Eso! Manos a la obra.'); pintar(); }
    else if (cara === 'dormido') Avatar.decir('sorpresa', '¡Ah! Aquí estoy, aquí estoy.', 'alerta');
  }

  var vuelta = null;
  window.Avatar = {
    init: function (canvas, globo) {
      cv = canvas; bubble = globo; ctx = cv.getContext('2d');
      cabecera = cv.closest('header') || cv.parentNode;
      ['pointerdown', 'keydown', 'input', 'focusin'].forEach(function (ev) { document.addEventListener(ev, actividad, true); });
      window.addEventListener('scroll', actividad, { passive: true });
      cv.width = N; cv.height = N;
      base = new Image(); base.onload = pintar; base.src = 'avatar.png';
      recorte = new Image(); recorte.src = 'avatar-recorte.png'; // sin fondo, para caminar
      reloj = setInterval(animar, 140);
      cv.addEventListener('click', function () { Avatar.travesura(); });
    },
    /** Cambia la cara, el texto y el icono. Vuelve a normal después de `ms` (0 = se queda). */
    decir: function (nuevaCara, msg, nuevoIcono, ms) {
      ultimo = Date.now();
      terminarPaseo();
      cara = nuevaCara || 'normal'; icono = nuevoIcono || null;
      if (msg) texto(msg);
      pintar();
      clearTimeout(vuelta);
      if (ms !== 0) vuelta = setTimeout(function () { cara = 'normal'; icono = null; pintar(); }, ms || 3500);
    },
    travesura: function () {
      var r = [
        ['cool', 'El que presta con orden, cobra con calma. 😎', 'estrella'],
        ['feliz', '¡Ese dinero va a volver con intereses!', 'billete'],
        ['sorpresa', '¡Oye! No me toques la barba. 😅', 'alerta'],
        ['pensando', '¿Ya revisaste quién vence esta semana?', 'duda'],
        ['feliz', 'Cuentas claras, amistades largas.', 'corazon']
      ][Math.floor(Math.random() * 5)];
      Avatar.decir(r[0], r[1], r[2]);
    },
    despertar: actividad,
    /** Marca que la página está cargando algo (+1) o terminó (-1), para no caminar mientras tanto. */
    ocupado: function (n) { cargando = Math.max(0, cargando + n); ultimo = Date.now(); }
  };
})();
