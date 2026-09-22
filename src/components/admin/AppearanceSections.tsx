"use client";

import { useRef, useState } from "react";
import { useTimerStore } from "../../lib/store/timer-store";
import type { AlignX, AnimationKind, BackgroundKind, VerticalZone } from "../../lib/types";
import { clamp } from "../../lib/utils/misc";
import { Button, ColorInput, Field, NumberInput, Segmented, Slider, TextInput, Toggle } from "../atoms/controls";
import { FontPicker, SectionCard, WeightSelect } from "../molecules/common";

const ANIMATION_OPTIONS: Array<{ value: AnimationKind; label: string }> = [
  { value: "none", label: "Ninguna" },
  { value: "pulse", label: "Pulso" },
  { value: "blink", label: "Parpadeo" },
  { value: "glow", label: "Brillo" },
  { value: "shake", label: "Sacudida" },
  { value: "scale", label: "Escala" },
  { value: "countdown", label: "Cuenta regresiva" },
];

const ALIGN_OPTIONS: Array<{ value: AlignX; label: string }> = [
  { value: "left", label: "↤" },
  { value: "center", label: "↔" },
  { value: "right", label: "↦" },
];

const ZONE_OPTIONS: Array<{ value: VerticalZone; label: string }> = [
  { value: "top", label: "Arriba" },
  { value: "middle", label: "Medio" },
  { value: "bottom", label: "Abajo" },
];

/* ------------------------------ Layout ------------------------------ */

