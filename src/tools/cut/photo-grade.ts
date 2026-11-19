// Some browsers support CSS filters but do not implement CanvasRenderingContext2D.filter.
// Grade a still once on those browsers. Two cached frames cover both sides of a dissolve.
import { context2d, makeCanvas } from './dom.ts';

type Matrix = [number, number, number, number, number, number, number, number, number];
const identity: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const sepia: Matrix = [.393, .769, .189, .349, .686, .168, .272, .534, .131];
const luminance: Matrix = [.213, .715, .072, .213, .715, .072, .213, .715, .072];

function blendFromIdentity(matrix: Matrix, amount: number): Matrix {
  return matrix.map((v, i) => identity[i] + (v - identity[i]) * amount) as Matrix;
}

function hueRotation(degrees: number): Matrix {
  const cos = Math.cos(degrees * Math.PI / 180);
  const sin = Math.sin(degrees * Math.PI / 180);
  return [
    .213 + .787*cos - .213*sin, .715 - .715*cos - .715*sin, .072 - .072*cos + .928*sin,
    .213 - .213*cos + .143*sin, .715 + .285*cos + .140*sin, .072 - .072*cos - .283*sin,
    .213 - .213*cos - .787*sin, .715 - .715*cos + .715*sin, .072 + .928*cos + .072*sin,
  ];
}

function applyFilter(data: Uint8ClampedArray, name: string, amount: number): void {
  if (name === 'contrast' || name === 'brightness') {
    const offset = name === 'contrast' ? 127.5 * (1 - amount) : 0;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i] * amount + offset;
      data[i + 1] = data[i + 1] * amount + offset;
      data[i + 2] = data[i + 2] * amount + offset;
    }
    return;
  }
  let matrix: Matrix;
  switch (name) {
    case 'saturate': matrix = blendFromIdentity(luminance, 1 - amount); break;
    case 'grayscale': matrix = blendFromIdentity(luminance, amount); break;
    case 'sepia': matrix = blendFromIdentity(sepia, amount); break;
    case 'hue-rotate': matrix = hueRotation(amount); break;
    default: return;
  }
  const [rr, rg, rb, gr, gg, gb, br, bg, bb] = matrix;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = rr*r + rg*g + rb*b;
    data[i + 1] = gr*r + gg*g + gb*b;
    data[i + 2] = br*r + bg*g + bb*b;
  }
}

const cache: { image: HTMLImageElement; filter: string; canvas: HTMLCanvasElement }[] = [];

export function gradeStill(image: HTMLImageElement, filter: string): HTMLCanvasElement {
  const cached = cache.find((frame) => frame.image === image && frame.filter === filter);
  if (cached) return cached.canvas;
  // The largest export is 1920px on its long side. Bound pixel work for camera originals.
  const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = makeCanvas(Math.max(1, Math.round(image.naturalWidth * scale)),
    Math.max(1, Math.round(image.naturalHeight * scale)));
  const ctx = context2d(canvas, { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (const match of filter.matchAll(/([\w-]+)\(([-\d.]+)(?:deg)?\)/g)) {
    applyFilter(pixels.data, match[1], Number(match[2]));
  }
  ctx.putImageData(pixels, 0, 0);
  if (cache.length === 2) cache.shift();
  cache.push({ image, filter, canvas });
  return canvas;
}
