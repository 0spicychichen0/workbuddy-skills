---
name: earth-online-guide
description: >-
  用《地球Online指南》(github.com/PensiveFei/earth-online-guide) 的正文回答具体生活技能问题：怎么做饭、租房合同怎么看、高铁/飞机/地铁怎么坐、挂号就医、洗衣打扫、防骗维权、出差打包等。先查 docs/ 下对应篇章再答，按原文步骤流程回答、不自己编步骤，并注明出自哪个文件。触发词：怎么蒸米饭、租房合同、押金、合租、高铁票、飞机、地铁、打车、挂号、体检、医保、洗衣机、拖地、换锁、网购、维权、二手、快递、电信诈骗、防骗、打包、出差、地球Online指南、生活技能手册、第一次。
---

# 生活技能查询：按《地球Online指南》查了再答

## 这个 skill 干什么

有人问一件具体的生活技能"怎么做"，先去《地球Online指南》的 `docs/` 里把对应篇章找出来，再按原文的步骤流程回答。

**书里没有的就别编。** 回答里的步骤、费用、坑点都要能指回某个正文文件；指不回去就说书里没写，可以给常识，但要标明那是常识不是书里内容。不要凭记忆补步骤、补价格、补条款。

## 正文位置（已随本 skill 安装到本地，无需联网）

全书是 VitePress 文档站（在线版 eartholguide.com），正文 markdown 已在本地。用绝对路径读取：

```
C:/Users/df/.workbuddy/skills/earth-online-guide/docs/
```

> 注：`.workbuddy` 实际是 junction，透明指向 E 盘，但用上面这个 C 盘路径即可正常访问。

各板块正文在 `docs/<板块>/<文章>.md`；板块首页是 `docs/<板块>/index.md`。图片在 `docs/public/`，本地 markdown 里引用的是站点相对路径（如 `/images/cooking/steam-rice.webp`），本地打不开，需要看图时引导用户去在线版对应页面。

## 板块与文件映射（照着对用户问题定位）

**🍚 做饭 cooking/**
- `steam-rice.md` 蒸米饭 · `congee.md` 煮粥 · `fried-egg.md` 煎蛋 · `steamed-egg-custard.md` 蒸蛋羹
- `noodles.md` 煮面条 · `soup.md` 煲汤 · `stir-fried-greens.md` 炒青菜 · `frozen-dumplings.md` 煮冻饺子
- `knife-skills.md` 刀工 · `kitchen-safety.md` 厨房安全 · `food-storage.md` 食物保存

**🧺 家务 housework/**
- `laundry.md` 洗衣服 · `underwear.md` 内衣袜子清洗 · `mopping.md` 拖地 · `toilet-seat.md` 马桶圈
- `unclog-toilet.md` 通马桶 · `clean-washer.md` 洗洗衣机 · `clean-ac.md` 洗空调 · `ac-saving.md` 空调省电
- `change-lock.md` 换锁 · `smart-lock.md` 智能锁

**🏥 就医 medical/**
- `registration.md` 挂号 · `common-ailments.md` 常见病应对 · `health-checkup.md` 体检 · `medical-insurance.md` 医保社保

**🏠 租房 renting/**
- `finding-a-place.md` 找房 · `viewing-checklist.md` 看房清单 · `contract-pitfalls.md` 合同坑 · `deposit-moveout.md` 押金与退租
- `shared-housing.md` 合租 · `utility-meters.md` 水电表 · `moving-process.md` 搬家流程

**🛒 购物防骗 shopping/**
- `online-shopping.md` 网购 · `rights-protection.md` 维权 · `parcel-claims.md` 快递理赔 · `second-hand.md` 二手交易 · `telecom-scams.md` 电信诈骗

**🚄 出行 travel/**
- `high-speed-rail.md` 高铁 · `flight.md` 飞机 · `bus.md` 公交 · `metro.md` 地铁 · `taxi.md` 打车 · `hotel.md` 酒店
- `tickets.md` 购票 · `packing-list.md` 打包清单 · `lost-documents.md` 证件丢失 · `anti-scam.md` 出行防骗

## 第 1 步：确认正文在本地

检查 `C:/Users/df/.workbuddy/skills/earth-online-guide/docs/index.md` 是否存在。
- 存在 → 本地模式，直接读。
- 不存在 → 说明本 skill 的正文缺失，如实告诉用户，不要凭印象复述。

## 第 2 步：定位到篇章

按上面「板块与文件映射」把用户的问题对到具体文件。拿不准就先读对应板块的 `index.md` 看全貌，或者 grep 条目标题：

```bash
grep -rln '关键词' "C:/Users/df/.workbuddy/skills/earth-online-guide/docs/" --include=*.md
```

## 第 3 步：把内容读出来

用 Read / Grep 直接读对应 `docs/<板块>/<文章>.md`。一篇通常不长（操作流程 / 必要物品与费用 / 容易踩错的点 三段式），可整篇读。

## 第 4 步：怎么写这份答复

照原文的骨架答：

1. **一句话结论 / 第一步是什么**（动词开头）。
2. **操作流程**：按原文顺序列步骤，动词开头，不增不减、不改顺序。原文有具体数值（水量比例、费用、时间）照抄。
3. **必要物品与费用**：原文列了就照列。
4. **容易踩错的点**：原文「容易踩错的点」原样转述，这是真实翻车经验，别漏。
5. **出处**：写明 `docs/<板块>/<文章>.md`，方便用户自己翻或去在线版看配图。

写的时候守住：

- **口语化**：按没做过这件事的成年人能一遍照做来写。专业名词当场用日常话解释一句。
- **不编**：书里没有的步骤、价格、条款一律不加；想补充常识要标明「这是常识，书里没写」。
- **三条铁律必须带上**（来自首页）：
  1. **安全第一**——涉及燃气、用电、医疗的步骤，有安全提醒就一并说。
  2. **内容仅供参考**——就医、法律问题请找专业人士（对应 `docs/disclaimer.md`）；本书不构成医疗/法律/专业建议。
  3. **每个人都会翻车**——第一次做不好很正常，避坑部分都是真实经验。
- **语气克制**，简体中文，不说教。

## 边界

本书是社区协作的开源生活手册（CC BY-SA 4.0），给的是通用经验，不替代医生、律师、专业维修人员。涉及具体病情、具体法律纠纷、具体电器故障的，按书里给方向和该找谁，别替专业人士下判断。
