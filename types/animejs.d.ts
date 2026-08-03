// Minimal types for animejs v3 (default export + namespace members).
// Mirrors the public @types/animejs shape: `anime({...})`, `anime.stagger(...)`,
// and the `anime.AnimeInstance` type referenced by the components.
declare module "animejs" {
  interface AnimeParams {
    targets?: unknown;
    duration?: number;
    delay?: number | (() => number);
    easing?: string | number[];
    direction?: "normal" | "reverse" | "alternate";
    loop?: boolean | number;
    autoplay?: boolean;
    opacity?: unknown;
    translateX?: unknown;
    translateY?: unknown;
    rotate?: unknown;
    scale?: unknown;
    keyframes?: Record<string, unknown>[];
    begin?: (anim: AnimeInstance) => void;
    update?: (anim: AnimeInstance) => void;
    complete?: (anim: AnimeInstance) => void;
    [key: string]: unknown;
  }

  interface AnimeInstance {
    pause(): void;
    play(): void;
    restart(): void;
    reverse(): void;
    seek(time: number): void;
    [key: string]: unknown;
  }

  function anime(params: AnimeParams): AnimeInstance;

  namespace anime {
    export { AnimeInstance, AnimeParams };
    export function stagger(value: number | number[] | string, params?: Record<string, unknown>): () => number;
  }

  export = anime;
}
