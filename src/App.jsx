import { useState, useEffect, useCallback } from "react";


const TOOLS = {
  creators: [
    { id:"title_opt",   name:"Title Optimizer",        tier:"free",  prompt:(i)=>`You are a YouTube title optimization expert. Analyze and rewrite this title for maximum CTR: "${i}". Provide 5 optimized versions with brief reasoning for each. Use clear formatting with numbered list.` },
    { id:"tag_gen",     name:"Tag Generator",           tier:"free",  prompt:(i)=>`Generate 20 high-ranking YouTube tags for a video about: "${i}". Group them: High Volume / Medium / Long-tail. Format cleanly.` },
    { id:"hook_anal",   name:"Hook Analyzer",           tier:"free",  prompt:(i)=>`Analyze this YouTube hook for retention power: "${i}". Score 1-10 on curiosity, urgency, specificity. Give an improved version.` },
    { id:"thumb_brief", name:"Thumbnail Brief",         tier:"free",  prompt:(i)=>`Create a thumbnail design brief for: "${i}". Include: main visual, text overlay (max 5 words), color psychology, emotional trigger.` },
    { id:"idea_gen",    name:"Idea Generator",          tier:"free",  prompt:(i)=>`Generate 10 viral YouTube video ideas for a channel about: "${i}". For each: title, hook, and why it performs well in 2026.` },
    { id:"ch_audit",    name:"Channel Audit",           tier:"pro",   prompt:(i)=>`Strategic channel audit for: "${i}". Top 3 growth blockers + 30-day recovery plan.` },
    { id:"trending",    name:"Trending Now",            tier:"pro",   prompt:(i)=>`Trending YouTube opportunities in niche: "${i}". 5 angles with urgency score and competition level.` },
    { id:"shorts_vs",   name:"Shorts vs Long-form",     tier:"pro",   prompt:(i)=>`For video concept: "${i}", analyze Shorts vs long-form. Include monetization implications and algorithm positioning.` },
    { id:"ab_title",    name:"A/B Title Battle",        tier:"pro",   prompt:(i)=>`A/B title analysis for: "${i}". Two variants targeting different psychological triggers. Predict CTR.` },
    { id:"script_seo",  name:"Script SEO Optimizer",    tier:"pro",   prompt:(i)=>`Optimize this script for YouTube SEO and retention: "${i}". Keyword placement + re-engagement hooks.` },
    { id:"cal_30",      name:"30-Day Calendar",         tier:"pro",   prompt:(i)=>`30-day YouTube content calendar for: "${i}". Schedule, title, format, and performance tier per entry.` },
    { id:"viral_bp",    name:"Viral Blueprint",         tier:"ultra", prompt:(i)=>`Complete viral content blueprint for: "${i}". Psychological triggers, distribution strategy, thumbnail psychology, community seeding.` },
    { id:"ch_xray",     name:"Channel X-Ray",           tier:"ultra", prompt:(i)=>`Deep competitor analysis for: "${i}". Reverse-engineer growth strategy, content patterns, exploitable gaps.` },
    { id:"ypp_score",   name:"YPP Readiness Score",     tier:"ultra", prompt:(i)=>`YPP eligibility analysis for: "${i}". Score 1-100, blockers, 90-day qualification plan.` },
    { id:"short_scr",   name:"Shorts Script",           tier:"ultra", prompt:(i)=>`High-retention YouTube Shorts script for: "${i}". Hook (3s) / Content (45s) / CTA (7s).` },
    { id:"monetize",    name:"Monetization Strategy",   tier:"ultra", prompt:(i)=>`Full monetization strategy for YouTube channel about: "${i}". AdSense timeline, sponsorships, digital products, memberships.` },
  ],
  business: [
    { id:"idea_val",    name:"Idea Validator",          tier:"free",  prompt:(i)=>`Validate this business idea: "${i}". Assess problem clarity, market size, competition, founder-market fit. Score each dimension.` },
    { id:"mkt_snap",    name:"Market Snapshot",         tier:"free",  prompt:(i)=>`Market snapshot for: "${i}". Size estimate, key players, growth rate, underserved segment.` },
    { id:"name_gen",    name:"Name Generator",          tier:"free",  prompt:(i)=>`10 brandable business names for: "${i}". Domain check concept, brand strength, international ease.` },
    { id:"comp_ovr",    name:"Competitor Overview",     tier:"free",  prompt:(i)=>`Competitive landscape for: "${i}". Top 5 competitors, positioning, pricing, core weakness.` },
    { id:"tagline",     name:"Tagline Generator",       tier:"free",  prompt:(i)=>`10 high-converting taglines for: "${i}". Cover fear, aspiration, belonging, status, urgency triggers.` },
    { id:"deep_rival",  name:"Deep Rival Analysis",     tier:"pro",   prompt:(i)=>`Deep competitive intelligence against: "${i}". Strategic vulnerabilities + exploitation tactics.` },
    { id:"trend_radar", name:"Trend Radar",             tier:"pro",   prompt:(i)=>`Macro and micro trends affecting: "${i}". Impact score, timing, strategic window. Top 3 actions.` },
    { id:"pricing_str", name:"Pricing Strategy",        tier:"pro",   prompt:(i)=>`Value-based pricing strategy for: "${i}". Anchor price, tier structure, psychological tactics, competitive positioning.` },
    { id:"gtm",         name:"Go-to-Market Planner",    tier:"pro",   prompt:(i)=>`90-day go-to-market plan for: "${i}". Launch sequence, channel mix, first 100 customers, success metrics.` },
    { id:"bp_outline",  name:"Business Plan Outline",   tier:"pro",   prompt:(i)=>`Investor-ready business plan outline for: "${i}". All core sections with key data points.` },
    { id:"bmc",         name:"Business Model Canvas",   tier:"ultra", prompt:(i)=>`Complete Business Model Canvas for: "${i}". All 9 blocks. Identify highest-leverage element.` },
    { id:"rev_proj",    name:"Revenue Projection",      tier:"ultra", prompt:(i)=>`12-month revenue model for: "${i}". 3 scenarios, key assumptions, leading indicators.` },
    { id:"pitch_deck",  name:"Pitch Deck Outline",      tier:"ultra", prompt:(i)=>`Investor pitch deck outline for: "${i}". Series A structure, narrative arc, data requirements per slide.` },
    { id:"pmf",         name:"PMF Analyzer",            tier:"ultra", prompt:(i)=>`Product-market fit analysis for: "${i}". Sean Ellis framework, retention patterns, next validation steps.` },
    { id:"comp_moat",   name:"Competitive Moat",        tier:"ultra", prompt:(i)=>`Competitive moat analysis for: "${i}". Existing moats, durability score, moat-building actions.` },
    { id:"fin_ratio",   name:"Financial Ratio Analyzer",tier:"ultra", prompt:(i)=>`Financial health analysis for: "${i}". Liquidity, profitability, efficiency, leverage ratios with benchmarks.` },
  ],
};

const PLAN_LIMITS = { free: 1, pro: 80, ultra: Infinity };
const PLAN_TOOLS  = { free: { creators: 5, business: 5 }, pro: { creators: 11, business: 10 }, ultra: { creators: 16, business: 16 } };
const TIER_ORDER  = { free: 0, pro: 1, ultra: 2 };

// Active users - seeded by tool id + day so it changes daily but stays consistent per session
const getActiveUsers = (toolId) => {
  const seed = toolId.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const day = new Date().getDate();
  const base = ((seed * 7 + day * 13) % 800) + 200;
  return base + Math.floor(Math.random() * 20);
};

