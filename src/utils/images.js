// Réduction des images insérées dans les descriptions (côté navigateur) :
// côté le plus long ≤ 1600 px, JPEG qualité 0,85 (PNG conservé si l'image a de la transparence).
export const MAX_IMAGE_SIDE = 1600
export const JPEG_QUALITY = 0.85
const SKIP_TYPES = /^data:image\/(gif|svg\+xml)/i

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}

function hasTransparency(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h)
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 250) return true
  }
  return false
}

/**
 * Renvoie { src, width, height, changed } : une version allégée de l'image si c'est utile.
 * Les GIF (animations) et SVG sont laissés tels quels.
 */
export async function shrinkImage(src, { maxSide = MAX_IMAGE_SIDE, quality = JPEG_QUALITY } = {}) {
  const img = await loadImage(src)
  const w0 = img.naturalWidth
  const h0 = img.naturalHeight
  if (!src.startsWith('data:') || SKIP_TYPES.test(src) || !w0 || !h0) {
    return { src, width: w0, height: h0, changed: false }
  }
  const scale = Math.min(1, maxSide / Math.max(w0, h0))
  const w = Math.max(1, Math.round(w0 * scale))
  const h = Math.max(1, Math.round(h0 * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  const mayBeTransparent = /^data:image\/(png|webp)/i.test(src)
  let out
  if (mayBeTransparent && hasTransparency(ctx, w, h)) {
    out = canvas.toDataURL('image/png')
  } else {
    // Fond blanc sous les zones éventuellement transparentes avant le passage en JPEG.
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    out = canvas.toDataURL('image/jpeg', quality)
  }
  if (out.length >= src.length && scale === 1) {
    return { src, width: w0, height: h0, changed: false }
  }
  return { src: out, width: w, height: h, changed: true }
}
