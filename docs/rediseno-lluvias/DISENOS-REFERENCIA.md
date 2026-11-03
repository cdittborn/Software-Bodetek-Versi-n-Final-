# Diseños de referencia · Rediseño Bodetek

Código fuente de los 13 diseños aprobados (formato de un editor de diseño). Úsalos como referencia de estructura, textos, tamaños y colores; se reimplementan con Next.js + Tailwind + shadcn, no se copian tal cual. Los archivos Movil* muestran la versión celular (390 px) de la pantalla que importan.

## Sidebar.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Menú lateral Bodetek</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0}
.sb a{text-decoration:none}
.sb .mod{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;color:#1b1d28;font-size:13.5px;min-height:34px;box-sizing:border-box}
.sb .mod:hover{background:#EEF1F7;color:#1b1d28}
.sb .mod.on{background:#E9EEFD;color:#2B4FCF;font-weight:600}
.sb .cat{display:flex;align-items:center;gap:8px;flex:1;min-width:0;border:0;background:transparent;padding:6px 10px;font:600 12.5px 'IBM Plex Sans',sans-serif;color:#3A3F4E;cursor:pointer;text-align:left;border-radius:8px;min-height:32px}
.sb .cat:hover{background:#EEF1F7}
.sb .sq{width:9px;height:9px;border-radius:3px;flex:none}
.sb .chev{color:#A3A8B6;margin-left:auto;flex:none}
.sb .subs{margin:0 0 6px 14px;padding-left:10px;border-left:1.5px solid}
.sb .it{display:flex;align-items:center;gap:9px;padding:5px 10px;border-radius:7px;color:#3A3F4E;font-size:13px;min-height:30px;box-sizing:border-box}
.sb a.it:hover{background:#EEF1F7;color:#1b1d28}
.sb .it.on{background:#fff;color:#1b1d28;font-weight:600;box-shadow:0 0 0 1px #E3E6EE}
.sb .pt{width:5px;height:5px;border-radius:50%;flex:none}
.sb .ib{width:26px;height:26px;border:0;background:transparent;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;color:#8A8FA0;cursor:pointer;flex:none;padding:0}
.sb .ib:hover{background:#E3E7F0;color:#1b1d28}
.sb .ib.del:hover{background:#FCE9EB;color:#C23B4A}
.sb .inp{flex:1;min-width:0;border:1px solid transparent;background:transparent;border-radius:6px;padding:4px 6px;font:500 13px 'IBM Plex Sans',sans-serif;color:#1b1d28}
.sb .inp:hover{border-color:#E3E6EE}
.sb .inp:focus{outline:0;border-color:#4363E0;background:#fff}
.sb .inp.c{font-weight:600}
.sb .add{display:flex;align-items:center;gap:8px;border:0;background:transparent;padding:5px 10px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:#5f6474;cursor:pointer;min-height:30px;border-radius:7px}
.sb .add:hover{color:#2B4FCF;background:#EEF1F7}
.sb .conf{display:flex;align-items:center;gap:8px;padding:6px 10px;margin:2px 0 4px;border-radius:8px;background:#FCF1F2;font-size:12.5px;color:#7A2530}
.sb .conf button{border:0;border-radius:6px;padding:3px 9px;font:600 12px 'IBM Plex Sans',sans-serif;cursor:pointer}
.sb-bar{display:none}
.sb-full{display:flex;flex-direction:column;flex:1}
@media (max-width:760px){
.sb-bar{display:flex}
.sb-full{display:none}
.sb-full.open{display:flex}
.sb-root{min-height:0 !important}
.sb-brand{display:none !important}
}
</style>
</helmet>
<div class="sb sb-root" style="width: 100%; box-sizing: border-box; font-family: 'IBM Plex Sans', system-ui, sans-serif; color: #1b1d28; display: flex; flex-direction: column; min-height: 1000px">
  <div class="sb-bar" style="align-items: center; gap: 10px; padding: 6px 8px 6px 16px; background: #fff; border-bottom: 1px solid #E8EBF2">
    <div style="width: 26px; height: 26px; border-radius: 7px; background: #c8102e; color: #fff; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center">B</div>
    <span style="font-weight: 600; font-size: 14.5px; flex: 1">Bodetek</span>
    <button onClick="{{toggleMenu}}" aria-expanded="{{menuAria}}" aria-label="Abrir menú" style="width: 44px; height: 44px; border: 0; background: transparent; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1b1d28; cursor: pointer">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
  <div class="sb-brand" style="display: flex; align-items: center; gap: 10px; padding: 16px 16px 12px">
    <div style="width: 28px; height: 28px; border-radius: 7px; background: #c8102e; color: #fff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center">B</div>
    <div>
      <div style="font-weight: 600; font-size: 14.5px; line-height: 1.2">Bodetek</div>
      <div style="font-size: 11.5px; color: #6E7383">Lunes 2 de noviembre</div>
    </div>
  </div>

  <div class="sb-full {{fullCls}}">
  <nav style="padding: 4px 8px; display: flex; flex-direction: column; gap: 1px" aria-label="Módulos">
    <a href="Main.dc.html" class="mod on">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Trabajos</a>
    <a href="#" class="mod">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-7h6v7"/></svg>Recintos</a>
    <a href="#" class="mod">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 7l3-3 3 3-3 3"/><path d="M17 4v9a4 4 0 0 1-4 4H4"/><path d="M7 14l-3 3 3 3"/></svg>Proveedores</a>
    <a href="#" class="mod">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>Usuarios</a>
  </nav>

  <div style="display: flex; align-items: center; justify-content: space-between; margin: 10px 8px 4px; padding: 12px 10px 2px; border-top: 1px solid #E8EBF2">
    <span style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #6E7383">Categorías</span>
    <sc-if value="{{noEdit}}" hint-placeholder-val="{{true}}">
      <a href="MenuEditar.dc.html" class="ib" aria-label="Editar categorías" title="Editar categorías">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>
      </a>
    </sc-if>
    <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
      <a href="Main.dc.html" style="font-size: 12.5px; font-weight: 600; color: #fff; background: #4363E0; border-radius: 7px; padding: 4px 12px">Listo</a>
    </sc-if>
  </div>
  <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
    <div style="margin: 0 18px 8px; font-size: 12px; color: #6E7383; line-height: 1.45">Escribe sobre un nombre para cambiarlo. Toca el cuadrito de color para cambiar el color de la categoría.</div>
  </sc-if>

  <div style="padding: 0 8px; display: flex; flex-direction: column; gap: 2px; flex: 1">
    <sc-for list="{{cats}}" as="c" hint-placeholder-count="6">
      <div>
        <sc-if value="{{noEdit}}" hint-placeholder-val="{{true}}">
          <button class="cat" onClick="{{c.toggle}}" aria-expanded="{{c.aria}}" style="width: 100%">
            <span class="sq" style="background: {{c.color}}"></span>
            <span style="flex: 1; min-width: 0">{{c.label}}</span>
            <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="transform: {{c.rot}}" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </sc-if>

        <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
          <div style="display: flex; align-items: center; gap: 4px; padding: 4px 2px 4px 4px">
            <span style="color: #B5BAC6; cursor: grab; display: flex" aria-hidden="true"><svg width="10" height="14" viewBox="0 0 12 16" fill="currentColor"><circle cx="3" cy="3" r="1.4"/><circle cx="9" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="9" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="9" cy="13" r="1.4"/></svg></span>
            <button onClick="{{c.recolor}}" aria-label="Cambiar color de {{c.label}}" style="width: 22px; height: 22px; border: 0; background: transparent; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer"><span class="sq" style="background: {{c.color}}; width: 11px; height: 11px"></span></button>
            <input class="inp c" value="{{c.label}}" onChange="{{c.rename}}" aria-label="Nombre de la categoría">
            <button class="ib" onClick="{{c.up}}" aria-label="Subir {{c.label}}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
            <button class="ib" onClick="{{c.down}}" aria-label="Bajar {{c.label}}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
            <button class="ib del" onClick="{{c.askDel}}" aria-label="Eliminar {{c.label}}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
          </div>
          <sc-if value="{{c.confirm}}" hint-placeholder-val="{{false}}">
            <div class="conf">
              <span style="flex: 1">¿Eliminar la categoría y sus {{c.nsubs}} subcategorías?</span>
              <button onClick="{{c.del}}" style="background: #C23B4A; color: #fff">Eliminar</button>
              <button onClick="{{cancel}}" style="background: #fff; color: #3A3F4E">No</button>
            </div>
          </sc-if>
        </sc-if>

        <sc-if value="{{c.open}}" hint-placeholder-val="{{true}}">
          <div class="subs" style="border-left-color: {{c.tint}}">
            <sc-for list="{{c.items}}" as="it" hint-placeholder-count="2">
              <div>
                <sc-if value="{{noEdit}}" hint-placeholder-val="{{true}}">
                  <a href="{{it.href}}" class="it {{it.cls}}"><span class="pt" style="background: {{c.color}}"></span><span style="flex: 1; min-width: 0">{{it.label}}</span></a>
                </sc-if>
                <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
                  <div style="display: flex; align-items: center; gap: 4px; padding: 1px 0">
                    <span style="color: #B5BAC6; cursor: grab; display: flex" aria-hidden="true"><svg width="9" height="13" viewBox="0 0 12 16" fill="currentColor"><circle cx="3" cy="3" r="1.4"/><circle cx="9" cy="3" r="1.4"/><circle cx="3" cy="8" r="1.4"/><circle cx="9" cy="8" r="1.4"/><circle cx="3" cy="13" r="1.4"/><circle cx="9" cy="13" r="1.4"/></svg></span>
                    <span class="pt" style="background: {{c.color}}; margin: 0 2px 0 4px"></span>
                    <input class="inp" value="{{it.label}}" onChange="{{it.rename}}" aria-label="Nombre de la subcategoría">
                    <button class="ib" onClick="{{it.up}}" aria-label="Subir {{it.label}}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
                    <button class="ib" onClick="{{it.down}}" aria-label="Bajar {{it.label}}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
                    <button class="ib del" onClick="{{it.askDel}}" aria-label="Eliminar {{it.label}}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
                  </div>
                  <sc-if value="{{it.confirm}}" hint-placeholder-val="{{false}}">
                    <div class="conf">
                      <span style="flex: 1">¿Eliminar esta subcategoría?</span>
                      <button onClick="{{it.del}}" style="background: #C23B4A; color: #fff">Eliminar</button>
                      <button onClick="{{cancel}}" style="background: #fff; color: #3A3F4E">No</button>
                    </div>
                  </sc-if>
                </sc-if>
              </div>
            </sc-for>
            <sc-if value="{{c.vacia}}" hint-placeholder-val="{{false}}">
              <div style="padding: 4px 10px; font-size: 12px; color: #8A8FA0">Sin subcategorías</div>
            </sc-if>
            <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
              <button class="add" onClick="{{c.add}}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                Agregar subcategoría
              </button>
            </sc-if>
          </div>
        </sc-if>
      </div>
    </sc-for>
    <sc-if value="{{edit}}" hint-placeholder-val="{{false}}">
      <button class="add" onClick="{{addCat}}" style="margin-top: 8px; border: 1px dashed #D3D7E0; justify-content: center; min-height: 36px">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        Nueva categoría
      </button>
    </sc-if>
  </div>

  <div style="border-top: 1px solid #E8EBF2; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; margin-top: 16px">
    <div>
      <div style="font-size: 13px; font-weight: 500">Cristóbal Dittborn</div>
      <div style="font-size: 11.5px; color: #6E7383">Admin</div>
    </div>
    <a href="#" style="font-size: 12.5px; color: #5f6474">Salir</a>
  </div>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"abierto":{"editor":"boolean","default":false},"active":{"editor":"enum","options":["","lluvias"],"default":""},"modo":{"editor":"enum","options":["normal","editar"],"default":"normal"},"$preview":{"width":260,"height":1100}}'>
class Component extends DCLogic {
  constructor(props) {
    super(props);
    const C = (id, label, ci, subs) => ({ id, label, ci, subs: subs.map((s, i) => ({ id: id + '-' + i, label: s, code: s === 'Lluvias y temporales' ? 'LLU' : '' })) });
    this.state = {
      closed: { pat: true, ocd: true },
      menu: props.abierto === true || props.abierto === 'true',
      confirm: null,
      n: 0,
      cats: [
        C('tec', 'Techumbres y canales', 0, ['Lluvias y temporales', 'Revisiones y mantenciones']),
        C('ima', 'Imagen', 1, ['Fachadas', 'Letreros de locales', 'Pórtico de entrada']),
        C('pat', 'Patentes', 2, ['Clientes con patentes', 'Recepción de obras']),
        C('pro', 'Protocolos', 3, []),
        C('seg', 'Seguridad', 4, []),
        C('otr', 'Otros', 5, []),
        C('ocd', 'Otros trabajos CD', 6, ['Administración de propiedades', 'Bodetek', 'Grupo BD', 'Hacienda Los Aromos', 'Parque Imaginario', 'Personales', 'Premios Chile Naturaleza', 'Viaje', 'Vías Condominio Vicuña', 'Otros'])
      ]
    };
    this.pal = [
      ['#5E87D6', '#C9D8F2'], ['#9682CF', '#DDD6F0'], ['#4E9E92', '#C6E2DE'], ['#C9973F', '#EDDDBF'],
      ['#C7707D', '#EFD0D5'], ['#8A90A0', '#DADDE4'], ['#5E9E70', '#CBE3D2']
    ];
  }
  move(arr, i, d) {
    const j = i + d;
    if (j < 0 || j >= arr.length) return arr;
    const a = arr.slice();
    const t = a[i]; a[i] = a[j]; a[j] = t;
    return a;
  }
  renderVals() {
    const edit = this.props.modo === 'editar';
    const active = this.props.active || '';
    const cats = this.state.cats;
    const conf = this.state.confirm;
    const setCats = (next) => this.setState({ cats: next, confirm: null });
    const mapCat = (ci, fn) => cats.map((x, k) => k === ci ? fn(x) : x);
    return {
      edit, noEdit: !edit,
      fullCls: (edit || this.state.menu) ? 'open' : '',
      menuAria: this.state.menu ? 'true' : 'false',
      toggleMenu: () => this.setState({ menu: !this.state.menu }),
      cancel: () => this.setState({ confirm: null }),
      addCat: () => {
        const n = this.state.n + 1;
        this.setState({ n, confirm: null, cats: cats.concat([{ id: 'n' + n, label: 'Nueva categoría', ci: cats.length % this.pal.length, subs: [] }]) });
      },
      cats: cats.map((c, ci) => {
        const open = edit || !this.state.closed[c.id];
        const p = this.pal[c.ci % this.pal.length];
        return {
          label: c.label, color: p[0], tint: p[1], open, aria: open ? 'true' : 'false',
          rot: open ? 'rotate(90deg)' : 'none',
          vacia: c.subs.length === 0 && !edit,
          nsubs: c.subs.length,
          confirm: conf === c.id,
          toggle: () => this.setState({ closed: { ...this.state.closed, [c.id]: open } }),
          recolor: () => setCats(mapCat(ci, (x) => ({ ...x, ci: (x.ci + 1) % this.pal.length }))),
          rename: (e) => setCats(mapCat(ci, (x) => ({ ...x, label: e.target.value }))),
          up: () => setCats(this.move(cats, ci, -1)),
          down: () => setCats(this.move(cats, ci, 1)),
          askDel: () => this.setState({ confirm: c.id }),
          del: () => setCats(cats.filter((_, k) => k !== ci)),
          add: () => {
            const n = this.state.n + 1;
            this.setState({ n, confirm: null, cats: mapCat(ci, (x) => ({ ...x, subs: x.subs.concat([{ id: 's' + n, label: 'Nueva subcategoría', code: '' }]) })) });
          },
          items: c.subs.map((s, si) => ({
            label: s.label,
            cls: (active === 'lluvias' && s.code === 'LLU') ? 'on' : '',
            href: s.code === 'LLU' ? 'Eventos.dc.html' : '#',
            confirm: conf === s.id,
            rename: (e) => setCats(mapCat(ci, (x) => ({ ...x, subs: x.subs.map((y, k) => k === si ? { ...y, label: e.target.value } : y) }))),
            up: () => setCats(mapCat(ci, (x) => ({ ...x, subs: this.move(x.subs, si, -1) }))),
            down: () => setCats(mapCat(ci, (x) => ({ ...x, subs: this.move(x.subs, si, 1) }))),
            askDel: () => this.setState({ confirm: s.id }),
            del: () => setCats(mapCat(ci, (x) => ({ ...x, subs: x.subs.filter((_, k) => k !== si) })))
          }))
        };
      })
    };
  }
}
</script>
</body>
</html>
```

## Main.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Trabajos · Inicio</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 14px !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 900px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 248px; max-width: 260px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="" modo="normal" hint-size="100%,1000px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column">
    <header style="padding: 22px 32px 18px; border-bottom: 1px solid #E8EBF2">
      <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #6E7383">Trabajos</div>
      <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Trabajos</h1>
      <p style="margin: 0; font-size: 13px; color: #5f6474">Elige una categoría del menú para ver sus trabajos.</p>
    </header>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px 24px">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 360px">
        <div style="width: 52px; height: 52px; border-radius: 14px; background: #F2F4FA; color: #6E7383; display: flex; align-items: center; justify-content: center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="16" rx="2"/><path d="M14 8h7M14 12h7M14 16h4"/></svg>
        </div>
        <div style="font-size: 15px; font-weight: 600">Nada seleccionado</div>
        <div style="font-size: 13px; color: #5f6474">Abre una categoría del menú de la izquierda para empezar.</div>
      </div>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## MenuEditar.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Editar categorías</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 14px !important}
main>div{margin:16px !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 1100px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 280px; max-width: 300px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="" modo="editar" hint-size="100%,1100px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column">
    <header style="padding: 22px 32px 18px; border-bottom: 1px solid #E8EBF2">
      <div style="font-size: 10.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: #6E7383">Trabajos</div>
      <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Editando categorías</h1>
      <p style="margin: 0; font-size: 13px; color: #5f6474">Los cambios del menú se guardan al tocar Listo.</p>
    </header>
    <div style="max-width: 560px; margin: 32px; border: 1px solid #E8EBF2; border-radius: 10px">
      <div style="padding: 14px 18px; border-bottom: 1px solid #E8EBF2; font-size: 14px; font-weight: 600">Qué puedes hacer en el menú</div>
      <div style="padding: 6px 18px 12px; display: flex; flex-direction: column; font-size: 13.5px; color: #3A3F4E">
        <div style="padding: 9px 0; border-bottom: 1px solid #F0F2F6">Cambiar el nombre escribiendo sobre él</div>
        <div style="padding: 9px 0; border-bottom: 1px solid #F0F2F6">Ordenar con las flechas o arrastrando desde los puntitos</div>
        <div style="padding: 9px 0; border-bottom: 1px solid #F0F2F6">Agregar subcategorías al final de cada categoría</div>
        <div style="padding: 9px 0; border-bottom: 1px solid #F0F2F6">Agregar una categoría nueva al final del menú</div>
        <div style="padding: 9px 0">Eliminar con el basurero; siempre pide confirmar</div>
      </div>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1100}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## Eventos.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Lluvias y temporales · Eventos</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#2B4FCF}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:#4363E0;color:#fff;border:0;border-radius:8px;padding:9px 16px;font:600 13.5px 'IBM Plex Sans',sans-serif;min-height:40px;cursor:pointer}
.btn-primary:hover{background:#3550C4;color:#fff}
.tag{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap}
.ev{display:flex;align-items:center;gap:20px;padding:14px 18px;border-bottom:1px solid #F0F2F6;color:#1b1d28}
.eyebrow{color:#6E7383 !important}
.ev:hover{background:#FAFBFD;color:#1b1d28}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 14px !important}
main>div{padding:18px 16px 40px !important}
.ev{flex-wrap:wrap;gap:8px 12px;padding:14px 16px}
.ev>div:first-child{flex:1 1 0 !important}
.ev>div:nth-child(2){order:3;flex:1 1 100% !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 900px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 248px; max-width: 260px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="lluvias" modo="normal" hint-size="100%,1000px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0">
    <header style="padding: 22px 32px 18px; border-bottom: 1px solid #E8EBF2; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
      <div>
        <div class="eyebrow">Techumbres y canales</div>
        <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Lluvias y temporales</h1>
        <p style="margin: 0; font-size: 13px; color: #5f6474">Cada evento agrupa las filtraciones de un temporal, recinto por recinto.</p>
      </div>
      <button class="btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        Nuevo evento
      </button>
    </header>

    <div style="max-width: 980px; margin: 0 auto; padding: 28px 32px">
      <div style="border: 1px solid #E8EBF2; border-radius: 10px; overflow: hidden">
      <div style="display: flex; align-items: baseline; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #E8EBF2">
        <span style="font-size: 14px; font-weight: 600">Eventos</span>
        <span style="font-size: 12.5px; color: #6E7383">3 eventos</span>
      </div>
      <sc-for list="{{eventos}}" as="ev" hint-placeholder-count="3">
        <a href="Evento.dc.html" class="ev">
          <div style="flex: 3 1 0; min-width: 0">
            <div style="font-weight: 600; font-size: 14px">{{ev.nombre}}</div>
            <div style="font-size: 12px; color: #6E7383">{{ev.fecha}} · {{ev.recintos}} recintos</div>
          </div>
          <div style="flex: 3 1 0; display: flex; align-items: center; gap: 12px">
            <div style="flex: 1; height: 6px; background: #EEF0F5; border-radius: 99px; overflow: hidden">
              <div style="height: 100%; background: #2F9E5B; border-radius: 99px; width: {{ev.pct}}"></div>
            </div>
            <span style="font-size: 12.5px; color: #3A3F4E; white-space: nowrap; width: 150px"><b>{{ev.entregados}}</b> de {{ev.recintos}} entregados</span>
          </div>
          <div style="width: 110px; display: flex; align-items: center; gap: 7px; font-size: 13px; color: #3A3F4E"><span style="width: 7px; height: 7px; border-radius: 50%; background: {{ev.dot}}"></span>{{ev.estado}}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A8B6" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </a>
      </sc-for>
      </div>
      <p style="margin: 14px 8px 0; font-size: 12px; color: #6E7383">Los dos eventos anteriores son ilustrativos, para ver cómo queda la lista con varios temporales.</p>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic {
  renderVals() {
    const enCurso = { estado: 'En curso', dot: '#D9822B' };
    const listo = { estado: 'Terminado', dot: '#2F9E5B' };
    return {
      eventos: [
        { nombre: 'Temporal 16 ago 2026', fecha: '16 de agosto de 2026', recintos: 29, entregados: 18, pct: '62%', ...enCurso },
        { nombre: 'Lluvias junio 2026', fecha: '24 de junio de 2026', recintos: 12, entregados: 12, pct: '100%', ...listo },
        { nombre: 'Temporal mayo 2025', fecha: '30 de mayo de 2025', recintos: 7, entregados: 7, pct: '100%', ...listo }
      ]
    };
  }
}
</script>
</body>
</html>
```

## Evento.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Temporal 16 ago 2026 · Filtraciones</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#6E7383}
.btn-primary{display:inline-flex;align-items:center;gap:8px;background:#4363E0;color:#fff;border:0;border-radius:8px;padding:9px 16px;font:600 13.5px 'IBM Plex Sans',sans-serif;min-height:40px;cursor:pointer}
.btn{display:inline-flex;align-items:center;gap:6px;background:#fff;color:#3A3F4E;border:1px solid #DDE1EA;border-radius:8px;padding:6px 12px;font:500 13px 'IBM Plex Sans',sans-serif;min-height:34px;cursor:pointer;box-sizing:border-box}
.btn:hover{border-color:#4363E0;color:#2B4FCF}
.tabs a{color:#5f6474;font-size:13.5px;font-weight:500;padding:10px 0;border-bottom:2px solid transparent;white-space:nowrap}
.tabs a.on{color:#1b1d28;font-weight:600;border-bottom-color:#4363E0}
.box{border:1px solid #E8EBF2;border-radius:10px;background:#fff}
.box-h{display:flex;align-items:baseline;gap:10px;padding:14px 18px;border-bottom:1px solid #E8EBF2}
.box-h h2,.box-h h3{margin:0;font-size:14px;font-weight:600}
.cnt{font-size:12.5px;color:#6E7383}
.st{display:inline-flex;align-items:center;gap:7px;font-size:13px;white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
.kpi{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 18px;border:0;border-top:1px solid #F0F2F6;background:transparent;font:400 13.5px 'IBM Plex Sans',sans-serif;color:#3A3F4E;cursor:pointer;text-align:left;min-height:42px;width:100%}
.kpi:hover{background:#FAFBFD}
table{border-collapse:collapse;width:100%;min-width:960px}
th{font-size:12px;font-weight:500;color:#6E7383;text-align:left;padding:10px 18px;border-bottom:1px solid #F0F2F6;white-space:nowrap}
td{padding:12px 18px;border-bottom:1px solid #F0F2F6;vertical-align:middle;font-size:13.5px}
tr:last-child td{border-bottom:0}
tr:hover td{background:#FAFBFD}
.m{color:#6E7383;font-size:12.5px}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 0 !important}
main>div{padding:18px 16px 40px !important}
.r2{grid-template-columns:minmax(0,1fr) !important}
.r4{grid-template-columns:repeat(2,minmax(0,1fr)) !important;row-gap:12px !important}
.tbl table,.tbl tbody,.tbl tr,.tbl td{display:block;width:auto}
.tbl table{min-width:0 !important}
.tbl thead{display:none}
.tbl tr{padding:14px 16px;border-bottom:1px solid #F0F2F6}
.tbl tr:last-child{border-bottom:0}
.tbl td{padding:3px 0 !important;border:0 !important;max-width:none !important;white-space:normal !important}
.tbl td[data-l]{display:flex;gap:10px;flex-wrap:wrap}
.tbl td[data-l]::before{content:attr(data-l);color:#6E7383;font-size:12.5px;width:78px;flex:none}
.tbl td:last-child{text-align:left !important;padding-top:10px !important}
.tbl td:first-child{padding-bottom:6px !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 1500px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 248px; max-width: 260px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="lluvias" modo="normal" hint-size="100%,1000px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0">
    <header style="padding: 22px 32px 0; border-bottom: 1px solid #E8EBF2; display: flex; flex-direction: column; gap: 14px">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
        <div>
          <div class="eyebrow"><a href="Eventos.dc.html" style="color: #6E7383">Lluvias y temporales</a></div>
          <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Temporal 16 ago 2026</h1>
          <p style="margin: 0; font-size: 13px; color: #5f6474">29 recintos · actualizado hace 11 días</p>
        </div>
        <button class="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Nueva filtración
        </button>
      </div>
      <nav class="tabs" style="display: flex; gap: 24px; overflow-x: auto">
        <a href="#">Resumen</a>
        <a href="#" class="on">Filtraciones</a>
        <a href="#">Materiales</a>
        <a href="Cotizaciones.dc.html">Cotizaciones y facturas</a>
        <a href="Informe.dc.html">Informe para el seguro</a>
      </nav>
    </header>

    <div style="max-width: 1180px; margin: 0 auto; padding: 28px 32px 56px; display: flex; flex-direction: column; gap: 28px">

      <section class="r2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">
        <div class="box">
          <div class="box-h"><h2>Avance</h2></div>
          <div style="padding: 18px; display: flex; flex-direction: column; gap: 14px">
            <div style="display: flex; align-items: baseline; gap: 8px">
              <span style="font-size: 32px; font-weight: 600; line-height: 1">18</span>
              <span style="font-size: 14px; color: #5f6474">de 29 recintos entregados</span>
            </div>
            <div style="height: 6px; background: #EEF0F5; border-radius: 99px; overflow: hidden"><div style="width: 62%; height: 100%; background: #2F9E5B; border-radius: 99px"></div></div>
            <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
              <div><div style="font-size: 18px; font-weight: 600">18</div><div class="m">Entregado</div></div>
              <div><div style="font-size: 18px; font-weight: 600">3</div><div class="m">Ejecutado</div></div>
              <div><div style="font-size: 18px; font-weight: 600">6</div><div class="m">En proceso</div></div>
              <div><div style="font-size: 18px; font-weight: 600">2</div><div class="m">Sin empezar</div></div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="box-h" style="justify-content: space-between"><h2>Por completar</h2><span class="cnt">Toca una fila para filtrar</span></div>
          <div style="padding: 4px 0">
            <sc-for list="{{kpis}}" as="k" hint-placeholder-count="6">
              <button class="kpi">
                <span>{{k.label}}</span>
                <span style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: {{k.color}}">
                  <sc-if value="{{k.warn}}" hint-placeholder-val="{{false}}"><span class="dot" style="background: #D9822B"></span></sc-if>
                  {{k.n}}
                </span>
              </button>
            </sc-for>
          </div>
        </div>
      </section>

      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600">Filtraciones</h2>
        <span class="cnt">por gravedad</span>
        <span style="flex: 1"></span>
        <label style="flex: 0 1 300px; display: flex; align-items: center; gap: 8px; border: 1px solid #DDE1EA; border-radius: 8px; padding: 0 10px; min-height: 36px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E7383" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input placeholder="Buscar recinto o arrendatario" aria-label="Buscar recinto o arrendatario" style="border: 0; outline: 0; flex: 1; font: 400 13px 'IBM Plex Sans',sans-serif; background: transparent">
        </label>
        <button class="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
          Filtros
        </button>
      </div>

      <sc-for list="{{grupos}}" as="g" hint-placeholder-count="4">
        <section class="box">
          <div class="box-h">
            <span class="dot" style="background: {{g.dot}}; align-self: center"></span>
            <h3>{{g.titulo}}</h3>
            <span class="cnt">{{g.cuenta}}</span>
          </div>
          <div class="tbl" style="overflow-x: auto">
            <table>
              <thead>
                <tr><th style="width: 22%">Recinto</th><th>Estado</th><th>Problemas</th><th>Fotos</th><th>Ejecución</th><th>Entrega</th><th>Pendiente</th><th><span style="position: absolute; left: -9999px">Acciones</span></th></tr>
              </thead>
              <tbody>
                <sc-for list="{{g.filas}}" as="r" hint-placeholder-count="3">
                  <tr>
                    <td>
                      <div style="font-weight: 600">{{r.codigo}}</div>
                      <div class="m">{{r.arrendatario}}</div>
                    </td>
                    <td data-l="Estado"><span class="st"><span class="dot" style="background: {{r.eDot}}"></span>{{r.estado}}</span></td>
                    <td data-l="Problemas" style="color: #3A3F4E; max-width: 200px">{{r.tipos}}</td>
                    <td data-l="Fotos" style="white-space: nowrap">
                      <div>{{r.antes}} antes</div>
                      <div style="color: {{r.despColor}}">{{r.despues}}</div>
                    </td>
                    <td data-l="Ejecución">
                      <div>{{r.ejecutor}}</div>
                      <div class="m">{{r.proveedor}}</div>
                    </td>
                    <td data-l="Entrega" style="white-space: nowrap">
                      <div>{{r.entrega}}</div>
                      <div class="m" style="color: {{r.entregaColor}}">{{r.entregaNota}}</div>
                    </td>
                    <td data-l="Pendiente" style="white-space: nowrap; color: {{r.pendColor}}">{{r.pendiente}}</td>
                    <td style="text-align: right">
                      <a href="Ficha.dc.html" class="btn" aria-label="Editar {{r.codigo}}">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>
                        Editar
                      </a>
                    </td>
                  </tr>
                </sc-for>
              </tbody>
            </table>
          </div>
        </section>
      </sc-for>
      <p class="m" style="margin: 0">Arrendatarios y proveedores son ilustrativos.</p>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1500}}'>
class Component extends DCLogic {
  renderVals() {
    const E = { 'Entregado': '#2F9E5B', 'Ejecutado': '#8CC63F', 'En proceso': '#D9822B', 'Sin empezar': '#A3A8B6' };
    const raw = [
      ['1B', 'Servicios Norte', 'Crítico', 'Entregado', 'Techumbre, cielo, eléctrico y piso', 8, 24, 'Proveedor externo', 'Techos del Pacífico', '02-10-2026', 'Real', ''],
      ['7', 'Ferretería Andes', 'Crítico', 'Entregado', 'Techumbre, cielo, eléctrico y piso', 28, 40, 'Proveedor externo', 'Servicios Integrales Sur', '19-10-2026', 'Real', ''],
      ['2A', 'Izajes del Norte', 'Crítico', 'En proceso', 'Techumbre y eléctrico', 5, 0, 'Proveedor externo', 'Techos del Pacífico', '30-09-2026', 'Atrasada', 'Fotos después'],
      ['LOCAL 2 Y 3', 'Frigorífico Austral', 'Crítico', 'Entregado', 'Techumbre, cielo, eléctrico y piso', 18, 14, 'Ambos', 'Montajes RYM', '01-10-2026', 'Real', ''],
      ['LOCAL 5', 'Sellos Industriales', 'Crítico', 'Entregado', 'Techumbre, cielo y eléctrico', 11, 6, 'Ambos', 'Montajes RYM', '30-09-2026', 'Real', ''],
      ['4A', 'Hidráulica Costa', 'Medio', 'En proceso', 'Techumbre y cielo', 10, 0, 'Proveedor externo', 'Techos del Pacífico', '29-10-2026', 'Atrasada', 'Fotos después'],
      ['LOCAL 1 Y 2', 'Óptica Central', 'Medio', 'Ejecutado', 'Techumbre', 33, 11, 'Maestros Bodetek', '', '21-10-2026', 'Real', ''],
      ['5', 'Arquetipo Ltda.', 'Bajo', 'En proceso', 'Techumbre y eléctrico', 15, 7, 'Proveedor externo', 'Techos del Pacífico', '29-10-2026', 'Estimada', ''],
      ['LOCAL 4', 'Café Altiplano', 'Bajo', 'Sin empezar', 'Techumbre', 4, 0, 'Maestros Bodetek', '', '15-11-2026', 'Estimada', 'Fotos después'],
      ['ADMINISTRACION', 'Área común', 'Sin gravedad', 'Sin empezar', 'Cielo', 2, 0, 'Maestros Bodetek', '', '20-11-2026', 'Estimada', 'Gravedad']
    ];
    const fila = (r) => ({
      codigo: r[0], arrendatario: r[1], estado: r[3], eDot: E[r[3]], tipos: r[4],
      antes: r[5],
      despues: r[6] > 0 ? r[6] + ' después' : 'Sin después',
      despColor: r[6] > 0 ? '#3A3F4E' : '#B4610F',
      ejecutor: r[7], proveedor: r[8], entrega: r[9],
      entregaNota: r[10] === 'Real' ? 'Entregado' : (r[10] === 'Atrasada' ? 'Atrasada' : 'Estimada'),
      entregaColor: r[10] === 'Atrasada' ? '#B4610F' : '#6E7383',
      pendiente: r[11] || '—',
      pendColor: r[11] ? '#B4610F' : '#A3A8B6'
    });
    const G = [
      ['Crítico', '#D64545'], ['Medio', '#D9822B'], ['Bajo', '#A3A8B6'], ['Sin gravedad', '#DDE1EA']
    ];
    const totales = { 'Crítico': 8, 'Medio': 3, 'Bajo': 17, 'Sin gravedad': 1 };
    const grupos = G.map(([t, dot]) => {
      const filas = raw.filter((r) => r[2] === t).map(fila);
      const total = totales[t];
      return { titulo: t, dot, filas, cuenta: total + (total === 1 ? ' recinto' : ' recintos') + (total > filas.length ? ' · se muestran ' + filas.length : '') };
    });
    const kp = (n, label) => ({ n, label, warn: n > 0, color: n > 0 ? '#1b1d28' : '#A3A8B6' });
    return {
      grupos,
      kpis: [
        kp(11, 'Sin fotos de después'),
        kp(2, 'Entregas atrasadas'),
        kp(1, 'Sin gravedad'),
        kp(0, 'Sin fotos de antes'),
        kp(0, 'Sin planos'),
        kp(0, 'Sin ejecutor asignado')
      ]
    };
  }
}
</script>
</body>
</html>
```

## Ficha.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Editar filtración · 1B</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
.box{border:1px solid #E8EBF2;border-radius:10px;background:#fff}
.box-h{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #E8EBF2}
.box-h h2{margin:0;font-size:14.5px;font-weight:600}
.num{font-size:12.5px;font-weight:600;color:#6E7383;width:18px}
.ok{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#6E7383}
.box-b{padding:18px;display:flex;flex-direction:column;gap:16px}
.lbl{font-size:12.5px;font-weight:500;color:#5f6474;display:block;margin-bottom:6px}
.help{font-size:12px;color:#6E7383;margin-top:4px}
.field{width:100%;box-sizing:border-box;border:1px solid #DDE1EA;border-radius:8px;padding:9px 12px;font:400 14px 'IBM Plex Sans',sans-serif;color:#1b1d28;background:#fff;min-height:42px}
.field.ro{background:#F7F8FC;color:#5f6474;border-color:#EEF0F5}
textarea.field{min-height:92px;resize:vertical;line-height:1.5}
.seg{display:inline-flex;border:1px solid #DDE1EA;border-radius:8px;overflow:hidden}
.seg button{display:inline-flex;align-items:center;gap:8px;border:0;border-right:1px solid #DDE1EA;background:#fff;padding:8px 18px;font:500 13.5px 'IBM Plex Sans',sans-serif;color:#3A3F4E;min-height:40px;cursor:pointer}
.seg button:last-child{border-right:0}
.seg button.on{background:#1b1d28;color:#fff}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
.thumb{aspect-ratio:4/3;border-radius:8px;background:#EEF0F5;display:flex;align-items:center;justify-content:center;color:#8A8FA0;font-size:12px}
.add{aspect-ratio:4/3;border-radius:8px;border:1px dashed #C9CED8;background:#fff;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;color:#5f6474;font:500 12.5px 'IBM Plex Sans',sans-serif;cursor:pointer}
.tog{display:flex;align-items:center;gap:10px;border:1px solid #DDE1EA;border-radius:8px;padding:9px 12px;min-height:42px;box-sizing:border-box;font-size:13.5px;background:#fff;cursor:pointer}
.tog.on{border-color:#1b1d28}
.box2{width:16px;height:16px;border-radius:4px;border:1.5px solid #C3C9D2;display:flex;align-items:center;justify-content:center;flex:none;background:#fff}
.tog.on .box2{background:#1b1d28;border-color:#1b1d28}
.sub{border:1px solid #EEF0F5;border-radius:8px;background:#FAFBFD}
.sub-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px}
.st{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#3A3F4E}
@media (max-width:760px){
.froot{padding:0 !important;background:#F7F8FC !important}
.fmodal{border-radius:0 !important;box-shadow:none !important}
.fpad{padding:14px 12px !important}
.box-b{padding:14px !important}
.r2{grid-template-columns:minmax(0,1fr) !important}
.r4{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
.r6{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
.seg{display:flex}
.seg button{flex:1;justify-content:center}
}
</style>
</helmet>
<div class="froot" style="width: 100%; min-height: 2200px; box-sizing: border-box; background: rgba(27,29,40,0.35); padding: 48px 0; display: flex; justify-content: center; align-items: flex-start">
  <div class="fmodal" style="width: 100%; max-width: 900px; background: #F7F8FC; border-radius: 14px; box-shadow: 0 20px 50px rgba(15,23,42,0.22); overflow: hidden; display: flex; flex-direction: column">

    <div style="background: #fff; padding: 20px 24px; border-bottom: 1px solid #E8EBF2; display: flex; flex-direction: column; gap: 14px">
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px">
        <div>
          <div style="font-size: 12.5px; color: #6E7383">FLT-0001 · Temporal 16 ago 2026</div>
          <h1 style="margin: 2px 0 0; font-size: 20px; font-weight: 600">1B · Servicios Norte</h1>
        </div>
        <button aria-label="Cerrar" style="width: 36px; height: 36px; border: 0; background: #F2F4FA; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3F4E" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="flex: 1; height: 4px; background: #EEF0F5; border-radius: 99px; overflow: hidden"><div style="width: 96%; height: 100%; background: #1b1d28"></div></div>
        <span style="font-size: 12.5px; color: #5f6474; white-space: nowrap">Falta 1 dato · fecha real de Eléctrico</span>
      </div>
    </div>

    <div class="fpad" style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px">

      <section id="s1" class="box">
        <div class="box-h"><span class="num">1</span><h2>Datos generales</h2><span class="ok"><span class="dot" style="background: #2F9E5B"></span>Completo</span></div>
        <div class="box-b">
          <div class="r2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">
            <div>
              <label class="lbl" for="recinto">Recinto</label>
              <select id="recinto" class="field"><option>1B · Servicios Norte</option></select>
            </div>
            <div>
              <label class="lbl" for="fest">Entrega estimada</label>
              <input id="fest" class="field ro" value="30-09-2026" readonly>
              <div class="help">Se calcula sola con la fecha más lejana de los problemas.</div>
            </div>
          </div>
          <div>
            <span class="lbl">Gravedad</span>
            <div class="seg" role="radiogroup" aria-label="Gravedad">
              <button role="radio" aria-checked="true" class="on">Crítico</button>
              <button role="radio" aria-checked="false">Medio</button>
              <button role="radio" aria-checked="false">Bajo</button>
            </div>
          </div>
        </div>
      </section>

      <section id="s2" class="box">
        <div class="box-h"><span class="num">2</span><h2>Fotos antes</h2><span style="font-size: 12.5px; color: #6E7383">8 archivos</span><span class="ok"><span class="dot" style="background: #2F9E5B"></span>Completo</span></div>
        <div class="box-b">
          <div class="r6" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">
            <button class="add">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Agregar
            </button>
            <sc-for list="{{fotos}}" as="f" hint-placeholder-count="5"><div class="thumb">{{f}}</div></sc-for>
          </div>
        </div>
      </section>

      <section id="s3" class="box">
        <div class="box-h"><span class="num">3</span><h2>Fotos después</h2><span style="font-size: 12.5px; color: #6E7383">24 archivos</span><span class="ok"><span class="dot" style="background: #2F9E5B"></span>Completo</span></div>
        <div class="box-b">
          <div class="r6" style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">
            <button class="add">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Agregar
            </button>
            <sc-for list="{{fotos}}" as="f" hint-placeholder-count="5"><div class="thumb">{{f}}</div></sc-for>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: #6E7383">
            <span>Se necesita al menos una para marcar Ejecutado o Entregado.</span>
            <a href="#" style="font-weight: 500">Ver las 24</a>
          </div>
        </div>
      </section>

      <section id="s4" class="box">
        <div class="box-h"><span class="num">4</span><h2>Diagnóstico y plan</h2><span class="ok"><span class="dot" style="background: #D9822B"></span>Falta 1 dato</span></div>
        <div class="box-b">
          <div>
            <span class="lbl">Tipos de problema</span>
            <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px">
              <label class="tog on"><span class="box2"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>Techumbre</label>
              <label class="tog on"><span class="box2"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>Cielo</label>
              <label class="tog on"><span class="box2"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>Eléctrico</label>
              <label class="tog on"><span class="box2"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>Suciedad en piso</label>
            </div>
          </div>

          <div class="sub" style="background: #fff">
            <div class="sub-h" style="border-bottom: 1px solid #EEF0F5">
              <b style="font-size: 14px">Techumbre</b>
              <span class="st"><span class="dot" style="background: #2F9E5B"></span>Entregado</span>
            </div>
            <div class="r2" style="padding: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px">
              <div>
                <label class="lbl" for="d1">Descripción del problema</label>
                <textarea id="d1" class="field">Canaleta en pared poniente en muy mal estado; colapsa con las lluvias y filtra agua hacia el interior. La cubierta tiene roturas por falta de mantención.</textarea>
              </div>
              <div>
                <label class="lbl" for="p1">Plan de acción</label>
                <textarea id="p1" class="field">Retirar la canaleta dañada e instalar una nueva. Reparar roturas en la techumbre. Instalar bajada de aguas lluvias.</textarea>
              </div>
              <div>
                <label class="lbl" for="e1">Ejecutado por</label>
                <select id="e1" class="field"><option>Proveedor externo</option><option>Maestros Bodetek</option><option>Sin asignar</option></select>
              </div>
              <div>
                <label class="lbl" for="pv1">Proveedor</label>
                <select id="pv1" class="field"><option>Techos del Pacífico</option></select>
              </div>
              <div>
                <label class="lbl" for="st1">Estado</label>
                <select id="st1" class="field"><option>Entregado</option><option>Ejecutado, con detalles pendientes</option><option>En proceso</option><option>Sin empezar</option></select>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
                <div><label class="lbl" for="fe1">Entrega estimada</label><input id="fe1" class="field" value="05-09-2026"></div>
                <div><label class="lbl" for="fr1">Entrega real</label><input id="fr1" class="field" value="07-09-2026"></div>
              </div>
            </div>
          </div>

          <div class="sub"><div class="sub-h"><b style="font-size: 14px">Cielo</b><span style="display: flex; align-items: center; gap: 16px"><span class="st"><span class="dot" style="background: #2F9E5B"></span>Entregado</span><a href="#" style="font-size: 13px">Abrir</a></span></div></div>
          <div class="sub"><div class="sub-h"><b style="font-size: 14px">Eléctrico</b><span style="display: flex; align-items: center; gap: 16px"><span class="st" style="color: #B4610F"><span class="dot" style="background: #D9822B"></span>Falta fecha real</span><a href="#" style="font-size: 13px">Abrir</a></span></div></div>
          <div class="sub"><div class="sub-h"><b style="font-size: 14px">Suciedad en piso</b><span style="display: flex; align-items: center; gap: 16px"><span class="st"><span class="dot" style="background: #2F9E5B"></span>Entregado</span><a href="#" style="font-size: 13px">Abrir</a></span></div></div>
        </div>
      </section>

      <section id="s5" class="box">
        <div class="box-h"><span class="num">5</span><h2>Planos</h2><span class="ok"><span class="dot" style="background: #2F9E5B"></span>Completo</span></div>
        <div class="box-b r2" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px">
          <div>
            <span class="lbl">Dónde cayó agua · 2 de 4</span>
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
              <div class="thumb">Plano 1</div><div class="thumb">Plano 2</div><button class="add">Agregar</button>
            </div>
          </div>
          <div>
            <span class="lbl">Dónde hay que reparar · 1 de 4</span>
            <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">
              <div class="thumb">Plano 1</div><button class="add">Agregar</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div style="padding: 14px 24px; border-top: 1px solid #E8EBF2; display: flex; justify-content: flex-end; gap: 8px; background: #fff">
      <button style="border: 1px solid #DDE1EA; background: #fff; border-radius: 8px; padding: 8px 16px; font: 500 13.5px 'IBM Plex Sans',sans-serif; min-height: 40px; color: #1b1d28">Cancelar</button>
      <button style="border: 0; background: #4363E0; color: #fff; border-radius: 8px; padding: 8px 20px; font: 600 13.5px 'IBM Plex Sans',sans-serif; min-height: 40px">Guardar cambios</button>
    </div>
  </div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1100,"height":2200}}'>
class Component extends DCLogic {
  renderVals() {
    return { fotos: ['Foto 1', 'Foto 2', 'Foto 3', 'Foto 4', 'Foto 5'] };
  }
}
</script>
</body>
</html>
```

## Cotizaciones.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Cotizaciones y facturas proveedores</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#6E7383}
.eyebrow a{color:#6E7383}
.tabs a{color:#5f6474;font-size:13.5px;font-weight:500;padding:10px 0;border-bottom:2px solid transparent;white-space:nowrap}
.tabs a.on{color:#1b1d28;font-weight:600;border-bottom-color:#4363E0}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 0 !important}
main>div{padding:18px 16px 40px !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 900px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 248px; max-width: 260px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="lluvias" modo="normal" hint-size="100%,1000px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0">
    <header style="padding: 22px 32px 0; border-bottom: 1px solid #E8EBF2; display: flex; flex-direction: column; gap: 14px">
      <div>
        <div class="eyebrow"><a href="Eventos.dc.html">Lluvias y temporales</a></div>
        <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Temporal 16 ago 2026</h1>
        <p style="margin: 0; font-size: 13px; color: #5f6474">29 recintos afectados · actualizado hace 11 días</p>
      </div>
      <nav class="tabs" style="display: flex; gap: 24px; overflow-x: auto">
        <a href="#">Resumen</a>
        <a href="Evento.dc.html">Filtraciones</a>
        <a href="#">Materiales</a>
        <a href="#" class="on">Cotizaciones y facturas</a>
        <a href="Informe.dc.html">Informe para el seguro</a>
      </nav>
    </header>
    <div style="max-width: 1240px; margin: 0 auto; padding: 24px 32px 48px; display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; align-items: baseline; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid #E8EBF2">
        <span style="font-size: 16px; font-weight: 600">Cotizaciones y facturas de proveedores</span>
        <span style="font-size: 12.5px; color: #6E7383">0 documentos</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 72px 24px">
        <div style="width: 52px; height: 52px; border-radius: 14px; background: #F2F4FA; color: #6E7383; display: flex; align-items: center; justify-content: center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/></svg>
        </div>
        <div style="font-size: 15px; font-weight: 600">Sección en preparación</div>
        <div style="font-size: 13px; color: #5f6474; max-width: 440px">Aquí se registrarán todas las cotizaciones y facturas de proveedores del evento, en un solo listado, y desde aquí se asignarán a cada recinto.</div>
      </div>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## Informe.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe para el seguro</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#fff;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:14px;line-height:1.5}
a{color:#2B4FCF;text-decoration:none}a:hover{color:#1F3DA8}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#6E7383}
.tabs a{color:#5f6474;font-size:13.5px;font-weight:500;padding:10px 0;border-bottom:2px solid transparent;white-space:nowrap}
.tabs a.on{color:#1b1d28;font-weight:600;border-bottom-color:#4363E0}
.box{border:1px solid #E8EBF2;border-radius:10px;background:#fff}
.box-h{display:flex;align-items:baseline;gap:10px;padding:14px 18px;border-bottom:1px solid #E8EBF2}
.box-h h2,.box-h h3{margin:0;font-size:14px;font-weight:600}
.cnt{font-size:12.5px;color:#6E7383}
.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid #DDE1EA;background:#fff;color:#1b1d28;border-radius:8px;padding:8px 14px;font:500 13.5px 'IBM Plex Sans',sans-serif;min-height:38px;cursor:pointer;box-sizing:border-box}
.btn:hover{color:#1b1d28;border-color:#B8BEC7}
.btn-primary{background:#4363E0;border-color:#4363E0;color:#fff;font-weight:600}
.btn-primary:hover{color:#fff;background:#3550C4}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex:none}
.st{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:#5f6474;white-space:nowrap}
.stat{padding:16px 18px;border-left:1px solid #F0F2F6}
.stat:first-child{border-left:0}
.stat .n{font-size:22px;font-weight:600;line-height:1.2}
.stat .l{font-size:12.5px;color:#5f6474}
.rec{display:flex;align-items:center;gap:10px;padding:11px 18px;border-top:1px solid #F0F2F6;color:#1b1d28}
.rec:hover{background:#FAFBFD;color:#1b1d28}
.rec.on{background:#F2F4FA;box-shadow:inset 2px 0 0 #4363E0}
.chip{display:inline-flex;padding:2px 8px;border:1px solid #E3E6EE;border-radius:6px;font-size:12.5px;color:#3A3F4E}
.chip:hover{border-color:#4363E0;color:#2B4FCF}
.ph{position:relative;aspect-ratio:4/3;border-radius:8px;border:2px solid transparent;cursor:pointer;padding:0;font:400 12px 'IBM Plex Sans',sans-serif;display:flex;align-items:center;justify-content:center}
.chk{position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.seg{display:inline-flex;border:1px solid #DDE1EA;border-radius:8px;overflow:hidden}
.seg a{padding:5px 12px;font-size:12.5px;font-weight:500;color:#5f6474;border-right:1px solid #DDE1EA}
.seg a:last-child{border-right:0}
.seg a.on{background:#1b1d28;color:#fff}
@media (max-width:760px){
.sidewrap{max-width:none !important;flex:1 1 100% !important;border-right:0 !important;border-bottom:1px solid #E8EBF2}
main>header{padding:16px 16px 0 !important}
main>div{padding:18px 16px 40px !important}
.r3{grid-template-columns:minmax(0,1fr) !important}
.r3>div{border-left:0 !important;border-top:1px solid #F0F2F6}
.r3>div:first-child{border-top:0}
.r5{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
.r5 .stat{border-left:0;border-top:1px solid #F0F2F6}
.r5 .stat:nth-child(-n+2){border-top:0}
.r5 .stat:nth-child(even){border-left:1px solid #F0F2F6}
.r6{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
.asidem{max-width:none !important;flex:1 1 100% !important}
}
</style>
</helmet>
<div style="display: flex; flex-wrap: wrap; min-height: 1800px; background: #fff">
  <div class="sidewrap" style="flex: 1 1 248px; max-width: 260px; background: #F7F8FC; border-right: 1px solid #E8EBF2">
    <dc-import name="Sidebar" active="lluvias" modo="normal" hint-size="100%,1000px"></dc-import>
  </div>
  <main style="flex: 999 1 560px; min-width: 0">
    <header style="padding: 22px 32px 0; border-bottom: 1px solid #E8EBF2; display: flex; flex-direction: column; gap: 14px">
      <div>
        <div class="eyebrow"><a href="Eventos.dc.html" style="color: #6E7383">Lluvias y temporales</a></div>
        <h1 style="margin: 4px 0 2px; font-size: 22px; font-weight: 600; line-height: 1.3">Temporal 16 ago 2026</h1>
        <p style="margin: 0; font-size: 13px; color: #5f6474">29 recintos · actualizado hace 11 días</p>
      </div>
      <nav class="tabs" style="display: flex; gap: 24px; overflow-x: auto">
        <a href="#">Resumen</a>
        <a href="Evento.dc.html">Filtraciones</a>
        <a href="#">Materiales</a>
        <a href="Cotizaciones.dc.html">Cotizaciones y facturas</a>
        <a href="#" class="on">Informe para el seguro</a>
      </nav>
    </header>

    <div style="max-width: 1180px; margin: 0 auto; padding: 28px 32px 56px; display: flex; flex-direction: column; gap: 24px">

      <div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px">
        <div>
          <h2 style="margin: 0; font-size: 16px; font-weight: 600">Informe para el seguro</h2>
          <p style="margin: 2px 0 0; font-size: 13px; color: #5f6474">Elige qué fotos ve el liquidador. Él ve siempre lo último que guardes.</p>
        </div>
        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px">
          <span class="st" style="margin-right: 6px"><span class="dot" style="background: #D9822B"></span>Cambios sin guardar</span>
          <a href="Liquidador.dc.html" class="btn">Ver como liquidador</a>
          <button class="btn">Copiar link</button>
          <button class="btn btn-primary">Guardar</button>
        </div>
      </div>

      <section class="box r5" style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr))">
        <div class="stat"><div class="n">29</div><div class="l">Recintos</div></div>
        <div class="stat"><div class="n">9 <span style="font-size: 14px; color: #6E7383; font-weight: 500">de 29</span></div><div class="l">Validados</div></div>
        <div class="stat"><div class="n" style="color: #A3A8B6">0</div><div class="l">Sin fotos de antes</div></div>
        <div class="stat"><div class="n" style="display: flex; align-items: center; gap: 8px">11 <span class="dot" style="background: #D9822B"></span></div><div class="l">Sin fotos de después</div></div>
        <div class="stat"><div class="n">{{totalElegidas}} <span style="font-size: 14px; color: #6E7383; font-weight: 500">de 612</span></div><div class="l">Fotos para el liquidador</div></div>
      </section>

      <section class="box">
        <div class="box-h"><h2>Lo que falta</h2></div>
        <div class="r3" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr))">
          <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 10px">
            <div style="font-size: 13px"><b>11</b> <span style="color: #5f6474">sin fotos de después</span></div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px">
              <sc-for list="{{sinDespues}}" as="c" hint-placeholder-count="6"><a href="#" class="chip">{{c}}</a></sc-for>
            </div>
          </div>
          <div style="padding: 16px 18px; border-left: 1px solid #F0F2F6; display: flex; flex-direction: column; gap: 10px">
            <div style="font-size: 13px"><b>4</b> <span style="color: #5f6474">sin fotos elegidas</span></div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px">
              <sc-for list="{{sinElegidas}}" as="c" hint-placeholder-count="4"><a href="#" class="chip">{{c}}</a></sc-for>
            </div>
          </div>
          <div style="padding: 16px 18px; border-left: 1px solid #F0F2F6; display: flex; flex-direction: column; gap: 6px">
            <div style="font-size: 13px"><b>20</b> <span style="color: #5f6474">por validar</span></div>
            <div style="font-size: 12.5px; color: #6E7383">Valida cada recinto cuando su texto y sus fotos estén listos.</div>
          </div>
        </div>
      </section>

      <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start">
        <aside class="box asidem" style="flex: 1 1 260px; max-width: 300px; overflow: hidden">
          <div class="box-h" style="border-bottom: 0"><h3>Recintos</h3><span class="cnt">29</span></div>
          <sc-for list="{{recintos}}" as="r" hint-placeholder-count="8">
            <a href="#" class="rec {{r.on}}">
              <div style="flex: 1; min-width: 0">
                <div style="font-weight: 600; font-size: 13.5px">{{r.codigo}}</div>
                <div style="font-size: 12px; color: #6E7383">{{r.fotos}}</div>
              </div>
              <span class="st"><span class="dot" style="background: {{r.dot}}"></span>{{r.estado}}</span>
            </a>
          </sc-for>
        </aside>

        <div style="flex: 999 1 520px; min-width: 0; display: flex; flex-direction: column; gap: 16px">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px">
            <div>
              <div class="cnt">Recinto 1 de 29</div>
              <h3 style="margin: 2px 0 0; font-size: 18px; font-weight: 600">1B · Servicios Norte</h3>
              <div style="font-size: 13px; color: #5f6474">Techumbre, cielo, eléctrico y suciedad en piso</div>
            </div>
            <span class="st"><span class="dot" style="background: #D9822B"></span>Por validar</span>
          </div>

          <section class="box">
            <div class="box-h"><h3>Qué pasó</h3></div>
            <div style="padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid #F0F2F6">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
                <b style="font-size: 13px">Techumbre</b>
                <span class="st"><span class="dot" style="background: #2F9E5B"></span>En el informe</span>
              </div>
              <p style="margin: 0; color: #3A3F4E; font-size: 13.5px">La canaleta de la pared poniente colapsó con las lluvias y filtró agua al interior. La cubierta presentó roturas que dejaron pasar el agua a la bodega.</p>
              <a href="#" style="font-size: 12.5px">Editar texto</a>
            </div>
            <div style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px">
              <div><b style="font-size: 13px">Cielo, eléctrico y piso</b><div class="cnt">El texto está solo en la ficha</div></div>
              <button class="btn" style="min-height: 34px; padding: 5px 12px; font-size: 13px">Pasar al informe</button>
            </div>
          </section>

          <section class="box">
            <div class="box-h" style="justify-content: space-between; align-items: center">
              <div style="display: flex; align-items: baseline; gap: 10px"><h3>Fotos antes</h3><span class="cnt">{{elegA}} de 8 elegidas</span></div>
              <div class="seg"><a href="#" class="on">Todas</a><a href="#">Elegidas</a></div>
            </div>
            <div class="r6" style="padding: 16px 18px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">
              <sc-for list="{{antes}}" as="f" hint-placeholder-count="8">
                <button class="ph" style="{{f.estilo}}" onClick="{{f.pick}}" aria-pressed="{{f.sel}}" aria-label="{{f.label}}">
                  {{f.label}}
                  <span class="chk" style="{{f.chk}}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>
                </button>
              </sc-for>
            </div>
          </section>

          <section class="box">
            <div class="box-h" style="justify-content: space-between; align-items: center">
              <div style="display: flex; align-items: baseline; gap: 10px"><h3>Fotos después</h3><span class="cnt">{{elegD}} de 24 elegidas</span></div>
              <div class="seg"><a href="#" class="on">Todas</a><a href="#">Elegidas</a></div>
            </div>
            <div class="r6" style="padding: 16px 18px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px">
              <sc-for list="{{despues}}" as="f" hint-placeholder-count="12">
                <button class="ph" style="{{f.estilo}}" onClick="{{f.pick}}" aria-pressed="{{f.sel}}" aria-label="{{f.label}}">
                  {{f.label}}
                  <span class="chk" style="{{f.chk}}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>
                </button>
              </sc-for>
            </div>
            <div style="padding: 0 18px 14px"><a href="#" style="font-size: 12.5px">Mostrar 12 más</a></div>
          </section>

          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px">
            <div style="display: flex; gap: 8px">
              <button class="btn" disabled style="color: #A3A8B6">Anterior</button>
              <button class="btn">Siguiente</button>
            </div>
            <button class="btn">Validar recinto</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1800}}'>
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: { a1: true, a2: true, a4: true, a6: true, d1: true, d3: true, d4: true, d7: true, d9: true, d12: true } };
  }
  renderVals() {
    const sel = this.state.sel;
    const make = (pref, n) => Array.from({ length: n }, (_, i) => {
      const id = pref + (i + 1);
      const on = !!sel[id];
      return {
        label: (pref === 'a' ? 'Antes ' : 'Después ') + (i + 1),
        sel: on ? 'true' : 'false',
        estilo: on ? 'background:#E3E7EF;border-color:#1b1d28;color:#3A3F4E' : 'background:#F2F4F8;border-color:transparent;color:#A3A8B6',
        chk: on ? 'background:#1b1d28' : 'background:#fff;border:1.5px solid #C9CED8',
        pick: () => this.setState({ sel: { ...this.state.sel, [id]: !on } })
      };
    });
    const antes = make('a', 8);
    const despues = make('d', 12);
    const elegA = antes.filter((f) => f.sel === 'true').length;
    const elegD = despues.filter((f) => f.sel === 'true').length;
    const R = (codigo, fotos, estado) => {
      const dot = { 'Validado': '#2F9E5B', 'Por validar': '#D9822B', 'Sin fotos': '#C9CED8' }[estado];
      return { codigo, fotos, estado, dot, on: codigo === '1B' ? 'on' : '' };
    };
    return {
      antes, despues, elegA, elegD,
      totalElegidas: 204 + elegA + elegD,
      sinDespues: ['2A', '4A', '4B', 'LOCAL 4', 'ADMINISTRACION', '6', '9', 'LOCAL 7', 'LOCAL 8', '12', '14'],
      sinElegidas: ['LOCAL 4', 'ADMINISTRACION', 'LOCAL 8', '14'],
      recintos: [
        R('1B', (elegA + elegD) + ' de 32 fotos', 'Por validar'),
        R('7', '18 de 68 fotos', 'Validado'),
        R('2A', '4 de 5 fotos', 'Por validar'),
        R('LOCAL 2 Y 3', '12 de 32 fotos', 'Validado'),
        R('LOCAL 5', '9 de 17 fotos', 'Validado'),
        R('4A', '6 de 10 fotos', 'Por validar'),
        R('LOCAL 1 Y 2', '14 de 44 fotos', 'Validado'),
        R('LOCAL 4', 'Ninguna elegida', 'Sin fotos'),
        R('ADMINISTRACION', 'Ninguna elegida', 'Sin fotos')
      ]
    };
  }
}
</script>
</body>
</html>
```

## Liquidador.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Informe para el liquidador</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#F7F8FC;font-family:'IBM Plex Sans',system-ui,sans-serif;color:#1b1d28;font-size:15px;line-height:1.6}
a{color:#163A9E;text-decoration:none}a:hover{color:#0F2A75}
.pill{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border:1px solid #E3E6EE;border-radius:6px;font-size:12.5px;color:#3A3F4E;white-space:nowrap}
.ph{aspect-ratio:4/3;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px}
@media (max-width:760px){
main{padding:0 0 40px !important}
article{border-radius:0 !important;box-shadow:none !important}
article>header,article>section{padding:22px 18px !important}
.r4{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
}
.toc a{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #EEF0F3;color:#1F2430;font-size:14px}
</style>
</helmet>
<div style="min-height: 100vh; display: flex; flex-direction: column">
  <div style="background: #fff; color: #3A3F4E; border-bottom: 1px solid #E8EBF2; padding: 12px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px">
    <span style="display: inline-flex; align-items: center; gap: 8px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
      Así verá el informe el liquidador. Solo aparecen los textos y las fotos que elegiste.
    </span>
    <a href="Informe.dc.html" style="font-weight: 600; background: #4363E0; color: #fff; padding: 8px 14px; border-radius: 8px; min-height: 36px; display: inline-flex; align-items: center">Volver a editar</a>
  </div>

  <main style="padding: 40px 24px 64px">
    <article style="max-width: 860px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 10px rgba(15,23,42,0.06); overflow: hidden">
      <header style="padding: 40px 48px 32px; border-bottom: 1px solid #EEF0F3; display: flex; flex-direction: column; gap: 18px">
        <div style="font-weight: 800; color: #c8102e; letter-spacing: 0.5px; font-size: 15px">BODETEK</div>
        <div>
          <div style="font-size: 13px; color: #5B6474; font-weight: 600">Informe de daños para el seguro</div>
          <h1 style="margin: 4px 0 0; font-size: 30px; font-weight: 700; line-height: 1.25">Temporal 16 ago 2026</h1>
        </div>
        <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; font-size: 13.5px">
          <div><div style="color: #5B6474">Fecha del evento</div><div style="font-weight: 600">16-08-2026</div></div>
          <div><div style="color: #5B6474">Recintos afectados</div><div style="font-weight: 600">29</div></div>
          <div><div style="color: #5B6474">N° de siniestro</div><div style="font-weight: 600">[N° SINIESTRO]</div></div>
          <div><div style="color: #5B6474">Contacto Bodetek</div><div style="font-weight: 600">[CONTACTO]</div></div>
        </div>
      </header>

      <section class="toc" style="padding: 24px 48px; border-bottom: 1px solid #EEF0F3">
        <h2 style="margin: 0 0 6px; font-size: 16px; font-weight: 600">Recintos</h2>
        <a href="#r1"><span><b>1B</b> · Servicios Norte</span><span style="color: #5B6474">10 fotos</span></a>
        <a href="#r2"><span><b>7</b> · Ferretería Andes</span><span style="color: #5B6474">18 fotos</span></a>
        <a href="#"><span><b>2A</b> · Izajes del Norte</span><span style="color: #5B6474">4 fotos</span></a>
        <a href="#" style="border-bottom: 0; color: #163A9E; font-weight: 600"><span>Ver los 29 recintos</span><span></span></a>
      </section>

      <section id="r1" style="padding: 32px 48px; border-bottom: 1px solid #EEF0F3; display: flex; flex-direction: column; gap: 16px">
        <div>
          <div style="font-size: 13px; color: #5B6474">Recinto 1 de 29</div>
          <h2 style="margin: 2px 0 0; font-size: 22px; font-weight: 700">1B · Servicios Norte</h2>
          <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap">
            <span class="pill">Techumbre</span>
            <span class="pill">Cielo</span>
            <span class="pill">Eléctrico</span>
            <span class="pill">Suciedad en piso</span>
          </div>
        </div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Qué pasó</h3>
          <p style="margin: 0; color: #374151">La canaleta de la pared poniente colapsó con las lluvias y filtró agua al interior. La cubierta presentó roturas que dejaron pasar el agua a la bodega.</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px">
          <h3 style="margin: 0; font-size: 15px; font-weight: 600">Antes de la reparación</h3>
          <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 1</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 2</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 4</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 6</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px">
          <h3 style="margin: 0; font-size: 15px; font-weight: 600">Después de la reparación</h3>
          <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 1</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 3</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 4</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 7</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 9</div>
            <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 12</div>
          </div>
        </div>
      </section>

      <section id="r2" style="padding: 32px 48px; display: flex; flex-direction: column; gap: 16px">
        <div>
          <div style="font-size: 13px; color: #5B6474">Recinto 2 de 29</div>
          <h2 style="margin: 2px 0 0; font-size: 22px; font-weight: 700">7 · Ferretería Andes</h2>
          <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap">
            <span class="pill">Techumbre</span>
            <span class="pill">Cielo</span>
          </div>
        </div>
        <div>
          <h3 style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Qué pasó</h3>
          <p style="margin: 0; color: #374151">Filtración por la cubierta sobre el sector de bodegaje, con daño en planchas de cielo y mercadería mojada.</p>
        </div>
        <div class="r4" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px">
          <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 1</div>
          <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Antes 2</div>
          <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 1</div>
          <div class="ph" style="background: #EEF0F5; color: #8A8FA0">Después 2</div>
        </div>
      </section>
    </article>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1600}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## MovilMenu.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Celular · Menú abierto</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#F7F8FC}
</style>
</helmet>
<div style="width: 390px; min-height: 1100px; background: #F7F8FC">
  <dc-import name="Sidebar" active="lluvias" modo="normal" abierto="true" hint-size="390px,1100px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":1100}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## MovilEvento.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Celular · Evento</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#fff}
</style>
</helmet>
<div style="width: 390px; background: #fff">
  <dc-import name="Evento" hint-size="390px,3200px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":3200}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## MovilFicha.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Celular · Editar filtración</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#F7F8FC}
</style>
</helmet>
<div style="width: 390px; background: #F7F8FC">
  <dc-import name="Ficha" hint-size="390px,3000px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":3000}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

## MovilInforme.dc.html

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Celular · Informe para el seguro</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0;background:#fff}
</style>
</helmet>
<div style="width: 390px; background: #fff">
  <dc-import name="Informe" hint-size="390px,3400px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":3400}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
```