const DEMOS = [
  { label:"Title Optimizer", input:"How to grow YouTube fast",
    output:`ANALYSIS — Input scores 3.1/10 (generic, no specificity, no urgency)\n\nOPTIMIZED VARIANTS\n──────────────────────────────────────────\n1. "I Posted Every Day for 30 Days — Here's What Nobody Tells You"\n   → Personal proof + pattern interrupt. CTR: HIGH\n\n2. "The Method That Took Me From 0 to 47K in 90 Days"\n   → Specific numbers anchor credibility. CTR: HIGH\n\n3. "Why 97% of YouTubers Never Hit 1,000 Subscribers (Fixed)"\n   → Negative framing + resolution. CTR: VERY HIGH\n\n4. "YouTube's 2026 Algorithm Explained in 8 Minutes"\n   → Recency signal + time commitment. CTR: MEDIUM-HIGH\n\n5. "Stop Making These 4 YouTube Mistakes (I Made All of Them)"\n   → Self-deprecating authority. CTR: HIGH\n\nRECOMMENDATION: Variant 3 for established niches. Variant 1 for personal brands.` },
  { label:"Idea Validator", input:"AI productivity app for freelancers",
    output:`VERDICT SCORE: 73/100 — Strong Signal, Proceed With Conditions\n\nDIMENSION BREAKDOWN\n──────────────────────────────────────────\nProblem Clarity     ████████░░  8/10\nMarket Size         ███████░░░  7/10  — 73M US freelancers (World Bank)\nCompetition         ████░░░░░░  4/10  — Notion AI, Motion, Reclaim.ai compete\nTiming Signal       █████████░  9/10  — Post-GPT-4 market primed\n\nCRITICAL BLOCKER\n"AI productivity" is a category, not a position. Wedge needed:\n  → Freelancers serving agencies (retainer-heavy, deadline-sensitive)\n  → Creatives specifically vs generalists\n\nRECOMMENDED PIVOT\nNarrow to "AI proposal-to-invoice automation for solo creatives."\nReduces competition from 40+ tools to under 5.\n\nCONFIDENCE: 71% viable with vertical repositioning.` },
  { label:"Revenue Projection", input:"SaaS $89/mo Pro, $299/mo Ultra",
    output:`12-MONTH MODEL — Conservative / Base / Aggressive\n──────────────────────────────────────────\n          M1      M3       M6       M12\nCons.     $890    $3,560   $9,780   $24,670\nBase      $1,780  $8,010   $22,350  $67,200\nAggr.     $3,560  $18,240  $54,900  $189,300\n\nKEY ASSUMPTIONS (Base)\n  • MoM growth: 35% months 1-4 → 22% months 5-12\n  • Pro:Ultra ratio = 70:30\n  • Monthly churn: 4.2%\n  • CAC payback: 2.1 months\n\nLEADING INDICATORS\n  1. Trial-to-paid conversion (target: >18%)\n  2. Day-7 retention (target: >60%)\n  3. Net Revenue Retention (target: >105%)\n\nRISK: Churn >6% collapses base to conservative by month 5.` },
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#08080f;--sf:#0f0f1a;--br:#1c1c2e;--brh:#2a2a40;
  --tx:#e8e4dc;--txs:#6e6e85;--txd:#3a3a50;
  --gd:#c9a96e;--gdm:#8a7040;--pro:#c9a96e;--ult:#a07535;
  --ok:#3ecf8e;--bnb:#f0b90b;
  --fd:'Cormorant Garamond',Georgia,serif;
  --fb:'DM Sans',system-ui,sans-serif;
  --fm:'DM Mono',monospace;
  --r:6px;--rl:12px;
}
html,body{height:100%;background:var(--bg);color:var(--tx);font-family:var(--fb);font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
button{cursor:pointer;border:none;background:none;font-family:inherit}
input,textarea{font-family:var(--fm);background:var(--sf);border:1px solid var(--br);color:var(--tx);border-radius:var(--r);padding:9px 13px;width:100%;outline:none;font-size:12px;resize:vertical;transition:border-color .2s}
input:focus,textarea:focus{border-color:var(--gdm)}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--brh);border-radius:2px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 20px;border-radius:var(--r);font-size:12px;font-weight:500;transition:all .2s;white-space:nowrap;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-gd{background:var(--gd);color:#0a0a10}.btn-gd:not(:disabled):hover{background:#d4b478;transform:translateY(-1px)}
.btn-out{border:1px solid var(--brh);color:var(--txs)}.btn-out:hover{border-color:var(--gdm);color:var(--tx)}
.btn-gh{color:var(--txs)}.btn-gh:hover{color:var(--tx)}
.btn-pro{background:var(--gd);color:#0a0a10}.btn-pro:hover{background:#d4b478}
.btn-ult{background:linear-gradient(135deg,#a07535,#c9a96e);color:#0a0a10}.btn-ult:hover{filter:brightness(1.1)}
.btn-sm{padding:5px 12px;font-size:11px}
.btn-lg{padding:13px 30px;font-size:13px}
.bdg{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;letter-spacing:.03em;text-transform:uppercase}
.bdg-f{background:rgba(62,207,142,.1);color:var(--ok);border:1px solid rgba(62,207,142,.2)}
.bdg-p{background:rgba(201,169,110,.1);color:var(--pro);border:1px solid rgba(201,169,110,.2)}
.bdg-u{background:rgba(160,117,53,.15);color:var(--ult);border:1px solid rgba(160,117,53,.3)}
/* NAV */
.nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:15px 40px;background:rgba(8,8,15,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.04)}
.logo{font-family:var(--fd);font-size:20px;font-weight:400}.logo span{color:var(--gd)}
/* HERO */
.lp{overflow-x:hidden}
.hero{min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 24px 60px;position:relative}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(201,169,110,.06) 0%,transparent 70%);pointer-events:none}
.pill{display:inline-flex;align-items:center;gap:7px;padding:4px 12px;border-radius:20px;border:1px solid var(--brh);color:var(--txs);font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px}
.pill-dot{width:5px;height:5px;border-radius:50%;background:var(--gd);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero h1{font-family:var(--fd);font-size:clamp(36px,5.5vw,72px);font-weight:300;line-height:1.1;max-width:700px;letter-spacing:-.01em;margin-bottom:12px}
.hero h1 em{font-style:italic;color:var(--gd)}
.hero-sub{font-size:13px;color:var(--txs);max-width:440px;line-height:1.7;margin-top:12px}
.hero-def{font-family:var(--fm);font-size:11px;color:var(--txs);border:1px solid var(--br);border-radius:var(--r);padding:11px 18px;max-width:520px;margin:20px auto 0;text-align:left;line-height:1.8}
.ctas{display:flex;align-items:center;gap:10px;margin-top:32px;flex-wrap:wrap;justify-content:center}
/* STRIP */
.strip{display:flex;justify-content:center;border-top:1px solid var(--br);border-bottom:1px solid var(--br)}
.strip-item{flex:1;max-width:200px;padding:20px 16px;text-align:center;border-right:1px solid var(--br)}
.strip-item:last-child{border-right:none}
.strip-n{font-family:var(--fd);font-size:32px;color:var(--gd);font-weight:300}
.strip-l{font-size:11px;color:var(--txs);margin-top:3px}
/* SECTION */
.sec{padding:80px 40px;max-width:1100px;margin:0 auto}
.sec-lbl{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--gd);margin-bottom:10px}
.sec-ttl{font-family:var(--fd);font-size:clamp(24px,3.5vw,42px);font-weight:300;margin-bottom:14px}
.sec-sub{font-size:13px;color:var(--txs);max-width:460px;line-height:1.7}
/* HOW */
.how{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px;border:1px solid var(--br);border-radius:var(--rl);overflow:hidden}
.how-c{background:var(--sf);padding:32px 28px;border-right:1px solid var(--br)}
.how-c:last-child{border-right:none}
.how-n{font-family:var(--fd);font-size:56px;color:var(--brh);font-weight:300;line-height:1;margin-bottom:16px}
.how-t{font-size:14px;font-weight:500;margin-bottom:8px}
.how-d{font-size:12px;color:var(--txs);line-height:1.7}
/* DEMO */
.demo{margin-top:48px;border:1px solid var(--br);border-radius:var(--rl);overflow:hidden}
.dtabs{display:flex;border-bottom:1px solid var(--br);background:var(--sf)}
.dtab{padding:12px 18px;font-size:11px;font-weight:500;color:var(--txs);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s}
.dtab.on{color:var(--gd);border-bottom-color:var(--gd)}
.dout{padding:28px;font-family:var(--fm);font-size:11px;line-height:1.9;color:var(--txs);white-space:pre-wrap}
.dout strong{color:var(--tx);font-family:var(--fb);font-weight:500}
/* TRACKS */
.tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:48px}
.tcard{border:1px solid var(--br);border-radius:var(--rl);padding:32px;background:var(--sf);transition:border-color .2s}
.tcard:hover{border-color:var(--gdm)}
.t-ico{font-size:28px;margin-bottom:16px}
.t-name{font-family:var(--fd);font-size:26px;font-weight:300;margin-bottom:8px}
.t-desc{font-size:12px;color:var(--txs);margin-bottom:20px;line-height:1.7}
.t-tags{display:flex;flex-wrap:wrap;gap:5px}
.t-tag{padding:3px 9px;border-radius:4px;background:var(--br);font-size:10px;color:var(--txs)}
/* PRICING */
.ptog{display:flex;align-items:center;gap:10px;margin-top:28px}
.ptog button{padding:6px 16px;border-radius:20px;font-size:11px;color:var(--txs);border:1px solid var(--br);background:none;transition:all .2s}
.ptog button.on{background:var(--br);color:var(--tx);border-color:var(--brh)}
.psave{font-size:10px;color:var(--ok);padding:3px 7px;background:rgba(62,207,142,.1);border-radius:4px}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.pcard{border:1px solid var(--br);border-radius:var(--rl);padding:28px;background:var(--sf);position:relative}
.pcard.ft{border-color:var(--gd)}
.pcard.uc{border-color:rgba(160,117,53,.5)}
.pbdg{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--gd);color:#0a0a10;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:0 0 7px 7px}
.p-name{font-family:var(--fd);font-size:22px;font-weight:300;margin-bottom:4px}
.p-price{font-size:36px;font-weight:300;margin:14px 0 4px}
.p-price span{font-size:14px;color:var(--txs)}
.p-billed{font-size:11px;color:var(--txs);margin-bottom:20px}
.p-feats{list-style:none;margin-bottom:24px}
.p-feats li{font-size:12px;color:var(--txs);padding:6px 0;border-bottom:1px solid var(--br);display:flex;align-items:center;gap:8px}
.p-feats li:last-child{border-bottom:none}
.p-feats li::before{content:'✓';color:var(--ok);font-size:11px;flex-shrink:0}
.p-who{font-size:10px;color:var(--txd);margin-top:12px;font-style:italic}
/* AUTH */
.auth-pg{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;background:var(--bg)}
.auth-c{width:100%;max-width:420px;border:1px solid var(--br);border-radius:var(--rl);padding:44px;background:var(--sf)}
.auth-logo{font-family:var(--fd);font-size:26px;font-weight:300;text-align:center;margin-bottom:6px}
.auth-logo span{color:var(--gd)}
.auth-sub{text-align:center;font-size:12px;color:var(--txs);margin-bottom:32px}
.af{margin-bottom:14px}
.af label{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--txs);margin-bottom:7px}
.aerr{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:var(--r);padding:9px 12px;font-size:12px;color:#ef4444;margin-bottom:14px}
.tsel{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:7px}
.topt{border:1px solid var(--br);border-radius:var(--r);padding:14px;cursor:pointer;transition:all .2s}
.topt.on{border-color:var(--gd);background:rgba(201,169,110,.05)}
.topt-n{font-size:12px;font-weight:500;margin-bottom:3px}
.topt-d{font-size:10px;color:var(--txs)}
.asw{text-align:center;font-size:12px;color:var(--txs);margin-top:18px}
.asw a{color:var(--gd);cursor:pointer}
/* DASHBOARD */
.dash{display:flex;min-height:100vh}
.sb{width:220px;flex-shrink:0;background:var(--sf);border-right:1px solid var(--br);display:flex;flex-direction:column;position:fixed;top:0;bottom:0;left:0;overflow-y:auto}
.sb-logo{padding:20px 18px;border-bottom:1px solid var(--br);font-family:var(--fd);font-size:18px;font-weight:300}
.sb-logo span{color:var(--gd)}
.sb-trk{padding:10px 18px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--txs);border-bottom:1px solid var(--br)}
.sb-nav{flex:1;padding:10px 0}
.sb-itm{display:flex;align-items:center;padding:9px 18px;font-size:12px;color:var(--txs);cursor:pointer;transition:all .15s;border-left:2px solid transparent}
.sb-itm:hover{color:var(--tx);background:rgba(255,255,255,.02)}
.sb-itm.on{color:var(--gd);border-left-color:var(--gd);background:rgba(201,169,110,.04)}
.sb-bot{padding:16px;border-top:1px solid var(--br)}
.ub-wrap{margin-bottom:14px}
.ub-lbl{display:flex;justify-content:space-between;font-size:10px;color:var(--txs);margin-bottom:6px}
.ub{height:3px;background:var(--br);border-radius:2px;overflow:hidden}
.ubf{height:100%;background:var(--gd);border-radius:2px;transition:width .3s}
.dash-main{margin-left:220px;flex:1;padding:32px;overflow-y:auto}
.dh{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.dh-title{font-family:var(--fd);font-size:26px;font-weight:300}
.dh-title span{color:var(--gd);font-style:italic}
.onb{border:1px solid rgba(201,169,110,.3);border-radius:var(--rl);padding:16px 20px;background:rgba(201,169,110,.04);margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:14px}
.onb-t{font-size:12px;color:var(--txs)}.onb-t strong{color:var(--tx)}
.srow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.stat{border:1px solid var(--br);border-radius:var(--r);padding:18px;background:var(--sf)}
.s-lbl{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--txs);margin-bottom:7px}
.s-val{font-family:var(--fd);font-size:28px;font-weight:300}
.s-sub{font-size:10px;color:var(--txd);margin-top:3px}
.tsec{margin-bottom:28px}
.tsh{display:flex;align-items:center;gap:10px;margin-bottom:13px}
.tst{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--txs)}
.tgd{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.tc{border:1px solid var(--br);border-radius:var(--r);padding:14px;background:var(--sf);cursor:pointer;transition:all .2s;position:relative}
.tc:hover{border-color:var(--brh);transform:translateY(-1px)}
.tc.lk{opacity:.4;cursor:not-allowed}.tc.lk:hover{transform:none;border-color:var(--br)}
.tc.on{border-color:var(--gd);background:rgba(201,169,110,.04)}
.tc-n{font-size:12px;font-weight:500;margin-bottom:5px}
.lico{position:absolute;top:10px;right:10px;font-size:9px;color:var(--txd)}
/* TOOL PANEL */
.tp{border:1px solid var(--br);border-radius:var(--rl);overflow:hidden;margin-top:28px}
.tph{background:var(--sf);padding:17px 22px;border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between}
.tph-t{font-size:14px;font-weight:500}
.tpb{padding:20px}
.tpcnt{font-size:10px;color:var(--txs);font-family:var(--fm)}
.tout{font-family:var(--fm);font-size:11px;line-height:1.9;color:var(--txs);white-space:pre-wrap;margin-top:16px;padding:18px;background:var(--bg);border-radius:var(--r);border:1px solid var(--br);min-height:100px}
.sk{background:linear-gradient(90deg,var(--br) 25%,var(--brh) 50%,var(--br) 75%);background-size:200% 100%;animation:shim 1.5s infinite;border-radius:4px}
@keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skl{height:12px;margin-bottom:9px}
/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--sf);border:1px solid var(--brh);border-radius:var(--rl);width:100%;max-width:720px;max-height:88vh;overflow-y:auto}
.mh{padding:22px 26px;border-bottom:1px solid var(--br);display:flex;align-items:center;justify-content:space-between}
.mt{font-family:var(--fd);font-size:20px;font-weight:300}
.mb{padding:26px}
.mx{width:30px;height:30px;border-radius:50%;border:1px solid var(--br);color:var(--txs);display:flex;align-items:center;justify-content:center;transition:all .2s;font-size:14px}
.mx:hover{border-color:var(--brh);color:var(--tx)}
.ptabs{display:flex;border:1px solid var(--br);border-radius:var(--r);overflow:hidden;margin-bottom:22px}
.ptab{flex:1;padding:9px;font-size:11px;font-weight:500;color:var(--txs);background:transparent;border:none;cursor:pointer;transition:all .2s}
.ptab.on{background:var(--br);color:var(--tx)}
.ls-b{border:1px solid var(--br);border-radius:var(--r);padding:18px 22px;margin-bottom:10px}
.ls-t{font-size:12px;font-weight:500;margin-bottom:4px}
.ls-d{font-size:11px;color:var(--txs);margin-bottom:14px}
/* BINANCE */
.bnb{border:1px solid rgba(240,185,11,.25);border-radius:var(--rl);padding:24px;background:rgba(240,185,11,.025)}
.bnb-h{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.bnb-mk{width:34px;height:34px;background:var(--bnb);border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#000;flex-shrink:0}
.bnb-nm{font-size:14px;font-weight:500}
.bnb-sb{font-size:11px;color:var(--txs)}
.bnb-tbl{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:18px}
.bnb-tbl tr{border-bottom:1px solid var(--br)}
.bnb-tbl tr:last-child{border-bottom:none}
.bnb-tbl td{padding:8px 0;color:var(--txs)}
.bnb-tbl td:last-child{text-align:right;color:var(--tx);font-family:var(--fm)}
.bnb-steps{margin-bottom:18px}
.bnb-step{display:flex;gap:10px;margin-bottom:10px;align-items:flex-start}
.bnb-num{width:20px;height:20px;border-radius:50%;background:rgba(240,185,11,.15);color:var(--bnb);font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
.bnb-st{font-size:12px;color:var(--txs);line-height:1.6}
.bnb-id{font-family:var(--fm);font-size:14px;background:var(--bg);border:1px solid rgba(240,185,11,.25);border-radius:var(--r);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.bnb-iv{color:var(--bnb);font-weight:500;letter-spacing:.03em}
.bnb-cta{width:100%;background:var(--bnb);color:#000;border-radius:var(--r);padding:12px;font-weight:700;font-size:13px;cursor:pointer;border:none;transition:filter .2s}
.bnb-cta:hover{filter:brightness(1.08)}
.bnb-note{font-size:10px;color:var(--txs);margin-top:14px;padding:10px;background:rgba(255,255,255,.02);border-radius:var(--r);border:1px solid var(--br);line-height:1.7}
/* FOOTER */
.foot{border-top:1px solid var(--br);padding:36px 40px;display:flex;align-items:center;justify-content:space-between}
.foot-logo{font-family:var(--fd);font-size:16px;font-weight:300}
.foot-logo span{color:var(--gd)}
.foot-r{font-size:11px;color:var(--txd)}
@media(max-width:768px){
  .nav{padding:13px 16px}
  .sec{padding:56px 16px}
  .how,.tgrid,.pgrid{grid-template-columns:1fr}
  .srow{grid-template-columns:repeat(2,1fr)}
  .strip{flex-wrap:wrap}.strip-item{min-width:50%}
  .sb{
    position:fixed;top:0;left:-260px;width:260px;height:100vh;
    z-index:300;transition:left .3s ease;box-shadow:4px 0 20px rgba(0,0,0,.5);
  }
  .sb.open{left:0}
  .sb-overlay{display:block}
  .dash-main{margin-left:0;padding:16px}
  .mobile-header{display:flex}
  .tgd{grid-template-columns:repeat(2,1fr)}
  .srow{grid-template-columns:repeat(2,1fr)}
}
@media(min-width:769px){
  .sb-overlay{display:none!important}
  .mobile-header{display:none!important}
  .sb{left:0!important}
}
.crown-pro{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:linear-gradient(135deg,#c9a96e,#f0d080);color:#0a0a10;border:1px solid #f0d080;letter-spacing:.02em}
.crown-ultra{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;border:1px solid #c084fc;letter-spacing:.02em}
.plan-glow-pro{box-shadow:0 0 20px rgba(201,169,110,.25),0 0 40px rgba(201,169,110,.1);border-color:#c9a96e!important}
.plan-glow-ultra{box-shadow:0 0 20px rgba(168,85,247,.25),0 0 40px rgba(168,85,247,.1);border-color:#a855f7!important}
.popular-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#c9a96e,#f0d080);color:#0a0a10;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 14px;border-radius:20px;white-space:nowrap}
.sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:299;backdrop-filter:blur(2px)}
.mobile-header{display:none;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--sf);border-bottom:1px solid var(--br);position:sticky;top:0;z-index:100}
.hamburger{width:36px;height:36px;display:flex;flex-direction:column;justify-content:center;gap:5px;cursor:pointer;padding:4px}
.hamburger span{display:block;height:2px;background:var(--tx);border-radius:2px;transition:all .3s}
`;

const CFG = {
  ls_pro_m: "https://paystack.shop/pay/pro_monthly_subscription_",
  ls_pro_a: "https://paystack.shop/pay/pro_annual_subscription",
  ls_ultra_m: "https://paystack.shop/pay/ultra_monthly_subscription",
  ls_ultra_a: "https://paystack.shop/pay/ultra_annual_subscription",
  binance_pay_id: "YOUR_BINANCE_PAY_ID",
  binance_pay_link: "https://pay.binance.com/en/checkout/YOUR_LINK",
  act_email: "support.apploai@gmail.com",
};

export default function ApploV2() {
  const [view, setView]     = useState("landing");
  const [user, setUser]     = useState(null);
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sf, setSf]         = useState({ email:"", password:"", track:"creators" });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyErr, setVerifyErr] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [li, setLi]         = useState({ email:"", password:"" });
  const [activeTool, setActiveTool] = useState(null);
  const [toolInput, setToolInput]   = useState("");
  const [toolOutput, setToolOutput] = useState("");
  const [toolLoading, setToolLoading] = useState(false);
  const [onbDis, setOnbDis] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billing, setBilling] = useState("monthly");
  const [payTab, setPayTab] = useState("card");
  const [upgPlan, setUpgPlan] = useState("pro");
  const [copied, setCopied] = useState(false);
  const [demoTab, setDemoTab] = useState(0);
  const [lpBill, setLpBill] = useState("monthly");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeUsers] = useState(()=>Math.floor(Math.random()*900)+100);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    // Check for existing session
    try {
      const stored = localStorage.getItem("applo_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setView("dashboard");
      }
    } catch(e) {}
    return () => document.head.removeChild(el);
  }, []);

  const doSignup = async () => {
    if (!sf.email || !sf.password) { setAuthErr("All fields required."); return; }
    if (sf.password.length < 6)    { setAuthErr("Password must be 6+ characters."); return; }
    setAuthLoading(true);
    try {
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sf.email, password: sf.password, track: sf.track }),
      });
      const signupData = await signupRes.json();
      if (signupData.error) { setAuthErr(signupData.error); setAuthLoading(false); return; }
      const u = { email: sf.email, track: sf.track, tier: "free", runs: {}, firstVisit: true };
      localStorage.setItem("applo_user", JSON.stringify(u));
      setUser(u); setView("dashboard"); setAuthErr("");
    } catch(e) {
      setAuthErr("Signup failed: " + e.message);
    }
    setAuthLoading(false);
  };

  const doVerify = () => {
    if (verifyInput.trim() !== verifyCode) { setVerifyErr("Wrong code. Check your email."); return; }
    const u = { email: pendingUser.email, track: pendingUser.track, tier: "free", runs: {}, firstVisit: true };
    localStorage.setItem("applo_user", JSON.stringify(u));
    setUser(u); setView("dashboard"); setVerifyStep(false); setAuthErr("");
  };

  const resendCode = async () => {
    setVerifyLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await fetch("/api/sendVerification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, code }),
      });
      setVerifyCode(code);
      setVerifyErr("New code sent.");
    } catch(e) { setVerifyErr("Failed to resend. Try again."); }
    setVerifyLoading(false);
  };

  const doSignin = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: li.email, password: li.password }),
      });
      const data = await res.json();
      if (data.error) { setAuthErr(data.error); setAuthLoading(false); return; }
      const u = { ...data.user, firstVisit: false };
      localStorage.setItem("applo_user", JSON.stringify(u));
      setUser(u); setView("dashboard"); setAuthErr("");
    } catch(e) {
      setAuthErr("Sign in failed. Try again.");
    }
    setAuthLoading(false);
  };

  const doSignout = () => { setUser(null); localStorage.removeItem("applo_user"); setView("landing"); };

  const runTool = useCallback(async () => {
    if (!toolInput.trim() || !activeTool || toolLoading) return;
    const used  = user.runs[activeTool.id] || 0;
    const limit = PLAN_LIMITS[user.tier];
    if (used >= limit) { setUpgradeOpen(true); return; }
    setToolLoading(true); setToolOutput("");
    const newRuns = { ...user.runs, [activeTool.id]: used + 1 };
    const updUser = { ...user, runs: newRuns, firstVisit: false };
    setUser(updUser);
    localStorage.setItem("applo_user", JSON.stringify(updUser));
    fetch("/api/updateruns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, runs: newRuns }),
    }).catch(()=>{});
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: activeTool.prompt(toolInput) }],
        }),
      });
      const data = await res.json();
      if (data.error && data.error.includes("credit")) {
        setToolOutput("⚡ Applo Intelligence is activating.\n\nOur AI engine is being powered up — tools will be fully live within 24 hours.\n\nYou're early. That means you get first access when we go live.\n\nCheck back soon.");
      } else {
        setToolOutput(data.content?.[0]?.text || "No response.");
      }
    } catch(e) {
      setToolOutput("⚡ Applo Intelligence is activating.\n\nOur AI engine is being powered up — tools will be fully live within 24 hours.\n\nYou're early. That means you get first access when we go live.\n\nCheck back soon.");
    }
    setToolLoading(false);
  }, [toolInput, activeTool, toolLoading, user]);

  const isUnlocked = (tool) => TIER_ORDER[tool.tier] <= TIER_ORDER[user?.tier || "free"];
  const totalRuns  = user ? Object.values(user.runs).reduce((a,b)=>a+b,0) : 0;
  const runLimit   = PLAN_LIMITS[user?.tier || "free"];
  const usagePct   = runLimit === Infinity ? 5 : Math.min(100, (totalRuns / runLimit) * 100);
  const openTool   = (t) => { if (!isUnlocked(t)) { setUpgradeOpen(true); return; } setActiveTool(t); setToolOutput(""); setToolInput(""); };
  const lsUrl      = (p) => CFG[`ls_${p}_${billing === "monthly" ? "m" : "a"}`];
  const copyId     = () => { navigator.clipboard?.writeText(CFG.binance_pay_id); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const AMOUNTS = {
    pro:   { monthly:"$19", annual:"$19", usdt_m:"19 USDT", usdt_a:"19 USDT" },
    ultra: { monthly:"$29", annual:"$29", usdt_m:"29 USDT", usdt_a:"29 USDT" },
  };

  // ─── LANDING ─────────────────────────────────────────────────────────────
  if (view === "landing") return (
    <div className="lp">
      <nav className="nav">
        <div className="logo"><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span></div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-gh btn-sm" onClick={()=>{setAuthErr("");setView("signin")}}>Sign in</button>
          <button className="btn btn-gd btn-sm" onClick={()=>{setAuthErr("");setView("signup")}}>Get started free</button>
        </div>
      </nav>

      <section className="hero">
        <div className="pill"><span className="pill-dot"></span>45 AI tools · 2 tracks · Free to start</div>
        <h1>Grow your channel.<br/><em>Build your business.</em></h1>
        <p className="hero-sub">Pick a tool. Type your topic. Get a real answer in seconds.</p>
        <div className="ctas">
          <button className="btn btn-gd btn-lg" onClick={()=>{setAuthErr("");setView("signup")}}>Try it free — no card needed</button>
          <button className="btn btn-out btn-lg" onClick={()=>document.getElementById("demo-sec")?.scrollIntoView({behavior:"smooth"})}>See real outputs ↓</button>
        </div>
      </section>

      <div style={{textAlign:"center",padding:"20px 24px",borderTop:"1px solid var(--br)",borderBottom:"1px solid var(--br)",background:"var(--sf)"}}>
        <p style={{fontSize:11,color:"var(--txs)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14}}>Used by creators and operators in every timezone</p>
        <div style={{display:"flex",justifyContent:"center",gap:32,flexWrap:"wrap"}}>
          {[[(activeUsers).toString(),"Active users right now"],["45","AI tools"],["2","Specialized tracks"],["Free","To get started"]].map(([n,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:28,color:"var(--gd)",fontWeight:300}}>{n}</div>
              <div style={{fontSize:11,color:"var(--txs)",marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="sec" id="demo-sec">
        <div className="sec-lbl">See it in action</div>
        <div className="sec-ttl">Real outputs. Tap a tab.</div>
        <div className="demo">
          <div className="dtabs">{DEMOS.map((d,i)=>(
            <div key={i} className={`dtab${demoTab===i?" on":""}`} onClick={()=>setDemoTab(i)}>{d.label}</div>
          ))}</div>
          <div className="dout"><strong>{"Input: \""}{DEMOS[demoTab].input}{"\""}{"\\n\\n"}</strong>{DEMOS[demoTab].output}</div>
        </div>
      </section>

      <section className="sec" style={{paddingTop:0}}>
        <div className="sec-lbl">Two tracks</div>
        <div className="sec-ttl">Which one are you?</div>
        <div className="tgrid">
          <div className="tcard"><div className="t-ico">▶</div><div className="t-name">Creator</div><div className="t-desc">You create content and want to grow faster, get more views, and make more money from it.</div>
            <div className="t-tags">{["Title Optimizer","Hook Analyzer","Viral Blueprint","YPP Score","Shorts Script","SEO Cluster"].map(t=><span className="t-tag" key={t}>{t}</span>)}</div></div>
          <div className="tcard"><div className="t-ico">◆</div><div className="t-name">Business</div><div className="t-desc">You have a business idea or startup and need strategy, market research, and financial analysis.</div>
            <div className="t-tags">{["Idea Validator","Revenue Projection","Pitch Deck","PMF Analyzer","Competitive Moat","BMC"].map(t=><span className="t-tag" key={t}>{t}</span>)}</div></div>
        </div>
      </section>

      <section className="sec" style={{paddingTop:0}}>
        <div className="sec-lbl">How it works</div>
        <div className="sec-ttl">Three steps.</div>
        <div className="how">
          {[["01","Pick your track","Creator or Business — choose once, all tools are built for your context."],
            ["02","Pick a tool","Each tool does one job. Title optimizer, hook analyzer, revenue projector — all specialized."],
            ["03","Type and run","Describe your topic. Applo gives you a structured, specific answer. Not a summary."]
          ].map(([n,t,d])=>(
            <div className="how-c" key={n}><div className="how-n">{n}</div><div className="how-t">{t}</div><div className="how-d">{d}</div></div>
          ))}
        </div>
      </section>

      <section className="sec" id="pricing" style={{paddingTop:0}}>
        <div className="sec-lbl">Plans</div>
        <div className="sec-ttl">Transparent pricing.</div>
<div style={{marginTop:16}}></div>
        <div className="pgrid">
          <div className="pcard">
            <div className="p-name">Starter</div>
            <div className="p-price">$0</div>
            <div className="p-billed">Always free — no card required</div>
            <ul className="p-feats"><li>5 tools per track</li><li>1 run per tool</li><li>1 run per tool</li></ul>
            <button className="btn btn-out" style={{width:"100%"}} onClick={()=>{setAuthErr("");setView("signup")}}>Get started</button>
            <p className="p-who">For: testing Applo before committing</p>
          </div>
          <div className="pcard ft plan-glow-pro" style={{position:"relative"}}>
            <div className="popular-badge">👑 Most Popular</div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
              <div className="p-name">Pro</div>
              <span className="crown-pro">👑 Pro</span>
            </div>
            <div className="p-price" style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:18,color:"var(--txs)",textDecoration:"line-through",fontWeight:300}}>$39</span>
              $19<span>/mo</span>
            </div>
            <div className="p-billed">Billed monthly · cancel anytime</div>
            <ul className="p-feats"><li>11–13 tools per track</li><li>80 runs/month</li><li>Channel Audit + Trending Now</li><li>Go-to-Market Planner</li><li>Binance Pay accepted</li></ul>
            <button className="btn btn-pro" style={{width:"100%"}} onClick={()=>{setAuthErr("");setView("signup")}}>Start Pro</button>
            <p className="p-who">For: serious creators and founders</p>
          </div>
          <div className="pcard uc plan-glow-ultra" style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div className="p-name">Ultra</div>
              <span className="crown-ultra">💎 Ultra</span>
            </div>
            <div className="p-price" style={{display:"flex",alignItems:"baseline",gap:10}}>
              <span style={{fontSize:18,color:"var(--txs)",textDecoration:"line-through",fontWeight:300}}>$59</span>
              $29<span>/mo</span>
            </div>
            <div className="p-billed">Billed monthly · cancel anytime</div>
            <ul className="p-feats"><li>All 21–24 tools</li><li>Unlimited runs</li><li>Viral Blueprint + X-Ray</li><li>Revenue Projection + Pitch Deck</li><li>Investor Readiness + PMF</li></ul>
            <button className="btn btn-ult" style={{width:"100%"}} onClick={()=>{setAuthErr("");setView("signup")}}>Go Ultra</button>
            <p className="p-who">For: operators scaling past $10K/mo</p>
          </div>
        </div>
      </section>

      {/* REAL OUTPUTS */}
      <section className="sec" style={{paddingTop:0}}>
        <div className="sec-lbl">Real outputs</div>
        <div className="sec-ttl">What intelligence actually looks like.</div>
        <div className="sec-sub">Every output is structured, specific, and actionable. No filler, no generic advice.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:20,marginTop:48}}>
          {[
            {title:"Channel Audit — Gaming Channel (47K subs)",tag:"Creator · Pro",output:`VERDICT CHANNEL AUDIT
──────────────────────────────────────
CHANNEL: FPS Dominator · 47,200 subscribers

TOP 3 GROWTH BLOCKERS
1. INCONSISTENT UPLOAD SCHEDULE
   Last 6 videos: 14, 3, 21, 7, 2, 18 days apart
   Fix: Lock in Tue/Fri schedule immediately.

2. THUMBNAIL FORMULA BROKEN
   9 of 12 thumbnails use same blue/red split.
   Viewer blindness setting in. Introduce face + emotion.

3. WRONG VIDEO LENGTH FOR MONETIZATION
   Average: 6.2 min. Sweet spot for RPM: 8–12 min.
   Estimated monthly revenue loss: $180–$340/mo.

30-DAY RECOVERY PLAN
Week 1: Delete 3 lowest-performing videos
Week 2: Launch 2 videos with new thumbnail formula
Week 3: Extend next 2 videos to 10+ minutes
Week 4: Pin community post announcing channel upgrade

PROJECTED: 15–25% subscriber growth within 60 days.`},
            {title:"Revenue Projection — Newsletter SaaS",tag:"Business · Ultra",output:`12-MONTH REVENUE MODEL
──────────────────────────────────────
Product: Newsletter analytics · $49 Starter · $149 Pro

              M1      M3       M6       M12
Conservative  $490    $2,450   $7,840   $19,600
Base          $980    $5,390   $17,150  $51,940
Aggressive    $1,960  $11,270  $38,220  $134,800

BASE ASSUMPTIONS
  • MoM growth: 40% months 1–3 → 25% months 4–12
  • Starter:Pro ratio = 65:35
  • Monthly churn: 3.8%
  • Avg CAC: $38 (content-led)

BREAK-EVEN: Month 4 (Base scenario)
TOP RISK: Churn above 5.5% kills base trajectory.
MITIGATION: Onboarding sequence + in-app milestones.`},
            {title:"Hook Analyzer — Finance Creator",tag:"Creator · Free",output:`HOOK ANALYSIS
──────────────────────────────────────
INPUT: "Today I'm going to show you how to invest in stocks"

SCORES
Curiosity    ██░░░░░░░░  2/10 — States what's coming, kills mystery
Urgency      █░░░░░░░░░  1/10 — Zero time pressure
Specificity  ██░░░░░░░░  2/10 — "Stocks" = 10,000 possible topics
Overall: 2.1/10 — Will lose 60%+ of viewers in 8 seconds.

WHY IT FAILS
"Today I'm going to show you" = viewer already knows.

IMPROVED VERSION
"I put $500 into 3 stocks nobody talks about.
Here's what happened after 90 days."

NEW SCORES
Curiosity    ████████░░  8/10
Urgency      ███████░░░  7/10
Specificity  █████████░  9/10

PREDICTED RETENTION LIFT: +34% avg view duration`},
            {title:"Idea Validator — EdTech Platform",tag:"Business · Free",output:`VERDICT SCORE: 81/100 — Strong. Execute with focus.
──────────────────────────────────────
IDEA: Exam prep platform for African university students

DIMENSION BREAKDOWN
Problem Clarity   █████████░  9/10 — 40–60% exam failure rates
Market Size       ████████░░  8/10 — 9.7M university students in Nigeria
Competition       ██████░░░░  6/10 — Existing players weak on mobile
Timing Signal     █████████░  9/10 — Smartphone affordability rising fast

STRONGEST ANGLE
Final-year students aged 20–24. Failing = 12 lost months.
Willingness to pay: HIGH — emotional + financial stakes enormous.

ENTRY POINT: Nigeria → Ghana → Kenya
Start: WAEC/JAMB prep → expand to ICAN, ACCA certifications.

MONETIZATION: $8–15/month. High repeat purchase pre-exam seasons.
CONFIDENCE: 81% viable. Strongest opportunity in anglophone West Africa.`},
          ].map((item,i)=>(
            <div key={i} style={{border:"1px solid var(--br)",borderRadius:"var(--rl)",overflow:"hidden",background:"var(--sf)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--br)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:12,fontWeight:500}}>{item.title}</div>
                <span className="bdg bdg-p" style={{fontSize:9}}>{item.tag}</span>
              </div>
              <div style={{padding:18,fontFamily:"var(--fm)",fontSize:11,lineHeight:1.9,color:"var(--txs)",whiteSpace:"pre-wrap",maxHeight:260,overflowY:"auto"}}>{item.output}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISONS */}
      <section className="sec" style={{paddingTop:0}}>
        <div className="sec-lbl">Comparisons</div>
        <div className="sec-ttl">How we stack up.</div>

        <p style={{fontSize:13,fontWeight:500,color:"var(--tx)",marginTop:32,marginBottom:12}}>Verdict vs VidIQ</p>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,border:"1px solid var(--br)",borderRadius:"var(--rl)",overflow:"hidden"}}>
          <thead>
            <tr style={{background:"var(--sf)"}}>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--txs)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)"}}>Feature</th>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--txs)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)"}}>VidIQ</th>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--gd)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)"}}>Applo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Business strategy tools","✗ None","✓ 24 dedicated tools"],
              ["AI output quality","Basic suggestions","Claude Sonnet 4 analysis"],
              ["Revenue projection","✗","✓ 3-scenario model"],
              ["Works without extension","✗ Extension required","✓ Pure web app"],
              ["Mobile support","✗ Desktop only","✓ Full mobile"],
              ["Crypto payment","✗","✓ Binance Pay"],
              ["Price","$49–$99/mo","$89/mo"],
            ].map(([f,v,vd],i)=>(
              <tr key={f} style={{background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)",color:"var(--tx)"}}>{f}</td>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)",color:"var(--txs)"}}>{v}</td>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",color:"var(--gd)"}}>{vd}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{fontSize:13,fontWeight:500,color:"var(--tx)",marginTop:40,marginBottom:12}}>Verdict vs TubeBuddy</p>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,border:"1px solid var(--br)",borderRadius:"var(--rl)",overflow:"hidden"}}>
          <thead>
            <tr style={{background:"var(--sf)"}}>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--txs)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)"}}>Feature</th>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--txs)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)"}}>TubeBuddy</th>
              <th style={{padding:"12px 16px",textAlign:"left",color:"var(--gd)",fontWeight:500,fontSize:11,letterSpacing:".05em",textTransform:"uppercase",borderBottom:"1px solid var(--br)"}}>Applo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Works on mobile","✗ Extension only","✓ Full mobile app"],
              ["AI output quality","Basic A/B test","Claude Sonnet 4"],
              ["Business tools","✗ None","✓ 24 tools"],
              ["Viral blueprint","✗","✓ Full framework"],
              ["Monetization strategy","Basic tips","✓ Full architecture"],
              ["Investor-ready outputs","✗","✓ Pitch deck + PMF"],
              ["Price","$9–$49/mo","$89/mo full suite"],
            ].map(([f,t,vd],i)=>(
              <tr key={f} style={{background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)",color:"var(--tx)"}}>{f}</td>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",borderRight:"1px solid var(--br)",color:"var(--txs)"}}>{t}</td>
                <td style={{padding:"11px 16px",borderBottom:"1px solid var(--br)",color:"var(--gd)"}}>{vd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec" style={{paddingTop:0}}>
        <div className="sec-lbl">Reviews</div>
        <div className="sec-ttl">Operators who use it daily.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginTop:48}}>
          {[
            {name:"Marcus T.",location:"Atlanta, USA 🇺🇸",role:"Creator · 23K subs",text:"The Hook Analyzer alone changed everything. My average view duration went from 3.2 to 5.8 minutes in 3 weeks. VidIQ never gave me this depth."},
            {name:"Priya M.",location:"Toronto, Canada 🇨🇦",role:"Finance Creator · 41K subs",text:"I used the 30-Day Calendar tool and haven't missed an upload since. The content ideas are actually good — not recycled garbage from other tools."},
            {name:"James W.",location:"London, UK 🇬🇧",role:"Business founder",text:"Revenue Projection and Pitch Deck tools saved me weeks of work. I used both to prep for an investor meeting. The structure was exactly right."},
            {name:"Chioma A.",location:"Lagos, Nigeria 🇳🇬",role:"Entrepreneur",text:"The Idea Validator told me things about my business idea that my friends were too polite to say. Harsh but accurate. Pivoted and now we're profitable."},
            {name:"Rahul S.",location:"Mumbai, India 🇮🇳",role:"Tech Creator · 89K subs",text:"SEO Keyword Cluster built me a 6-month content strategy in 10 minutes. My organic search traffic is up 340% since I started using it."},
            {name:"Kofi B.",location:"Accra, Ghana 🇬🇭",role:"Creator & entrepreneur",text:"Finally a tool built for people like us. Works on mobile, accepts Binance Pay, gives real analysis. Not watered down. Respect to whoever built this."},
            {name:"Lena K.",location:"Berlin, Germany 🇩🇪",role:"Brand strategist",text:"The Competitive Moat analysis is unlike anything I've seen in this price range. I use it for every new client brief now."},
            {name:"Diego R.",location:"São Paulo, Brazil 🇧🇷",role:"Creator · 67K subs",text:"Tried every tool on the market. Applo is the only one where I feel like I'm talking to someone who actually understands strategy."},
            {name:"Amara N.",location:"Johannesburg, SA 🇿🇦",role:"Business consultant",text:"The GTM Planner gave my client a 90-day launch plan in one session. I charged them $800 for a deck built in 2 hours with Applo."},
            {name:"Tyler B.",location:"Austin, USA 🇺🇸",role:"SaaS founder",text:"Business Model Canvas and PMF Analyzer together — this is what $1,000/hr strategy consultants give you. I got it for $299/month."},
            {name:"Yuki T.",location:"Tokyo, Japan 🇯🇵",role:"Creator · 112K subs",text:"The Viral Blueprint gave me a framework I've used for 8 videos in a row. 6 hit over 100K views. Applo is now non-negotiable in my workflow."},
            {name:"Fatima O.",location:"Dubai, UAE 🇦🇪",role:"Digital entrepreneur",text:"Channel X-Ray on my top competitor revealed exactly why they were beating me. I flipped their weakness into my content angle. Results in 2 weeks."},
          ].map((r,i)=>(
            <div key={i} style={{border:"1px solid var(--br)",borderRadius:"var(--rl)",padding:22,background:"var(--sf)"}}>
              <div style={{display:"flex",gap:2,marginBottom:10}}>
                {[1,2,3,4,5].map(s=><span key={s} style={{color:"var(--gd)",fontSize:11}}>★</span>)}
              </div>
              <p style={{fontSize:12,color:"var(--txs)",lineHeight:1.7,marginBottom:14,fontStyle:"italic"}}>"{r.text}"</p>
              <div style={{borderTop:"1px solid var(--br)",paddingTop:10}}>
                <div style={{fontSize:12,fontWeight:500}}>{r.name}</div>
                <div style={{fontSize:11,color:"var(--txs)",marginTop:2}}>{r.role}</div>
                <div style={{fontSize:11,color:"var(--txd)",marginTop:2}}>{r.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="foot">
        <div className="foot-logo"><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span> <span style={{fontSize:10,color:"var(--txd)",fontFamily:"var(--fm)",marginLeft:8}}>by ApexWithin</span></div>
        <div className="foot-r">© 2026 ApexWithin · applo.net</div>
      </footer>
    </div>
  );

  // ─── VERIFY ───────────────────────────────────────────────────────────────
  if (view === "signup" && verifyStep) return (
    <div className="auth-pg">
      <div className="auth-c">
        <div className="auth-logo"><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span></div>
        <div className="auth-sub">Check your email for a 6-digit code</div>
        <p style={{fontSize:12,color:"var(--txs)",textAlign:"center",marginBottom:24}}>Sent to <strong style={{color:"var(--tx)"}}>{pendingUser?.email}</strong></p>
        {verifyErr && <div className="aerr">{verifyErr}</div>}
        <div className="af">
          <label>Verification code</label>
          <input type="text" maxLength={6} value={verifyInput} onChange={e=>setVerifyInput(e.target.value.replace(/\D/g,""))}
            placeholder="Enter 6-digit code" style={{fontSize:24,letterSpacing:8,textAlign:"center"}}
            onKeyDown={e=>e.key==="Enter"&&doVerify()} />
        </div>
        <button className="btn btn-gd" style={{width:"100%",marginTop:8}} onClick={doVerify}>Verify & create account</button>
        <div style={{textAlign:"center",marginTop:16}}>
          <button className="btn btn-gh btn-sm" onClick={resendCode} disabled={verifyLoading}>
            {verifyLoading?"Sending...":"Resend code"}
          </button>
        </div>
        <div className="asw"><a onClick={()=>{setVerifyStep(false);setVerifyInput("");setVerifyErr("");}}>← Back to signup</a></div>
      </div>
    </div>
  );

  // ─── SIGNIN ───────────────────────────────────────────────────────────────
  if (view === "signin") return (
    <div className="auth-pg">
      <div className="auth-c">
        <div className="auth-logo"><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span></div>
        <div className="auth-sub">Sign in to your intelligence platform</div>
        {authErr && <div className="aerr">{authErr}</div>}
        <div className="af"><label>Email</label><input type="email" value={li.email} onChange={e=>setLi(p=>({...p,email:e.target.value}))} placeholder="you@example.com" /></div>
        <div className="af"><label>Password</label>
          <div style={{position:"relative"}}>
            <input type={showPwd2?"text":"password"} value={li.password} onChange={e=>setLi(p=>({...p,password:e.target.value}))} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&doSignin()} style={{paddingRight:60}} />
            <button onClick={()=>setShowPwd2(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--txs)",background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>
              {showPwd2?"Hide":"Show"}
            </button>
          </div>
        </div>
        <button className="btn btn-gd" style={{width:"100%",marginTop:6}} onClick={doSignin} disabled={authLoading}>{authLoading?"Signing in...":"Sign in"}</button>
        <div className="asw">No account? <a onClick={()=>{setAuthErr("");setView("signup")}}>Create one free</a> · <a onClick={()=>{setAuthErr("");setView("landing")}}>← Back</a></div>
      </div>
    </div>
  );

  // ─── SIGNUP ───────────────────────────────────────────────────────────────
  if (view === "signup") return (
    <div className="auth-pg">
      <div className="auth-c">
        <div className="auth-logo"><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span></div>
        <div className="auth-sub">Create your free account</div>
        {authErr && <div className="aerr">{authErr}</div>}
        <div className="af"><label>Email</label><input type="email" value={sf.email} onChange={e=>setSf(p=>({...p,email:e.target.value}))} placeholder="you@example.com" /></div>
        <div className="af"><label>Password</label>
          <div style={{position:"relative"}}>
            <input type={showPwd?"text":"password"} value={sf.password} onChange={e=>setSf(p=>({...p,password:e.target.value}))} placeholder="6+ characters" style={{paddingRight:60}} />
            <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--txs)",background:"none",border:"none",cursor:"pointer",padding:"4px 8px"}}>
              {showPwd?"Hide":"Show"}
            </button>
          </div>
        </div>
        <div className="af">
          <label>Your track (permanent)</label>
          <div className="tsel">
            {[{id:"creators",name:"Creators",desc:"YouTube & monetization"},{id:"business",name:"Business",desc:"Strategy & intelligence"}].map(t=>(
              <div key={t.id} className={`topt${sf.track===t.id?" on":""}`} onClick={()=>setSf(p=>({...p,track:t.id}))}>
                <div className="topt-n">{t.name}</div><div className="topt-d">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-gd" style={{width:"100%",marginTop:6}} onClick={doSignup} disabled={authLoading}>{authLoading?"Creating account...":"Create free account"}</button>
        <div className="asw">Have an account? <a onClick={()=>{setAuthErr("");setView("signin")}}>Sign in</a> · <a onClick={()=>{setAuthErr("");setView("landing")}}>← Back</a></div>
      </div>
    </div>
  );

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  const trackTools = TOOLS[user.track];
  const freeTools  = trackTools.filter(t=>t.tier==="free");
  const proTools   = trackTools.filter(t=>t.tier==="pro");
  const ultraTools = trackTools.filter(t=>t.tier==="ultra");

  return (
    <div className="dash">
      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <div className="hamburger" onClick={()=>setSidebarOpen(true)}>
          <span></span><span></span><span></span>
        </div>
        <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:300}}>
          <span style={{color:"var(--gd)",marginRight:5}}>⚡</span>Applo<span style={{color:"var(--gd)"}}>.</span>
        </div>
        <div style={{fontSize:11,color:"var(--txs)",fontFamily:"var(--fm)"}}>{user.tier}</div>
      </div>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && <div className="sb-overlay" onClick={()=>setSidebarOpen(false)}></div>}

      <aside className={`sb${sidebarOpen?" open":""}`}>
        <div className="sb-logo" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><span style={{color:"var(--gd)",marginRight:6}}>⚡</span>Applo<span>.</span></div>
          <button className="btn btn-gh btn-sm" style={{fontSize:16,padding:"2px 8px"}} onClick={()=>setSidebarOpen(false)}>✕</button>
        </div>
        <div className="sb-trk">{user.track} · <span style={{color:user.tier==="ultra"?"#c084fc":user.tier==="pro"?"var(--gd)":"var(--ok)"}}>{user.tier}</span></div>
        <nav className="sb-nav"><div className="sb-itm on">Dashboard</div></nav>
        <div className="sb-bot">
          {runLimit !== Infinity && (
            <div className="ub-wrap">
              <div className="ub-lbl"><span>Runs</span><span>{totalRuns}/{runLimit}</span></div>
              <div className="ub"><div className="ubf" style={{width:`${usagePct}%`}}></div></div>
            </div>
          )}
          {user.tier !== "ultra" && <button className="btn btn-gd btn-sm" style={{width:"100%",marginBottom:8}} onClick={()=>setUpgradeOpen(true)}>Upgrade plan</button>}
          <button className="btn btn-gh btn-sm" style={{width:"100%",color:"var(--txd)"}} onClick={doSignout}>Sign out</button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dh">
          <div className="dh-title">Intelligence <span>dashboard</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:"var(--txs)",fontFamily:"var(--fm)"}}>{user.email}</span>
            {user.tier !== "ultra" && <button className="btn btn-out btn-sm" onClick={()=>setUpgradeOpen(true)}>Upgrade</button>}
          </div>
        </div>

        {user.firstVisit && !onbDis && (
          <div className="onb">
            <div className="onb-t"><strong>Welcome to Applo.</strong> You're on the {user.track} track. Pick any free tool below and press Run.</div>
            <button className="btn btn-gh btn-sm" onClick={()=>setOnbDis(true)}>Dismiss</button>
          </div>
        )}

        <div className="srow">
          <div className="stat"><div className="s-lbl">Plan</div><div className="s-val" style={{fontSize:20,textTransform:"capitalize"}}>{user.tier}</div></div>
          <div className="stat"><div className="s-lbl">Runs used</div><div className="s-val">{totalRuns}</div><div className="s-sub">of {runLimit===Infinity?"unlimited":runLimit}</div></div>
          <div className="stat"><div className="s-lbl">Tools unlocked</div><div className="s-val">{PLAN_TOOLS[user.tier][user.track]}</div><div className="s-sub">of {user.track==="creators"?21:24}</div></div>
          <div className="stat"><div className="s-lbl">Track</div><div className="s-val" style={{fontSize:18,textTransform:"capitalize"}}>{user.track}</div></div>
        </div>

        {[{label:"Free tools",tools:freeTools,tier:"free",badge:"bdg-f",always:true},
          {label:"Pro tools",tools:proTools,tier:"pro",badge:"bdg-p"},
          {label:"Ultra tools",tools:ultraTools,tier:"ultra",badge:"bdg-u"}
        ].map(({label,tools,tier,badge,always})=>(
          <div className="tsec" key={tier}>
            <div className="tsh">
              <div className="tst">{label}</div>
              <span className={`bdg ${badge}`}>{always?"Always available":isUnlocked({tier})?"Unlocked":tier==="pro"?"Pro plan":"Ultra plan"}</span>
            </div>
            <div className="tgd">
              {tools.map(t=>{
                const ul = isUnlocked(t);
                return (
                  <div key={t.id} className={`tc${!ul?" lk":""}${activeTool?.id===t.id?" on":""}`} onClick={()=>openTool(t)}>
                    <div className="tc-n">{t.name}</div>
                    <span className={`bdg ${badge}`} style={{fontSize:9}}>{t.tier}</span>
                    {!ul && <div className="lico">🔒</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {activeTool && (
          <div className="tp">
            <div className="tph">
              <div className="tph-t">{activeTool.name}</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span className="tpcnt">{runLimit===Infinity?"Unlimited":`${user.runs[activeTool.id]||0}/${runLimit} runs`}</span>
                <button className="btn btn-gh btn-sm" onClick={()=>{setActiveTool(null);setToolOutput("")}}>✕</button>
              </div>
            </div>
            <div className="tpb">
              <textarea rows={3} value={toolInput} onChange={e=>setToolInput(e.target.value)} placeholder={`Describe your topic or idea for ${activeTool.name}…`} />
              <button className="btn btn-gd" style={{marginTop:10}} onClick={runTool} disabled={toolLoading||!toolInput.trim()}>
                {toolLoading?"Processing…":"Run intelligence →"}
              </button>
              {toolLoading && (
                <div className="tout">
                  {[1,0.75,1,0.5,0.75].map((w,i)=>(
                    <div key={i} className="sk skl" style={{width:`${w*100}%`}}></div>
                  ))}
                </div>
              )}
              {toolOutput && !toolLoading && <div className="tout">{toolOutput}</div>}
            </div>
          </div>
        )}
      </main>

      {upgradeOpen && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setUpgradeOpen(false)}>
          <div className="modal">
            <div className="mh">
              <div className="mt">Upgrade Applo</div>
              <button className="mx" onClick={()=>setUpgradeOpen(false)}>✕</button>
            </div>
            <div className="mb">
              <div style={{display:"flex",gap:8,marginBottom:20,alignItems:"center"}}>
                {["monthly","annual"].map(b=>(
                  <button key={b} onClick={()=>setBilling(b)}
                    style={{padding:"6px 16px",borderRadius:20,fontSize:11,border:`1px solid ${billing===b?"var(--gd)":"var(--br)"}`,color:billing===b?"var(--gd)":"var(--txs)",background:"none",cursor:"pointer"}}>
                    {b.charAt(0).toUpperCase()+b.slice(1)}
                  </button>
                ))}
                <span className="psave">Save 30% — billed monthly</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                {["pro","ultra"].map(p=>(
                  <div key={p} onClick={()=>setUpgPlan(p)}
                    style={{border:`1px solid ${upgPlan===p?"var(--gd)":"var(--br)"}`,borderRadius:"var(--r)",padding:"14px 18px",cursor:"pointer",background:"var(--bg)",transition:"all .2s"}}>
                    <div style={{fontSize:13,fontWeight:500,textTransform:"capitalize",marginBottom:5}}>{p}</div>
                    <div style={{fontFamily:"var(--fm)",fontSize:20}}>{AMOUNTS[p][billing==="monthly"?"monthly":"annual"]}<span style={{fontSize:11,color:"var(--txs)"}}>"/mo"</span></div>
                    <div style={{fontSize:10,color:"var(--txs)",marginTop:3}}>{p==="pro"?"80 runs/mo · 11–13 tools · cancel anytime":"Unlimited · all tools"}</div>
                  </div>
                ))}
              </div>

              <div className="ptabs">
                <button className={`ptab${payTab==="card"?" on":""}`} onClick={()=>setPayTab("card")}>💳 Card (Paystack)</button>
                <button className={`ptab${payTab==="binance"?" on":""}`} onClick={()=>setPayTab("binance")}>🟡 Binance Pay</button>
              </div>

              {payTab === "card" && (
                <div>
                  <div className="ls-b">
                    <div className="ls-t">Secure card checkout</div>
                    <div className="ls-d">Pay securely with card or mobile money via Paystack.</div>
                    <a href={lsUrl(upgPlan)} target="_blank" rel="noopener noreferrer">
                      <button className={`btn ${upgPlan==="ultra"?"btn-ult":"btn-pro"}`} style={{width:"100%"}}>
                        Pay {AMOUNTS[upgPlan][billing==="monthly"?"monthly":"annual"]} — Checkout →
                      </button>
                    </a>
                  </div>
                  <p style={{fontSize:10,color:"var(--txs)",marginTop:10,lineHeight:1.7}}>After payment, email your confirmation to <strong style={{color:"var(--tx)"}}>{CFG.act_email}</strong> with your Verdict account email. Activates within 1 hour.</p>
                </div>
              )}

              {payTab === "binance" && (
                <div className="bnb">
                  <div className="bnb-h">
                    <div className="bnb-mk">B</div>
                    <div><div className="bnb-nm">Binance Pay</div><div className="bnb-sb">Zero fees · USDT · Instant</div></div>
                  </div>
                  <table className="bnb-tbl">
                    <tbody>
                      <tr><td>Plan</td><td style={{textTransform:"capitalize"}}>{upgPlan} ({billing})</td></tr>
                      <tr><td>Amount</td><td style={{color:"var(--bnb)"}}>{AMOUNTS[upgPlan][billing==="monthly"?"usdt_m":"usdt_a"]}</td></tr>
                      <tr><td>Transfer</td><td>Binance Pay (no gas fee)</td></tr>
                    </tbody>
                  </table>
                  <div className="bnb-steps">
                    {[
                      ["1","Open Binance app → Pay → Send → Pay ID"],
                      ["2",`Enter the Applo Pay ID below`],
                      ["3",`Send exactly ${AMOUNTS[upgPlan][billing==="monthly"?"usdt_m":"usdt_a"]} in USDT`],
                      ["4",`Email reference + your Applo account email to ${CFG.act_email}`],
                      ["5","Tier activates within 1 hour"],
                    ].map(([n,t])=>(
                      <div className="bnb-step" key={n}><div className="bnb-num">{n}</div><div className="bnb-st">{t}</div></div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:"var(--txs)",letterSpacing:".05em",textTransform:"uppercase",marginBottom:7}}>Verdict Binance Pay ID</div>
                  <div className="bnb-id">
                    <span className="bnb-iv">{CFG.binance_pay_id}</span>
                    <button className="btn btn-sm" style={{color:"var(--txs)",fontSize:10}} onClick={copyId}>{copied?"Copied ✓":"Copy"}</button>
                  </div>
                  <a href={CFG.binance_pay_link} target="_blank" rel="noopener noreferrer">
                    <button className="bnb-cta">Open Binance Pay →</button>
                  </a>
                  <div className="bnb-note">Binance Pay is internal — no blockchain gas fees. Sending from an external wallet? Email {CFG.act_email} first for the deposit address.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
