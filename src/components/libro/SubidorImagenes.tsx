"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { comprimirImagen } from "@/lib/comprimir";
import { MAX_IMAGENES } from "@/lib/types";
import { Icono } from "../Icono";

/**
 * Selector + arrastrar y soltar de imágenes.
 * Antes de subir cada archivo al servidor lo redimensiona/comprime en el navegador (ideal para fotos de celular).
 */
export function SubidorImagenes({
  imagenes,
  onChange,
}: {
  imagenes: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restantes = MAX_IMAGENES - imagenes.length;

  async function procesarArchivos(lista: FileList | File[]) {
    const archivos = Array.from(lista).slice(0, Math.max(0, restantes));
    if (archivos.length === 0) return;

    setError(null);
    setSubiendo((n) => n + archivos.length);
    const nuevas: string[] = [];

    for (const archivo of archivos) {
      try {
        const comprimido = await comprimirImagen(archivo);
        const form = new FormData();
        form.append("file", comprimido);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const cuerpo = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !cuerpo.url) {
          throw new Error(cuerpo.error ?? "No se pudo subir la imagen.");
        }
        nuevas.push(cuerpo.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir la imagen.");
      } finally {
        setSubiendo((n) => Math.max(0, n - 1));
      }
    }

    if (nuevas.length > 0) {
      onChange([...imagenes, ...nuevas].slice(0, MAX_IMAGENES));
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function quitar(indice: number) {
    onChange(imagenes.filter((_, i) => i !== indice));
  }

  function moverPrincipio(indice: number) {
    if (indice <= 0) return;
    const copia = [...imagenes];
    const [elegida] = copia.splice(indice, 1);
    copia.unshift(elegida);
    onChange(copia);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && procesarArchivos(e.target.files)}
      />

      {imagenes.length === 0 ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            if (e.dataTransfer.files) procesarArchivos(e.dataTransfer.files);
          }}
          className={`placa-trama relative flex min-h-[300px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-[2px] border border-dashed px-6 py-10 text-center transition-colors md:min-h-[380px] ${
            arrastrando ? "border-tinta bg-[var(--c)]" : "border-tinta-2/60 bg-placa/60 hover:bg-placa"
          }`}
        >
          <Icono nombre="imagen" tamano={44} />
          <span className="max-w-[16ch] font-serif text-[28px] leading-[1.12] font-medium text-tinta">
            {subiendo > 0 ? "Revelando fotografía…" : "Sube una o varias fotos de referencia"}
          </span>
          <span className="max-w-[30ch] text-[14px] text-tinta-2">
            Toca para abrir tu galería o arrastra las imágenes aquí. Se comprimen solas antes de subir.
          </span>
          <span className="rotulo mt-1 rounded-[2px] border border-tinta px-3 py-1.5 text-tinta">
            {subiendo > 0 ? `Subiendo (${subiendo})…` : "Elegir desde el dispositivo"}
          </span>
          <span className="rotulo absolute bottom-4 left-5 text-tinta-2">Hasta {MAX_IMAGENES} láminas</span>
        </label>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-[2px] bg-placa md:min-h-[320px]">
            <Image
              src={imagenes[0]}
              alt="Imagen principal de referencia"
              fill
              unoptimized
              sizes="(min-width: 768px) 520px, 100vw"
              className="object-contain"
            />
            <span className="rotulo absolute bottom-3 left-3 rounded-[2px] bg-papel/90 px-2.5 py-1 text-tinta">
              Portada · 1 / {imagenes.length}
            </span>
            <button
              type="button"
              onClick={() => quitar(0)}
              className="rotulo absolute top-3 right-3 rounded-[2px] border border-regla bg-papel/95 px-2.5 py-1 text-tinta hover:bg-marfil"
            >
              Quitar
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {imagenes.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`group relative h-16 w-16 overflow-hidden rounded-[2px] bg-placa ${
                  idx === 0 ? "outline-2 outline-offset-2 outline-tinta" : "opacity-85 hover:opacity-100"
                }`}
              >
                <Image src={url} alt={`Miniatura ${idx + 1}`} fill unoptimized sizes="64px" className="object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-tinta/80 px-1 py-0.5 text-[10px] font-semibold text-papel">
                  {idx > 0 ? (
                    <button type="button" onClick={() => moverPrincipio(idx)} title="Usar como principal">
                      1ª
                    </button>
                  ) : (
                    <span>1ª</span>
                  )}
                  <button type="button" onClick={() => quitar(idx)} aria-label={`Quitar imagen ${idx + 1}`}>
                    ×
                  </button>
                </div>
              </div>
            ))}

            {restantes > 0 && (
              <label
                htmlFor={inputId}
                className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-[2px] border border-dashed border-tinta-2 bg-papel text-xs font-semibold text-tinta-2 transition-colors hover:border-tinta hover:text-tinta"
              >
                <span className="text-lg leading-none">+</span>
                <span>{subiendo > 0 ? "…" : "Foto"}</span>
              </label>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-[3px] bg-terracota-claro px-3.5 py-2.5 text-[14px] text-tinta">
          {error}
        </p>
      )}
    </div>
  );
}
