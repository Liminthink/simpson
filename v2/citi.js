const
  With = (u, f) => (f(u), u)
  , qs = s => document.querySelector(s)
  , useEntry = (u, k) => new Promise(ok => u.once(k, ok))
  , useMemoKV = (f, kv = new Map) => (k, v) => (v = kv.get(k), v ?? kv.set(k, v = f(k)), v)
  , useCount = (f, i = 0) => (...a) => f(i++, ...a)
  , useSwap = (c, onexit = c => { }, LS = localStorage) => {
    let pre = c.key ?? 'c.'; delete c.key
    let ks = Object.keys(c), k, v
    for (k of ks) { if (v = LS[pre + k]) c[k] = JSON.parse(v) }
    addEventListener("unload", () => { onexit(c); for (k of ks) LS[pre + k] = JSON.stringify(c[k]) })
    return c
  }

CSS.fx = document.startViewTransition?.bind?.(document) ?? (f => f())

let
  _404 = (genkey, u = {}) => new Proxy(u, { get: (u, k) => u[k] ?? (u[k] = genkey(k)) })
  , FnHoles = () => _404((k, v) => (vf) => (v == null) ? (v = vf) : v(vf))

  , useOldValue = (on0, v) => (v1) => { if (v1 != null && v != v1) { v && on0(v, v1); v = v1 } return v1 }
  , useChanged = (find = () => true, opt = [document, { attributes: true, childList: true, subtree: true }]) => new Promise(OK => new MutationObserver((_, obs, e) => { e = find(); obs.takeRecords(); e && (obs.disconnect(), OK(e)) }).observe(...opt))
  , emo2png = (emoji, s = 64) =>
    With(document.createElement('canvas'), c =>
      (c.width = c.height = s, Object.assign(c.getContext('2d'), { font: `${s * 0.8}px sans-serif`, textAlign: 'center', textBaseline: 'middle' }).fillText(emoji, s / 2, s / 2))
    )

let map, c = useSwap({
  prj: '3D'
})


// 初始化地图 OpenFreeMap Liberty 样式
map = new maplibregl.Map({
  container: 'map', // 大屏幕容器
  ...useSwap({
    style: 'https://tiles.openfreemap.org/styles/liberty',
    pitch: 32,
    zoom: (c.prj == '3D') ? 2 : 5, // 初始缩放级别
    center: [109, 36], // 初始中心点 (中国)
  }, c => {
    c.style = map.f12.urTile ?? c.style
    c.pitch = map.getPitch()
    c.zoom = map.getZoom()
    c.center = map.getCenter()
  }),
  minZoom: 4, maxZoom: 7, // 最小缩放级别，防止过度缩小
  maxBounds: [[64, 10], [145, 54]],
  antialias: true, // 开启抗锯齿，使球体边缘更平滑
  attributionControl: false,

});

c.APP = `
provinces-area-fill:
  paint:
    fill-color: '#007cbf'
    fill-opacity: ['number', ['feature-state', 'heat'], ['get', 'heat'], 0.2]
provinces-area-active-fill:
  filter: ['==', 'adcode', 0]
  paint:
    fill-color: '#FF9800'
    fill-opacity: 0.6
provinces-area-hover-fill:
  paint:
    fill-color: '#5f9ea0'
    fill-opacity: ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0]


provinces-outline-line:
  paint:
    line-color: '#ffffff'
    line-width: 1.5
provinces-labels-symbol:
  layout:
    text-field: ['get', 'name']
    symbol-placement: point
  paint:
    text-color: '#333333'
    text-halo-color: '#eee'     # 文本光晕/描边颜色（白色）
    text-halo-width: 1


cities-emo-symbol:
  filter: ['!', ['has', 'point_count']]
  layout:
    # 使用栅格化后的图片
    icon-size: 0.4
    icon-image: ['get', 'emo'] 
    icon-allow-overlap: true
    
cities-o-circle:
  filter: ['has', 'point_count']
  paint:
    # 动态变色：数量小于10展示绿色，小于50展示黄色，大于50展示红色
    circle-color: ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1']
    circle-radius: ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]

    circle-stroke-width: 2
    circle-stroke-color: '#ffffff'

cities-n-symbol:
  filter: ['has', 'point_count']
  layout:
    text-field: '{point_count_abbreviated}'
    text-size: 14
  paint:
    text-color: '#ffffff'
`;

window.CHINA_CITIES_DB = {
  '北京': [39.90, 116.40], '上海': [31.23, 121.47], '广州': [23.12, 113.26],
  '深圳': [22.54, 114.05], '成都': [30.57, 104.06], '杭州': [30.27, 120.15],
  '武汉': [30.59, 114.30], '西安': [34.26, 108.95], '南京': [32.06, 118.78],
  '重庆': [29.56, 106.55], '拉萨': [29.64, 91.11], '哈尔滨': [45.75, 126.63], '天津': [39.12, 117.20],
  '香港': [22.31, 114.17], '澳门': [22.19, 113.54], '大理': [25.61, 100.27], '乌鲁木齐': [43.82, 87.61]
}
map._404 = [121, 25]

