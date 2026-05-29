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

const PLAN_LIMITS = { free: 3, pro: 80, ultra: Infinity };
const PLAN_TOOLS  = { free: { creators: 5, business: 5 }, pro: { creators: 11, business: 10 }, ultra: { creators: 16, business: 16 } };
const TIER_ORDER  = { free: 0, pro: 1, ultra: 2 };

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
  --gd:#c9a96e;--gdm:#8a7040;--pro:#4a7cf6;--ult:#a855f7;
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
.btn-pro{background:var(--pro);color:#fff}.btn-pro:hover{filter:brightness(1.1)}
.btn-ult{background:linear-gradient(135deg,var(--ult),#7c3aed);color:#fff}.btn-ult:hover{filter:brightness(1.1)}
.btn-sm{padding:5px 12px;font-size:11px}
.btn-lg{padding:13px 30px;font-size:13px}
.bdg{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;letter-spacing:.03em;text-transform:uppercase}
.bdg-f{background:rgba(62,207,142,.1);color:var(--ok);border:1px solid rgba(62,207,142,.2)}
.bdg-p{background:rgba(74,124,246,.1);color:var(--pro);border:1px solid rgba(74,124,246,.2)}
.bdg-u{background:rgba(168,85,247,.1);color:var(--ult);border:1px solid rgba(168,85,247,.2)}
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
.pcard.ft{border-color:var(--pro)}
.pcard.uc{border-color:rgba(168,85,247,.4)}
.pbdg{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:var(--pro);color:#fff;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:0 0 7px 7px}
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
.onb{border:1px solid rgba(201,169,110,.3);border-radius:var(--rl);padding:16px 20px;background:rgba(201,169,110,.04);margin-bottom:24px;display:flex;align-items:center;justify-content:space-between
