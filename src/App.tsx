import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

type TemplateCategory = "F&B / Quán" | "Làm đẹp" | "Tư vấn / Dịch vụ" | "Du lịch";

type TemplateLayout = "split" | "bold" | "minimal";

type TemplateItem = {
  id: string;
  name: string;
  category: TemplateCategory;
  price: number; // 0 = free
  popularScore: number;
  description: string;
  tags: string[];
  layout: TemplateLayout;
};

type FontMode = "system" | "serif" | "mono";

type TemplateConfig = {
  brandName: string;
  tagline: string;
  primary: string;
  fontMode: FontMode;
  phone: string;
  email: string;
  address: string;
  showGallery: boolean;
  showFaq: boolean;
};

const TEMPLATES: TemplateItem[] = [
  {
    id: "cafe-moc",
    name: "Cafe Mộc",
    category: "F&B / Quán",
    price: 199000,
    popularScore: 92,
    description:
      "Landing page cho quán cafe/đồ uống",
    tags: ["Menu", "Đặt bàn", "Bản đồ"],
    layout: "split",
  },
    {
    id: "travel-trivago",
    name: "Travel Finder",
    category: "Du lịch",
    price: 299000,
    popularScore: 88,
    description:
      "Website tìm khách sạn: search theo điểm đến + ngày + khách, gợi ý deal & khách sạn nổi bật.",
    tags: ["Tìm khách sạn", "So sánh giá", "Deal hot"],
    layout: "bold",
  },

  {
    id: "consult-pro",
    name: "Consult Pro",
    category: "Tư vấn / Dịch vụ",
    price: 0,
    popularScore: 84,
    description:
      "Website giới thiệu sản phẩm và bán hàng",
    tags: ["Case study", "FAQ", "Form"],
    layout: "minimal",
  },
];

const DEFAULT_CFG: TemplateConfig = {
  brandName: "Tên thương hiệu",
  tagline: "Slogan/Thông điệp chính",
  primary: "#1a5cff",
  fontMode: "system",
  phone: "0900 000 000",
  email: "hello@domain.com",
  address: "123 Đường A, Quận B",
  showGallery: true,
  showFaq: true,
};

type SortKey = "popular" | "price-asc" | "price-desc" | "name";
type Viewport = "desktop" | "tablet" | "mobile";

function formatPrice(vnd: number): string {
  if (vnd === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(vnd) + "đ";
}

function safeSlug(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "") || "site"
  );
}

