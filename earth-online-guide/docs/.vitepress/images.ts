/**
 * 构建期图片处理：把 <img> 指向 WebP，并补齐尺寸/加载策略。
 *
 * 为什么不用 markdown-it 的 image 渲染器？
 * 因为页面上有三类图片，只有一类走 markdown 语法：
 *   1. markdown 语法     ![alt](/images/x.jpg)
 *   2. 裸 HTML           <img src="/images/mascot/section.png" class="section-mascot">
 *   3. frontmatter hero  （由 VPHero 组件渲染）
 * 在 transformHtml 这一层统一处理，三类一网打尽，且不用改任何一篇 markdown。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HeadConfig, PageData } from 'vitepress'

interface ImageInfo {
  webp: string
  width: number
  height: number
  srcset?: string
  sizes?: string
}

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function loadManifest(): Record<string, ImageInfo> {
  try {
    const raw = fs.readFileSync(path.join(docsRoot, '.vitepress/image-manifest.json'), 'utf8')
    return JSON.parse(raw) as Record<string, ImageInfo>
  } catch {
    // 清单缺失时整体降级为「什么都不做」，站点照常构建
    return {}
  }
}

const MANIFEST = loadManifest()

/**
 * 同时用「原图路径」和「webp 路径」建索引。
 * markdown 里的引用已被 optimize-images 改写成 .webp，
 * 但原图路径也保留映射，这样无论脚本跑没跑过都不会漏掉图片。
 */
const INDEX: Record<string, ImageInfo> = {}
for (const entry of Object.values(MANIFEST)) {
  INDEX[entry.src] = entry
  INDEX[entry.webp] = entry
}
const HAS_MANIFEST = Object.keys(INDEX).length > 0

const HERO = Object.values(MANIFEST).find((e) => e.src.endsWith('/mascot/home-hero.png'))

/**
 * 首页 hero 是 LCP 元素，但它出现在 HTML 靠后的位置，
 * 浏览器要解析到那一行才会发起请求。在 <head> 里 preload 并标记高优先级，
 * 可以让它跟 CSS 并行下载，而不是排在后面。
 */
export function imageHead({ pageData }: { pageData: PageData }): HeadConfig[] {
  if (!HAS_MANIFEST || pageData.relativePath !== 'index.md' || !HERO) return []
  const hero = HERO
  const attrs: Record<string, string> = {
    rel: 'preload',
    as: 'image',
    href: hero.webp,
    fetchpriority: 'high'
  }
  // preload 响应式图片必须同时给出 imagesrcset/imagesizes，否则会重复下载
  if (hero.srcset) attrs.imagesrcset = hero.srcset
  if (hero.sizes) attrs.imagesizes = hero.sizes
  return [['link', attrs]]
}

const IMG_TAG_RE = /<img\b[^>]*>/g
const SRC_RE = /\bsrc="([^"]*)"/
const HERO_CLASS_RE = /\bclass="[^"]*\bimage-src\b[^"]*"/
const MANAGED_ATTRS = ['width', 'height', 'loading', 'decoding', 'fetchpriority', 'srcset', 'sizes']

function stripAttr(tag: string, name: string): string {
  return tag
    .replace(new RegExp(`\\s+${name}="[^"]*"`, 'gi'), '')
    .replace(new RegExp(`\\s+${name}(?=[\\s/>])`, 'gi'), '')
}

export function transformHtml(code: string): string {
  if (!HAS_MANIFEST) return code

  return code.replace(IMG_TAG_RE, (tag) => {
    const srcMatch = tag.match(SRC_RE)
    if (!srcMatch) return tag
    const info = INDEX[srcMatch[1]]
    if (!info) return tag

    let out = tag.replace(SRC_RE, `src="${info.webp}"`)
    for (const attr of MANAGED_ATTRS) out = stripAttr(out, attr)

    const isHero = HERO_CLASS_RE.test(out)
    const bits = [`width="${info.width}"`, `height="${info.height}"`]

    if (info.srcset && info.sizes) {
      bits.push(`srcset="${info.srcset}"`, `sizes="${info.sizes}"`)
    }
    if (isHero) {
      // LCP 元素：绝不能用 lazy，且要声明高优先级
      bits.push('decoding="async"', 'fetchpriority="high"')
    } else {
      // 正文图基本都在首屏之下，lazy 能省掉大部分流量
      bits.push('loading="lazy"', 'decoding="async"')
    }

    const close = out.lastIndexOf('>')
    const head = out.slice(0, close).replace(/\/\s*$/, '')
    return `${head} ${bits.join(' ')}>`
  })
}

/** 首页 hero 优化后的路径，供外部复用 */
export const HERO_WEBP = HERO?.webp ?? null