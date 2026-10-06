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
    estrella: { m: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'], c: { y: C.oro } }
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
  var cv, ctx, bubble, base, cara = 'normal', icono = null, t = 0, reloj = null, ultimo = Date.now();
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pintar() {
    ctx.clearRect(0, 0, N, N);
    if (base.complete && base.naturalWidth) ctx.drawImage(base, 0, 0, N, N);
    (CARAS[cara] || []).forEach(function (capa) {
      capa.forEach(function (p) { ctx.fillStyle = p[2]; ctx.fillRect(p[0], p[1], 1, 1); });
    });
    if (icono && ICONOS[icono]) {
      var ic = ICONOS[icono];
      var cuantos = icono === 'zeta' ? 2 : (icono === 'alerta' || icono === 'duda' ? 1 : 4);
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
    // Si nadie lo toca en 45 s, se duerme.
    if (cara === 'normal' && Date.now() - ultimo > 45000) { cara = 'dormido'; icono = 'zeta'; texto('Zzz... avísame cuando haya otro préstamo.'); }
    pintar();
  }

  function texto(msg) {
    if (!bubble) return;
    bubble.textContent = msg;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }

  var vuelta = null;
  window.Avatar = {
    init: function (canvas, globo) {
      cv = canvas; bubble = globo; ctx = cv.getContext('2d');
      cv.width = N; cv.height = N;
      base = new Image(); base.onload = pintar; base.src = 'avatar.png';
      reloj = setInterval(animar, 140);
      cv.addEventListener('click', function () { Avatar.travesura(); });
    },
    /** Cambia la cara, el texto y el icono. Vuelve a normal después de `ms` (0 = se queda). */
    decir: function (nuevaCara, msg, nuevoIcono, ms) {
      ultimo = Date.now();
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
    despertar: function () { ultimo = Date.now(); if (cara === 'dormido') Avatar.decir('sorpresa', '¡Ah! Aquí estoy, aquí estoy.', 'alerta'); }
  };
})();
