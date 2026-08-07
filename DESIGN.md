---
name: OneChart Position Calculator
description: A restrained risk worksheet for position sizing, recovery, and profit protection.
colors:
  ground: "#f3f4f6"
  paper: "#ffffff"
  ink: "#13161a"
  text: "#30363e"
  muted: "#6e7783"
  line: "#e0e3e7"
  accent: "#2563eb"
  risk: "#c94742"
  gain: "#14715c"
  warm: "#996421"
  dark-ground: "#0f1216"
  dark-paper: "#15191e"
  dark-ink: "#f0f2f5"
  dark-text: "#c9d0d8"
  dark-muted: "#8f99a5"
  dark-line: "#282f38"
  dark-risk: "#bd716d"
  dark-warm: "#b99565"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans SC, sans-serif"
    fontSize: "28px"
    fontWeight: 710
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans SC, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans SC, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  control: "0px"
  surface: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
---

# Design System: OneChart Position Calculator

## Overview

**Creative North Star: “The Risk Worksheet”**

这是 OneChart 体系中的操作型工具表面。界面像一张可持续填写和复核的风险工作表：中性背景、白色数据平面、清楚的输入—结果关系，以及只在风险、收益、警示和当前选择上出现的颜色。它拒绝旧式玻璃面板、渐变、彩色卡片、胶囊按钮、emoji 和装饰阴影。

**Key Characteristics:**
- 平面、方角、细线分隔。
- 数字与状态优先，品牌藏在精确的比例和节奏中。
- 浅色默认；深色保持低亮度和相同信息层级。
- 三个计算流程共享同一结构与控件语法。

## Colors

主界面由冷静的中性色构成。蓝色仅标识交互焦点或当前状态，红色用于风险与目标压力，绿色用于收益或安全状态。

- **Ground** (`#f3f4f6`): 页面背景。
- **Paper** (`#ffffff`): 工作表和输入表面。
- **Ink** (`#13161a`): 标题、激活导航和关键数值。
- **Text** (`#30363e`): 正文和主要标签。
- **Muted** (`#6e7783`): 次要说明。
- **Line** (`#e0e3e7`): 分隔线与普通边框。
- **Accent** (`#2563eb`): 焦点和当前选择。
- **Risk / Gain** (`#c94742` / `#14715c`): 风险与收益语义。

深色使用 `#0f1216` ground、`#15191e` paper、`#f0f2f5` ink、`#c9d0d8` text、`#8f99a5` muted 和 `#282f38` line；语义红绿分别为更低亮度、低饱和的 `#bd716d` 与 `#48b89d`，阶段性暖色为 `#b99565`。所有结构分割线保持中性，不随数据颜色变化。

## Typography

使用系统 UI 字体栈，中文由 `Noto Sans SC` 补充。标题 28px/710，移动端 24px；正文通常 12–14px；标签以 10–12px 和 600 左右字重建立层级。金额、百分比与股数保持稳定的数字对齐，不用等宽字体模拟“专业感”。

## Layout

导航采用 full-bleed outer，底部 1px 分界线贯穿视口；导航内容、页面标题与主体使用同一 centered inner。统一 token 为 `--oc-layout-max: 1560px`，容器为 `width: min(var(--oc-layout-max), calc(100% - 2 * var(--oc-layout-gutter)))`，自身不叠加横向 padding。gutter：桌面 24px、1287px 以下 16px、640px 以下 14px。统一导航之后依次为页面标题、流程切换、当前流程的输入/结果双栏。1179px 以下改为单栏；640px 以下导航分两行。流程切换和窄屏导航链接可横向滚动，但页面本身不得横向溢出。

## Elevation & Depth

系统没有静态装饰阴影。层级由背景明度、1px 规则线、留白与文字层级表达；焦点使用可见 outline，而不是光晕。

## Shapes

容器、按钮、输入框、标签和提示均为方角。唯一允许的圆形是 range thumb 等原生数据控制点。

## Components

- **Navigation:** 58px 高；当前页用 2px 底线；移动端分为品牌行和链接行。
- **Workflow tabs:** 透明背景、底部规则线；当前流程以深色底线标识。
- **Panels:** paper 背景、1px line 边框、无阴影；输入和结果在同一网格中对应。
- **Inputs:** 中性背景和边框；focus 转为 accent 边框与清楚的 outline。
- **Segmented controls:** 方角中性按钮；当前选择只改变边框和文字，不铺大面积彩色背景。
- **Status:** 警示、成功和风险可使用轻量语义底色；结果内部的结构分割线统一使用中性 line，仅文字与关键数值保留语义色。
- **Theme control:** 固定使用“月亮/太阳 SVG + 深色/浅色标签”；浅色显示月亮与“深色”，深色显示太阳与“浅色”。状态使用 `onechart-theme` 和 `html[data-theme]`，缺失或非法值回退 light。

## Do's and Don'ts

### Do:
- **Do** 保持输入、公式说明和结果之间的直接对应。
- **Do** 只用颜色表达真实状态。
- **Do** 在 1180px 与 640px 断点保持任务顺序。
- **Do** 保留全部计算 ID、事件入口和本地历史语义。

### Don't:
- **Don't** 使用渐变、玻璃、装饰阴影、emoji 或彩色圆角卡片。
- **Don't** 用卡片嵌套代替信息层级。
- **Don't** 让主题切换重置输入、历史或计算结果。
- **Don't** 将本页面描述为自动交易或投资建议工具。