c.MapRect = async (rwPts, rwAreaHov, onArea, pts2card = u => `<h3>${u.city}:Tag#${u.emo}</h3>`) => {

  map.onGlobe = () => map.setProjection({ type: c.prj == '3D' ? 'globe' : 'mercator' })
  map.popup = s => With(new maplibregl.Popup({ closeOnClick: true }).trackPointer().setHTML(s).addTo(map), u => {
    map.getCanvasContainer().dispatchEvent(new MouseEvent('mousemove', { clientX: map.xy.x, clientY: map.xy.y, bubbles: true }));
  })
  map.on('mousemove', (e) => { map.xy = e.point; });

  map.newP = P => ({ 'type': 'FeatureCollection', 'features': P })
  map.getP = useMemoKV(key => map.querySourceFeatures('provinces').find(u => u.properties.name.includes(key)));
  map.addUI = yml => Object.entries(jsyaml.load(yml)).forEach(([key, c]) => {
    let [m, id, type] = /(.*)-(.*)/.exec(key)
    c.source = c.source ?? /(.*?)-/.exec(key)[1]
    map.addLayer({ id, type, ...c });
  });
  // 球体颜色主题+中文，增加沉浸感
  map.preproc = (yellow = new Set(['road_primary', 'road_secondary', 'road_trunk', 'road_motorway'])) => map.getStyle().layers.forEach((layer) => {
    let k = layer.id, isBW = ['#f8f4f0', 'rgb(12,12,12)'].includes(map.getStyle().layers[0]?.paint?.["background-color"])

    if (yellow.has(k)) map.setPaintProperty(k, 'line-color', '#70e0e0');
    if (isBW && layer.layout && layer.layout['text-field']) {
      map.setLayoutProperty(k, 'text-field', [
        'coalesce', ['get', 'name:zh'], ['get', 'name']
      ]);
    }
  })


  await useEntry(map, 'load')
  map.onGlobe()
  map.preproc()

  // 添加数据源，并提升 'adcode' 属性为要素 ID
  map.addSource('cities', {
    'type': 'geojson', data: map.newP([]),

    cluster: true,
    clusterMaxZoom: 14, // 当缩放级别大于 14 时，打散所有聚合 point_count
    clusterRadius: 50,  // 聚合半径（像素）
  })
  map.addSource('provinces', {
    type: 'geojson',
    data: './citi.json',
    promoteId: 'adcode' // 用于 setFeatureState 和 filter
  });
  map.addUI(c.APP)

  /// 用于：当前悬停foc的省份ID
  let
    hov = useOldValue(id => map.setFeatureState({ source: 'provinces', id }, { hover: false })),
    foc = useOldValue((_, k) => {
      CSS.fx(() => map.setFilter('provinces-area-active', ['==', 'adcode', map.getP(k).id]))
        .finished.then(() => onArea(k.replace(/[省市]$/, '')))
    }, 'Taps'),

    ec = map.getCanvas().style,
    setsEmo = useMemoKV(useCount((i, k) => (map.addImage(i, emo2png(k).getContext('2d').getImageData(0, 0, 64, 64)), i))),
    setsPos = useMemoKV((k, v) => (v = CHINA_CITIES_DB[k]) ? [...v].reverse() : (v = map.getP(k), v ? JSON.parse(v.properties.centroid) : map._404))

  let
    eHov = new maplibregl.Popup({ closeButton: false, closeOnClick: false }).trackPointer().addTo(map),
    kHov = { 310000: '上海悬停' }

  // 我们监听 'provinces-area' 图层，这样只有点击到省份时才会触发
  Object.entries({
    click: e => foc(e.features[0]?.properties?.name),
    mouseenter: () => { ec.cursor = 'help'; }, mouseleave: () => { ec.cursor = ''; hov(0); eHov.setHTML('') },

    mousemove: (e, k) => {
      k = e.features[0]?.id
      if (!!k) {
        map.setFeatureState(
          { source: 'provinces', id: hov(k) },
          { hover: true }
        );
        eHov.setHTML(kHov[k] ?? '')
      }
    },
  }).forEach(([k, f]) => {
    map.on(k, 'provinces-area', f);
  });


  // 将点数据转换为 GeoJSON 格式
  rwPts(set =>
    map.getSource('cities').setData(map.newP(set.map(P => ({
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': setsPos(P.city)
      },
      'properties': { ...P, 'emo': setsEmo(P.emo) }
    })
    ))))

  rwAreaHov(set => (kHov = {}, set.forEach(([k, heat, htm]) => {
    if (!(k = map.getP(k)?.id)) return
    kHov[k] = htm
    map.setFeatureState({ source: 'provinces', id: k }, { heat });
  })))

  // 监听聚合圈的点击事件
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const id = features[0].properties.cluster_id;

    map.getSource('cities').getClusterExpansionZoom(id, (err, zoom) => {
      if (!err) map.easeTo({ zoom, center: features[0].geometry.coordinates });
    });
  });
  // 城市点图层点击事件，弹出 Popup
  map.on('click', 'cities-emo', (e) => {
    const xy = e.features[0].geometry.coordinates.slice();

    // 确保在地图上移动时，即使经度超过 +/-180 度，Popup 也能正确显示
    while (Math.abs(e.lngLat.lng - xy[0]) > 180) {
      xy[0] += e.lngLat.lng > xy[0] ? 360 : -360;
    }

    new maplibregl.Popup({ closeOnClick: !e.originalEvent.ctrlKey })
      .setLngLat(xy)
      .setHTML(pts2card(e.features[0].properties))
      .addTo(map);
  });

  await useEntry(map, 'idle')
  let e = qs(`#map`).style; e.setProperty('--t', '100%')
  setTimeout(() => e.mask = 'none', 1000)
}
  ; (async () => {
    let pg = FnHoles()
    await c.MapRect(pg.pts, pg.prov, console.info)
    pg.pts([
      { city: '北京', emo: '🎯' },
      { city: '上海', emo: '✨' }
    ])
    pg.prov([
      ['北京', 0.4, '你好'],
      ['台湾', 0., '你好']
    ])
  })()