function fontStack(mode: FontMode): string {
  if (mode === "serif")
    return `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;
  if (mode === "mono")
    return `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
  return `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
}

function suggestedBrandName(tpl: TemplateItem): string {
  if (tpl.id === "cafe-moc") return "Cafe Mộc";
  if (tpl.id === "travel-trivago") return "Travel Finder";
  if (tpl.id === "consult-pro") return "Consult Pro";
  return DEFAULT_CFG.brandName;
}

function suggestedTagline(tpl: TemplateItem): string {
  if (tpl.id === "cafe-moc")
    return "Cà phê thơm • Không gian ấm • Gặp gỡ bạn bè";
  if (tpl.id === "travel-trivago")
    return "Tìm khách sạn • So sánh giá • Deal tốt mỗi ngày";
  if (tpl.id === "consult-pro")
    return "PRO X — Maximum performance for gamers";
  return DEFAULT_CFG.tagline;
}

function suggestedColor(tpl: TemplateItem): string {
  if (tpl.id === "cafe-moc") return "#006241";
  if (tpl.id === "travel-trivago") return "#e11d2e";
  if (tpl.id === "consult-pro") return "#0ea5e9";
  return DEFAULT_CFG.primary;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();

  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Core: generate HTML for the selected template + config
 * -> used for iframe srcDoc + download HTML file
 */
function renderTemplateHtml(tpl: TemplateItem, cfg: TemplateConfig): string {
  const anchorOffset = tpl.id === "cafe-moc" ? 110 : 90;

  const cssVars = `
    :root{
      --p: ${cfg.primary};
      --txt: #0c1633;
      --muted: rgba(12,22,51,.72);
      --card: rgba(255,255,255,.92);
      --stroke: rgba(12,22,51,.12);
      --shadow: 0 18px 44px rgba(12,22,51,.14);
      --r: 18px;
      --font: ${fontStack(cfg.fontMode)};
      --anchor: ${anchorOffset}px;
    }
  `;

  const body =
    tpl.id === "cafe-moc"
      ? layoutStarbucksCafe(cfg)
      : tpl.id === "travel-trivago"
        ? layoutTrivagoTravel(cfg)
        : tpl.id === "consult-pro"
          ? layoutFinalProducts(cfg)  
          : tpl.layout === "split"
            ? layoutSplit(cfg, tpl.category)
            : tpl.layout === "bold"
              ? layoutBold(cfg, tpl.category)
              : layoutMinimal(cfg, tpl.category);

  const topBar =
     tpl.id === "cafe-moc" || tpl.id === "travel-trivago"
      ? ""
      : `
    <div class="top">
      <div class="nav">
        <div class="brand">
          <div class="mark">${escapeHtml(cfg.brandName).slice(0,2).toUpperCase()}</div>
          <div>${escapeHtml(cfg.brandName)}</div>
        </div>
        <div class="navlinks">
          <a href="#services">Dịch vụ</a>
          ${cfg.showGallery ? `<a href="#gallery">Gallery</a>` : ``}
          ${cfg.showFaq ? `<a href="#faq">FAQ</a>` : ``}
          <a href="#contact">Liên hệ</a>
        </div>
        <a class="btn primary" href="#contact">Gọi tư vấn</a>
      </div>
    </div>
  `;

  return `<!doctype html>

<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(cfg.brandName)} • ${escapeHtml(tpl.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
  rel="stylesheet"
/>

<style>
${cssVars}
*{ box-sizing: border-box; }
html, body { font-family: var(--font); }
html{
  scroll-behavior: smooth;
  scroll-padding-top: var(--anchor);
}

/* mọi target có id khi nhảy anchor sẽ tự chừa khoảng trên */
[id]{
  scroll-margin-top: var(--anchor);
}
button, input, select, textarea {
  font-family: var(--font);
  font-weight: inherit;
}
button { font: inherit; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

body{
  margin:0;
  font-family: var(--font);
  background:
    radial-gradient(900px 520px at 20% 0%, rgba(26,92,255,.14), transparent 60%),
    radial-gradient(700px 420px at 85% 10%, rgba(0,200,255,.10), transparent 62%),
    #f6f8ff;
  color: var(--txt);
}
a{ color: inherit; text-decoration: none; }
.wrap{ max-width: 1050px; margin: 0 auto; padding: 18px; }
.top{
  position: sticky; top: 0; z-index: 9;
  background: rgba(246,248,255,.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(12,22,51,.10);
}
.nav{
  display:flex; align-items:center; justify-content: space-between;
  gap: 14px; padding: 12px 18px;
  max-width: 1050px; margin: 0 auto;
}
.brand{
  display:flex; gap: 10px; align-items:center;
  font-weight: 950; letter-spacing: -.01em;
}
.mark{
  width: 38px; height: 38px; border-radius: 14px;
  background: linear-gradient(135deg, var(--p), rgba(0,200,255,.35));
  display:grid; place-items:center; color: #fff; font-weight: 950;
  box-shadow: 0 16px 34px rgba(26,92,255,.18);
}
.navlinks{
  display:flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: auto;        /* ✅ đẩy cụm link sang phải */
  justify-content: flex-end;/* ✅ canh phải trong cụm */
}

.navlinks a{ color: rgba(12,22,51,.74); font-weight: 900; font-size: 13px; }
.btn{
  border: 1px solid rgba(12,22,51,.14);
  background: #fff;
  padding: 10px 12px;
  border-radius: 14px;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(12,22,51,.10);
}
.btn.primary{
  border-color: rgba(0,0,0,0);
  background: linear-gradient(135deg, var(--p), rgba(26,92,255,.55));
  color: #fff;
}
.card{
  background: #fff;
  border: 1px solid rgba(12,22,51,.10);
  border-radius: var(--r);
  box-shadow: var(--shadow);
}
.grid3{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.grid2{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.muted{ color: rgba(12,22,51,.72); }
.k{
  font-size: 12px; color: rgba(12,22,51,.62);
  font-weight: 950; text-transform: uppercase; letter-spacing: .10em;
}
.h2{ font-size: 22px; font-weight: 1000; margin: 0 0 8px; letter-spacing: -.02em; }
.h3{ font-size: 16px; font-weight: 1000; margin: 0 0 6px; }
.pad{ padding: 16px; }
.hero{
  margin-top: 16px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(12,22,51,.10);
  background:
    radial-gradient(900px 520px at 20% 10%, rgba(26,92,255,.18), transparent 60%),
    radial-gradient(700px 420px at 80% 20%, rgba(0,200,255,.10), transparent 62%),
    #ffffff;
}
.section{ margin-top: 14px; }
.pill{
  display:inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  font-weight: 950;
  font-size: 12px;
  color: rgba(12,22,51,.72);
}
.service{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(12,22,51,.02), rgba(12,22,51,.00));
}
.gal{
  height: 110px;
  border-radius: 16px;
  border: 1px solid rgba(12,22,51,.10);
  background:
    radial-gradient(260px 160px at 30% 35%, rgba(26,92,255,.18), transparent 60%),
    radial-gradient(260px 160px at 70% 65%, rgba(0,200,255,.12), transparent 62%),
    #fff;
}
.footer{
  margin: 18px 0 10px;
  text-align:center;
  color: rgba(12,22,51,.62);
  font-weight: 900;
  font-size: 12px;
}
.contactbox{ display:grid; grid-template-columns: 1.1fr .9fr; gap: 12px; }
.field{ display:flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.field input, .field textarea{
  border: 1px solid rgba(12,22,51,.14);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 850;
  outline: none;
}
.faq{ display:grid; gap: 10px; }
details{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 16px;
  padding: 12px 12px;
  background: rgba(12,22,51,.02);
}
summary{ cursor:pointer; font-weight: 1000; }
@media (max-width: 860px){
  .grid3{ grid-template-columns: 1fr; }
  .grid2{ grid-template-columns: 1fr; }
  .contactbox{ grid-template-columns: 1fr; }
  .navlinks{ display:none; }
  .wrap{ padding: 14px; }
}
/* ===== Starbucks-like (for cafe) ===== */
.sb-wrap{ max-width: 1200px; margin: 0 auto; padding: 0 18px; }
.sb-top{
  position: sticky; top: 0; z-index: 20;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(12,22,51,.10);
}
.sb-nav{
  display:flex; align-items:center; justify-content: space-between;
  gap: 16px; padding: 14px 18px; max-width: 1200px; margin: 0 auto;
}
.sb-left{ display:flex; align-items:center; gap: 18px; }
.sb-logo{
  width: 42px; height: 42px; border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.65), rgba(255,255,255,.2)),
              linear-gradient(135deg, var(--p), rgba(0,0,0,.05));
  border: 1px solid rgba(12,22,51,.10);
  display:grid; place-items:center; color: #fff; font-weight: 1000;
  box-shadow: 0 12px 30px rgba(0,98,65,.18);
}
.sb-menu{ display:flex; gap: 16px; flex-wrap: wrap; }
.sb-menu a{
  font-weight: 1000; letter-spacing: .04em; text-transform: uppercase;
  font-size: 12px; color: rgba(12,22,51,.78);
}
.sb-right{ display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
.sb-btn{
  border: 1px solid rgba(12,22,51,.14);
  background: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 1000;
  cursor: pointer;
}
.sb-btn.black{ background: #111; color: #fff; border-color: #111; }
.sb-find{
  display:flex; align-items:center; gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  font-weight: 950;
  color: rgba(12,22,51,.74);
}

.sb-ann{
  background: #2f4b3a;
  color: rgba(255,255,255,.92);
  border-bottom: 1px solid rgba(0,0,0,.08);
}
.sb-ann-inner{
  max-width: 1200px; margin: 0 auto; padding: 14px 18px;
  display:flex; align-items:center; justify-content:center; gap: 12px; flex-wrap: wrap;
  font-weight: 950;
}
.sb-ann-inner .sb-btn{
  background: transparent;
  border-color: rgba(255,255,255,.6);
  color: #fff;
}

.sb-section{ padding: 22px 0; }
.sb-tiles{
  max-width: 1200px; margin: 0 auto;
  display:grid; gap: 22px; padding: 0 18px 24px;
}
.sb-tile{
  display:grid; grid-template-columns: 1fr 1fr;
  border-radius: 22px; overflow: hidden;
  border: 1px solid rgba(12,22,51,.10);
  background: #fff;
  box-shadow: 0 18px 44px rgba(12,22,51,.12);
}
.sb-img{
  min-height: 320px;
  background:
    radial-gradient(520px 280px at 30% 30%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(480px 240px at 70% 70%, rgba(0,0,0,.08), transparent 62%),
    linear-gradient(135deg, rgba(0,98,65,.22), rgba(255,255,255,.0));
}
.sb-img.alt{
  background:
    radial-gradient(520px 280px at 30% 30%, rgba(255,255,255,.35), transparent 60%),
    radial-gradient(480px 240px at 70% 70%, rgba(0,0,0,.06), transparent 62%),
    linear-gradient(135deg, rgba(193,155,107,.24), rgba(255,255,255,.0));
}
.sb-content{
  display:grid; place-items:center;
  padding: 26px;
  text-align: center;
}
.sb-green{ background: #0b6b50; color: #fff; }
.sb-beige{ background: #f4efe7; color: #0c1633; }
.sb-content-inner{ max-width: 420px; }
.sb-h{
  margin: 0 0 10px;
  font-size: 28px; line-height: 1.15;
  font-weight: 1000; letter-spacing: -.02em;
}
.sb-p{
  margin: 0 0 16px;
  line-height: 1.75;
  font-weight: 850;
  opacity: .92;
}
.sb-cta{
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 1000;
  border: 1px solid rgba(255,255,255,.7);
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.sb-cta.dark{
  border-color: rgba(12,22,51,.18);
  color: rgba(12,22,51,.90);
}
.sb-info{
  max-width: 1200px; margin: 0 auto;
  padding: 0 18px 26px;
  display:grid; grid-template-columns: 1.2fr .8fr; gap: 16px;
}
.sb-card{
  border-radius: 22px;
  border: 1px solid rgba(12,22,51,.10);
  background: rgba(255,255,255,.86);
  box-shadow: 0 18px 44px rgba(12,22,51,.10);
  padding: 16px;
}
.sb-k{ font-size: 12px; letter-spacing: .12em; text-transform: uppercase; font-weight: 1000; color: rgba(12,22,51,.62); }
.sb-row{ display:flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
.sb-pill{
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  font-weight: 950;
  color: rgba(12,22,51,.72);
}

@media (max-width: 900px){
  .sb-tile{ grid-template-columns: 1fr; }
  .sb-img{ min-height: 220px; }
  .sb-info{ grid-template-columns: 1fr; }
  .sb-menu{ display:none; }
}

/* ===== Trivago-like (Travel) ===== */
.tv-top{
  position: sticky; top: 0; z-index: 20;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(12,22,51,.10);
}
.tv-nav{
  max-width: 1200px; margin: 0 auto; padding: 12px 18px;
  display:flex; align-items:center; justify-content: space-between; gap: 12px;
}
.tv-brand{
  display:flex; align-items:center; gap: 10px;
  font-weight: 1000; letter-spacing: -.02em;
}
.tv-logo{
  width: 38px; height: 38px; border-radius: 12px;
  display:grid; place-items:center; color:#fff; font-weight: 1000;
  background: linear-gradient(135deg, var(--p), rgba(0,0,0,.06));
  box-shadow: 0 16px 30px rgba(0,0,0,.10);
}
.tv-links{ display:flex; gap: 14px; flex-wrap: wrap; }
.tv-links a{ font-weight: 950; font-size: 13px; color: rgba(12,22,51,.78); }
.tv-actions{ display:flex; gap: 10px; align-items:center; }
.tv-ghost{
  border: 1px solid rgba(12,22,51,.14);
  background: #fff;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 950;
  cursor: pointer;
}
.tv-hero{
  max-width: 1200px; margin: 0 auto; padding: 18px;
}
.tv-heroBox{
  border-radius: 24px;
  border: 1px solid rgba(12,22,51,.10);
  background:
    radial-gradient(900px 520px at 20% 10%, rgba(225,29,46,.16), transparent 60%),
    radial-gradient(700px 420px at 80% 20%, rgba(26,92,255,.10), transparent 62%),
    #fff;
  padding: 18px;
  overflow: hidden;
}
.tv-title{
  margin: 0;
  font-size: 34px;
  font-weight: 1100;
  letter-spacing: -.03em;
}
.tv-sub{
  margin: 8px 0 0;
  color: rgba(12,22,51,.72);
  font-weight: 850;
  line-height: 1.6;
}
.tv-tabs{
  margin-top: 14px;
  display:flex; gap: 10px; flex-wrap: wrap;
}
.tv-tab{
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 950;
  color: rgba(12,22,51,.78);
}
.tv-search{
  margin-top: 14px;
  border-radius: 20px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(255,255,255,.92);
  box-shadow: 0 18px 44px rgba(12,22,51,.10);
  padding: 12px;
}
.tv-row{
  display:grid;
  grid-template-columns: 1.2fr .9fr .9fr .7fr auto;
  gap: 10px;
  align-items: end;
}
.tv-field{
  display:flex; flex-direction: column; gap: 6px;
}
.tv-label{
  font-size: 11px; letter-spacing: .10em; text-transform: uppercase;
  color: rgba(12,22,51,.62); font-weight: 1000;
}
.tv-input{
  border: 1px solid rgba(12,22,51,.14);
  border-radius: 14px;
  padding: 10px 12px;
  font-weight: 900;
  outline: none;
  background: #fff;
}
.tv-btn{
  border-radius: 14px;
  border: 0;
  padding: 12px 16px;
  font-weight: 1000;
  cursor: pointer;
  color:#fff;
  background: linear-gradient(135deg, var(--p), rgba(0,0,0,.04));
  box-shadow: 0 14px 30px rgba(0,0,0,.12);
  white-space: nowrap;
}
.tv-main{
  max-width: 1200px; margin: 0 auto; padding: 0 18px 26px;
  display:grid; grid-template-columns: 280px 1fr; gap: 14px;
}
.tv-panel{
  border-radius: 18px;
  border: 1px solid rgba(12,22,51,.10);
  background: rgba(255,255,255,.92);
  box-shadow: 0 18px 44px rgba(12,22,51,.08);
  padding: 14px;
}
.tv-filters .tv-chip{
  display:inline-flex; align-items:center; gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  font-weight: 950;
  color: rgba(12,22,51,.75);
  margin: 6px 6px 0 0;
}
.tv-list{ display:grid; gap: 12px; }
.tv-item{
  display:grid; grid-template-columns: 180px 1fr 170px;
  gap: 12px;
  border-radius: 18px;
  border: 1px solid rgba(12,22,51,.10);
  background: #fff;
  box-shadow: 0 18px 44px rgba(12,22,51,.08);
  overflow: hidden;
}
.tv-img{
  background:
    radial-gradient(260px 160px at 30% 35%, rgba(26,92,255,.14), transparent 60%),
    radial-gradient(260px 160px at 70% 65%, rgba(225,29,46,.10), transparent 62%),
    #fff;
}
.tv-mid{ padding: 12px; }
.tv-h{
  margin: 0;
  font-weight: 1050;
  letter-spacing: -.02em;
}
.tv-meta{
  margin-top: 6px;
  color: rgba(12,22,51,.72);
  font-weight: 850;
  font-size: 13px;
  line-height: 1.5;
}
.tv-badges{ margin-top: 10px; display:flex; gap: 8px; flex-wrap: wrap; }
.tv-badge{
  font-size: 12px;
  font-weight: 950;
  color: rgba(12,22,51,.74);
  background: rgba(12,22,51,.03);
  border: 1px solid rgba(12,22,51,.12);
  border-radius: 999px;
  padding: 6px 10px;
}
.tv-right{
  padding: 12px;
  display:flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
}
.tv-price{
  text-align: right;
}
.tv-from{
  font-size: 12px;
  color: rgba(12,22,51,.62);
  font-weight: 900;
}
.tv-amount{
  font-size: 22px;
  font-weight: 1100;
}
.tv-cta{
  border-radius: 14px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  padding: 10px 12px;
  font-weight: 1000;
  cursor: pointer;
}

/* ===== Final-like hero + tools ===== */
.fp-hero{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 26px;
  background:
    radial-gradient(900px 520px at 20% 10%, rgba(26,92,255,.10), transparent 60%),
    radial-gradient(700px 420px at 80% 20%, rgba(0,200,255,.08), transparent 62%),
    #fff;
  padding: 18px;
  margin-bottom: 18px;
}
.fp-heroInner{ padding: 8px 6px; }
.fp-breadcrumb{
  font-size: 12px;
  font-weight: 900;
  color: rgba(12,22,51,.60);
  letter-spacing: .06em;
  text-transform: uppercase;
}
.fp-heroTitle{
  margin: 10px 0 8px;
  font-size: 52px;
  line-height: 1.02;
  letter-spacing: -.05em;
  font-weight: 1150;
}
.fp-heroSub{
  margin: 0;
  max-width: 70ch;
  color: rgba(12,22,51,.72);
  font-weight: 850;
  line-height: 1.7;
}

.fp-heroTools{
  margin-top: 14px;
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items:center;
}
.fp-search{
  flex: 1;
  min-width: 240px;
  display:flex;
  align-items:center;
  gap: 10px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(255,255,255,.92);
  border-radius: 999px;
  padding: 10px 14px;
  box-shadow: 0 18px 44px rgba(12,22,51,.08);
}
.fp-searchIcon{ color: rgba(12,22,51,.55); font-weight: 1000; }
.fp-search input{
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-weight: 900;
}
.fp-select{
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(255,255,255,.92);
  border-radius: 999px;
  padding: 10px 12px;
  font-weight: 950;
}

.fp-ctaPrimary{
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 1000;
  cursor: pointer;
  color:#fff;
  background: linear-gradient(135deg, var(--p), rgba(0,0,0,.04));
  box-shadow: 0 18px 44px rgba(12,22,51,.10);
}
.fp-ctaGhost{
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 950;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  cursor: pointer;
}

.fp-tabs{
  margin-top: 12px;
  display:flex;
  gap: 10px;
  flex-wrap: wrap;
}
.fp-tab{
  border-radius: 999px;
  padding: 10px 12px;
  font-weight: 950;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  cursor: pointer;
}
.fp-tab.is-on{
  border-color: rgba(0,0,0,0);
  background: linear-gradient(135deg, rgba(26,92,255,.18), rgba(0,200,255,.10));
}

/* Product card extras */
.fp-thumb{ position: relative; }
.fp-thumbBadge{
  position:absolute;
  top: 12px;
  left: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 1000;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(255,255,255,.75);
  backdrop-filter: blur(10px);
}
.fp-chipRow{ margin-top: 10px; display:flex; gap: 8px; flex-wrap: wrap; }
.fp-chipSm{
  border: 1px solid rgba(12,22,51,.10);
  background: rgba(12,22,51,.03);
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 950;
  font-size: 12px;
  color: rgba(12,22,51,.78);
}

/* Compare + support */
.fp-k{
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  font-weight: 1000;
  color: rgba(12,22,51,.62);
}
.fp-h2{
  margin: 8px 0 6px;
  font-size: 22px;
  font-weight: 1100;
  letter-spacing: -.02em;
}
.fp-muted{ color: rgba(12,22,51,.72); font-weight: 850; line-height: 1.7; margin: 0; }

.fp-compare{
  margin-top: 18px;
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 22px;
  background: rgba(255,255,255,.86);
  box-shadow: 0 18px 44px rgba(12,22,51,.06);
  padding: 14px;
}
.fp-compareHead{
  display:flex;
  align-items:flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.fp-compareGrid{
  margin-top: 12px;
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.fp-compareItem{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 18px;
  background: rgba(12,22,51,.02);
  padding: 12px;
}
.fp-compareK{ font-size: 12px; font-weight: 950; color: rgba(12,22,51,.62); }
.fp-compareV{ margin-top: 6px; font-weight: 1000; color: rgba(12,22,51,.86); }

.fp-support{ margin-top: 18px; }
.fp-supportCard{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 22px;
  background: rgba(255,255,255,.86);
  box-shadow: 0 18px 44px rgba(12,22,51,.06);
  padding: 14px;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items:start;
}
.fp-form{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.fp-field{ display:flex; flex-direction: column; gap: 6px; }
.fp-field span{
  font-size: 11px;
  letter-spacing: .10em;
  text-transform: uppercase;
  font-weight: 1000;
  color: rgba(12,22,51,.62);
}
.fp-field input, .fp-field textarea{
  border: 1px solid rgba(12,22,51,.14);
  border-radius: 14px;
  padding: 10px 12px;
  outline: none;
  font-weight: 900;
}
.fp-field--full{ grid-column: 1 / -1; }
.fp-formBtn{ grid-column: 1 / -1; justify-self: start; }

.fp-filterRow{ margin-top: 10px; }
.fp-help{ margin-top: 10px; color: rgba(12,22,51,.78); font-weight: 850; line-height: 1.7; }
.fp-helpMuted{ margin-top: 6px; color: rgba(12,22,51,.62); }

/* Responsive */
@media (max-width: 980px){
  .fp-heroTitle{ font-size: 40px; }
  .fp-supportCard{ grid-template-columns: 1fr; }
  .fp-compareGrid{ grid-template-columns: 1fr; }
}


@media (max-width: 980px){
  .tv-main{ grid-template-columns: 1fr; }
  .tv-row{ grid-template-columns: 1fr 1fr; }
  .tv-item{ grid-template-columns: 1fr; }
  .tv-right{ align-items: flex-start; }
}

/* ===== Final-like PRODUCTS page (consult-pro) ===== */
.fp{
  background: #ffffff !important;
  color: #0c1633 !important;
}
.fp a{ color: inherit; }

.fp-top{
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,.86);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(12,22,51,.10);
}
.fp-nav{
  max-width: 1200px; margin: 0 auto;
  display:flex; align-items:center; justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
}
.fp-brand{
  display:flex; align-items:center; gap: 10px;
  font-weight: 1000; letter-spacing: -.02em;
}
.fp-logo{
  width: 40px; height: 40px; border-radius: 999px;
  display:grid; place-items:center;
  color:#fff; font-weight: 1000;
  background: linear-gradient(135deg, var(--p), rgba(0,0,0,.06));
  box-shadow: 0 14px 30px rgba(12,22,51,.12);
}
.fp-links{ display:flex; gap: 14px; flex-wrap: wrap; }
.fp-links a{
  font-weight: 900;
  font-size: 13px;
  color: rgba(12,22,51,.72);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.fp-actions{ display:flex; gap: 10px; align-items:center; }
.fp-pillBtn{
  border-radius: 999px;
  padding: 10px 12px;
  border: 1px solid rgba(12,22,51,.12);
  background: rgba(12,22,51,.03);
  font-weight: 950;
  color: rgba(12,22,51,.76);
}

.fp-page{
  max-width: 1200px;
  margin: 0 auto;
  padding: 18px 18px 30px;
}
.fp-layout{
  display:grid;
  grid-template-columns: 280px 1fr;
  gap: 18px;
  align-items: start;
}

.fp-side{
  position: sticky;
  top: 84px; /* gần giống trang mẫu: sidebar bám khi scroll */
  border-right: 1px solid rgba(12,22,51,.08);
  padding-right: 14px;
}
.fp-side h4{
  margin: 14px 0 8px;
  font-size: 12px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(12,22,51,.62);
  font-weight: 1000;
}
.fp-side a{
  display:block;
  padding: 8px 0;
  font-weight: 900;
  color: rgba(12,22,51,.78);
}
.fp-side a:hover{ text-decoration: underline; text-underline-offset: 4px; }

.fp-mainTitle{
  margin: 6px 0 14px;
  font-size: 44px;
  letter-spacing: -.04em;
  font-weight: 1100;
}

.fp-grid{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.fp-card{
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 18px 44px rgba(12,22,51,.08);
  overflow: hidden;
}
.fp-thumb{
  height: 190px;
  background:
    radial-gradient(520px 260px at 20% 20%, rgba(26,92,255,.16), transparent 60%),
    radial-gradient(520px 260px at 80% 80%, rgba(0,200,255,.10), transparent 62%),
    linear-gradient(135deg, rgba(12,22,51,.06), rgba(255,255,255,0));
  border-bottom: 1px solid rgba(12,22,51,.08);
}
.fp-body{ padding: 14px 14px 16px; }
.fp-h{
  margin: 0;
  font-size: 18px;
  font-weight: 1050;
  letter-spacing: -.02em;
}
.fp-desc{
  margin: 8px 0 0;
  color: rgba(12,22,51,.72);
  font-weight: 800;
  line-height: 1.6;
}
.fp-more{
  display:inline-flex;
  margin-top: 12px;
  font-weight: 1000;
  color: rgba(12,22,51,.86);
  border-bottom: 2px solid rgba(12,22,51,.18);
  padding-bottom: 2px;
}
.fp-more:hover{ border-bottom-color: rgba(12,22,51,.35); }

.fp-lineup{
  margin-top: 18px;
  border: 1px solid rgba(12,22,51,.10);
  border-radius: 22px;
  background: rgba(255,255,255,.86);
  box-shadow: 0 18px 44px rgba(12,22,51,.06);
  padding: 14px;
}
.fp-lineup h3{
  margin: 0;
  font-size: 14px;
  font-weight: 1050;
  letter-spacing: -.01em;
}
.fp-lineupList{
  margin-top: 10px;
  display:flex;
  gap: 8px;
  flex-wrap: wrap;
}
.fp-chip{
  border: 1px solid rgba(12,22,51,.10);
  background: rgba(12,22,51,.03);
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 950;
  color: rgba(12,22,51,.78);
  font-size: 12px;
}

@media (max-width: 980px){
  .fp-layout{ grid-template-columns: 1fr; }
  .fp-side{
    position: relative;
    top: 0;
    border-right: 0;
    padding-right: 0;
    border-bottom: 1px solid rgba(12,22,51,.08);
    padding-bottom: 10px;
    margin-bottom: 10px;
  }
  .fp-side a{ display:inline-block; padding: 8px 10px; margin: 6px 6px 0 0;
    border: 1px solid rgba(12,22,51,.10);
    border-radius: 999px;
    background: rgba(12,22,51,.03);
  }
  .fp-grid{ grid-template-columns: 1fr; }
  .fp-links{ display:none; }
}


</style>
</head>
<body class="${tpl.id === "consult-pro" ? "fp" : ""}">
  ${topBar}


  ${body}

  <div class="wrap footer">
    Phone: ${escapeHtml(cfg.phone)} • Email: ${escapeHtml(cfg.email)}
  </div>

  <script>
    const f = document.getElementById('leadForm');
    const sf = document.getElementById('tvSearchForm');
    if (sf) {
      sf.addEventListener('submit', (e) => {
        e.preventDefault();
        const dest = document.getElementById('tvDestination')?.value || "";
        const s = document.getElementById('tvStatus');
        if (s) {
          s.textContent = 'Đang tìm deal cho "' + dest + '" (demo). Bạn có thể nối API thật sau.';
          setTimeout(() => s.textContent = "", 3500);
        }
      });
    }

  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Layouts for generated HTML */
function layoutSplit(cfg: TemplateConfig, category: string): string {
  return `
  <div class="wrap">
    <section class="hero">
      <div class="pad grid2" style="align-items:center;">
        <div style="padding: 10px;">
          <div class="k">${escapeHtml(category)}</div>
          <h1 style="margin:8px 0 10px; font-size: 40px; letter-spacing: -.03em; line-height: 1.05;">
            ${escapeHtml(cfg.brandName)}
          </h1>
          <p class="muted" style="margin:0 0 14px; font-size: 15px; line-height: 1.6;">
            ${escapeHtml(cfg.tagline)}
          </p>
          <div style="display:flex; gap: 10px; flex-wrap: wrap;">
            <a class="btn primary" href="#services">Xem dịch vụ</a>
            <a class="btn" href="#contact">Liên hệ</a>
            <span class="pill">☎ ${escapeHtml(cfg.phone)}</span>
          </div>
          <div style="margin-top: 12px; display:flex; gap: 8px; flex-wrap: wrap;">
            <span class="pill">Thiết kế gọn</span>
            <span class="pill">Tải 1 file</span>
            <span class="pill">Chuẩn mobile</span>
          </div>
        </div>
        <div style="padding: 10px;">
          <div class="card" style="padding: 14px; border-radius: 22px;">
            <div class="k">Nổi bật</div>
            <div class="h2" style="margin-top: 6px;">Menu hôm nay</div>
            <div class="grid3" style="margin-top: 10px;">
              <div class="service"><div class="h3">Signature</div><div class="muted">Best-seller</div></div>
              <div class="service"><div class="h3">Combo</div><div class="muted">Tiết kiệm</div></div>
              <div class="service"><div class="h3">Giao nhanh</div><div class="muted">Nhận trong 30’</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="services" class="section">
      <div class="k">Dịch vụ</div>
      <div class="h2">Bạn cung cấp gì?</div>
      <div class="grid3">
        <div class="card pad"><div class="h3">Sản phẩm 1</div><div class="muted">Mô tả lợi ích.</div></div>
        <div class="card pad"><div class="h3">Sản phẩm 2</div><div class="muted">Mô tả lợi ích.</div></div>
        <div class="card pad"><div class="h3">Sản phẩm 3</div><div class="muted">Mô tả lợi ích.</div></div>
      </div>
    </section>

    ${cfg.showGallery ? `
    <section id="gallery" class="section">
      <div class="k">Hình ảnh</div>
      <div class="h2">Một vài hình ảnh</div>
      <div class="grid3"><div class="gal"></div><div class="gal"></div><div class="gal"></div></div>
    </section>` : ``}

    ${cfg.showFaq ? `
    <section id="faq" class="section">
      <div class="k">FAQ</div>
      <div class="h2">Câu hỏi thường gặp</div>
      <div class="faq">
        <details open><summary>Giờ mở cửa?</summary><div class="muted" style="margin-top:8px;">08:00 – 22:00 (demo)</div></details>
        <details><summary>Có giao hàng không?</summary><div class="muted" style="margin-top:8px;">Có (tùy khu vực).</div></details>
        <details><summary>Đặt bàn như thế nào?</summary><div class="muted" style="margin-top:8px;">Gọi hotline hoặc để lại form.</div></details>
      </div>
    </section>` : ``}

    <section id="contact" class="section">
      <div class="k">Liên hệ</div>
      <div class="h2">Để lại thông tin</div>
      <div class="contactbox">
        <div class="card pad">
          <form id="leadForm">
            <div class="field"><span class="k">Họ tên</span><input required placeholder="Nguyễn Văn A" /></div>
            <div class="field"><span class="k">Số điện thoại</span><input required placeholder="09xx xxx xxx" /></div>
            <div class="field"><span class="k">Nội dung</span><textarea rows="4" placeholder="Mình muốn tư vấn..."></textarea></div>
            <button class="btn primary" type="submit">Gửi (demo)</button>
            <div id="leadStatus" class="muted" style="margin-top:10px; font-weight: 900;"></div>
          </form>
        </div>
        <div class="card pad">
          <div class="h3">Thông tin</div>
          <p class="muted" style="margin: 8px 0 0; line-height: 1.7;">
            <strong>Địa chỉ:</strong> ${escapeHtml(cfg.address)}<br/>
            <strong>Điện thoại:</strong> ${escapeHtml(cfg.phone)}<br/>
            <strong>Email:</strong> ${escapeHtml(cfg.email)}
          </p>
          <div style="margin-top: 12px; height: 150px; border-radius: 16px; border:1px solid rgba(12,22,51,.10);
            background: radial-gradient(260px 160px at 30% 35%, rgba(26,92,255,.16), transparent 60%),
                        radial-gradient(260px 160px at 70% 65%, rgba(0,200,255,.10), transparent 62%), #fff;
            display:grid; place-items:center; color: rgba(12,22,51,.60); font-weight: 950;">
            Map placeholder
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function layoutStarbucksCafe(cfg: TemplateConfig): string {
  return `
  <div class="sb-top">
    <div class="sb-nav">
      <div class="sb-left">
        <div class="sb-logo">${escapeHtml(cfg.brandName).slice(0, 1).toUpperCase()}</div>
        <div class="sb-menu">
          <a href="#menu">Thực đơn</a>
          <a href="#rewards">Tích điểm</a>
          <a href="#gift">Thẻ quà tặng</a>
        </div>
      </div>

      <div class="sb-right">
        <div class="sb-find">📍 Tìm cửa hàng</div>
        <button class="sb-btn">Đăng nhập</button>
        <button class="sb-btn black">Tham gia</button>
      </div>
    </div>
  </div>

  <div class="sb-ann">
    <div class="sb-ann-inner">
      <div>Hôm nay là ngày tuyệt vời để uống cà phê</div>
      <a class="sb-btn" href="#contact">Bắt đầu đặt món</a>
    </div>
  </div>

  <main class="sb-section">
    <div class="sb-tiles">
      <!-- Tile 1: image left, green content right -->
      <section class="sb-tile">
        <div class="sb-img" aria-hidden="true"></div>
        <div class="sb-content sb-green">
          <div class="sb-content-inner">
            <h2 class="sb-h">Ưu đãi đặc biệt đã có</h2>
            <p class="sb-p">
              ${escapeHtml(cfg.tagline)}
            </p>
            <a class="sb-cta" href="#menu">Khám phá menu</a>
          </div>
        </div>
      </section>

      <!-- Tile 2: beige content left, image right -->
      <section class="sb-tile">
        <div class="sb-content sb-beige">
          <div class="sb-content-inner">
            <h2 class="sb-h">Hello, pistachio</h2>
              <p class="sb-p" style="opacity:.85;">
                Vị ngon quen thuộc đã trở lại với ba sản phẩm mới hấp dẫn: Pistachio Cortado, Pistachio Cream Cold Brew và Pistachio Latte.
                Vị mặn ngọt ấm áp, mang lại cảm giác thoải mái bất cứ lúc nào trong ngày.
              </p>
          </div>
        </div>
        <div class="sb-img alt" aria-hidden="true"></div>
      </section>

      <!-- Tile 3: image left, green content right -->
      <section class="sb-tile" id="menu">
        <div class="sb-img" aria-hidden="true"></div>
        <div class="sb-content sb-green">
          <div class="sb-content-inner">
            <h2 class="sb-h">Menu hôm nay</h2>
            <p class="sb-p">Signature • Matcha • Latte • Cold brew</p>
            <a class="sb-cta" href="#contact">Đặt món</a>
          </div>
        </div>
      </section>
    </div>

    <div class="sb-info" id="rewards">
      <div class="sb-card">
        <div class="sb-k">Tích điểm / Khách hàng thân thiết (demo)</div>
        <h3 style="margin: 10px 0 6px; font-size: 20px; letter-spacing: -.02em;">Tích điểm dễ, quay lại thường xuyên</h3>
        <div style="color: rgba(12,22,51,.72); font-weight: 850; line-height: 1.7;">
          Đây là phần bạn nói về chương trình khách hàng thân thiết (tặng topping, giảm giá, voucher…).
        </div>
        <div class="sb-row">
          <span class="sb-pill">🎁 Quà tặng</span>
          <span class="sb-pill">⭐ Tích điểm</span>
          <span class="sb-pill">📣 Ưu đãi</span>
        </div>
      </div>

      <div class="sb-card" id="gift">
        <div class="sb-k">Thẻ quà tặng (demo)</div>
        <h3 style="margin: 10px 0 6px; font-size: 20px; letter-spacing: -.02em;">Voucher / Thẻ quà tặng</h3>
        <div style="color: rgba(12,22,51,.72); font-weight: 850; line-height: 1.7;">
          Nếu bạn có bán voucher, thêm CTA ở đây.
        </div>
        <div class="sb-row">
          <a class="sb-btn" href="#contact">Mua voucher</a>
        </div>
      </div>
    </div>

    <div class="sb-wrap" id="contact" style="padding-bottom: 30px;">
      <div class="sb-card">
        <div class="sb-k">Liên hệ</div>
        <h3 style="margin: 10px 0 12px; font-size: 20px; letter-spacing: -.02em;">Liên hệ nhanh</h3>
        <div class="sb-row">
          <span class="sb-pill">☎ ${escapeHtml(cfg.phone)}</span>
          <span class="sb-pill">✉ ${escapeHtml(cfg.email)}</span>
          <span class="sb-pill">📍 ${escapeHtml(cfg.address)}</span>
        </div>
        <div style="margin-top: 14px; color: rgba(12,22,51,.70); font-weight: 850;">
          Form đặt món / đặt bàn bạn có thể nối backend sau. (Demo UI là chính)
        </div>
      </div>
    </div>
  </main>
  `;
}

function layoutTrivagoTravel(cfg: TemplateConfig): string {
  return `
  <div class="tv-top">
    <div class="tv-nav">
      <div class="tv-brand">
        <div class="tv-logo">${escapeHtml(cfg.brandName).slice(0, 1).toUpperCase()}</div>
        <div>${escapeHtml(cfg.brandName)}</div>
      </div>

      <div class="tv-links">
        <a href="#deals">Deal hot</a>
        <a href="#hotels">Khách sạn</a>
        <a href="#destinations">Điểm đến</a>
        <a href="#support">Hỗ trợ</a>
      </div>

      <div class="tv-actions">
        <button class="tv-ghost">VN • VND</button>
        <button class="tv-ghost">Đăng nhập</button>
      </div>
    </div>
  </div>

  <section class="tv-hero">
    <div class="tv-heroBox">
      <h1 class="tv-title">Tìm khách sạn lý tưởng với giá tốt</h1>
      <p class="tv-sub">${escapeHtml(cfg.tagline)}</p>

      <div class="tv-tabs" aria-label="Loại tìm kiếm">
        <div class="tv-tab">🏨 Khách sạn</div>
        <div class="tv-tab">🏠 Căn hộ</div>
        <div class="tv-tab">🌴 Resort</div>
        <div class="tv-tab">🎒 Homestay</div>
      </div>

      <div class="tv-search" id="search">
        <form id="tvSearchForm">
          <div class="tv-row">
            <label class="tv-field">
              <span class="tv-label">Điểm đến</span>
              <input class="tv-input" id="tvDestination" placeholder="Ví dụ: Đà Nẵng, Hà Nội, Nha Trang..." value="Đà Nẵng" />
            </label>

            <label class="tv-field">
              <span class="tv-label">Nhận phòng</span>
              <input class="tv-input" id="tvCheckin" type="date" />
            </label>

            <label class="tv-field">
              <span class="tv-label">Trả phòng</span>
              <input class="tv-input" id="tvCheckout" type="date" />
            </label>

            <label class="tv-field">
              <span class="tv-label">Khách</span>
              <select class="tv-input" id="tvGuests">
                <option>1 khách</option>
                <option selected>2 khách</option>
                <option>3 khách</option>
                <option>4 khách</option>
                <option>5+ khách</option>
              </select>
            </label>

            <button class="tv-btn" type="submit">Tìm kiếm</button>
          </div>

          <div id="tvStatus" class="muted" style="margin-top:10px; font-weight: 900;"></div>
        </form>
      </div>
    </div>
  </section>

  <section class="tv-main" id="hotels">
    <aside class="tv-panel tv-filters">
      <div class="k">Bộ lọc (demo)</div>
      <div style="margin-top:10px; font-weight:1000;">Xếp hạng</div>
      <div>
        <span class="tv-chip">⭐ 5 sao</span>
        <span class="tv-chip">⭐ 4 sao</span>
        <span class="tv-chip">⭐ 3 sao</span>
      </div>

      <div style="margin-top:12px; font-weight:1000;">Tiện nghi</div>
      <div>
        <span class="tv-chip">🏊 Hồ bơi</span>
        <span class="tv-chip">🍳 Ăn sáng</span>
        <span class="tv-chip">🧖 Spa</span>
        <span class="tv-chip">📶 Wi-Fi</span>
      </div>

      <div style="margin-top:12px; font-weight:1000;">Khoảng giá</div>
      <div class="muted" style="margin-top:6px; line-height:1.6;">
        (Demo) Bạn có thể nối slider/filters thật sau.
      </div>

      <div class="divider" style="margin:14px 0;"></div>

      <div class="k" id="support">Hỗ trợ</div>
      <div class="muted" style="margin-top:8px; line-height:1.7;">
        <strong>Hotline:</strong> ${escapeHtml(cfg.phone)}<br/>
        <strong>Email:</strong> ${escapeHtml(cfg.email)}<br/>
        <strong>Văn phòng:</strong> ${escapeHtml(cfg.address)}
      </div>
    </aside>

    <main class="tv-list" aria-label="Danh sách khách sạn">
      <div class="tv-panel" id="deals">
        <div class="k">Deal hot hôm nay</div>
        <div class="h2" style="margin-top:6px;">Gợi ý theo điểm đến</div>
        <div class="muted" style="line-height:1.7;">
          Kết quả dưới đây là UI demo “trivago-like” (so sánh giá / deal / rating).
        </div>
      </div>

      ${tvHotelItem("Sunset Beach Hotel", "Bãi biển • 4.6/5 • Cách trung tâm 2.1km", ["Ăn sáng", "Hồ bơi", "Wi-Fi"], "1.290.000đ", "agoda")}
      ${tvHotelItem("Riverside Boutique", "Sông • 4.4/5 • Cách trung tâm 1.2km", ["Gần phố", "Spa", "Wi-Fi"], "980.000đ", "booking")}
      ${tvHotelItem("City View Apartments", "Trung tâm • 4.3/5 • Căn hộ", ["Bếp", "Máy giặt", "Wi-Fi"], "720.000đ", "traveloka")}
      ${tvHotelItem("Green Resort & Spa", "Resort • 4.7/5 • View núi", ["Spa", "Hồ bơi", "Ăn sáng"], "1.890.000đ", "resort")}
      
      <section class="tv-panel" id="destinations">
        <div class="k">Điểm đến phổ biến</div>
        <div class="sb-row" style="margin-top:10px;">
          <span class="sb-pill">Đà Nẵng</span>
          <span class="sb-pill">Nha Trang</span>
          <span class="sb-pill">Đà Lạt</span>
          <span class="sb-pill">Hạ Long</span>
          <span class="sb-pill">Phú Quốc</span>
        </div>
      </section>
    </main>
  </section>
  `;
}

function layoutFinalProducts(cfg: TemplateConfig): string {
  return `
  <div class="fp-top">
    <div class="fp-nav">
      <div class="fp-brand">
        <div class="fp-logo">${escapeHtml(cfg.brandName).slice(0,1).toUpperCase()}</div>
        <div>${escapeHtml(cfg.brandName)}</div>
      </div>

      <div class="fp-links">
        <a href="#products">Products</a>
        <a href="#featured">Featured</a>
        <a href="#compare">Compare</a>
        <a href="#support">Support</a>
      </div>

      <div class="fp-actions">
        <button class="fp-pillBtn">EN • VND</button>
        <button class="fp-pillBtn">Sign in</button>
      </div>
    </div>
  </div>

  <div class="fp-page">
    <div class="fp-hero">
      <div class="fp-heroInner">
        <div class="fp-breadcrumb">Home / Products</div>
        <h1 class="fp-heroTitle">Products</h1>
        <p class="fp-heroSub">
          ${escapeHtml(cfg.tagline)}
        </p>

        <div class="fp-heroTools">
          <label class="fp-search">
            <span class="fp-searchIcon" aria-hidden="true">⌕</span>
            <input placeholder="Search products..." />
          </label>

          <select class="fp-select" aria-label="Sort">
            <option>Sort: Featured</option>
            <option>Sort: Newest</option>
            <option>Sort: Price (Low)</option>
            <option>Sort: Price (High)</option>
          </select>

          <button class="fp-ctaPrimary">Contact sales</button>
        </div>

        <div class="fp-tabs" aria-label="Category">
          <button class="fp-tab is-on">All</button>
          <button class="fp-tab">Keyboards</button>
          <button class="fp-tab">Mice</button>
          <button class="fp-tab">Audio</button>
          <button class="fp-tab">Accessories</button>
        </div>
      </div>
    </div>

    <div class="fp-layout">
      <aside class="fp-side" aria-label="Filters">
        <h4>Categories</h4>
        <a href="#products">All products</a>
        <a href="#featured">Featured</a>
        <a href="#compare">Compare</a>
        <a href="#support">Support</a>

        <h4>Filter</h4>
        <div class="fp-filterRow">
          <span class="fp-chip">New</span>
          <span class="fp-chip">Best seller</span>
          <span class="fp-chip">In stock</span>
          <span class="fp-chip">Wireless</span>
        </div>

        <h4>Need help?</h4>
        <div class="fp-help">
          <div><strong>Phone:</strong> ${escapeHtml(cfg.phone)}</div>
          <div><strong>Email:</strong> ${escapeHtml(cfg.email)}</div>
          <div class="fp-helpMuted">${escapeHtml(cfg.address)}</div>
        </div>
      </aside>

      <main id="products">
        <div class="fp-mainTitle">Explore the lineup</div>

        <div class="fp-grid">
          ${fpProductCard("PRO X Keyboard", "Low-latency wireless, hot-swap, premium build.", ["Wireless", "Hot-swap", "RGB"])}
          ${fpProductCard("AERO Mouse", "Ultra-light shell, precise sensor, long battery life.", ["Ultra-light", "26K DPI", "Battery"])}
          ${fpProductCard("WAVE Headset", "Immersive audio, clear mic, comfort for long sessions.", ["Surround", "Mic", "Comfort"])}
          ${fpProductCard("STREAM Deck Mini", "One-touch macros for creators and workflows.", ["Creators", "Macros", "USB-C"])}
        </div>

        <section class="fp-lineup" id="featured">
          <h3>Featured</h3>
          <div class="fp-lineupList">
            <span class="fp-chip">Limited edition</span>
            <span class="fp-chip">Bundle deals</span>
            <span class="fp-chip">New arrivals</span>
            <span class="fp-chip">Top rated</span>
          </div>
        </section>

        <section class="fp-compare" id="compare">
          <div class="fp-compareHead">
            <div>
              <div class="fp-k">Compare (demo)</div>
              <h2 class="fp-h2">Compare products quickly</h2>
              <p class="fp-muted">
                UI theo kiểu products page: bảng so sánh gọn + CTA.
              </p>
            </div>
            <button class="fp-ctaGhost">Open comparison</button>
          </div>

          <div class="fp-compareGrid">
            <div class="fp-compareItem">
              <div class="fp-compareK">Connectivity</div>
              <div class="fp-compareV">Wireless / BT</div>
            </div>
            <div class="fp-compareItem">
              <div class="fp-compareK">Battery</div>
              <div class="fp-compareV">Up to 40h</div>
            </div>
            <div class="fp-compareItem">
              <div class="fp-compareK">Warranty</div>
              <div class="fp-compareV">12 months</div>
            </div>
          </div>
        </section>

        <section class="fp-support" id="support">
          <div class="fp-supportCard">
            <div>
              <div class="fp-k">Support</div>
              <h2 class="fp-h2">Talk to us</h2>
              <p class="fp-muted">
                Form demo — bạn nối CRM/backend sau. Mục tiêu: UI “premium” như trang mẫu.
              </p>
            </div>

            <form class="fp-form">
              <label class="fp-field">
                <span>Name</span>
                <input placeholder="Your name" />
              </label>
              <label class="fp-field">
                <span>Email</span>
                <input placeholder="you@email.com" />
              </label>
              <label class="fp-field fp-field--full">
                <span>Message</span>
                <textarea rows="4" placeholder="Tell us what you need..." ></textarea>
              </label>
              <button class="fp-ctaPrimary fp-formBtn" type="button">Send (demo)</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  </div>
  `;
}

function fpProductCard(title: string, desc: string, chips: string[]): string {
  return `
    <article class="fp-card">
      <div class="fp-thumb" aria-hidden="true">
        <div class="fp-thumbBadge">New</div>
      </div>
      <div class="fp-body">
        <h3 class="fp-h">${escapeHtml(title)}</h3>
        <p class="fp-desc">${escapeHtml(desc)}</p>
        <div class="fp-chipRow">
          ${chips.map(c => `<span class="fp-chipSm">${escapeHtml(c)}</span>`).join("")}
        </div>
        <a class="fp-more" href="#support">Learn more</a>
      </div>
    </article>
  `;
}


  function layoutLogiProduct(cfg: TemplateConfig): string {
    return `
    <div class="lg-top">
      <div class="lg-nav">
        <div class="lg-brand">
          <div class="lg-logo">${escapeHtml(cfg.brandName).slice(0,1).toUpperCase()}</div>
          <div>${escapeHtml(cfg.brandName)}</div>
        </div>

        <div class="lg-links">
          <a href="#product">Sản phẩm</a>
          <a href="#features">Tính năng</a>
          <a href="#highlights">Trình diễn</a>
          <a href="#specs">Thông số</a>
          <a href="#faq">FAQ</a>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <a class="lg-cta" href="#specs">Xem specs</a>
          <a class="lg-cta primary" href="#buy">Mua ngay</a>
        </div>
      </div>
    </div>

    <section class="lg-hero" id="product">
      <div class="lg-heroBox">
        <div class="lg-heroGrid">
          <div>
            <div class="lg-k">Gear / Product landing</div>
            <h1 class="lg-h1">${escapeHtml(cfg.tagline)}</h1>
            <p class="lg-sub">
              Trang giới thiệu sản phẩm kiểu “gaming gear”: dark theme, nhấn mạnh performance, feature highlight,
              có bảng thông số và CTA mua hàng. (UI demo)
            </p>

            <div class="lg-actions">
              <a class="lg-cta primary" href="#buy">Mua ngay</a>
              <a class="lg-cta" href="#features">Khám phá tính năng</a>
              <span class="lg-pill">⚡ Low latency</span>
              <span class="lg-pill">🎧 Immersive</span>
            </div>
          </div>

          <div class="lg-visual" aria-hidden="true">
            <div class="lg-visualText">Product Visual Placeholder</div>
          </div>
        </div>
      </div>
    </section>

    <section class="lg-section" id="features">
      <div class="lg-k">Tính năng</div>
      <div class="lg-grid3" style="margin-top:12px;">
        <div class="lg-card">
          <div class="lg-k">01</div>
          <h3>Thiết kế tối ưu</h3>
          <p>Form factor gọn, vật liệu bền, ưu tiên trải nghiệm lâu dài.</p>
        </div>
        <div class="lg-card">
          <div class="lg-k">02</div>
          <h3>Hiệu năng nổi bật</h3>
          <p>Tối ưu độ trễ/độ nhạy (demo), nhấn mạnh key selling points.</p>
        </div>
        <div class="lg-card">
          <div class="lg-k">03</div>
          <h3>Tùy biến RGB / Profile</h3>
          <p>Cấu hình preset, profile theo nhu cầu (demo).</p>
        </div>
      </div>
    </section>

    <section class="lg-section" id="highlights">
      <div class="lg-k">Trình diễn</div>
      <div class="lg-split" style="margin-top:12px;">
        <div class="lg-shot"></div>
        <div class="lg-card" style="border-radius:24px;">
          <div class="lg-k">Highlight</div>
          <h3 style="margin-top:10px;">Một đoạn copy kiểu “LogitechG”</h3>
          <p>
            Big headline + short paragraph + CTA. Bạn có thể thay bằng video/ảnh sản phẩm thật sau.
          </p>
          <div class="lg-actions" style="margin-top:14px;">
            <a class="lg-cta primary" href="#buy">Mua ngay</a>
            <a class="lg-cta" href="#specs">Xem thông số</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lg-section" id="specs">
      <div class="lg-k">Thông số kỹ thuật</div>
      <div class="lg-specs" style="margin-top:12px;">
        <div class="lg-specsRow">
          <div class="lg-specsK">Kết nối</div>
          <div class="lg-specsV">Wireless / Bluetooth (demo)</div>
        </div>
        <div class="lg-specsRow">
          <div class="lg-specsK">Pin</div>
          <div class="lg-specsV">Lên đến 40 giờ (demo)</div>
        </div>
        <div class="lg-specsRow">
          <div class="lg-specsK">Driver</div>
          <div class="lg-specsV">50mm custom (demo)</div>
        </div>
        <div class="lg-specsRow">
          <div class="lg-specsK">Tương thích</div>
          <div class="lg-specsV">PC / Mac / Mobile (demo)</div>
        </div>
      </div>
    </section>

    <section class="lg-section" id="faq">
      <div class="lg-k">FAQ</div>
      <div style="margin-top:12px; display:grid; gap: 10px;">
        <details open style="border-color: rgba(255,255,255,.10); background: rgba(255,255,255,.03);">
          <summary style="color: rgba(255,255,255,.92);">Bảo hành bao lâu?</summary>
          <div style="margin-top:8px; color: rgba(255,255,255,.72); font-weight:850; line-height:1.7;">
            12 tháng (demo). Bạn thay bằng policy thật.
          </div>
        </details>

        <details style="border-color: rgba(255,255,255,.10); background: rgba(255,255,255,.03);">
          <summary style="color: rgba(255,255,255,.92);">Có đổi trả không?</summary>
          <div style="margin-top:8px; color: rgba(255,255,255,.72); font-weight:850; line-height:1.7;">
            Có trong 7 ngày (demo).
          </div>
        </details>
      </div>
    </section>

    <section class="lg-section" id="buy" style="padding-bottom: 34px;">
      <div class="lg-heroBox" style="border-radius: 24px;">
        <div class="lg-heroGrid" style="padding: 18px;">
          <div>
            <div class="lg-k">CTA</div>
            <h2 style="margin:10px 0 10px; font-size: 30px; letter-spacing: -.03em; font-weight: 1100;">
              Sẵn sàng nâng cấp trải nghiệm?
            </h2>
            <p class="lg-sub" style="max-width: 60ch;">
              CTA cuối trang + “giá” + nút mua. Bạn có thể nối thanh toán/giỏ hàng sau.
            </p>
          </div>

          <div style="display:flex; flex-direction:column; gap: 10px; align-items:flex-end;">
            <div style="font-weight:1100; font-size: 28px;">${escapeHtml(cfg.brandName)}</div>
            <div style="color: rgba(255,255,255,.72); font-weight: 900;">Giá: 1.990.000đ (demo)</div>
            <a class="lg-cta primary" href="#product">Mua ngay</a>
            <div style="color: rgba(255,255,255,.62); font-weight: 850; font-size: 12px;">
              Hotline: ${escapeHtml(cfg.phone)} • ${escapeHtml(cfg.email)}
            </div>
          </div>
        </div>
      </div>
    </section>
    `;
  }


function tvHotelItem(title: string, meta: string, badges: string[], price: string, src: string): string {
  return `
  <article class="tv-item">
    <div class="tv-img" aria-hidden="true"></div>
    <div class="tv-mid">
      <h3 class="tv-h">${escapeHtml(title)}</h3>
      <div class="tv-meta">${escapeHtml(meta)}</div>
      <div class="tv-badges">
        ${badges.map(b => `<span class="tv-badge">${escapeHtml(b)}</span>`).join("")}
      </div>
    </div>
    <div class="tv-right">
      <div class="tv-price">
        <div class="tv-from">Giá/đêm từ</div>
        <div class="tv-amount">${escapeHtml(price)}</div>
        <div class="muted" style="font-weight:850; font-size:12px;">Nguồn: ${escapeHtml(src)} (demo)</div>
      </div>
      <button class="tv-cta">Xem deal</button>
    </div>
  </article>
  `;
}


function layoutBold(cfg: TemplateConfig, category: string): string {
  return `
  <div class="wrap">
    <section class="hero">
      <div class="pad" style="padding: 22px;">
        <div class="k">${escapeHtml(category)}</div>
        <div style="display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; flex-wrap: wrap;">
          <h1 style="margin:8px 0 0; font-size: 44px; letter-spacing: -.04em; line-height: 1.02;">
            ${escapeHtml(cfg.brandName)}
          </h1>
          <span class="pill">Hotline: ${escapeHtml(cfg.phone)}</span>
        </div>
        <p class="muted" style="margin: 10px 0 16px; font-size: 15px; line-height: 1.65;">
          ${escapeHtml(cfg.tagline)}
        </p>

        <div class="grid3">
          <div class="card pad" style="border-radius:22px;"><div class="k">Cam kết</div><div class="h3">Chất lượng</div><div class="muted">Mô tả ngắn.</div></div>
          <div class="card pad" style="border-radius:22px;"><div class="k">Trải nghiệm</div><div class="h3">Chuẩn dịch vụ</div><div class="muted">Mô tả ngắn.</div></div>
          <div class="card pad" style="border-radius:22px;"><div class="k">Ưu đãi</div><div class="h3">Combo tiết kiệm</div><div class="muted">Mô tả ngắn.</div></div>
        </div>

        <div style="margin-top: 14px; display:flex; gap: 10px; flex-wrap: wrap;">
          <a class="btn primary" href="#services">Xem bảng dịch vụ</a>
          <a class="btn" href="#contact">Đặt lịch</a>
        </div>
      </div>
    </section>

    <section id="services" class="section">
      <div class="k">Bảng dịch vụ</div>
      <div class="h2">Dịch vụ nổi bật</div>
      <div class="grid3">
        <div class="service"><div class="h3">Gói 1</div><div class="muted">Giá từ 199K (demo)</div></div>
        <div class="service"><div class="h3">Gói 2</div><div class="muted">Giá từ 299K (demo)</div></div>
        <div class="service"><div class="h3">Gói 3</div><div class="muted">Giá từ 399K (demo)</div></div>
      </div>
    </section>

    ${cfg.showGallery ? `
    <section id="gallery" class="section">
      <div class="k">Hình ảnh</div>
      <div class="h2">Trước & sau</div>
      <div class="grid3"><div class="gal"></div><div class="gal"></div><div class="gal"></div></div>
    </section>` : ``}

    ${cfg.showFaq ? `
    <section id="faq" class="section">
      <div class="k">FAQ</div>
      <div class="h2">Giải đáp</div>
      <div class="faq">
        <details open><summary>Thời gian làm bao lâu?</summary><div class="muted" style="margin-top:8px;">Tùy dịch vụ (demo).</div></details>
        <details><summary>Có bảo hành không?</summary><div class="muted" style="margin-top:8px;">Có (demo).</div></details>
        <details><summary>Đặt lịch thế nào?</summary><div class="muted" style="margin-top:8px;">Gọi hotline hoặc để lại form.</div></details>
      </div>
    </section>` : ``}

    <section id="contact" class="section">
      <div class="k">Liên hệ</div>
      <div class="h2">Đặt lịch nhanh</div>
      <div class="contactbox">
        <div class="card pad">
          <form id="leadForm">
            <div class="field"><span class="k">Họ tên</span><input required placeholder="Nguyễn Văn A" /></div>
            <div class="field"><span class="k">Số điện thoại</span><input required placeholder="09xx xxx xxx" /></div>
            <button class="btn primary" type="submit">Gửi (demo)</button>
            <div id="leadStatus" class="muted" style="margin-top:10px; font-weight: 900;"></div>
          </form>
        </div>
        <div class="card pad">
          <div class="h3">Thông tin</div>
          <p class="muted" style="margin: 8px 0 0; line-height: 1.7;">
            <strong>Địa chỉ:</strong> ${escapeHtml(cfg.address)}<br/>
            <strong>Điện thoại:</strong> ${escapeHtml(cfg.phone)}<br/>
            <strong>Email:</strong> ${escapeHtml(cfg.email)}
          </p>
          <div style="margin-top: 12px; height: 150px; border-radius: 16px; border:1px solid rgba(12,22,51,.10);
            background: radial-gradient(260px 160px at 30% 35%, rgba(26,92,255,.16), transparent 60%),
                        radial-gradient(260px 160px at 70% 65%, rgba(0,200,255,.10), transparent 62%), #fff;
            display:grid; place-items:center; color: rgba(12,22,51,.60); font-weight: 950;">
            Map placeholder
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

function layoutMinimal(cfg: TemplateConfig, category: string): string {
  return `
  <div class="wrap">
    <section class="hero">
      <div class="pad" style="padding: 22px;">
        <div class="k">${escapeHtml(category)}</div>
        <h1 style="margin:8px 0 8px; font-size: 38px; letter-spacing: -.03em; line-height: 1.08;">
          ${escapeHtml(cfg.brandName)}
        </h1>
        <p class="muted" style="margin:0 0 14px; font-size: 15px; line-height: 1.65;">
          ${escapeHtml(cfg.tagline)}
        </p>
        <div style="display:flex; gap: 10px; flex-wrap: wrap;">
          <a class="btn primary" href="#contact">Liên hệ</a>
          <span class="pill">${escapeHtml(cfg.email)}</span>
          <span class="pill">${escapeHtml(cfg.phone)}</span>
        </div>
      </div>
    </section>

    <section id="services" class="section">
      <div class="k">Dịch vụ</div>
      <div class="h2">Bạn làm gì?</div>
      <div class="grid2">
        <div class="card pad">
          <div class="h3">Case study 01</div>
          <div class="muted">Tóm tắt kết quả/điểm nổi bật.</div>
          <div style="margin-top:10px;"><span class="pill">+30% chuyển đổi</span></div>
        </div>
        <div class="card pad">
          <div class="h3">Case study 02</div>
          <div class="muted">Tóm tắt kết quả/điểm nổi bật.</div>
          <div style="margin-top:10px;"><span class="pill">Tiết kiệm thời gian</span></div>
        </div>
      </div>
    </section>

    ${cfg.showGallery ? `
    <section id="gallery" class="section">
      <div class="k">Dự án</div>
      <div class="h2">Một vài dự án</div>
      <div class="grid3"><div class="gal"></div><div class="gal"></div><div class="gal"></div></div>
    </section>` : ``}

    ${cfg.showFaq ? `
    <section id="faq" class="section">
      <div class="k">FAQ</div>
      <div class="h2">Hỏi đáp</div>
      <div class="faq">
        <details open><summary>Bạn hỗ trợ những gì?</summary><div class="muted" style="margin-top:8px;">Tư vấn + triển khai (demo).</div></details>
        <details><summary>Thời gian triển khai?</summary><div class="muted" style="margin-top:8px;">1–3 ngày (demo).</div></details>
        <details><summary>Chi phí?</summary><div class="muted" style="margin-top:8px;">Theo gói (demo).</div></details>
      </div>
    </section>` : ``}

    <section id="contact" class="section">
      <div class="k">Liên hệ</div>
      <div class="h2">Nhận tư vấn</div>
      <div class="contactbox">
        <div class="card pad">
          <form id="leadForm">
            <div class="field"><span class="k">Họ tên</span><input required placeholder="Nguyễn Văn A" /></div>
            <div class="field"><span class="k">Email</span><input required placeholder="you@email.com" /></div>
            <div class="field"><span class="k">Nhu cầu</span><textarea rows="4" placeholder="Mình cần..."></textarea></div>
            <button class="btn primary" type="submit">Gửi (demo)</button>
            <div id="leadStatus" class="muted" style="margin-top:10px; font-weight: 900;"></div>
          </form>
        </div>
        <div class="card pad">
          <div class="h3">Thông tin</div>
          <p class="muted" style="margin: 8px 0 0; line-height: 1.7;">
            <strong>Địa chỉ:</strong> ${escapeHtml(cfg.address)}<br/>
            <strong>Điện thoại:</strong> ${escapeHtml(cfg.phone)}<br/>
            <strong>Email:</strong> ${escapeHtml(cfg.email)}
          </p>
          <div style="margin-top: 12px; height: 150px; border-radius: 16px; border:1px solid rgba(12,22,51,.10);
            background: radial-gradient(260px 160px at 30% 35%, rgba(26,92,255,.16), transparent 60%),
                        radial-gradient(260px 160px at 70% 65%, rgba(0,200,255,.10), transparent 62%), #fff;
            display:grid; place-items:center; color: rgba(12,22,51,.60); font-weight: 950;">
            Map placeholder
          </div>
        </div>
      </div>
    </section>
  </div>`;
}

/** Modal component */
function Modal(props: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  const { open, title, subtitle, onClose, left, right } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Chi tiết template">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <div>
            <div className="modal__title">{title}</div>
            <div className="modal__sub">{subtitle}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng" title="Đóng">
            <span className="icon-btn__x" aria-hidden="true">×</span>
          </button>
        </div>

        <div className="modal__body">
          <aside className="side">{left}</aside>
          <section className="preview">{right}</section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [category, setCategory] = useState<string>("Tất cả");

  const [activeId, setActiveId] = useState<string | null>(null);
  const [cfg, setCfg] = useState<TemplateConfig>({ ...DEFAULT_CFG });
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const headerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const set = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--topbar-h", `${h}px`);
    };

    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);

    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);


  function scrollToId(id: string) {
    const el = document.getElementById(id);
    const scroller = scrollRef.current;
    if (!el || !scroller) return;

    const headerH = headerRef.current?.getBoundingClientRect().height ?? 0;

    const scrollerTop = scroller.getBoundingClientRect().top;
    const y =
      scroller.scrollTop +
      (el.getBoundingClientRect().top - scrollerTop) -
      headerH -
      12;

    scroller.scrollTo({ top: y, behavior: "smooth" });
  }




  const categories = useMemo(() => {
    const set = new Set<string>(TEMPLATES.map((t) => t.category));
    return ["Tất cả", ...Array.from(set)];
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    let filtered = TEMPLATES.filter((t) => {
      const matchCat = category === "Tất cả" || t.category === category;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.join(" ").toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    switch (sort) {
      case "price-asc":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
      default:
        filtered = [...filtered].sort((a, b) => b.popularScore - a.popularScore);
    }

    return filtered;
  }, [query, category, sort]);

  const activeTpl = useMemo(
    () => TEMPLATES.find((t) => t.id === activeId) ?? null,
    [activeId]
  );

  const previewHtml = useMemo(() => {
    if (!activeTpl) return "";
    return renderTemplateHtml(activeTpl, cfg);
  }, [activeTpl, cfg]);

  useEffect(() => {
    // ensure iframe updates even if some browsers cache srcDoc
    if (iframeRef.current && previewHtml) {
      iframeRef.current.srcdoc = previewHtml;
    }
  }, [previewHtml]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // chỉ bắt click trái, không bắt ctrl/cmd/alt/shift
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (href === "#" || !href.startsWith("#")) return;

      const id = decodeURIComponent(href.slice(1));
      if (!id) return;

      // chỉ xử lý nếu element tồn tại
      if (!document.getElementById(id)) return;

      e.preventDefault();
      // cập nhật URL hash cho đúng (optional)
      history.pushState(null, "", `#${encodeURIComponent(id)}`);

      // đợi 1 frame để layout ổn định rồi scroll (giảm sai lệch)
      requestAnimationFrame(() => scrollToId(id));
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const run = () => {
      const id = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!id) return;
      if (!document.getElementById(id)) return;

      // đợi layout ổn định rồi scroll offset
      requestAnimationFrame(() => scrollToId(id));
    };

    run();
    window.addEventListener("hashchange", run);
    return () => window.removeEventListener("hashchange", run);
  }, []);



  function openTemplate(tpl: TemplateItem) {
    setActiveId(tpl.id);
    setViewport("desktop");
    setCfg({
      ...DEFAULT_CFG,
      brandName: suggestedBrandName(tpl),
      tagline: suggestedTagline(tpl),
      primary: suggestedColor(tpl),
    });
  }

  function downloadActive() {
    if (!activeTpl) return;
    const html = renderTemplateHtml(activeTpl, cfg);
    downloadTextFile(`${activeTpl.id}-${safeSlug(cfg.brandName)}.html`, html);
  }

  const modalLeft = activeTpl ? (
    <div className="card card--pad">
      <h4 className="h4">Thông tin template</h4>

      <div className="meta">
        <div className="meta__item">
          <div className="meta__k">Phổ biến</div>
          <div className="meta__v">{activeTpl.popularScore}/100</div>
        </div>

        <div className="meta__item">
          <div className="meta__k">Xuất</div>
          <div className="meta__v">HTML</div>
        </div>
      </div>


      <div className="divider" />

      <h4 className="h4">Tùy biến nhanh</h4>

      <label className="field">
        <span>Tên thương hiệu</span>
        <input
          value={cfg.brandName}
          onChange={(e) => setCfg((p) => ({ ...p, brandName: e.target.value }))}
          placeholder="Ví dụ: Cafe Mộc"
        />
      </label>

      <label className="field">
        <span>Slogan</span>
        <input
          value={cfg.tagline}
          onChange={(e) => setCfg((p) => ({ ...p, tagline: e.target.value }))}
          placeholder="Ví dụ: Ấm áp như ở nhà"
        />
      </label>

      <div className="row2">
        <label className="field">
          <span>Màu chủ đạo</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              id="primaryColor"
              type="color"
              value={cfg.primary}
              onChange={(e) => setCfg((p) => ({ ...p, primary: e.target.value }))}
              aria-label="Chọn màu chủ đạo"
              style={{
                position: "absolute",
                width: 1,
                height: 1,
                opacity: 0,
                pointerEvents: "none",
              }}
            />

            <label
              htmlFor="primaryColor"
              title={cfg.primary.toUpperCase()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: cfg.primary,
                border: "1px solid rgba(12,22,51,.18)",
                boxShadow: "0 10px 24px rgba(12,22,51,.10)",
                cursor: "pointer",
                display: "inline-block",
              }}
            />
          </div>


        </label>

        <label className="field">
          <span>Font</span>
          <select
            value={cfg.fontMode}
            onChange={(e) => setCfg((p) => ({ ...p, fontMode: e.target.value as FontMode }))}
          >
            <option value="system">System</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
          </select>
        </label>
      </div>

      <div className="row2">
        <label className="field">
          <span>Điện thoại</span>
          <input
            value={cfg.phone}
            onChange={(e) => setCfg((p) => ({ ...p, phone: e.target.value }))}
            placeholder="0900 000 000"
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            value={cfg.email}
            onChange={(e) => setCfg((p) => ({ ...p, email: e.target.value }))}
            placeholder="hello@domain.com"
          />
        </label>
      </div>

      <label className="field">
        <span>Địa chỉ</span>
        <input
          value={cfg.address}
          onChange={(e) => setCfg((p) => ({ ...p, address: e.target.value }))}
          placeholder="123 Đường A, Quận B"
        />
      </label>

      <div className="divider" />

      <div className="row2">
        <label className="check">
          <input
            type="checkbox"
            checked={cfg.showGallery}
            onChange={(e) => setCfg((p) => ({ ...p, showGallery: e.target.checked }))}
          />
          <span>Hiện Gallery</span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={cfg.showFaq}
            onChange={(e) => setCfg((p) => ({ ...p, showFaq: e.target.checked }))}
          />
          <span>Hiện FAQ</span>
        </label>
      </div>

      <div className="divider" />

      <div className="rowActions">
        <button className="btn btn--primary" onClick={downloadActive}>
          Tải file HTML
        </button>
        <button
          className="btn btn--ghost"
          onClick={() => {
            scrollToId("contact");

            setActiveId(null);
          }}
        >
          Dùng gói Business
        </button>
      </div>

      <p className="tiny muted" style={{ marginTop: 10 }}>
        (Demo) Không cần đăng nhập. Ở bản thật bạn có thể nối thanh toán / CRM / backend.
      </p>
    </div>
  ) : null;

  const modalRight = activeTpl ? (
    <>
      <div className="preview__bar">
        <div className="preview__hint">Bản xem trước</div>
        <div className="preview__tools">
          <button
            className={`seg ${viewport === "desktop" ? "is-on" : ""}`}
            onClick={() => setViewport("desktop")}
          >
            Desktop
          </button>
          <button
            className={`seg ${viewport === "tablet" ? "is-on" : ""}`}
            onClick={() => setViewport("tablet")}
          >
            Tablet
          </button>
          <button
            className={`seg ${viewport === "mobile" ? "is-on" : ""}`}
            onClick={() => setViewport("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className="preview__frame">
        <iframe
          ref={iframeRef}
          title="Xem trước template"
          style={{
            width: viewport === "desktop" ? "100%" : viewport === "tablet" ? 820 : 390,
            margin: "0 auto",
            display: "block",
          }}
          srcDoc={previewHtml}
        />
      </div>
    </>
  ) : null;

  return (
    <div className="app-shell">
      <header ref={headerRef} className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__mark" aria-hidden="true">
              TH
            </div>
            <div className="brand__text">
              <div className="brand__name">TemplateHub</div>
              <div className="brand__tag">Chọn mẫu • Tùy biến • Tải HTML</div>
            </div>
          </div>

          <nav className="nav">
            <a
              href="#intro"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("intro");
              }}
            >
              Giới thiệu
            </a>

            <a
              href="#templates"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("templates");
              }}
            >
              Template
            </a>

            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("how");
              }}
            >
              Cách hoạt động
            </a>

            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("pricing");
              }}
            >
              Báo giá
            </a>

            <a
              className="btn btn--primary"
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToId("contact");
              }}
            >
              Đăng nhập
            </a>
          </nav>
        </div>
      </header>

      <main ref={scrollRef} className="app-scroll">
        {/* Nord-ish hero */}
        <section className="hero hero--nord">
          <div className="container hero__inner hero__inner--nord">
            <div className="hero__copy hero__copy--nord">
              <div className="hero__kicker">TEMPLATEHUB • WEB TEMPLATE CHO SME</div>

              <h1 className="hero__title">
                Tạo website đẹp chỉ trong thời gian ngắn - chọn mẫu, tùy biến, tải về
              </h1>

              <p className="hero__lead">
                Xem preview trực tiếp, đổi màu/brand, và xuất file HTML để dùng ngay.
              </p>

              <div className="hero__cta hero__cta--nord">
                <a
                  className="btn btn--primary btn--lg"
                  href="#templates"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("templates");
                  }}
                >
                  Xem template
                </a>

                <button
                  className="btn btn--ghost btn--lg"
                  onClick={() => openTemplate(TEMPLATES[0])}
                >
                  Xem demo nhanh
                </button>
              </div>

              <div className="hero__badges">
                <span className="badge-pill">✅ Preview trực tiếp</span>
                <span className="badge-pill">✅ Tùy biến brand</span>
                <span className="badge-pill">✅ Tải 1 file HTML</span>
              </div>

              <div className="hero__mini">
                <div className="mini-card">
                  <div className="mini-card__num">3</div>
                  <div className="mini-card__txt">Template demo</div>
                </div>
                <div className="mini-card">
                  <div className="mini-card__num">&lt; 2′</div>
                  <div className="mini-card__txt">Dựng landing</div>
                </div>
                <div className="mini-card">
                  <div className="mini-card__num">0</div>
                  <div className="mini-card__txt">Không cần login</div>
                </div>
              </div>
            </div>

            <div className="hero__art" aria-hidden="true">
              <div className="map-card">
                <div className="map-card__top">
                  <span className="dot dot--r" />
                  <span className="dot dot--y" />
                  <span className="dot dot--g" />
                  <span className="map-title">Live preview</span>
                </div>

                <div className="map-card__body">
                  <svg className="world" viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="rgba(26,92,255,.18)" />
                        <stop offset="1" stopColor="rgba(0,200,255,.10)" />
                      </linearGradient>
                      <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="rgba(12,22,51,.10)" />
                        <stop offset="1" stopColor="rgba(12,22,51,.06)" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="900" height="420" rx="22" fill="url(#sea)" />
                    <path
                      d="M95 130c60-60 140-70 220-30 60 30 60 70 10 95-50 25-120 30-190-5-60-30-90-20-40-60z"
                      fill="url(#land)"
                    />
                    <path
                      d="M360 120c70-35 150-30 210 20 40 35 10 70-55 80-70 10-140-10-180-45-35-30-25-40 25-55z"
                      fill="url(#land)"
                    />
                    <path
                      d="M585 210c55-35 120-35 170-5 45 26 35 70-20 85-65 18-130 5-165-20-30-22-30-40 15-60z"
                      fill="url(#land)"
                    />
                    <path
                      d="M185 245c55-25 95-10 120 18 20 23 5 55-35 60-45 6-90-5-110-25-18-18-12-40 25-53z"
                      fill="url(#land)"
                    />
                  </svg>

                  <div className="pins">
                    <span className="pin p1" />
                    <span className="pin p2" />
                    <span className="pin p3" />
                    <span className="pin p4" />
                  </div>

                  <div className="map-stats">
                    <div className="stat-chip">
                      <div className="stat-chip__k">Ngành phổ biến</div>
                      <div className="stat-chip__v">F&B • Làm đẹp • Tư vấn</div>
                    </div>
                    <div className="stat-chip">
                      <div className="stat-chip__k">Xuất bản</div>
                      <div className="stat-chip__v">HTML</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-glow" />
            </div>
          </div>
        </section>

        <section className="trustbar">
          <div className="container trustbar__inner">
            <div className="trustbar__text">Được tin dùng bởi mô hình nhỏ:</div>
            <div className="trustbar__logos" aria-label="Trusted by (demo)">
              <span className="logo-chip">Cafe</span>
              <span className="logo-chip">Salon</span>
              <span className="logo-chip">Studio</span>
              <span className="logo-chip">Tư vấn</span>
              <span className="logo-chip">Cửa hàng</span>
            </div>
          </div>
        </section>

        <section className="featurestrip">
          <div className="container">
            <div className="featurestrip__grid">
              <div className="fcard">
                <div className="ficon">⚡</div>
                <div className="ftitle">Dựng nhanh</div>
                <div className="fdesc">Chọn mẫu → sửa brand → có landing trong vài phút.</div>
              </div>
              <div className="fcard">
                <div className="ficon">🎨</div>
                <div className="ftitle">Tùy biến dễ</div>
                <div className="fdesc">Đổi màu, font, thông tin liên hệ, bật/tắt section.</div>
              </div>
              <div className="fcard">
                <div className="ficon">🧩</div>
                <div className="ftitle">Mẫu theo ngành</div>
                <div className="fdesc">F&B, làm đẹp, tư vấn… cấu trúc đúng nhu cầu.</div>
              </div>
              <div className="fcard">
                <div className="ficon">📦</div>
                <div className="ftitle">Tải về dùng ngay</div>
                <div className="fdesc">Xuất file HTML — đưa lên hosting là chạy (demo).</div>
              </div>
            </div>
          </div>
        </section>

        <section id="intro" className="section">
          <div className="container">
            <div className="section__head">
              <div>
                <h2>Website cho SME — đẹp, nhanh, dễ triển khai</h2>
                <p className="muted">
                  Không cần code: chọn mẫu, đổi brand, tải HTML. Có thể đưa lên hosting là chạy.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a
                  className="btn btn--primary"
                  href="#templates"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("templates");
                  }}
                >
                  Xem template
                </a>
                <a
                  className="btn btn--ghost"
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId("pricing");
                  }}
                >
                  Xem gói
                </a>
              </div>
            </div>

            <div className="grid2" style={{ alignItems: "stretch" }}>
              <div className="card card--pad">
                <h3 style={{ marginTop: 0 }}>Điểm mạnh</h3>
                <ul className="list">
                  <li>Preview trực tiếp (desktop/tablet/mobile)</li>
                  <li>Đổi màu, font, brand trong vài giây</li>
                  <li>Tải 1 file HTML — dễ gửi khách / dev</li>
                  <li>Phù hợp: F&B, làm đẹp, tư vấn</li>
                </ul>
                <div className="tip" style={{ marginTop: 12 }}>
                  Tip: dùng “Xem demo nhanh” để mở template nổi bật.
                </div>
              </div>

              <div className="card card--pad">
                <div className="muted tiny">Preview</div>
                <div
                  style={{
                    marginTop: 10,
                    height: 280,
                    borderRadius: 18,
                    border: "1px solid rgba(12,22,51,.10)",
                    background:
                      "radial-gradient(520px 300px at 30% 30%, rgba(26,92,255,.16), transparent 60%)," +
                      "radial-gradient(520px 300px at 80% 70%, rgba(0,200,255,.10), transparent 62%), #fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "rgba(12,22,51,.65)",
                  }}
                >
                  Screenshot / video 
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="section">
          <div className="container">
            <div className="section__head">
              <div>
                <h2>Chọn template phù hợp</h2>
                <p className="muted">
                  Tìm kiếm, lọc theo ngành, mở chi tiết để preview + tùy biến + tải HTML.
                </p>
              </div>

              <div className="toolbar">
                <label className="input input--icon" aria-label="Tìm kiếm template">
                  <span className="input__icon" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    type="search"
                    placeholder="Tìm kiếm"
                    autoComplete="off"
                  />
                </label>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="select"
                  aria-label="Sắp xếp"
                >
                  <option value="popular">Phổ biến</option>
                  <option value="name">Tên A→Z</option>
                </select>
              </div>
            </div>

            <div className="chip-row" aria-label="Bộ lọc ngành">
              {categories.map((c) => (
                <button
                  key={c}
                  className="chip"
                  aria-pressed={c === category}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid" aria-live="polite">
              {list.length === 0 ? (
                <div className="card card--pad" style={{ gridColumn: "1 / -1" }}>
                  <strong>Không tìm thấy template phù hợp.</strong>
                  <div className="muted" style={{ marginTop: 6 }}>
                    Thử đổi từ khóa hoặc chọn lại ngành.
                  </div>
                </div>
              ) : (
                list.map((t) => {
                  const thumb = suggestedColor(t);

                  const thumbBg =
                    `radial-gradient(520px 300px at 30% 30%, ${hexToRgba(thumb, 0.22)}, transparent 60%),` +
                    `radial-gradient(520px 300px at 80% 70%, ${hexToRgba(thumb, 0.14)}, transparent 62%),` +
                    `linear-gradient(135deg, ${hexToRgba(thumb, 0.18)}, rgba(255,255,255,0))`;

                  return (
                    <article key={t.id} className="tcard2">
                      <div
                        className="tcard2__media"
                        aria-hidden="true"
                        style={{ background: thumbBg }}
                      >
                        <div className="tcard2__badges">
                          <span className="pill pill--soft">{t.category}</span>
                        </div>
                      </div>

                      <div className="tcard2__body">
                        <div className="tcard2__titleRow">
                          <h3 className="tcard2__title">{t.name}</h3>
                          <span className="tcard2__score" title="Phổ biến (demo)">
                            ★ {t.popularScore}
                          </span>
                        </div>

                        <div className="tcard2__desc">{t.description}</div>

                        <div className="tcard2__tags">
                          {t.tags.map((tag) => (
                            <span key={tag} className="tag tag--soft">
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="tcard2__footer">
                          <button className="linkBtn" onClick={() => openTemplate(t)}>
                            Xem chi tiết →
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

            </div>
          </div>
        </section>

        <section id="how" className="section section--alt">
          <div className="container">
            <div className="section__head">
              <div>
                <h2>Cách hoạt động</h2>
                <p className="muted"></p>
              </div>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step__num">1</div>
                <h3>Chọn mẫu</h3>
                <p>Lọc theo ngành và mở trang chi tiết.</p>
              </div>
              <div className="step">
                <div className="step__num">2</div>
                <h3>Tùy biến</h3>
                <p>Đổi màu, font, tên thương hiệu, thông tin liên hệ.</p>
              </div>
              <div className="step">
                <div className="step__num">3</div>
                <h3>Tải về / triển khai</h3>
                <p>Tải file HTML để up hosting hoặc gửi dev chỉnh sửa.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <div className="section__head">
              <div>
                <h2>Gói tháng</h2>
                <p className="muted">Chọn gói phù hợp: tự làm nhanh hoặc có hỗ trợ tuỳ biến.</p>
              </div>
            </div>

            <div className="pricing">
              <div className="card price-card">
                <div className="price-head">
                  <h3>Starter</h3>
                  <div className="price-sub">Phù hợp để tự dựng nhanh</div>
                </div>

                <div className="price">
                  199.000đ<span className="price__unit">/tháng</span>
                </div>

                <ul className="list list--check">
                  <li>1 template</li>
                  <li>Tải file HTML</li>
                  <li>Hướng dẫn đăng hosting cơ bản</li>
                </ul>

                <a className="btn btn--ghost price-cta" href="#contact" onClick={(e)=>{e.preventDefault(); scrollToId("contact");}}>
                  Bắt đầu với Starter
                </a>
              </div>


              <div className="card price-card price-card--featured">
                <div className="badge">Phổ biến</div>

                <div className="price-head">
                  <h3>Business</h3>
                  <div className="price-sub">Dành cho người cần có hỗ trợ</div>
                </div>

                <div className="price">
                  499.000đ<span className="price__unit">/tháng</span>
                </div>

                <ul className="list list--check">
                  <li>1 template + tùy biến màu/nội dung</li>
                  <li>Chỉnh sửa 1 lần theo yêu cầu</li>
                  <li>Hỗ trợ up hosting</li>
                </ul>

                <a className="btn btn--primary price-cta" href="#contact" onClick={(e)=>{e.preventDefault(); scrollToId("contact");}}>
                  Chọn Business
                </a>

                <div className="price-note">Hợp nhất giữa tốc độ và tuỳ biến.</div>
              </div>


              <div className="card price-card">
                <div className="price-head">
                  <h3>Pro</h3>
                  <div className="price-sub">Cho nhu cầu nâng cao / nhận diện</div>
                </div>

                <div className="price">
                  999.000đ<span className="price__unit">/tháng</span>
                </div>

                <ul className="list list--check">
                  <li>Thiết kế theo nhận diện</li>
                  <li>Tối ưu SEO cơ bản</li>
                  <li>Form liên hệ + tracking</li>
                </ul>

                <a className="btn btn--ghost price-cta" href="#contact" onClick={(e)=>{e.preventDefault(); scrollToId("contact");}}>
                  Nhận báo giá Pro
                </a>
              </div>

            </div>
          </div>
        </section>

        <section id="contact" className="section section--alt">
          <div className="container">
            <div className="section__head">
              <div>
                <h2>Đăng nhập/ đặt template</h2>
                <p className="muted"></p>
              </div>
            </div>

            <div className="contact">
              <div className="card card--pad">
                <div className="row">
                  <label className="field">
                    <span>Họ tên</span>
                    <input placeholder="Nguyễn Văn A" />
                  </label>
                  <label className="field">
                    <span>Số điện thoại</span>
                    <input placeholder="09xx xxx xxx" />
                  </label>
                </div>

                <label className="field">
                  <span>Nhu cầu</span>
                  <textarea
                    rows={4}
                    placeholder="Mình muốn website giới thiệu, có menu dịch vụ, nút gọi điện..."
                  />
                </label>

                <div className="actions">
                  <button className="btn btn--primary" onClick={() => alert("Đã nhận (demo).")}>
                    Gửi yêu cầu
                  </button>
                  <div className="muted tiny"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container footer__inner">
            <div className="muted">
              © {new Date().getFullYear()} TemplateHub 
            </div>
            <div className="muted"></div>
          </div>
        </footer>
      </main>

      <Modal
        open={!!activeTpl}
        title={activeTpl?.name ?? ""}
        subtitle={activeTpl ? `${activeTpl.category} • Theo gói tháng` : ""}
        onClose={() => setActiveId(null)}
        left={modalLeft}
        right={modalRight}
      />
    </div>
  );

}
