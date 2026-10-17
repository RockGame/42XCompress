import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  ArrowDownToLine, Check, ChevronDown, FileImage, FilePlus2, Languages,
  LockKeyhole, Moon, Settings2, ShieldCheck, Sparkles, Sun,
  Trash2, Upload, X
} from "lucide-react";
import { formatBytes, processImage } from "./imageProcessor";
import type { OutputFormat, ProcessedImage } from "./imageProcessor";

type Language = "es" | "en";
type Theme = "dark" | "light";
type Item = { id: string; file: File; preview: string; result?: ProcessedImage; resultPreview?: string; status: "ready" | "processing" | "done" | "error"; error?: string };

const copy = {
  es: {
    eyebrow: "PROCESAMIENTO LOCAL · PRIVACIDAD PRIMERO", title: "Tus imágenes, más ligeras.",
    subtitle: "Comprime y convierte imágenes sin subirlas a ningún servidor.", add: "Añadir imágenes",
    drop: "Arrastra imágenes aquí", dropSub: "o selecciónalas desde tu dispositivo",
    supported: "JPEG · PNG · WebP · AVIF · BMP · Máximo 100 MB por imagen",
    output: "Formato de salida", original: "Conservar / automático", jpeg: "JPEG", png: "PNG sin pérdida", webp: "WebP", avif: "AVIF", bmp: "BMP",
    quality: "Calidad", qualityHint: "Solo afecta a formatos con pérdida", process: "Procesar imágenes", processing: "Procesando…",
    clear: "Limpiar todo", download: "Descargar", downloadZip: "Descargar resultados (.ZIP)", before: "Original", after: "Resultado",
    ready: "Lista", done: "Completada", error: "Error", privacyTitle: "Tus archivos se quedan contigo",
    privacyBody: "La compresión se ejecuta en tu navegador. 42XCompress no envía tus imágenes a un servidor.",
    noFiles: "Aún no hay imágenes", noFilesHint: "Añade imágenes para empezar a comprimir o convertir.",
    saved: "ahorrado", larger: "más grande", same: "sin cambio", outputSize: "Tamaño final", originalSize: "Tamaño original",
    settings: "Ajustes", resize: "Redimensionar opcionalmente", maxWidth: "Ancho máximo (px)", maxHeight: "Alto máximo (px)",
    theme: "Tema", language: "Idioma", local: "100% local", footer: "© RG42X Lab 2026 · Licencia GPL-3.0",
    source: "Código fuente", remove: "Eliminar imagen", outputNote: "La compatibilidad de salida AVIF depende del navegador.",
    selectAll: "Puedes seleccionar varias imágenes a la vez.", noResults: "Procesa imágenes primero para descargar resultados.",
    totalSaved: "Ahorro total", items: "imágenes", formatNotice: "Los resultados pueden variar según navegador y formato."
  },
  en: {
    eyebrow: "LOCAL PROCESSING · PRIVACY FIRST", title: "Make your images lighter.",
    subtitle: "Compress and convert images without uploading them to a server.", add: "Add images",
    drop: "Drop images here", dropSub: "or choose them from your device",
    supported: "JPEG · PNG · WebP · AVIF · BMP · Maximum 100 MB per image",
    output: "Output format", original: "Keep / automatic", jpeg: "JPEG", png: "Lossless PNG", webp: "WebP", avif: "AVIF", bmp: "BMP",
    quality: "Quality", qualityHint: "Only affects lossy formats", process: "Process images", processing: "Processing…",
    clear: "Clear all", download: "Download", downloadZip: "Download results (.ZIP)", before: "Original", after: "Result",
    ready: "Ready", done: "Completed", error: "Error", privacyTitle: "Your files stay with you",
    privacyBody: "Compression runs in your browser. 42XCompress does not send your images to a server.",
    noFiles: "No images yet", noFilesHint: "Add images to start compressing or converting.",
    saved: "saved", larger: "larger", same: "no change", outputSize: "Output size", originalSize: "Original size",
    settings: "Settings", resize: "Optional resize", maxWidth: "Maximum width (px)", maxHeight: "Maximum height (px)",
    theme: "Theme", language: "Language", local: "100% local", footer: "© RG42X Lab 2026 · GPL-3.0 License",
    source: "Source code", remove: "Remove image", outputNote: "AVIF output support depends on your browser.",
    selectAll: "You can select multiple images at once.", noResults: "Process images first to download results.",
    totalSaved: "Total savings", items: "images", formatNotice: "Results vary by browser and format."
  }
} as const;

const extensions = /\.(jpe?g|png|webp|avif|bmp)$/i;
const formatOptions: { value: OutputFormat; key: keyof typeof copy.es }[] = [
  { value: "original", key: "original" }, { value: "jpeg", key: "jpeg" }, { value: "png", key: "png" },
  { value: "webp", key: "webp" }, { value: "avif", key: "avif" }, { value: "bmp", key: "bmp" }
];
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function makeZip(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  // Minimal ZIP STORE writer. Images are already encoded; no extra compression is applied.
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); table[n] = c >>> 0; }
  const crc32 = (data: Uint8Array) => { let c = 0xffffffff; for (const b of data) c = (table[(c ^ b) & 0xff] ^ (c >>> 8)) >>> 0; return (c ^ 0xffffffff) >>> 0; };
  const enc = new TextEncoder(), locals: Uint8Array[] = [], centrals: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = enc.encode(entry.name), data = new Uint8Array(await entry.blob.arrayBuffer()), crc = crc32(data);
    const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true); lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true); local.set(name, 30);
    locals.push(local, data);
    const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); central.set(name, 46); centrals.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
  return new Blob([...locals, ...centrals, end], { type: "application/zip" });
}