export function LayoutSection() {
  const editing = useTimerStore((s) => s.editing);
  const layout = editing.layout;
  const patch = useTimerStore((s) => s.patchLayout);
  const patchHeader = useTimerStore((s) => s.patchHeader);
  const patchFooter = useTimerStore((s) => s.patchFooter);

  return (
    <SectionCard title="Posición y composición" description="Alineación, separación y offsets del conjunto.">
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Separación (${layout.gap}px)`}>
          <Slider value={layout.gap} min={-120} max={120} onChange={(v) => patch({ gap: v })} label="Separación" />
        </Field>
        <Field label={`Offset vertical (${layout.offsetY}px)`}>
          <Slider value={layout.offsetY} min={-200} max={200} onChange={(v) => patch({ offsetY: v })} label="Offset vertical" />
        </Field>
        <Field label={`Ancho máximo (${layout.maxWidthPct}%)`}>
          <Slider value={layout.maxWidthPct} min={40} max={100} onChange={(v) => patch({ maxWidthPct: v })} label="Ancho máximo" />
        </Field>
      </div>

      {([
        { key: "Header", align: editing.header.textAlign, zone: layout.headerZone, onAlign: (a: AlignX) => patchHeader({ textAlign: a }), onZone: (z: VerticalZone) => patch({ headerZone: z }) },
        { key: "Timer", align: layout.timerAlign, zone: layout.timerZone, onAlign: (a: AlignX) => patch({ timerAlign: a }), onZone: (z: VerticalZone) => patch({ timerZone: z }) },
        { key: "Footer", align: editing.footer.textAlign, zone: layout.footerZone, onAlign: (a: AlignX) => patchFooter({ textAlign: a }), onZone: (z: VerticalZone) => patch({ footerZone: z }) },
      ] as const).map((row) => (
        <div key={row.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-800/40 px-3 py-2">
          <span className="w-16 text-xs font-semibold uppercase text-slate-400">{row.key}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase text-slate-500">V:</span>
            <Segmented value={row.zone} onChange={row.onZone} options={[...ZONE_OPTIONS]} />
            <span className="text-[10px] uppercase text-slate-500">H:</span>
            <Segmented value={row.align} onChange={row.onAlign} options={[...ALIGN_OPTIONS]} />
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

/* ---------------------------- Background ---------------------------- */

function BackgroundUpload({ onUploaded, onError }: { onUploaded: (url: string) => void; onError: (msg: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        onError(json.error ?? "Error al subir la imagen");
        return;
      }
      onUploaded(json.url);
    } catch {
      onError("Error de red al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? "Subiendo…" : "Subir imagen"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function BackgroundSection() {
  const editing = useTimerStore((s) => s.editing);
  const bg = editing.background;
  const patch = useTimerStore((s) => s.patchBackground);
  const [error, setError] = useState<string | null>(null);

  return (
    <SectionCard title="Fondo" description="Color sólido o imagen con zoom, posición y overlay.">
      <div className="flex items-center gap-3">
        <Segmented<BackgroundKind>
          value={bg.kind}
          onChange={(v) => patch({ kind: v })}
          options={[
            { value: "solid", label: "Color sólido" },
            { value: "image", label: "Imagen" },
          ]}
          label="Tipo de fondo"
        />
      </div>

      {bg.kind === "solid" && (
        <div className="grid grid-cols-3 gap-4">
          <Field label="Color">
            <ColorInput value={bg.color} onChange={(v) => patch({ color: v })} label="Color de fondo" />
          </Field>
        </div>
      )}

      {bg.kind === "image" && (
        <>
          <div className="flex flex-col gap-2">
            <BackgroundUpload
              onUploaded={(url) => patch({ imageUrl: url, kind: "image" })}
              onError={setError}
            />
            {error ? <span className="text-xs text-rose-400">{error}</span> : null}
            {bg.imageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-md border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bg.imageUrl} alt="Fondo actual" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={`Zoom (${(bg.zoom).toFixed(2)}×)`}>
              <Slider value={bg.zoom} min={1} max={1.5} step={0.01} onChange={(v) => patch({ zoom: v })} label="Zoom" />
            </Field>
            <div className="grid min-w-0 grid-cols-2 gap-4">
              <Field label={`Pos. H (${bg.positionX}%)`}>
                <Slider value={bg.positionX} min={0} max={100} onChange={(v) => patch({ positionX: v })} label="Posición horizontal" />
              </Field>
              <Field label={`Pos. V (${bg.positionY}%)`}>
                <Slider value={bg.positionY} min={0} max={100} onChange={(v) => patch({ positionY: v })} label="Posición vertical" />
              </Field>
            </div>
          </div>

          {bg.imageUrl ? (
            <Button variant="danger" onClick={() => patch({ imageUrl: null, kind: "solid" })}>
              Quitar fondo
            </Button>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Color del overlay">
              <ColorInput value={bg.overlayColor} onChange={(v) => patch({ overlayColor: v })} label="Color overlay" />
            </Field>
            <Field label={`Opacidad overlay (${Math.round(bg.overlayOpacity * 100)}%)`}>
              <Slider value={bg.overlayOpacity} min={0} max={1} step={0.01} onChange={(v) => patch({ overlayOpacity: v })} label="Opacidad overlay" />
            </Field>
          </div>
        </>
      )}
    </SectionCard>
  );
}

/* -------------------------- Section editor -------------------------- */

function SectionEditor({
  title,
  enabled,
  onEnabled,
  text,
  onText,
  fontSize,
  onFontSize,
  fontFamily,
  onFontFamily,
  color,
  onColor,
  fontWeight,
  onFontWeight,
  fontStyle,
  onFontStyle,
  letterSpacing,
  onLetterSpacing,
  textAlign,
  onTextAlign,
  maxWidthPct,
  onMaxWidthPct,
}: {
  title: string;
  enabled: boolean;
  onEnabled: (v: boolean) => void;
  text: string;
  onText: (v: string) => void;
  fontSize: number;
  onFontSize: (v: number) => void;
  fontFamily: string;
  onFontFamily: (v: string) => void;
  color: string;
  onColor: (v: string) => void;
  fontWeight: number;
  onFontWeight: (v: number) => void;
  fontStyle: "normal" | "italic";
  onFontStyle: (v: "normal" | "italic") => void;
  letterSpacing: number;
  onLetterSpacing: (v: number) => void;
  textAlign: AlignX;
  onTextAlign: (v: AlignX) => void;
  maxWidthPct: number;
  onMaxWidthPct: (v: number) => void;
}) {
  return (
    <SectionCard
      title={title}
      actions={<Toggle checked={enabled} onChange={onEnabled} label={title} />}
    >
      <TextInput value={text} onChange={(e) => onText(e.target.value)} placeholder="Texto libre…" />
      <Field label="Fuente">
        <FontPicker value={fontFamily} onChange={onFontFamily} label={`Fuente de ${title}`} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tamaño (1–10)">
          <Slider value={fontSize} min={1} max={10} onChange={onFontSize} label="Tamaño" />
        </Field>
        <Field label="Color">
          <ColorInput value={color} onChange={onColor} label="Color" />
        </Field>
        <Field label="Peso">
          <WeightSelect value={fontWeight} onChange={onFontWeight} />
        </Field>
        <Field label="Estilo">
          <Segmented
            value={fontStyle}
            onChange={onFontStyle}
            options={[
              { value: "normal", label: "Normal" },
              { value: "italic", label: "Itálica" },
            ]}
            label="Estilo"
          />
        </Field>
        <Field label={`Espaciado (${letterSpacing}px)`}>
          <Slider value={letterSpacing} min={0} max={40} onChange={onLetterSpacing} label="Letter spacing" />
        </Field>
        <Field label="Alineación">
          <Segmented value={textAlign} onChange={onTextAlign} options={[...ALIGN_OPTIONS]} label="Alineación" />
        </Field>
        <Field label={`Ancho máx. (${maxWidthPct}%)`}>
          <Slider value={maxWidthPct} min={20} max={100} onChange={onMaxWidthPct} label="Ancho máximo" />
        </Field>
      </div>
    </SectionCard>
  );
}

export function HeaderSection() {
  const h = useTimerStore((s) => s.editing.header);
  const patch = useTimerStore((s) => s.patchHeader);
  return (
    <SectionEditor
      title="Header"
      enabled={h.enabled}
      onEnabled={(v) => patch({ enabled: v })}
      text={h.text}
      onText={(v) => patch({ text: v })}
      fontSize={h.size}
      onFontSize={(v) => patch({ size: v })}
      fontFamily={h.fontFamily}
      onFontFamily={(v) => patch({ fontFamily: v })}
      color={h.color}
      onColor={(v) => patch({ color: v })}
      fontWeight={h.fontWeight}
      onFontWeight={(v) => patch({ fontWeight: v })}
      fontStyle={h.fontStyle}
      onFontStyle={(v) => patch({ fontStyle: v })}
      letterSpacing={h.letterSpacing}
      onLetterSpacing={(v) => patch({ letterSpacing: v })}
      textAlign={h.textAlign}
      onTextAlign={(v) => patch({ textAlign: v })}
      maxWidthPct={h.maxWidthPct}
      onMaxWidthPct={(v) => patch({ maxWidthPct: v })}
    />
  );
}

export function FooterSection() {
  const f = useTimerStore((s) => s.editing.footer);
  const patch = useTimerStore((s) => s.patchFooter);
  return (
    <SectionEditor
      title="Footer"
      enabled={f.enabled}
      onEnabled={(v) => patch({ enabled: v })}
      text={f.text}
      onText={(v) => patch({ text: v })}
      fontSize={f.size}
      onFontSize={(v) => patch({ size: v })}
      fontFamily={f.fontFamily}
      onFontFamily={(v) => patch({ fontFamily: v })}
      color={f.color}
      onColor={(v) => patch({ color: v })}
      fontWeight={f.fontWeight}
      onFontWeight={(v) => patch({ fontWeight: v })}
      fontStyle={f.fontStyle}
      onFontStyle={(v) => patch({ fontStyle: v })}
      letterSpacing={f.letterSpacing}
      onLetterSpacing={(v) => patch({ letterSpacing: v })}
      textAlign={f.textAlign}
      onTextAlign={(v) => patch({ textAlign: v })}
      maxWidthPct={f.maxWidthPct}
      onMaxWidthPct={(v) => patch({ maxWidthPct: v })}
    />
  );
}

/* ------------------------------ Timer ------------------------------ */

export function TimerSection() {
  const t = useTimerStore((s) => s.editing.timer);
  const patch = useTimerStore((s) => s.patchTimer);

  return (
    <SectionCard title="Timer" description="El elemento principal de la pantalla.">
      <Field label="Fuente">
        <FontPicker value={t.fontFamily} onChange={(v) => patch({ fontFamily: v })} label="Fuente del timer" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tamaño (1–10)">
          <Slider value={t.size} min={1} max={10} onChange={(v) => patch({ size: v })} label="Tamaño" />
        </Field>
        <Field label="Alineación">
          <Segmented value={t.textAlign} onChange={(v) => patch({ textAlign: v })} options={[...ALIGN_OPTIONS]} label="Alineación" />
        </Field>
        <Field label="Peso">
          <WeightSelect value={t.fontWeight} onChange={(v) => patch({ fontWeight: v })} />
        </Field>
        <Field label="Estilo">
          <Segmented
            value={t.fontStyle}
            onChange={(v) => patch({ fontStyle: v })}
            options={[
              { value: "normal", label: "Normal" },
              { value: "italic", label: "Itálica" },
            ]}
            label="Estilo"
          />
        </Field>
        <Field label={`Espaciado (${t.letterSpacing}px)`}>
          <Slider value={t.letterSpacing} min={0} max={60} onChange={(v) => patch({ letterSpacing: v })} label="Letter spacing" />
        </Field>
        <Field label={`Ancho máx. (${t.maxWidthPct}%)`}>
          <Slider value={t.maxWidthPct} min={30} max={100} onChange={(v) => patch({ maxWidthPct: v })} label="Ancho máximo" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Color">
          <ColorInput value={t.color} onChange={(v) => patch({ color: v })} label="Color" />
        </Field>
        <Field label="Warning">
          <ColorInput value={t.warningColor} onChange={(v) => patch({ warningColor: v })} label="Color warning" />
        </Field>
        <Field label="Critical">
          <ColorInput value={t.criticalColor} onChange={(v) => patch({ criticalColor: v })} label="Color critical" />
        </Field>
        <Field label="Finalizado">
          <ColorInput value={t.finishedColor} onChange={(v) => patch({ finishedColor: v })} label="Color finalizado" />
        </Field>
      </div>
    </SectionCard>
  );
}

/* --------------------------- Animations --------------------------- */

export function AnimationSection() {
  const a = useTimerStore((s) => s.editing.animation);
  const patch = useTimerStore((s) => s.patchAnimation);
  return (
    <SectionCard title="Animaciones" description="Efecto aplicado al timer según la fase.">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Normal">
          <Segmented value={a.running} onChange={(v) => patch({ running: v })} options={ANIMATION_OPTIONS} label="Animación normal" />
        </Field>
        <Field label="Warning">
          <Segmented value={a.warning} onChange={(v) => patch({ warning: v })} options={ANIMATION_OPTIONS} label="Animación warning" />
        </Field>
        <Field label="Critical">
          <Segmented value={a.critical} onChange={(v) => patch({ critical: v })} options={ANIMATION_OPTIONS} label="Animación crítica" />
        </Field>
        <Field label="Finalizado">
          <Segmented value={a.finished} onChange={(v) => patch({ finished: v })} options={ANIMATION_OPTIONS} label="Animación final" />
        </Field>
      </div>
      <Field label={`Énfasis últimos segundos (${a.countdownEmphasisSeconds}s)`}>
        <Slider value={a.countdownEmphasisSeconds} min={0} max={60} onChange={(v) => patch({ countdownEmphasisSeconds: v })} label="Énfasis" />
      </Field>
    </SectionCard>
  );
}

export function WarningSection() {
  const w = useTimerStore((s) => s.editing.warning);
  const patch = useTimerStore((s) => s.patchWarning);
  return (
    <SectionCard title="Umbrales de alerta" description="Minutos al llegar a los cuales cambia el estado visual.">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Warning (minutos)">
          <NumberInput value={w.warningMinutes} min={1} max={180} onChange={(v) => patch({ warningMinutes: clamp(v, 1, 180) })} />
        </Field>
        <Field label="Critical (minutos)">
          <NumberInput value={w.criticalMinutes} min={0} max={45} onChange={(v) => patch({ criticalMinutes: clamp(v, 0, 45) })} />
        </Field>
      </div>
    </SectionCard>
  );
}

/* ----------------------------- Sounds ----------------------------- */

export function SoundSection() {
  const s = useTimerStore((s) => s.editing.sound);
  const patch = useTimerStore((s) => s.patchSound);
  return (
    <SectionCard
      title="Sonidos"
      description="Se reproducen en la PC. Requieren una interacción inicial del navegador."
      actions={<Toggle checked={s.enabled} onChange={(v) => patch({ enabled: v })} label="Sonidos" />}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Al iniciar">
          <Toggle checked={s.start} onChange={(v) => patch({ start: v })} label="Sonido al iniciar" />
        </Field>
        <Field label="Al pausar">
          <Toggle checked={s.pause} onChange={(v) => patch({ pause: v })} label="Sonido al pausar" />
        </Field>
        <Field label="Advertencia">
          <Toggle checked={s.warning} onChange={(v) => patch({ warning: v })} label="Sonido de advertencia" />
        </Field>
        <Field label="Al finalizar">
          <Toggle checked={s.finish} onChange={(v) => patch({ finish: v })} label="Sonido al finalizar" />
        </Field>
        <Field label={`Volumen (${Math.round(s.volume * 100)}%)`}>
          <Slider value={s.volume} min={0} max={1} step={0.01} onChange={(v) => patch({ volume: v })} label="Volumen" />
        </Field>
      </div>
      <hr className="border-slate-800" />
      <Field label="Mensaje al finalizar">
        <div className="flex gap-2">
          <TextInput
            value={s.finishOverlayText}
            onChange={(e) => patch({ finishOverlayText: e.target.value })}
            placeholder="TIME!"
          />
        </div>
      </Field>
      <Field label="Mostrar mensaje de finalización en pantalla">
        <Toggle checked={s.showFinishOverlay} onChange={(v) => patch({ showFinishOverlay: v })} label="Mostrar mensaje final" />
      </Field>
    </SectionCard>
  );
}