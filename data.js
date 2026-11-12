/* ==========================================================
   SGLC VIEWER – DATA & SETTINGS  (edit THIS file only)
   All coordinates: WGS84 decimal degrees, elevation in metres.
   Values below are PLACEHOLDERS near the SGLC site – replace
   them with your surveyed footprint, points and orthophoto.
   ========================================================== */
window.SGLC = {

  /* ---------- Initial camera ---------- */
  view: { center: [110.37242, -7.76528], zoom: 18.3, pitch: 60, bearing: -20 },

  /* Ground elevation at the building (m). Used to convert point elevation
     into height above ground when drawing PT cubes on the structure. */
  groundElevation: 161.7,

  /* ---------- 3D model (file SGLC_centered.glb di folder yang sama dengan index.html, satuan meter, dasar di 0) ----------
     lon/lat = where the CENTRE of the building footprint sits. rotation = clockwise degrees
     (seen from above) to align the model with north. east/north = fine shift in metres.
     You can tune rotation/east/north live in the viewer panel, then copy the values here. */
  model: { url: 'SGLC_centered.glb', lon: 110.37240025, lat: -7.76523591, altitude: 0, rotation: 298.4, east: -2.9, north: -14.2, scale: 1 },   // model SketchUp (meter), dicocokkan ke titik PT/GNSS

  /* ---------- Basemaps ----------
     type 'tiles' : XYZ raster tiles  (e.g. orthophoto tiled with GDAL2Tiles / ODM / GeoServer)
     type 'image' : a single georeferenced image, corners = [TL, TR, BR, BL] as [lon, lat]
     Set enabled:true once you have filled in the orthophoto entry. */
  defaultBasemap: 'ortho-image',
  basemaps: [
    { id: 'esri', label: 'Satellite (Esri)', type: 'tiles', maxzoom: 19,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      attribution: 'Imagery © Esri' },
    { id: 'osm', label: 'Street map (OSM)', type: 'tiles', maxzoom: 19,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      attribution: '© OpenStreetMap contributors' },

    /* >>> YOUR ORTHOPHOTO – option A: tiles (best for large/high-res imagery) */
    { id: 'ortho-tiles', label: 'Orthophoto (tiles)', enabled: false, type: 'tiles', maxzoom: 22,
      tiles: ['ortho/tiles/{z}/{x}/{y}.png'],       // or a full https:// URL
      attribution: 'Orthophoto SGLC' },

    /* >>> YOUR ORTHOPHOTO – option B: one georeferenced image (PNG/JPG, EPSG:4326 corners) */
    { id: 'ortho-image', label: 'Orthophoto (image)', enabled: true, type: 'image',
      url: 'orthoteknikwgs84.png',
      coordinates: [[110.3698308, -7.7629354], [110.3760319, -7.7629354],
                    [110.3760319, -7.7677000], [110.3698308, -7.7677000]],
      attribution: 'Orthophoto SGLC' }
  ],

  /* ---------- Building (extruded parts) ----------
     ring: closed polygon [lon,lat] (first = last not required)
     base/height: metres above ground. Add as many parts as needed. */
  building: [   /* fallback box, hidden automatically once the 3D model loads */
    { name: 'SGLC box', color: '#d9d6cc', base: 0, height: 19.7,
      ring: [[110.37367815,-7.76580801],[110.37392185,-7.76580801],[110.37392185,-7.76599199],[110.37367815,-7.76599199]] }
  ],

  /* ---------- Point styles ---------- */
  types: {
    BM:   { label: 'BM (Titik Kontrol RTS)', color: '#e63946', shape: 'triangle' },
    BS:   { label: 'BS (Backsight)',        color: '#f4a000', shape: 'square'   },
    GNSS: { label: 'Titik GNSS',            color: '#1d6fd1', shape: 'diamond'  },
    PT:   { label: 'PT (Target Prisma)',     color: '#c026d3', shape: 'circle'   }
  },
  ptCubeSize: 1.2,   // metres, size of PT markers drawn on the structure

  /* ---------- Kartu info saat titik diklik ----------
     fields : baris yang ditampilkan untuk setiap tipe titik, sesuai urutan. Hapus nama untuk menyembunyikan baris.
              Bawaan: type, lat, lon, elev, h (tinggi dari tanah). Selain itu boleh kunci apa saja yang kamu
              tulis di titik (alat, lokasi, prisma, lantai, sta, foto, ...). Baris yang masih kosong tampil "–".
     photos : kunci yang isinya alamat foto (mis. 'foto/STA1.jpg', taruh fotonya di folder yang sama dengan index.html). */
  info: {
    fields: {
      BM:   ['type', 'lat', 'lon', 'elev', 'alat', 'lokasi', 'foto'],
      BS:   ['type', 'lat', 'lon', 'elev', 'prisma'],
      PT:   ['type', 'prisma', 'lokasi', 'sta', 'foto'],
      GNSS: ['type', 'lat', 'lon', 'elev', 'alat', 'lokasi', 'foto']
    },
    labels:   { type: 'Tipe', lat: 'Latitude', lon: 'Longitude', elev: 'Elevasi (m)', h: 'Tinggi dari tanah (m)',
                alat: 'Jenis alat', lokasi: 'Lokasi', foto: 'Foto POV', prisma: 'Jenis prisma', lantai: 'Lokasi', sta: 'Diukur dari' },
    decimals: { lat: 7, lon: 7, elev: 3, h: 2 },
    photos:   ['foto']
  },

  /* ---------- Survey points ----------
     elev = elevation (m). PT points are drawn at their real height on the building.
     Add a row, save, refresh. (Or use "Load CSV" in the viewer: id,type,lat,lon,elev,note) */
  points: [
    { id: 'STA1', type: 'BM', lat: -7.76464090, lon: 110.37240819, elev: 161.789, note: 'RTS station', alat: 'Leica TS16', lokasi: 'Di depan Masjid Al-Mustadam FT UGM', foto: 'RTS/STA01_MASTEK.PNG' },
    { id: 'STA3', type: 'BM', lat: -7.76631028, lon: 110.37222770, elev: 155.581, note: 'RTS station', alat: 'Leica TS16', lokasi: 'Sebelah Timur Gedung SGLC', foto: 'RTS/STA03_TETI.JPG' },
    { id: 'STA2', type: 'BM', lat: -7.76574452, lon: 110.37329614, elev: 162.107, note: 'RTS station', alat: 'Leica TS16', lokasi: 'Parkiran mobil DTETI FT UGM', foto: 'RTS/STA02_TUGU.jpg' },
    { id: 'BS1-1', type: 'BS', lat: -7.76453306, lon: 110.37254144, elev: 162.101, note: 'BS1 set', prisma: 'Leica GRZ4 360° Reflector' },
    { id: 'BS3-1', type: 'BS', lat: -7.76625497, lon: 110.37234605, elev: 151.096, note: 'BS1 set', prisma: 'Leica GRZ4 360° Reflector' },
    { id: 'BS2-1', type: 'BS', lat: -7.76556771, lon: 110.37329992, elev: 161.763, note: 'BS1 set', prisma: 'Leica GRZ4 360° Reflector' },
    { id: 'BS1-2', type: 'BS', lat: -7.76473360, lon: 110.37230627, elev: 162.282, note: 'BS2 set', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)' },
    { id: 'BS2-2', type: 'BS', lat: -7.76590109, lon: 110.37356386, elev: 163.292, note: 'BS2 set', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)' },
    { id: 'BS3-2', type: 'BS', lat: -7.76605676, lon: 110.37220248, elev: 154.298, note: 'BS2 set', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)' },
    { id: '11B', type: 'GNSS', lat: -7.76510659, lon: 110.37220173, elev: 214.462, lokasi: 'Rooftop lantai 11 Barat', alat: 'Leica', foto:'GNSS/Lt 11 barat.jpg' },
    { id: '11Ta', type: 'GNSS', lat: -7.76523591, lon: 110.37240025, elev: 214.390, lokasi: 'Rooftop lantai 11 Tengah', alat: 'Trimble', foto: 'GNSS/Lt 11 tengah.jpg' },
    { id: '11T', type: 'GNSS', lat: -7.76533759, lon: 110.37268063, elev: 214.383, lokasi: 'Rooftop lantai 11 Timur', alat: 'Leica', foto: 'GNSS/Lt 11 timur.jpg' },
    { id: '5B', type: 'GNSS', lat: -7.76550477, lon: 110.37209824, elev: 180.181, lokasi: 'Rooftop lantai 5 Barat', alat: 'Leica', foto: 'GNSS/Lt 5 barat.jpg' },
    { id: '5T', type: 'GNSS', lat: -7.76556406, lon: 110.37229714, elev: 181.831, lokasi: 'Rooftop lantai 5 Timur', alat: 'Javad', foto: 'GNSS/Lt 5 timur.jpg' },
    { id: 'GU', type: 'GNSS', lat: -7.76465449, lon: 110.37243828, elev: 161.826, lokasi: 'Utara gedung SGLC (di depan Masjid Al-Mustadam FT UGM)', alat: 'Leica/Geomate', foto:'' },
    { id: 'GS', type: 'GNSS', lat: -7.76624814, lon: 110.37239721, elev: 152.8141, lokasi: 'Selatan gedung SGLC (parkiran motor DTETI)', alat: 'Emlid', foto: '' },
    /* PT: koordinat = rata-rata semua epoch dari D1_ALL.xlsx */
    { id: 'P1000', type: 'PT', lat: -7.76508557, lon: 110.37229820, elev: 166.858, sta: 'STA1', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 1 Utara Teknikmart', foto: '' },
    { id: 'P1001', type: 'PT', lat: -7.76509167, lon: 110.37231312, elev: 189.185, sta: 'STA1', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 7 Utara', foto: '' },
    { id: 'P1002', type: 'PT', lat: -7.76511650, lon: 110.37242587, elev: 210.819, sta: 'STA1', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Utara-tengah', foto: 'RTS/Lantai 11_Utara tengah.jpg' },
    { id: 'P1003', type: 'PT', lat: -7.76508607, lon: 110.37228790, elev: 210.834, sta: 'STA1', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Utara-Barat', foto: 'RTS/Lantai 11_Utara barat.jpg' },
    { id: 'P2000', type: 'PT', lat: -7.76521434, lon: 110.37265476, elev: 167.231, sta: 'STA2', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 1 Utara-Timur', foto: '' },
    { id: 'P2001', type: 'PT', lat: -7.76538268, lon: 110.37254323, elev: 166.749, sta: 'STA2', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 1 Selatan-Timur', foto: '' },
    { id: 'P2002', type: 'PT', lat: -7.76523630, lon: 110.37264751, elev: 188.792, sta: 'STA2', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 7 Utara-Timur', foto: 'RTS/Lantai 7_Timur.jpg' },
    { id: 'P2003', type: 'PT', lat: -7.76538721, lon: 110.37255960, elev: 188.873, sta: 'STA2', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 7 Selatan-Timur', foto: 'RTS/Lantai 7_Utara (menghadap timur).jpg' },
    { id: 'P2004', type: 'PT', lat: -7.76521424, lon: 110.37265386, elev: 210.480, sta: 'STA2', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Utara-Timur', foto: 'RTS/Lantai 11_Utara (menghadap Timur).jpg' },
    { id: 'P3000', type: 'PT', lat: -7.76553193, lon: 110.37213286, elev: 179.164, sta: 'STA3', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 5 selatan-Barat', foto: 'RTS/Lantai 5_Selatan Barat.jpg' },
    { id: 'P3001', type: 'PT', lat: -7.76558394, lon: 110.37230701, elev: 179.180, sta: 'STA3', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 5 Selatan-Timur', foto: 'RTS/Lantai 5_Selatan Timur.jpg' },
    { id: 'P3002', type: 'PT', lat: -7.76528862, lon: 110.37223538, elev: 210.459, sta: 'STA3', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Selatan-Barat', foto: 'RTS/Lantai 11_Selatan Barat.jpg' },
    { id: 'P3003', type: 'PT', lat: -7.76532391, lon: 110.37235342, elev: 210.446, sta: 'STA3', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Selatan-tengah', foto: 'RTS/Lantai 11_Selatan tengah.jpg' },
    { id: 'P3004', type: 'PT', lat: -7.76530998, lon: 110.37230577, elev: 188.898, sta: 'STA3', prisma: 'Leica GPR112 Monitoring Prism (Prisma Kuning)', lokasi: 'Lantai 7 Selatan-Barat', foto: 'RTS/Lantai 7_Selatan.jpg' },
    { id: 'P3005', type: 'PT', lat: -7.76539299, lon: 110.37258359, elev: 210.471, sta: 'STA3', prisma: 'Leica GMP104 Mini Prism with L bar (Prisma Kecil)', lokasi: 'Rooftop lantai 11 Selatan-Timur', foto: 'RTS/Lantai 11_Selatan Timur.jpg' }
  ]
};