export default function App() {
  const [language, setLanguage] = useState<Language>("es");
  const [theme, setTheme] = useState<Theme>("dark");
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(82);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxWidth, setMaxWidth] = useState("1920");
  const [maxHeight, setMaxHeight] = useState("1920");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = copy[language];

  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.lang = language; }, [theme, language]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const all = Array.from(files), valid = all.filter((file) => extensions.test(file.name));
    const rejected = all.length - valid.length;
    const added: Item[] = valid.map((file) => ({ id: id(), file, preview: URL.createObjectURL(file), status: "ready" }));
    setItems((current) => [...current, ...added]);
    if (rejected) window.alert(language === "es"
      ? `${rejected} archivo(s) omitido(s). Formatos aceptados: JPEG, PNG, WebP, AVIF y BMP.`
      : `${rejected} file(s) skipped. Supported formats: JPEG, PNG, WebP, AVIF and BMP.`);
    if (valid.some((file) => file.size > 100 * 1024 * 1024)) window.alert(language === "es"
      ? "Los archivos de más de 100 MB se mostrarán pero no se podrán procesar."
      : "Files larger than 100 MB will be listed but cannot be processed.");
  }, [language]);

  const onInput = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); };

  const processAll = async () => {
    if (busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === "done" || item.status === "processing") continue;
      setItems((current) => current.map((x) => x.id === item.id ? { ...x, status: "processing", error: undefined } : x));
      try {
        const result = await processImage(item.file, {
          format, quality,
          ...(resizeEnabled && Number(maxWidth) > 0 ? { maxWidth: Number(maxWidth) } : {}),
          ...(resizeEnabled && Number(maxHeight) > 0 ? { maxHeight: Number(maxHeight) } : {})
        });
        setItems((current) => current.map((x) => x.id === item.id ? { ...x, status: "done", result, resultPreview: URL.createObjectURL(result.blob), error: undefined } : x));
      } catch (error) {
        setItems((current) => current.map((x) => x.id === item.id ? { ...x, status: "error", error: error instanceof Error ? error.message : String(error) } : x));
      }
    }
    setBusy(false);
  };

  const clearAll = () => { items.forEach((item) => { URL.revokeObjectURL(item.preview); if (item.resultPreview) URL.revokeObjectURL(item.resultPreview); }); setItems([]); };
  const removeItem = (itemId: string) => setItems((current) => {
    const target = current.find((x) => x.id === itemId);
    if (target) { URL.revokeObjectURL(target.preview); if (target.resultPreview) URL.revokeObjectURL(target.resultPreview); }
    return current.filter((x) => x.id !== itemId);
  });
  const finished = items.filter((item) => item.result);
  const totalOriginal = finished.reduce((sum, item) => sum + item.file.size, 0);
  const totalOutput = finished.reduce((sum, item) => sum + (item.result?.outputBytes ?? 0), 0);
  const totalSaved = totalOriginal > 0 ? ((totalOriginal - totalOutput) / totalOriginal) * 100 : 0;
  const downloadAll = async () => {
    if (!finished.length) return;
    if (finished.length === 1 && finished[0].result) { downloadBlob(finished[0].result.blob, finished[0].result.filename); return; }
    const zip = await makeZip(finished.map((item) => ({ name: item.result!.filename, blob: item.result!.blob })));
    downloadBlob(zip, "42XCompress-results.zip");
  };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="42XCompress home">
        <span className="brand-mark"><span>42</span><b>X</b></span>
        <span className="brand-name">42X<span>Compress</span></span>
      </a>
      <div className="top-actions">
        <span className="local-pill"><span className="status-dot" />{t.local}</span>
        <button className="icon-button" onClick={() => setLanguage(language === "es" ? "en" : "es")} title={t.language}><Languages size={17}/><span>{language.toUpperCase()}</span></button>
        <button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={t.theme}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <button className={`icon-button ${settingsOpen ? "active" : ""}`} onClick={() => setSettingsOpen(!settingsOpen)} title={t.settings}><Settings2 size={17}/></button>
      </div>
    </header>

    <main className="main-content">
      <section className="hero">
        <div className="eyebrow"><Sparkles size={13}/>{t.eyebrow}</div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </section>

      <section className="workspace">
        <div className="controls-panel">
          <div className="panel-heading"><div><span className="step">01</span><h2>{t.output}</h2></div><span className="panel-icon"><FileImage size={17}/></span></div>
          <div className="select-wrap">
            <select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} aria-label={t.output}>
              {formatOptions.map((option) => <option key={option.value} value={option.value}>{t[option.key]}</option>)}
            </select><ChevronDown size={16}/>
          </div>
          <div className="quality-row"><label htmlFor="quality">{t.quality}</label><strong>{quality}%</strong></div>
          <input id="quality" className="range" type="range" min="10" max="100" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
          <div className="range-labels"><span>{language === "es" ? "Menor tamaño" : "Smaller file"}</span><span>{language === "es" ? "Mayor calidad" : "Higher quality"}</span></div>
          <p className="field-note">{t.qualityHint}</p>

          {settingsOpen && <div className="advanced-settings">
            <div className="settings-title"><Settings2 size={15}/>{t.settings}</div>
            <label className="toggle-line"><input type="checkbox" checked={resizeEnabled} onChange={(event) => setResizeEnabled(event.target.checked)}/><span>{t.resize}</span></label>
            {resizeEnabled && <div className="dimensions">
              <label>{t.maxWidth}<input type="number" min="1" value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)}/></label>
              <label>{t.maxHeight}<input type="number" min="1" value={maxHeight} onChange={(event) => setMaxHeight(event.target.value)}/></label>
            </div>}
          </div>}

          <button className="primary-button" onClick={processAll} disabled={!items.length || busy}>
            {busy ? <span className="spinner"/> : <Sparkles size={17}/>} {busy ? t.processing : t.process}
          </button>
          <button className="secondary-button" onClick={() => inputRef.current?.click()}><FilePlus2 size={16}/>{t.add}</button>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.bmp,image/jpeg,image/png,image/webp,image/avif,image/bmp" multiple hidden onChange={onInput}/>
          <div className="privacy-card"><div className="privacy-icon"><ShieldCheck size={17}/></div><div><strong>{t.privacyTitle}</strong><p>{t.privacyBody}</p></div><LockKeyhole size={14} className="lock-icon"/></div>
        </div>

        <div className="files-panel">
          <div className="files-header"><div><div className="section-kicker">02 / {language === "es" ? "TUS ARCHIVOS" : "YOUR FILES"}</div><h2>{language === "es" ? "Cola de imágenes" : "Image queue"} <span className="count">{items.length}</span></h2></div>
            <div className="files-header-actions">{items.length > 0 && <button className="text-button" onClick={clearAll}><Trash2 size={14}/>{t.clear}</button>}</div>
          </div>
          {items.length === 0 ? <div className={`dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}>
            <div className="upload-art"><div className="upload-art-back"/><div className="upload-art-front"><Upload size={25}/></div><span className="art-spark spark-a">✦</span><span className="art-spark spark-b">✳</span></div>
            <h3>{t.drop}</h3><p>{t.dropSub}</p><button className="browse-button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Upload size={15}/>{t.add}</button>
            <span className="supported">{t.supported}</span>
          </div> : <div className="file-list">
            {items.map((item) => <article className="file-card" key={item.id}>
              <div className="thumbnail"><img src={item.resultPreview ?? item.preview} alt={item.file.name}/></div>
              <div className="file-info">
                <div className="file-name-row"><strong title={item.file.name}>{item.file.name}</strong><button className="remove-button" title={t.remove} onClick={() => removeItem(item.id)}><X size={14}/></button></div>
                <div className="file-meta">{formatBytes(item.file.size)} <span>·</span> {item.status === "done" ? t.done : item.status === "processing" ? t.processing : item.status === "error" ? t.error : t.ready}</div>
                {item.result && <div className="result-meta"><span>{formatBytes(item.result.outputBytes)}</span><span className={item.result.savingsPercent >= 0 ? "savings" : "larger"}>{item.result.savingsPercent >= 0 ? `${item.result.savingsPercent.toFixed(1)}% ${t.saved}` : `${Math.abs(item.result.savingsPercent).toFixed(1)}% ${t.larger}`}</span></div>}
                {item.error && <p className="error-text">{item.error}</p>}
                {item.result?.warning && <p className="warning-text">{item.result.warning}</p>}
              </div>
              {item.result && <button className="download-icon" title={t.download} onClick={() => downloadBlob(item.result!.blob, item.result!.filename)}><ArrowDownToLine size={17}/></button>}
              {item.status === "done" && <span className="done-mark"><Check size={12}/></span>}
            </article>)}
            <div className="add-more" onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}><FilePlus2 size={16}/>{t.add}</div>
          </div>}
          {items.length > 0 && <div className="queue-footer">
            <div className="queue-stats"><span>{finished.length}/{items.length} {t.items}</span>{finished.length > 0 && <strong>{t.totalSaved}: {totalSaved.toFixed(1)}%</strong>}</div>
            <button className="download-all" onClick={downloadAll} disabled={!finished.length}><ArrowDownToLine size={16}/>{finished.length > 1 ? t.downloadZip : t.download}</button>
          </div>}
        </div>
      </section>
      <div className="format-note">{t.outputNote} <span>{t.formatNotice}</span></div>
    </main>
    <footer className="footer"><a href="https://github.com/" target="_blank" rel="noreferrer">{t.source}</a><span>{t.footer}</span><span className="footer-brand">42X <i>LAB</i></span></footer>
  </div>;
}
