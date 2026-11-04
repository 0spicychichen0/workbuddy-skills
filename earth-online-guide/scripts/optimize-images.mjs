#!/usr/bin/env node
/**
 * 图片优化：把 docs/public/images 下的原图转成 WebP，尺寸按「实际显示宽度 × 2（Retina）」裁剪。
 *
 * 痛点：原图是 2560×1440 的 JPEG，而正文容器 max-width 只有 688px；
 * 首页 hero 更是 1255×780 的 PNG，而 CSS 里它只显示 520px。
 * 原样直出等于让每个访客多下 4~10 倍的字节。
 *
 * 用法： npm run docs:images
 *
 * 做三件事（幂等，可重复运行）：
 *   1. 生成 docs/public/images 下与原图同目录同名的 .webp
 *   2. 把 markdown / frontmatter 里对原图的引用改成 .webp
 *   3. 写出 docs/.vitepress/image-manifest.json 供构建期读取尺寸
 *
 * 第 2 步必须在源头改：VitePress 是 SPA，markdown 会被编译进 JS chunk，
 * 只在 transformHtml 里改最终 HTML 的话，客户端路由跳转时仍会去拉原图。
 *
 * 原图保留在仓库里作为「母版」，重跑本脚本需要它们。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs')
const IMAGES_DIR = path.join(DOCS, 'public/images')
const MANIFEST_PATH = path.join(DOCS, '.vitepress/image-manifest.json')

/** 显示宽度 × 2（Retina）。宽度取自线上 CSS 实测值，不是拍脑袋。 */
const TARGETS = [
  { test: /^mascot\/home-hero\.png$/, width: 1040, quality: 90 },
  { test: /^mascot\//, width: 760, quality: 90 },
  { test: /.*/, width: 1400, quality: 82 }
]

const HERO_REL = "mascot/home-hero.png"

function walkImages(dir, base = dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkImages(full, base))
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return out
}

async function encode(src, width, quality) {
  return sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer({ resolveWithObject: true })
}

async function main() {
  const files = walkImages(IMAGES_DIR).sort()
  const manifest = {}
  let before = 0
  let after = 0

  console.log("")
  console.log("文件".padEnd(42) + "原尺寸".padStart(13) + "新尺寸".padStart(13) + "体积".padStart(21))
  console.log("-".repeat(90))

  for (const rel of files) {
    const src = path.join(IMAGES_DIR, rel)
    const rule = TARGETS.find((t) => t.test.test(rel))
    const outRel = rel.replace(/\.(jpe?g|png)$/i, ".webp")
    const meta = await sharp(src).metadata()
    const buf = await encode(src, rule.width, rule.quality)
    fs.writeFileSync(path.join(IMAGES_DIR, outRel), buf.data)

    const sizeBefore = fs.statSync(src).size
    const sizeAfter = buf.data.length
    before += sizeBefore
    after += sizeAfter

    const entry = {
      src: `/images/${rel}`,
      webp: `/images/${outRel}`,
      width: buf.info.width,
      height: buf.info.height
    }

    // hero 是 LCP 元素，额外出一档 520w：桌面 2x 取 1040w，普通屏/手机取 520w
    if (rel === HERO_REL) {
      const smallName = outRel.replace(/\.webp$/, "-520.webp")
      const small = await encode(src, 520, 88)
      fs.writeFileSync(path.join(IMAGES_DIR, smallName), small.data)
      entry.srcset = `/images/${smallName} 520w, /images/${outRel} ${buf.info.width}w`
      entry.sizes = '(min-width: 960px) 520px, min(460px, 100vw)'
    }

    manifest[entry.src] = entry

    const ratio = (sizeBefore / sizeAfter).toFixed(1)
    const sz = `${(sizeBefore / 1024).toFixed(0)}K -> ${(sizeAfter / 1024).toFixed(0)}K  (${ratio}x)`
    console.log(rel.padEnd(42) + `${meta.width}x${meta.height}`.padStart(13) +
      `${buf.info.width}x${buf.info.height}`.padStart(13) + sz.padStart(21))
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n")

  console.log("-".repeat(90))
  console.log(`图片合计 ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB  缩减 ${(before / after).toFixed(1)} 倍`)
  console.log(`清单 ${Object.keys(manifest).length} 条 -> ${path.relative(ROOT, MANIFEST_PATH)}`)

  // ---- 第二步：把 markdown / frontmatter 里的引用改到 .webp ----
  const rewrites = []
  const mdFiles = []
  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== "public" && entry.name !== ".vitepress" && entry.name !== "node_modules") collect(full)
      } else if (entry.name.endsWith(".md")) mdFiles.push(full)
    }
  }
  collect(DOCS)

  for (const file of mdFiles) {
    const original = fs.readFileSync(file, "utf8")
    let updated = original
    for (const entry of Object.values(manifest)) {
      updated = updated.split(entry.src).join(entry.webp)
    }
    if (updated !== original) {
      fs.writeFileSync(file, updated)
      rewrites.push(path.relative(ROOT, file))
    }
  }

  console.log("")
  if (rewrites.length) {
    console.log(`已把 ${rewrites.length} 个 markdown 文件里的图片引用改到 .webp：`)
    for (const f of rewrites) console.log(`  ${f}`)
  } else {
    console.log("markdown 里已无对原图的引用（无需改写）")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})