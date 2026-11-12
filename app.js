/* SGLC viewer logic – normally you do not need to edit this file. */
(function () {
  const C = window.SGLC, M = 111320;               // metres per degree latitude
  const $ = id => document.getElementById(id);
  const say = t => ($('msg').textContent = t || '');

  const map = new maplibregl.Map({
    container: 'map', center: C.view.center, zoom: C.view.zoom, pitch: C.view.pitch,
    bearing: C.view.bearing, maxPitch: 85, canvasContextAttributes: { antialias: true },
    style: { version: 8, glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf', sources: {}, layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#dfe5e0' } }] }
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
  map.addControl(new maplibregl.FullscreenControl(), 'top-right');

  /* ---------- Orbit-style controls: drag = orbit the camera, right/Shift-drag = pan, scroll = zoom ---------- */
  map.dragPan.disable(); map.dragRotate.disable();
  map.scrollZoom.enable({ around: 'center' });
  const cv = map.getCanvasContainer(); let drag = null;
  cv.style.touchAction = 'none';
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    if (!e.isPrimary) { drag = null; return; }              // 2nd finger: leave pinch/rotate to the map
    drag = { x: e.clientX, y: e.clientY, pan: e.button !== 0 || e.shiftKey };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.pan) map.panBy([-dx, -dy], { duration: 0 });
    else { map.setBearing(map.getBearing() + dx * 0.4);
           map.setPitch(Math.min(85, Math.max(0, map.getPitch() - dy * 0.3))); }
  });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => drag = null));

  /* ---------- helpers ---------- */
  const rect = (lon, lat, s) => { const dy = s / 2 / M, dx = s / 2 / (M * Math.cos(lat * Math.PI / 180));
    return [[[lon-dx,lat-dy],[lon+dx,lat-dy],[lon+dx,lat+dy],[lon-dx,lat+dy],[lon-dx,lat-dy]]]; };
  const closed = r => (r[0][0]===r.at(-1)[0] && r[0][1]===r.at(-1)[1]) ? r : [...r, r[0]];

  function icon(shape, color) {                      // draws a 48px symbol, white outline
    const n = 48, c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d'); g.fillStyle = color; g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath();
    if (shape === 'triangle') { g.moveTo(24,6); g.lineTo(43,40); g.lineTo(5,40); g.closePath(); }
    else if (shape === 'square') g.rect(9,9,30,30);
    else if (shape === 'diamond') { g.moveTo(24,4); g.lineTo(44,24); g.lineTo(24,44); g.lineTo(4,24); g.closePath(); }
    else g.arc(24,24,16,0,7);
    g.stroke(); g.fill();
    return g.getImageData(0, 0, n, n);
  }

  /* ---------- data -> GeoJSON ---------- */
  const fc = f => ({ type: 'FeatureCollection', features: f });
  const props = p => ({ ...p, h: +(p.elev - C.groundElevation).toFixed(2), color: (C.types[p.type] || {}).color });

  /* Tipe titik yang digambar sebagai kubus di ketinggian aslinya (bukan ikon di tanah).
     Tambah tipe lain di sini kalau perlu. */
  const RAISED = ['PT', 'GNSS'];
  const raised = p => RAISED.includes(p.type);
  const cubeSize = p => (C.types[p.type] && C.types[p.type].cube) || C.ptCubeSize;

  function pointData() {
    const pts = C.points;
    return {
      ground: fc(pts.filter(p => !raised(p)).map(p => ({ type:'Feature', properties: props(p),
        geometry:{ type:'Point', coordinates:[p.lon,p.lat] } }))),
      cubes: fc(pts.filter(raised).map(p => { const s = cubeSize(p), h = p.elev - C.groundElevation, r = s / 2;
        return { type:'Feature', properties: { ...props(p), lo: h - r, hi: h + r },
                 geometry:{ type:'Polygon', coordinates: rect(p.lon,p.lat,s) } }; }))
    };
  }
  function refreshPoints() {
    const d = pointData();
    ['ground','cubes'].forEach(k => map.getSource('pts-' + k).setData(d[k]));
    buildLegend();
    buildLabels();
  }

  /* ---------- label 3D: teks HTML yang menempel di atas kubus ---------- */
  let labels = [], labelBox = null;
  function buildLabels() {
    if (!labelBox) {
      labelBox = document.createElement('div');
      labelBox.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1';
      map.getContainer().appendChild(labelBox);
    }
    labelBox.innerHTML = '';
    labels = C.points.filter(raised).map(p => {
      const el = document.createElement('div'), t = C.types[p.type] || {};
      el.textContent = p.id;
      el.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font:600 12px "Open Sans",Arial,sans-serif;' +
        'padding-bottom:4px;will-change:transform;display:none;color:' + t.color + ';' +
        'text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 0 3px #fff';
      labelBox.appendChild(el);
      const top = (p.elev - C.groundElevation) + cubeSize(p) / 2;          // atas kubus (m dari tanah)
      const mc = maplibregl.MercatorCoordinate.fromLngLat([p.lon, p.lat], top);
      return { el, type: p.type, x: mc.x, y: mc.y, z: mc.z };
    });
    map.triggerRepaint();
  }
  /* Label disembunyikan kalau titiknya tertutup gedung (dicek dengan raycast ke model 3D).
     HIDE_TOL = toleransi (meter): tembok dalam jarak ini dari titik diabaikan, supaya titik
     yang menempel di fasad depan tetap berlabel walau sedikit "tenggelam" di dinding model. */
  const HIDE_TOL = 4;
  const MODEL = { scene: null, l: null, scale: 1 };         // diisi oleh modelLayer
  const ray = new THREE.Raycaster();
  const inv = m => m.clone().invert();
  let occTime = 0, occTimer = null, occForce = false;

  function blocked(l, ndcx, ndcy, Minv, linv) {
    const P = new THREE.Vector3(l.x, l.y, l.z).applyMatrix4(linv);                       // titik (koordinat model)
    const N = new THREE.Vector3(ndcx, ndcy, -1).applyMatrix4(Minv).applyMatrix4(linv);   // posisi kamera
    const dir = N.clone().sub(P), dist = dir.length();
    if (dist < 1e-9) return false;
    ray.set(P, dir.normalize());
    ray.near = HIDE_TOL / MODEL.scale; ray.far = dist;
    return ray.intersectObject(MODEL.scene, true).length > 0;
  }

  function labelLayer() {                                   // custom layer: posisi layar + cek tertutup
    return {
      id: 'pt-labels', type: 'custom',
      onAdd() {},
      render(gl, matrix) {
        const m = matrix.length ? matrix : matrix.defaultProjectionData.mainMatrix;
        const c = map.getCanvas(), w = c.clientWidth, h = c.clientHeight;
        const forced = occForce, now = performance.now();
        let Minv = null, linv = null;
        if ((forced || now - occTime > 250) && MODEL.l && MODEL.scene) {   // cek tertutup maks. 4x/detik
          occForce = false; occTime = now;
          Minv = inv(new THREE.Matrix4().fromArray(m)); linv = inv(MODEL.l);
        }
        labels.forEach(l => {
          const cw = m[3]*l.x + m[7]*l.y + m[11]*l.z + m[15];
          if (hidden.has(l.type) || cw <= 0 || !$('lbl').checked) { l.el.style.display = 'none'; return; }
          const cx = m[0]*l.x + m[4]*l.y + m[8]*l.z + m[12];
          const cy = m[1]*l.x + m[5]*l.y + m[9]*l.z + m[13];
          const sx = (cx / cw + 1) / 2 * w, sy = (1 - cy / cw) / 2 * h;
          if (Minv) l.blocked = Math.abs(cx / cw) > 1.2 || Math.abs(cy / cw) > 1.2
            ? false : blocked(l, cx / cw, cy / cw, Minv, linv);
          l.el.style.display = l.blocked ? 'none' : 'block';
          l.el.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-100%)`;
        });
        if (!forced) {                                      // setelah kamera berhenti, cek sekali lagi
          clearTimeout(occTimer);
          occTimer = setTimeout(() => { occForce = true; map.triggerRepaint(); }, 300);
        }
      }
    };
  }

  /* ---------- basemaps ---------- */
  const bms = C.basemaps.filter(b => b.enabled !== false);
  function addBasemaps() {
    bms.forEach(b => {
      const src = b.type === 'image'
        ? { type: 'image', url: b.url, coordinates: b.coordinates }
        : { type: 'raster', tiles: b.tiles, tileSize: b.tileSize || 256, maxzoom: b.maxzoom || 19, attribution: b.attribution };
      map.addSource('bm-' + b.id, src);
      map.addLayer({ id: 'bm-' + b.id, type: 'raster', source: 'bm-' + b.id,
        layout: { visibility: b.id === C.defaultBasemap ? 'visible' : 'none' } }, 'bg-top');
    });
    $('basemap').innerHTML = bms.map(b => `<option value="${b.id}">${b.label}</option>`).join('');
    $('basemap').value = C.defaultBasemap;
    $('basemap').onchange = e => bms.forEach(b => map.setLayoutProperty('bm-' + b.id, 'visibility', b.id === e.target.value ? 'visible' : 'none'));
  }

  /* ---------- legend / toggles ---------- */
  const hidden = new Set();
  function buildLegend() {
    $('legend').innerHTML = Object.entries(C.types).map(([k, t]) => {
      const n = C.points.filter(p => p.type === k).length;
      return `<label class="row"><input type="checkbox" data-t="${k}" ${hidden.has(k)?'':'checked'}>
        <canvas class="sw" data-s="${t.shape}" data-c="${t.color}" width="48" height="48"></canvas>${t.label}<span class="ct">${n}</span></label>`; }).join('');
    $('legend').querySelectorAll('canvas').forEach(cv => cv.getContext('2d').putImageData(icon(cv.dataset.s, cv.dataset.c), 0, 0));
    $('legend').querySelectorAll('input').forEach(i => i.onchange = () => { i.checked ? hidden.delete(i.dataset.t) : hidden.add(i.dataset.t); applyFilter(); });
  }
  function applyFilter() {
    const f = ['!', ['in', ['get', 'type'], ['literal', [...hidden]]]];
    ['pts-ground', 'pts-cubes'].forEach(l => map.setFilter(l, f));
    map.triggerRepaint();                                   // label HTML ikut disembunyikan/ditampilkan
  }

  /* ---------- info card (fixed on top of everything; content set in data.js -> info) ---------- */
  const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hideInfo = () => $('info').hidden = true;
  function popup(e) {
    const p = e.features[0].properties, t = C.types[p.type] || {}, I = C.info || {}, F = I.fields;
    const fields = Array.isArray(F) ? F : ((F && F[p.type]) || ['type', 'lat', 'lon', 'elev']);
    const L = { type: 'Tipe', lat: 'Latitude', lon: 'Longitude', elev: 'Elevasi (m)', h: 'Tinggi dari tanah (m)', ...(I.labels || {}) };
    const D = { lat: 7, lon: 7, elev: 3, h: 2, ...(I.decimals || {}) }, photos = I.photos || ['foto'];
    const empty = v => v === undefined || v === null || v === '' || v === 'null';
    const val = k => k === 'type' ? (t.label || p.type) : (D[k] != null && isFinite(+p[k]) && !empty(p[k]) ? (+p[k]).toFixed(D[k]) : p[k]);
    const rows = fields.map(k => {
      if (photos.includes(k)) return empty(p[k]) ? '' : `<tr><td colspan="2">${esc(L[k] || k)}<br><img src="${esc(p[k])}" alt="${esc(L[k] || k)}"
        onerror="this.replaceWith(document.createTextNode('(foto tidak ditemukan)'))"></td></tr>`;
      return `<tr><td>${esc(L[k] || k)}</td><td>${empty(p[k]) && k !== 'type' ? '–' : esc(val(k))}</td></tr>`;
    }).join('');
    $('infoBody').innerHTML = `<h3 style="color:${t.color}">${esc(p.id)}</h3><table>${rows}</table>`;
    $('info').hidden = false;
  }
  $('infoClose').onclick = hideInfo;
  /* klik foto di kartu -> tampil penuh (klik di mana saja, tombol × atau Esc untuk menutup) */
  const closePhoto = () => { $('lightbox').hidden = true; $('lbImg').removeAttribute('src'); };
  $('infoBody').onclick = e => { if (e.target.tagName === 'IMG') { $('lbImg').src = e.target.src; $('lightbox').hidden = false; } };
  $('lightbox').onclick = closePhoto;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('lightbox').hidden ? hideInfo() : closePhoto(); });
  map.on('click', e => { if (!map.queryRenderedFeatures(e.point, { layers: ['pts-ground', 'pts-cubes'] }).length) hideInfo(); });

  /* ---------- CSV import: id,type,lat,lon,elev,note ---------- */
  $('csvBtn').onclick = () => $('csv').click();
  $('csv').onchange = async e => {
    const rows = (await e.target.files[0].text()).trim().split(/\r?\n/).map(r => r.split(',').map(s => s.trim()));
    const head = rows.shift().map(h => h.toLowerCase()), ix = k => head.indexOf(k);
    if (['id','type','lat','lon','elev'].some(k => ix(k) < 0)) return say('CSV needs columns: id,type,lat,lon,elev[,note]');
    const pts = rows.map(r => { const o = Object.fromEntries(head.map((k, i) => [k, r[i] ?? '']));
      return { ...o, type: String(o.type).toUpperCase(), lat: +o.lat, lon: +o.lon, elev: +o.elev }; })
      .filter(p => C.types[p.type] && isFinite(p.lat + p.lon + p.elev));
    if (!pts.length) return say('No valid rows found (type must be BM, BS, GNSS or PT).');
    C.points = pts; refreshPoints(); say(pts.length + ' points loaded.');
  };
  $('lbl').onchange = () => map.triggerRepaint();
  $('reset').onclick = () => map.easeTo({ ...C.view, duration: 1200 });

  /* ---------- 3D model (three.js custom layer) ---------- */
  function modelLayer(cfg, onLoaded) {
    const camera = new THREE.Camera(), scene = new THREE.Scene(); let renderer;
    MODEL.scene = scene;
    return {
      id: 'building-model', type: 'custom', renderingMode: '3d',
      onAdd(m, gl) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.85));
        const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(60, 120, 40); scene.add(sun);
        const ok = g => {
          g.scene.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { m.side = THREE.DoubleSide; m.needsUpdate = true; }); });
          scene.add(g.scene); onLoaded(); m.triggerRepaint(); };
        const bad = () => say('3D model failed to load – showing the simple box instead.');
        const b64 = cfg.url ? null : window.SGLC_MODEL_B64;      // kalau ada url, pakai file .glb (model.js lama diabaikan)
        if (b64) { const bin = atob(b64), buf = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          new THREE.GLTFLoader().parse(buf.buffer, '', ok, bad); }
        else if (cfg.url) new THREE.GLTFLoader().load(cfg.url, ok, undefined, bad);
        else say('model.js not found next to index.html – copy it into the same folder.');
        renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
        renderer.outputEncoding = THREE.sRGBEncoding; renderer.autoClear = false;
      },
      render(gl, matrix) {
        const o = maplibregl.MercatorCoordinate.fromLngLat([cfg.lon, cfg.lat], cfg.altitude || 0);
        const u = o.meterInMercatorCoordinateUnits(), s = u * (cfg.scale || 1);
        const l = new THREE.Matrix4().makeTranslation(o.x + (cfg.east || 0) * u, o.y - (cfg.north || 0) * u, o.z)
          .scale(new THREE.Vector3(s, -s, s))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
          .multiply(new THREE.Matrix4().makeRotationY(-(cfg.rotation || 0) * Math.PI / 180));
        MODEL.l = l; MODEL.scale = cfg.scale || 1;
        camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
        renderer.resetState(); renderer.render(scene, camera);
      }
    };
  }
  function bindAlign(cfg) {
    const f = { mRot: 'rotation', mE: 'east', mN: 'north', mS: 'scale' };
    const show = () => $('mOut').textContent = `rotation: ${cfg.rotation}, east: ${cfg.east}, north: ${cfg.north}, scale: ${cfg.scale}  (copy to data.js)`;
    Object.entries(f).forEach(([id, k]) => { $(id).value = cfg[k] || 0;
      $(id).oninput = e => { cfg[k] = parseFloat(e.target.value) || (k === 'scale' ? 1 : 0); show(); map.triggerRepaint(); }; });
    show();
  }

  /* ---------- build the scene ---------- */
  map.on('load', () => {
    map.addLayer({ id: 'bg-top', type: 'background', paint: { 'background-opacity': 0 } });
    addBasemaps();

    map.addSource('building', { type: 'geojson', data: fc(C.building.map(b => ({ type:'Feature',
      properties: { name: b.name, color: b.color, base: b.base, height: b.height },
      geometry: { type:'Polygon', coordinates: [closed(b.ring)] } }))) });
    map.addLayer({ id: 'building', type: 'fill-extrusion', source: 'building', paint: {
      'fill-extrusion-color': ['get','color'], 'fill-extrusion-base': ['get','base'],
      'fill-extrusion-height': ['get','height'], 'fill-extrusion-opacity': 0.82, 'fill-extrusion-vertical-gradient': true } });

    if (C.model) {
      map.addLayer(modelLayer(C.model, () => map.setLayoutProperty('building', 'visibility', 'none')));
      bindAlign(C.model);
    }

    Object.entries(C.types).forEach(([k, t]) => map.addImage('ic-' + k, icon(t.shape, t.color)));
    ['ground','cubes'].forEach(k => map.addSource('pts-' + k, { type: 'geojson', data: fc([]) }));

    map.addLayer({ id: 'pts-cubes', type: 'fill-extrusion', source: 'pts-cubes', paint: {
      'fill-extrusion-color': ['get','color'], 'fill-extrusion-base': ['get','lo'], 'fill-extrusion-height': ['get','hi'] } });
    const label = { 'text-field': ['get','id'], 'text-font': ['Open Sans Semibold'], 'text-size': 12, 'text-offset': [0, 1.1],
      'text-anchor': 'top', 'text-allow-overlap': false };
    const lp = { 'text-color': '#14232b', 'text-halo-color': '#fff', 'text-halo-width': 1.6 };
    map.addLayer({ id: 'pts-ground', type: 'symbol', source: 'pts-ground',
      layout: { 'icon-image': ['concat','ic-',['get','type']], 'icon-size': 0.55, 'icon-allow-overlap': true, ...label }, paint: lp });

    map.addLayer(labelLayer());                             // label PT/GNSS (HTML, di atas kubus)

    refreshPoints();
    ['pts-ground', 'pts-cubes'].forEach(l => {
      map.on('click', l, popup);
      map.on('mouseenter', l, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', l, () => map.getCanvas().style.cursor = '');
    });
  });
  map.on('error', e => say('Layer/source error: ' + (e.error && e.error.message || 'check data.js paths')));
})();
