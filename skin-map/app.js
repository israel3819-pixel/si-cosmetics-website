/* SkinMap research demo — local only. Experimental image indicators; not clinically validated; not a diagnosis.
 * All thresholds marked PROVISIONAL are engineering choices evaluated on a small set of synthetic and
 * expressly authorised fixtures (see docs/THRESHOLDS.md). They are not scientific or clinical cut-offs. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const W = 480, H = 640, FACE_W = 300, STAGE_ASPECT = 3 / 4;
const TEST = new URLSearchParams(location.search).has("test");
const EXP = "מדד ניסיוני · לא אומת קלינית · אינו אבחנה";

/* ---------------- PROVISIONAL thresholds (docs/THRESHOLDS.md) ---------------- */
const GATE = {
  minFacePx: 300,             // native face width (landmarks 234–454) in analysed pixels; analysis never upsamples
  faceFrac: [0.35, 0.85],     // face width / frame width (visible crop for camera, whole image for uploads)
  center: [0.15, 0.18],       // max |dx|, |dy| of face centre from frame centre
  yaw: 0.08, roll: 8, pitch: [0.34, 0.58],
  clipFrac: 0.02,             // face pixels with any channel >= 250
  darkFrac: 0.05,             // measurement-region pixels with linear luminance < 0.005
  minMedianY: 0.02,           // median linear luminance of measurement regions
  sideRatio: 0.70,            // min/max of left vs right median linear luminance
  vertLog: 0.60,              // |ln(forehead / cheeks)| median linear luminance
  noise: 1.5,                 // Immerkær noise sigma (8-bit luma, analysis scale) on forehead + cheeks
  sharpness: 0.80,            // fine/coarse gradient-energy ratio on measurement regions (scale-normalised)
};
const REGION = { minCoverage: 0.60, minPx: 300, hairResp: 0.06, maxHairFlat: 0.10, maxHairPeriocular: 0.25 };
const PERIOCULAR = new Set(["underR","underL","crowR","crowL"]);
const MET = {                  // relative-contrast thresholds (ln linear luminance), equivalence-derived, see docs
  spot: 0.177, blemDark: 0.034, blemA: 3.6, red: 3.5, line: 0.077,
};
const DETECT_TIMEOUT_MS = 8000;

const GATE_HE = {
  faces: "פנים אחת בפריים", landmarks: "נקודות פנים בתוך התמונה", resolution: "רזולוציית פנים מקורית", framing: "מיקום וגודל במסגרת",
  pose: "זווית ראש", exposure: "חשיפה בתוך הפנים", asymmetry: "אסימטריית תאורה (ימין/שמאל)", uniformity: "אחידות תאורה (מצח/לחיים)",
  noise: "רעש תמונה", sharpness: "חדות באזורי העור"
};
const GATE_FIX = {
  faces: "ודאו שרק פנים אחת מופיעות.", landmarks: "הפנים חייבות להופיע במלואן בתוך התמונה/המסגרת.",
  resolution: "התקרבו או השתמשו בתמונה ברזולוציה גבוהה יותר (בלי הגדלה מלאכותית).", framing: "מרכזו את הפנים בתוך המסגרת המסומנת.",
  pose: "הביטו ישר למצלמה, ראש ישר.", exposure: "הפחיתו סנוור או הוסיפו אור: לא שרוף ולא חשוך.",
  asymmetry: "תאורה אחידה מלפנים, בלי צל על צד אחד.", uniformity: "הימנעו מאור מלמעלה או מלמטה שמחשיך חלק מהפנים.",
  noise: "התמונה רועשת מדי: יותר אור, או מצלמה/תמונה איכותית יותר.", sharpness: "התמונה לא חדה מספיק: החזיקו יציב והמתינו לפוקוס."
};
const GATE_IDS = ["faces","landmarks","resolution","framing","pose","exposure","asymmetry","uniformity","noise","sharpness"];

/* ---------------- indicators (6) ---------------- */
const IND = [
  {k:"spots", he:"אזורים כהים קטנים", en:"Small dark areas", unit:"מספר · % שטח",
   what:"בלובים קטנים (כ־1.5–12 מ\"מ) שכהים מסביבתם ביחס הלומיננס. בלוב שחופף לבלוב אדמדם מוצג רק כאדמדם. אינו סיווג פיגמנטציה."},
  {k:"blem", he:"כתמים אדמדמים קטנים", en:"Small reddish blobs", unit:"מספר",
   what:"בלובים קטנים שה־a* הנומינלי שלהם גבוה מסביבתם וכהים מעט. אינו ספירת אקנה או נגעים."},
  {k:"red", he:"פיזור אדמומיות יחסי", en:"Relative a* spread", unit:"% פיקסלים",
   what:"אחוז הפיקסלים באזורי המדידה שה־a* (מטושטש) שלהם גבוה ב־3.5 יחידות נומינליות ומעלה מממוצע אותן פנים."},
  {k:"tex", he:"אנרגיית תדר גבוה בתמונה", en:"High-frequency image energy", unit:"% ניגודיות RMS",
   what:"שונות בתדר גבוה של לוגריתם הלומיננס בלחיים ובמצח. מושפעת מאוד מרעש, עיבוד מצלמה ודחיסה."},
  {k:"lines", he:"קווים כהים מוארכים", en:"Elongated dark lines", unit:"לכל 1,000 פיקסלים",
   what:"פיקסלים של עמקים צרים ומוארכים בארבעת האזורים יחד. מושפע מכיוון התאורה, הבעה ושיער. אינו עומק או דירוג קמטים."},
  {k:"dark", he:"הפרש בהירות לחי–מתחת לעין", en:"Cheek vs under-eye luminance", unit:"% (יחס לומיננס)",
   what:"בכמה אחוזים אזור מתחת לעין כהה מהלחי העליונה באותו צד. נשלט בעיקר על ידי הצללה ומבנה ארובת העין, לא רק פיגמנט."},
];
const ZONES = [{k:"forehead", he:"מצח", dirs:["h"]}, {k:"glabella", he:"בין הגבות", dirs:["v"]},
               {k:"crows", he:"צידי העיניים", dirs:["h","d"]}, {k:"perioc", he:"מתחת לעיניים", dirs:["h","d"]}];
const REGION_HE = {forehead:"מצח", glabella:"בין הגבות", nose:"גב האף", cheekR:"לחי עליונה ימין", cheekL:"לחי עליונה שמאל",
                   underR:"מתחת לעין ימין", underL:"מתחת לעין שמאל", crowR:"צד עין ימין", crowL:"צד עין שמאל"};
const MEAS_REGIONS = ["forehead","glabella","nose","cheekR","cheekL"];

/* ---------------- landmark sets (MediaPipe FaceMesh indices) ---------------- */
const OVAL=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
const R_EYE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7];
const L_EYE=[263,466,388,387,386,385,384,398,362,382,381,380,374,373,390,249];
const R_BROW=[70,63,105,66,107,55,65,52,53,46];
const L_BROW=[300,293,334,296,336,285,295,282,283,276];
const LIPS=[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
const FOREHEAD=[54,103,67,109,10,338,297,332,284,300,293,334,296,336,9,107,66,105,63,70];
const GLABELLA=[107,9,336,285,168,55];
const R_LID=[33,7,163,144,145,153,154,155,133], L_LID=[263,249,390,373,374,380,381,382,362];
const USED_LANDMARKS = [...new Set([...OVAL,...R_EYE,...L_EYE,...R_BROW,...L_BROW,...LIPS,...FOREHEAD,...GLABELLA,...R_LID,...L_LID,1,4,129,358,168,152,10,50,280])];

/* ---------------- state ---------------- */
let fm = null, fmReady = false, fmResolve = null, detectChain = Promise.resolve(), inFlight = 0, maxInFlight = 0, hangNext = false, timeoutMs = DETECT_TIMEOUT_MS;
let stream = null, camLoop = 0, goodSince = 0, countdownT = 0, camOn = false, camSession = 0, liveBusy = false;
let result = null, sel = null, scanSeq = 0, lastGate = null, status = "idle";

/* ---------------- off-screen canvases (all cleared on reset/fail/stop) ---------------- */
const fcv = document.createElement("canvas"); const fctx = fcv.getContext("2d", {willReadFrequently:true});   // camera frame (visible crop)
const acv = document.createElement("canvas"); const actx = acv.getContext("2d", {willReadFrequently:true});   // aligned face
const mcv = document.createElement("canvas"); const mctx = mcv.getContext("2d", {willReadFrequently:true});   // masks
const tcv = document.createElement("canvas");                                                                  // overlay scratch
function shrink(c){ c.width = 1; c.height = 1; }
function clearCanvas(c){ const x = c.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height); }

/* ---------------- MediaPipe: local bundle, serialised requests, timeout ---------------- */
async function initMesh(){
  try{
    if (typeof window.FaceMesh !== "function") throw new Error("face_mesh.js missing");
    fm = new window.FaceMesh({locateFile: f => "mp/" + f + (/\.(data|binarypb)$/.test(f) ? ".wasm" : "")});
    fm.setOptions({maxNumFaces:2, refineLandmarks:false, minDetectionConfidence:0.5, minTrackingConfidence:0.5, selfieMode:false});
    fm.onResults(r => { const f = fmResolve; fmResolve = null; if (f) f(r); });
    await fm.initialize();
    fmReady = true;
    $("mpStatus").textContent = "מודל זיהוי הפנים המקומי מוכן.";
    $("bCam").disabled = false; $("bUp").disabled = false;
  }catch(e){ modelDown("מודל זיהוי הפנים לא נטען. בלי זיהוי פנים אמיתי לא מתבצעת סריקה."); }
}
function modelDown(msg){
  fmReady = false; $("mpStatus").textContent = msg; $("bCam").disabled = true; $("bUp").disabled = true;
}
function detect(img){
  const job = detectChain.then(() => runDetect(img));
  detectChain = job.catch(() => {});
  return job;
}
function runDetect(img){
  return new Promise(res => {
    if (!fmReady){ res({faces:0, lm:null, error:"MODEL"}); return; }
    inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
    let done = false;
    const finish = v => { if (done) return; done = true; clearTimeout(timer); inFlight--; res(v); };
    const timer = setTimeout(() => {
      // A late result could otherwise be delivered to the next request: the model is taken out of service.
      fmResolve = null; modelDown("זיהוי הפנים לא הגיב בזמן. טענו מחדש את הדף.");
      finish({faces:0, lm:null, error:"TIMEOUT"});
    }, timeoutMs);
    fmResolve = r => { const all = (r && r.multiFaceLandmarks) || []; finish({faces: all.length, lm: all[0] || null, error:null}); };
    if (hangNext){ hangNext = false; return; }   // test-only: simulate a model that never answers
    try { fm.reset(); fm.send({image: img}).catch(() => { fmResolve = null; finish({faces:0, lm:null, error:"SEND"}); }); }
    catch(e){ fmResolve = null; finish({faces:0, lm:null, error:"SEND"}); }
  });
}

/* ---------------- math helpers ---------------- */
const dist = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
const mid = (a,b) => [(a[0]+b[0])/2, (a[1]+b[1])/2];
const mix = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
const LIN = new Float32Array(256); for (let i=0;i<256;i++){ const v=i/255; LIN[i] = v<=.04045 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }
function median(arr, mask){ const v=[]; for (let i=0;i<arr.length;i++) if (mask[i]) v.push(arr[i]); if (!v.length) return NaN; v.sort((a,b)=>a-b); return v[v.length>>1]; }
function meanM(arr, mask){ let s=0,n=0; for (let i=0;i<arr.length;i++) if (mask[i]){ s+=arr[i]; n++; } return n ? s/n : NaN; }
const count = m => { let n=0; for (let i=0;i<m.length;i++) n += m[i]; return n; };
const AND = (...ms) => { const o = new Uint8Array(W*H); for (let i=0;i<o.length;i++){ let v=1; for (const m of ms) if (!m[i]) { v=0; break; } o[i]=v; } return o; };
const OR = (...ms) => { const o = new Uint8Array(W*H); for (let i=0;i<o.length;i++) for (const m of ms) if (m[i]) { o[i]=1; break; } return o; };
const NOT = m => { const o = new Uint8Array(W*H); for (let i=0;i<o.length;i++) o[i] = m[i] ? 0 : 1; return o; };

/* True separable Gaussian, mask-normalised (pixels outside the mask never bleed in). */
function kernel(sigma){ const r = Math.max(1, Math.ceil(3*sigma)), k = new Float32Array(2*r+1); let s=0; for (let i=-r;i<=r;i++){ k[i+r]=Math.exp(-i*i/(2*sigma*sigma)); s+=k[i+r]; } for (let i=0;i<k.length;i++) k[i]/=s; return {k, r}; }
function conv(src, sigma){
  const {k, r} = kernel(sigma), tmp = new Float32Array(W*H), out = new Float32Array(W*H);
  for (let y=0;y<H;y++){ const o=y*W; for (let x=0;x<W;x++){ let s=0; for (let j=-r;j<=r;j++){ const xx = x+j < 0 ? 0 : x+j >= W ? W-1 : x+j; s += src[o+xx]*k[j+r]; } tmp[o+x]=s; } }
  for (let y=0;y<H;y++){ for (let x=0;x<W;x++){ let s=0; for (let j=-r;j<=r;j++){ const yy = y+j < 0 ? 0 : y+j >= H ? H-1 : y+j; s += tmp[yy*W+x]*k[j+r]; } out[y*W+x]=s; } }
  return out;
}
function mblur(src, mask, sigma){
  const sm = new Float32Array(W*H), mm = new Float32Array(W*H);
  for (let i=0;i<sm.length;i++){ sm[i] = mask[i] ? src[i] : 0; mm[i] = mask[i]; }
  const a = conv(sm, sigma), b = conv(mm, sigma);
  for (let i=0;i<a.length;i++) a[i] = b[i] > 1e-3 ? a[i]/b[i] : src[i];
  return a;
}
function erode(mask, sigma){ const b = conv(Float32Array.from(mask), sigma); const o = new Uint8Array(W*H); for (let i=0;i<o.length;i++) o[i] = b[i] > .97 ? 1 : 0; return o; }
function components(bin, minA, maxA){
  const lab = new Int32Array(W*H), out = [], st = []; let id = 0;
  for (let i=0;i<bin.length;i++){
    if (!bin[i] || lab[i]) continue;
    id++; st.push(i); lab[i] = id; const pix = [];
    while (st.length){ const p = st.pop(); pix.push(p); const x = p%W, y = (p/W)|0;
      if (x>0&&bin[p-1]&&!lab[p-1]){lab[p-1]=id;st.push(p-1);} if (x<W-1&&bin[p+1]&&!lab[p+1]){lab[p+1]=id;st.push(p+1);}
      if (y>0&&bin[p-W]&&!lab[p-W]){lab[p-W]=id;st.push(p-W);} if (y<H-1&&bin[p+W]&&!lab[p+W]){lab[p+W]=id;st.push(p+W);} }
    if (pix.length < minA || pix.length > maxA) continue;
    let sx=0, sy=0; for (const p of pix){ sx += p%W; sy += (p/W)|0; } const cx = sx/pix.length, cy = sy/pix.length;
    let xx=0, yy=0, xy=0; for (const p of pix){ const dx = p%W-cx, dy = ((p/W)|0)-cy; xx+=dx*dx; yy+=dy*dy; xy+=dx*dy; }
    xx/=pix.length; yy/=pix.length; xy/=pix.length;
    const tr = xx+yy, det = xx*yy-xy*xy, disc = Math.sqrt(Math.max(0, tr*tr/4-det));
    // single-pixel blobs have no defined elongation: treated as maximally elongated (never pass blob filters)
    const elong = tr === 0 ? Infinity : Math.sqrt((tr/2+disc)/Math.max(.05, tr/2-disc));
    out.push({pix, n:pix.length, cx, cy, elong, r:Math.sqrt(tr/2+disc)*2});
  }
  return out;
}

/* masks */
function readMask(){ const d = mctx.getImageData(0,0,W,H).data, m = new Uint8Array(W*H); for (let i=0;i<m.length;i++) m[i] = d[i*4+3] > 127 ? 1 : 0; return m; }
function ensureMaskCanvas(){ if (mcv.width !== W || mcv.height !== H){ mcv.width = W; mcv.height = H; } }
function polyMask(polys, dilate){
  ensureMaskCanvas(); mctx.clearRect(0,0,W,H); mctx.fillStyle = mctx.strokeStyle = "#fff";
  for (const pts of polys){ if (!pts || pts.length < 3) continue; mctx.beginPath(); pts.forEach(([x,y],j) => j ? mctx.lineTo(x,y) : mctx.moveTo(x,y)); mctx.closePath(); mctx.fill();
    if (dilate){ mctx.lineWidth = dilate*2; mctx.lineJoin = "round"; mctx.stroke(); } }
  return readMask();
}

/* ---------------- frame preparation ---------------- */
// Camera: crop each frame to exactly the region visible in the 3:4 preview (object-fit: cover).
function grabFrame(){
  const v = $("video"), vw = v.videoWidth, vh = v.videoHeight;
  let sw = vw, sh = vh, sx = 0, sy = 0;
  if (vw / vh > STAGE_ASPECT){ sw = Math.round(vh * STAGE_ASPECT); sx = Math.round((vw - sw) / 2); }
  else { sh = Math.round(vw / STAGE_ASPECT); sy = Math.round((vh - sh) / 2); }
  fcv.width = sw; fcv.height = sh; fctx.drawImage(v, sx, sy, sw, sh, 0, 0, sw, sh);
  return fcv;
}

/* Geometry gate -> alignment (downscale only) -> anatomical regions -> photometric gate.
 * Used unchanged for live frames, the captured frame and uploads. */
function evaluate(src, det){
  const sw = src.width, sh = src.height, checks = [];
  const add = (id, ok, value) => checks.push({id, he: GATE_HE[id], ok: !!ok, value: String(value)});
  const out = () => { for (const id of GATE_IDS) if (!checks.find(c => c.id === id)) checks.push({id, he: GATE_HE[id], ok:false, value:"לא נבדק"}); return {gate:{pass: checks.every(c => c.ok), checks}}; };
  add("faces", det.faces === 1, det.faces);
  if (!det.lm || det.faces !== 1) return out();
  const S = det.lm.map(p => [p.x * sw, p.y * sh]);
  const finite = S.length >= 468 && S.every(([x,y]) => Number.isFinite(x) && Number.isFinite(y));
  const inside = finite ? USED_LANDMARKS.filter(i => S[i][0] >= 0 && S[i][1] >= 0 && S[i][0] < sw && S[i][1] < sh).length : 0;
  add("landmarks", finite && inside === USED_LANDMARKS.length, `${inside}/${USED_LANDMARKS.length}`);
  if (!finite || inside !== USED_LANDMARKS.length) return out();
  const fw = dist(S[234], S[454]);
  add("resolution", fw >= GATE.minFacePx, Math.round(fw) + "px");
  const cx = (S[234][0] + S[454][0]) / 2 / sw, cy = (S[10][1] + S[152][1]) / 2 / sh, frac = fw / sw;
  add("framing", frac >= GATE.faceFrac[0] && frac <= GATE.faceFrac[1] && Math.abs(cx-.5) <= GATE.center[0] && Math.abs(cy-.5) <= GATE.center[1],
      `${Math.round(frac*100)}% · Δ${Math.round(Math.abs(cx-.5)*100)}/${Math.round(Math.abs(cy-.5)*100)}`);
  const yaw = (S[1][0] - S[234][0]) / ((S[454][0] - S[234][0]) || 1) - .5;
  const roll = Math.atan2(S[263][1] - S[33][1], S[263][0] - S[33][0]) * 180 / Math.PI;
  const pitch = (S[1][1] - S[168][1]) / ((S[152][1] - S[168][1]) || 1);
  add("pose", Math.abs(yaw) <= GATE.yaw && Math.abs(roll) <= GATE.roll && pitch >= GATE.pitch[0] && pitch <= GATE.pitch[1],
      `roll ${Math.round(roll)}° · yaw ${yaw.toFixed(2)} · pitch ${pitch.toFixed(2)}`);
  if (!checks.every(c => c.ok)) return out();   // never align or measure a geometrically invalid face

  const A = align(src, S);
  const R = buildRegions(A);
  const ph = photometric(A, R);
  add("exposure", ph.exposureOk, ph.exposureVal);
  add("asymmetry", ph.sideRatio >= GATE.sideRatio, ph.sideRatio.toFixed(2));
  add("uniformity", ph.vert <= GATE.vertLog, ph.vert.toFixed(2));
  add("noise", ph.noise <= GATE.noise, ph.noise.toFixed(2));
  add("sharpness", ph.sharp >= GATE.sharpness, ph.sharp.toFixed(3));
  const res = out(); res.A = A; res.R = R; res.ph = ph; return res;
}

function align(src, pts){
  const re = mid(pts[33], pts[133]), le = mid(pts[263], pts[362]);
  const roll = Math.atan2(le[1]-re[1], le[0]-re[0]);
  const s = Math.min(1, FACE_W / dist(pts[234], pts[454]));   // downscale only; never upsample
  const c = mid(mid(pts[234], pts[454]), mid(pts[10], pts[152]));
  const cos = Math.cos(-roll)*s, sin = Math.sin(-roll)*s, tx = W/2, ty = H*0.53;
  const T = ([x,y]) => [cos*(x-c[0]) - sin*(y-c[1]) + tx, sin*(x-c[0]) + cos*(y-c[1]) + ty];
  const m = [cos, sin, -sin, cos, tx - cos*c[0] + sin*c[1], ty - sin*c[0] - cos*c[1]];
  acv.width = W; acv.height = H;
  actx.setTransform(1,0,0,1,0,0); actx.fillStyle = "#000"; actx.fillRect(0,0,W,H);
  actx.setTransform(...m); actx.imageSmoothingEnabled = true; actx.imageSmoothingQuality = "high"; actx.drawImage(src, 0, 0); actx.setTransform(1,0,0,1,0,0);
  const img = actx.getImageData(0,0,W,H);
  // pixels that come from the source image (not the black border)
  ensureMaskCanvas(); mctx.setTransform(1,0,0,1,0,0); mctx.clearRect(0,0,W,H); mctx.setTransform(...m); mctx.fillStyle = "#fff"; mctx.fillRect(1, 1, src.width-2, src.height-2); mctx.setTransform(1,0,0,1,0,0);
  const inImage = readMask();
  const n = W*H, Y = new Float32Array(n), ell = new Float32Array(n), A = new Float32Array(n), luma = new Float32Array(n), clip = new Uint8Array(n), d = img.data;
  const f = t => t > .008856 ? Math.cbrt(t) : 7.787*t + 16/116;
  for (let i=0;i<n;i++){
    const r = d[i*4], g = d[i*4+1], b = d[i*4+2], Rl = LIN[r], Gl = LIN[g], Bl = LIN[b];
    const y = Rl*.2126 + Gl*.7152 + Bl*.0722; Y[i] = y; ell[i] = Math.log(y + 0.005);
    A[i] = 500*(f((Rl*.4124+Gl*.3576+Bl*.1805)/.95047) - f(y));
    luma[i] = .299*r + .587*g + .114*b; clip[i] = (r >= 250 || g >= 250 || b >= 250) ? 1 : 0;
  }
  return {img, P: pts.map(T), inImage, Y, ell, A, luma, clip};
}

function buildRegions({P, inImage}){
  const pp = idx => idx.map(i => P[i]);
  const eyeW = (dist(P[33],P[133]) + dist(P[263],P[362]))/2, fw = dist(P[234],P[454]);
  const oval = polyMask([pp(OVAL)]);
  const excl = OR(polyMask([pp(R_EYE), pp(L_EYE)], eyeW*.15), polyMask([pp(R_BROW), pp(L_BROW)], eyeW*.10), polyMask([pp(LIPS)], eyeW*.05));
  const band = (lid, o1, o2) => pp(lid).map(([x,y]) => [x, y+eyeW*o1]).concat(pp(lid).map(([x,y]) => [x, y+eyeW*o2]).reverse());
  const crow = side => { const c = P[side ? 263 : 33], dir = side ? 1 : -1;
    return [[c[0]+dir*eyeW*.08, c[1]-eyeW*.45],[c[0]+dir*eyeW*.8, c[1]-eyeW*.45],[c[0]+dir*eyeW*.8, c[1]+eyeW*.6],[c[0]+dir*eyeW*.08, c[1]+eyeW*.6]]; };
  const cheek = side => {   // upper cheek: below the under-eye band, above the alar level, lateral to the nose
    const lid = side ? L_LID : R_LID, top = Math.max(...lid.map(i => P[i][1])) + eyeW*.65, ala = P[side ? 358 : 129], edge = P[side ? 454 : 234];
    const bottom = ala[1], inner = ala[0] + (side ? 1 : -1) * fw*.03, outer = edge[0] + (ala[0] - edge[0]) * .12;
    return bottom - top < 4 ? null : [[inner, top],[outer, top],[outer, bottom],[inner, bottom]];
  };
  const nose = [P[168], mix(P[129], P[168], .35), P[4], mix(P[358], P[168], .35)];   // dorsum to tip, excludes alae and nostrils
  const defs = {forehead:[pp(FOREHEAD)], glabella:[pp(GLABELLA)], nose:[nose], cheekR:[cheek(0)], cheekL:[cheek(1)],
                underR:[band(R_LID,.14,.6)], underL:[band(L_LID,.14,.6)], crowR:[crow(0)], crowL:[crow(1)]};
  const regions = {}, polys = {};
  const notExcl = NOT(excl), valid = AND(oval, inImage, notExcl);
  for (const [name, pl] of Object.entries(defs)){
    const anat = AND(polyMask(pl), notExcl);
    const usable = AND(anat, valid);
    const area = count(anat), px = count(usable);
    regions[name] = {anat, usable, area, px, coverage: area ? px/area : 0};
    polys[name] = pl.filter(Boolean);
  }
  return {regions, polys, oval, excl, valid, eyeW, fw, P};
}

/* Immerkær fast noise estimate on 8-bit luma inside a mask. */
function noiseSigma(luma, mask){
  let s = 0, n = 0;
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++){ const i = y*W+x; if (!mask[i] || !mask[i-1] || !mask[i+1] || !mask[i-W] || !mask[i+W]) continue;
    const v = luma[i-W-1] - 2*luma[i-W] + luma[i-W+1] - 2*luma[i-1] + 4*luma[i] - 2*luma[i+1] + luma[i+W-1] - 2*luma[i+W] + luma[i+W+1];
    s += Math.abs(v); n++; }
  return n ? Math.sqrt(Math.PI/2) * s / (6*n) : Infinity;
}
function photometric(Aimg, R){
  const {Y, luma, clip} = Aimg, rg = R.regions;
  const meas = OR(...MEAS_REGIONS.map(k => rg[k].usable));
  const faceAll = R.valid;
  const clipF = count(AND(clip, faceAll)) / Math.max(1, count(faceAll));
  let dark = 0, nm = 0; for (let i=0;i<Y.length;i++) if (meas[i]){ nm++; if (Y[i] < 0.005) dark++; }
  const darkF = dark / Math.max(1, nm), medY = median(Y, meas);
  const exposureOk = clipF <= GATE.clipFrac && darkF <= GATE.darkFrac && medY >= GATE.minMedianY;
  const sideR = OR(rg.cheekR.usable, rg.underR.usable, rg.crowR.usable), sideL = OR(rg.cheekL.usable, rg.underL.usable, rg.crowL.usable);
  const yr = median(Y, sideR), yl = median(Y, sideL);
  const sideRatio = Number.isFinite(yr) && Number.isFinite(yl) ? Math.min(yr, yl) / Math.max(yr, yl) : 0;
  const yf = median(Y, rg.forehead.usable), yc = median(Y, OR(rg.cheekR.usable, rg.cheekL.usable));
  const vert = Number.isFinite(yf) && Number.isFinite(yc) ? Math.abs(Math.log(yf / yc)) : Infinity;
  const skinCore = OR(rg.forehead.usable, rg.cheekR.usable, rg.cheekL.usable);
  const noise = noiseSigma(luma, skinCore);
  // Sharpness = gradient energy of the luma minus its σ=2 smoothed version, relative to the smoothed version's
  // gradient energy (unitless; blur lowers it, independent of overall contrast). Noise is gated separately.
  const sm = conv(luma, 2.0); let gf = 0, gc = 0;
  const grad = (a, i) => { const gx = a[i-W+1] + 2*a[i+1] + a[i+W+1] - a[i-W-1] - 2*a[i-1] - a[i+W-1];
    const gy = a[i+W-1] + 2*a[i+W] + a[i+W+1] - a[i-W-1] - 2*a[i-W] - a[i-W+1]; return gx*gx + gy*gy; };
  const hp = new Float32Array(W*H); for (let i=0;i<hp.length;i++) hp[i] = luma[i] - sm[i];
  for (let y=1;y<H-1;y++) for (let x=1;x<W-1;x++){ const i = y*W+x; if (!meas[i]) continue; gf += grad(hp, i); gc += grad(sm, i); }
  const sharp = gc > 0 ? gf / gc : 0;
  return {exposureOk, exposureVal: `שרוף ${(clipF*100).toFixed(1)}% · חשוך ${(darkF*100).toFixed(1)}% · Y ${Number.isFinite(medY) ? medY.toFixed(3) : "–"}`,
          clipF, darkF, medY, sideRatio, vert, noise, sharp};
}

/* ---------------- analysis (only after every gate check passed) ---------------- */
function analyze(Aimg, R){
  const {ell, A, Y} = Aimg, rg = R.regions;
  // region validity: coverage, size, hair-like filament density (region-level abstention, never pixel deletion)
  const fine = mblur(ell, R.valid, 0.8);
  const valley = (arr, i, dir, k) => { const x = i%W, y = (i/W)|0; if (x<k||y<k||x>=W-k||y>=H-k) return 0; const c = arr[i];
    if (dir === "h") return (arr[i-k*W]+arr[i+k*W])/2 - c; if (dir === "v") return (arr[i-k]+arr[i+k])/2 - c;
    return Math.max((arr[i-k*W-k]+arr[i+k*W+k])/2 - c, (arr[i-k*W+k]+arr[i+k*W-k])/2 - c); };
  const cov = {};
  for (const [name, r] of Object.entries(rg)){
    let hair = 0; for (let i=0;i<r.usable.length;i++) if (r.usable[i] && Math.max(valley(fine,i,"h",2), valley(fine,i,"v",2), valley(fine,i,"d",1)) > REGION.hairResp) hair++;
    const hairFrac = r.px ? hair / r.px : 0;
    const reason = r.px < REGION.minPx || r.coverage < REGION.minCoverage ? (r.area === 0 ? "אזור לא קיים בגאומטריה" : "כיסוי נמוך (מחוץ לתמונה או לפנים)")
                 : hairFrac > (PERIOCULAR.has(name) ? REGION.maxHairPeriocular : REGION.maxHairFlat) ? "צפיפות קווים דקים גבוהה (שיער/זקן משוער)" : null;
    cov[name] = {coverage: r.coverage, px: r.px, hairFrac, valid: !reason, reason};
  }
  const V = name => cov[name].valid ? rg[name].usable : new Uint8Array(W*H);
  const measNames = MEAS_REGIONS.filter(k => cov[k].valid);
  const meas = OR(...MEAS_REGIONS.map(V)), measE = erode(meas, 1.5), allValid = OR(...Object.keys(rg).map(V));
  const ind = {}, put = (k, valid, value, display, reason, extra={}) => { ind[k] = {k, valid, value: valid ? value : null, display: valid ? display : "לא זמין", reason: valid ? null : reason, ...extra}; };
  const cheekOk = cov.cheekR.valid || cov.cheekL.valid, enoughMeas = measNames.length >= 3 && cheekOk;
  const NOREG = "פחות מ־3 אזורי מדידה תקפים (כולל לחי אחת לפחות)";

  const l1 = mblur(ell, allValid, 1.0), l2 = mblur(ell, allValid, 2.0), l5 = mblur(ell, allValid, 5.0);
  const a12 = mblur(A, allValid, 1.2), a6 = mblur(A, allValid, 6.0);
  // spots & reddish blobs
  const dk = new Uint8Array(W*H), rb = new Uint8Array(W*H);
  for (let i=0;i<dk.length;i++){ if (!measE[i]) continue; const dl = l5[i]-l1[i], da = a12[i]-a6[i]; if (dl > MET.spot) dk[i]=1; if (da > MET.blemA && dl > MET.blemDark) rb[i]=1; }
  const blems = components(rb, 9, 400).filter(c => c.elong < 2.6);
  const spots = components(dk, 7, 500).filter(c => c.elong < 2.6 && !blems.some(b => Math.hypot(b.cx-c.cx, b.cy-c.cy) < Math.max(b.r, 4)));
  const measN = count(measE);
  put("spots", enoughMeas, spots.length, `${spots.length} · ${(spots.reduce((s,c)=>s+c.n,0)/Math.max(1,measN)*100).toFixed(2)}%`, NOREG, {overlay: spots});
  put("blem", enoughMeas, blems.length, `${blems.length}`, NOREG, {overlay: blems});
  const aMean = meanM(A, measE); let redPx = 0; const redMap = new Float32Array(W*H);
  for (let i=0;i<A.length;i++) if (measE[i]){ const r = a6[i]-aMean; redMap[i] = r; if (r > MET.red) redPx++; }
  put("red", enoughMeas, redPx/Math.max(1,measN)*100, `${(redPx/Math.max(1,measN)*100).toFixed(1)}%`, NOREG, {overlay: redMap});
  // texture: RMS of ln-luminance band-pass on cheeks + forehead
  const texM = AND(OR(V("forehead"), V("cheekR"), V("cheekL")), measE); const texN = count(texM);
  const lf = mblur(ell, allValid, 0.8); let tS = 0; for (let i=0;i<ell.length;i++) if (texM[i]){ const h = lf[i]-l2[i]; tS += h*h; }
  const tex = Math.sqrt(tS/Math.max(1,texN)) * 100;
  put("tex", texN >= REGION.minPx && (cov.forehead.valid || cheekOk), tex, `${tex.toFixed(2)}%`, "אין מצח או לחי תקפים", {overlay: {lf, l2, texM}});
  // elongated dark lines per zone (fixed zone set)
  const zoneMask = {forehead: V("forehead"), glabella: V("glabella"), crows: OR(V("crowR"), V("crowL")), perioc: OR(V("underR"), V("underL"))};
  const zoneValid = {forehead: cov.forehead.valid, glabella: cov.glabella.valid, crows: cov.crowR.valid || cov.crowL.valid, perioc: cov.underR.valid || cov.underL.valid};
  const lineVal = new Float32Array(W*H), zones = {}; let zPx = 0, zN = 0;
  for (const z of ZONES){
    if (!zoneValid[z.k]){ zones[z.k] = {valid:false, value:null, display:"לא זמין", reason:"האזור לא תקף (ראו כיסוי אזורים)"}; continue; }
    const mask = zoneMask[z.k], n = count(mask), bin = new Uint8Array(W*H), val = new Float32Array(W*H);
    for (let i=0;i<bin.length;i++){ if (!mask[i]) continue; let v = 0; for (const d of z.dirs) v = Math.max(v, valley(l1, i, d, d === "d" ? 2 : 3)); val[i] = v; if (v > MET.line) bin[i] = 1; }
    let px = 0; for (const c of components(bin, 6, 5000).filter(c => c.elong > 2.3)) for (const p of c.pix){ px++; lineVal[p] = Math.max(lineVal[p], val[p]); }
    zones[z.k] = {valid:true, value: px/n*1000, display:`${(px/n*1000).toFixed(1)}/1k`, reason:null}; zPx += px; zN += n;
  }
  const allZones = ZONES.every(z => zones[z.k].valid);
  put("lines", allZones, zPx/Math.max(1,zN)*1000, `${(zPx/Math.max(1,zN)*1000).toFixed(1)}/1k`, "נדרשים כל ארבעת האזורים תקפים", {overlay: lineVal});
  // cheek vs under-eye luminance, per side, then averaged over valid sides
  const sides = [["underR","cheekR"],["underL","cheekL"]].filter(([u,c]) => cov[u].valid && cov[c].valid)
    .map(([u,c]) => 100 * (1 - median(Y, rg[u].usable) / median(Y, rg[c].usable)));
  put("dark", sides.length > 0, sides.reduce((a,b)=>a+b,0)/Math.max(1,sides.length), `${(sides.reduce((a,b)=>a+b,0)/Math.max(1,sides.length)).toFixed(1)}%`, "אין צד עם לחי ואזור מתחת לעין תקפים", {sides: sides.length});
  return {ind, zones, cov, layers:{lineVal, zoneMask}};
}

/* ---------------- UI state ---------------- */
function resetAll(){
  scanSeq++; result = null; sel = null; lastGate = null;
  for (const id of ["photo","ov","guide"]) clearCanvas($(id));
  for (const c of [fcv, acv, mcv, tcv]) shrink(c);
  for (const id of ["chips","rows","zones","qlist","errList","covBody"]) $(id).replaceChildren();
  $("detail").textContent = ""; $("badge").textContent = "אזורי מדידה";
  for (const id of ["rowsEmpty","zonesEmpty","qEmpty","covEmpty"]) $(id).hidden = false;
  $("kFace").textContent = "–"; $("kGate").textContent = "–"; $("kCount").textContent = "–";
  setState("אין תוצאה", "");
}
function setState(text, cls){ const s = $("state"); s.textContent = text; s.className = "state" + (cls ? " " + cls : ""); }
function show(layer){
  for (const id of ["L-intro","L-cam","L-scan","L-res","L-err"]) $(id).hidden = id !== layer;
  $("video").hidden = layer !== "L-cam"; $("guide").hidden = layer !== "L-cam";
  $("photo").hidden = $("ov").hidden = !(layer === "L-scan" || layer === "L-res");
}
function fail(title, message, gate){
  scanSeq++; result = null; status = "failed";
  clearCanvas($("photo")); clearCanvas($("ov"));
  for (const c of [fcv, acv, mcv, tcv]) shrink(c);
  for (const id of ["chips","rows","zones","covBody"]) $(id).replaceChildren();
  for (const id of ["rowsEmpty","zonesEmpty","covEmpty"]) $(id).hidden = false;
  $("kCount").textContent = "–";
  $("errT").textContent = title; $("errM").textContent = message;
  const list = $("errList"); list.replaceChildren();
  if (gate){ lastGate = gate; for (const c of gate.checks.filter(c => !c.ok && c.value !== "לא נבדק")){ const li = document.createElement("li"); li.textContent = `${c.he}: ${GATE_FIX[c.id]}`; list.appendChild(li); } renderGate(gate); }
  setState("לא נותח", "bad");
  show("L-err");
}

/* ---------------- camera ---------------- */
async function startCam(){
  stopCam(); resetAll();
  status = "camera";
  const session = ++camSession;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ fail("המצלמה לא זמינה","הדפדפן לא מאפשר גישה למצלמה. אפשר להעלות תמונה."); return; }
  let s;
  try { s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user", width:{ideal:1280}, height:{ideal:960}}, audio:false}); }
  catch(e){ if (session === camSession) fail("אין גישה למצלמה","הגישה למצלמה נדחתה או שאין מצלמה. אפשר לאשר הרשאה בהגדרות הדפדפן, או להעלות תמונה."); return; }
  if (session !== camSession){ s.getTracks().forEach(t => t.stop()); return; }
  stream = s;
  const v = $("video"); v.srcObject = stream;
  try { await v.play(); } catch(e){ if (session === camSession){ stopCam(); fail("המצלמה לא הופעלה","לא ניתן להציג את המצלמה. נסו שוב או העלו תמונה."); } return; }
  if (session !== camSession) return;
  camOn = true; goodSince = 0; countdownT = 0;
  show("L-cam");
  camTick(session);
}
function stopCam(){
  camOn = false; camSession++; clearTimeout(camLoop);
  if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
  const v = $("video"); v.srcObject = null;
  $("count").hidden = true; shrink(fcv);
}
async function camTick(session){
  if (!camOn || session !== camSession) return;
  const v = $("video");
  if (!liveBusy && v.readyState >= 2 && v.videoWidth){
    liveBusy = true;
    const frame = grabFrame();
    const det = await detect(frame);
    if (camOn && session === camSession){
      if (det.error === "TIMEOUT"){ liveBusy = false; stopCam(); fail("זיהוי הפנים לא הגיב","המודל המקומי לא הגיב בזמן. טענו מחדש את הדף."); return; }
      const ev = evaluate(frame, det);
      lastGate = ev.gate; livePills(ev.gate, session);
    }
    liveBusy = false;
  }
  if (!camOn || session !== camSession) return;
  drawGuide();
  camLoop = setTimeout(() => camTick(session), 180);
}
function livePills(gate, session){
  const ok = ids => ids.every(id => gate.checks.find(c => c.id === id)?.ok);
  const set = (id, good) => { const el = $(id); el.classList.toggle("ok", good); el.querySelector("b").textContent = good ? "תקין" : "לא תקין"; };
  set("ckPos", ok(["faces","landmarks","resolution","framing"])); set("ckPose", ok(["pose"]));
  set("ckLight", ok(["exposure","asymmetry","uniformity"])); set("ckImg", ok(["noise","sharpness"]));
  const firstFail = gate.checks.find(c => !c.ok);
  $("camMsg").textContent = firstFail ? (firstFail.id === "faces" && firstFail.value === "0" ? "לא זוהו פנים · הכניסו את הפנים למסגרת" : GATE_FIX[firstFail.id]) : "אל תזוזו…";
  const now = performance.now();
  if (gate.pass){ if (!goodSince) goodSince = now; } else { goodSince = 0; countdownT = 0; $("count").hidden = true; }
  if (gate.pass && now - goodSince > 500){
    if (!countdownT) countdownT = now;
    const left = 3 - Math.floor((now - countdownT) / 1000);
    $("count").hidden = false; $("countN").textContent = Math.max(1, left);
    if (left <= 0 && session === camSession) capture(session);
  }
}
/* Guide drawn from the gate limits: inner/outer face-width bounds and the allowed centre region. */
function drawGuide(){
  const c = $("guide").getContext("2d");
  c.clearRect(0,0,W,H); c.fillStyle = "rgba(0,0,0,.30)"; c.fillRect(0,0,W,H);
  const target = (GATE.faceFrac[0] + GATE.faceFrac[1]) / 2, ry = r => r * 1.32;
  c.globalCompositeOperation = "destination-out"; c.beginPath(); c.ellipse(W/2, H/2, W*GATE.faceFrac[1]/2, ry(W*GATE.faceFrac[1]/2), 0, 0, Math.PI*2); c.fill();
  c.globalCompositeOperation = "source-over";
  const good = lastGate && lastGate.pass;
  c.strokeStyle = good ? "#8FD19E" : "rgba(255,255,255,.9)"; c.lineWidth = 3;
  c.beginPath(); c.ellipse(W/2, H/2, W*target/2, ry(W*target/2), 0, 0, Math.PI*2); c.stroke();
  c.setLineDash([6,6]); c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,.75)";
  for (const f of GATE.faceFrac){ c.beginPath(); c.ellipse(W/2, H/2, W*f/2, ry(W*f/2), 0, 0, Math.PI*2); c.stroke(); }
  c.strokeRect(W*(.5-GATE.center[0]), H*(.5-GATE.center[1]), W*GATE.center[0]*2, H*GATE.center[1]*2);
  c.setLineDash([]);
}
async function capture(session){
  if (session !== camSession) return;
  const frame = grabFrame();
  const cv = document.createElement("canvas"); cv.width = frame.width; cv.height = frame.height; cv.getContext("2d").drawImage(frame, 0, 0);
  stopCam();
  await runAnalysis(cv, "camera");
  shrink(cv);
}

/* ---------------- upload ---------------- */
const onFile = e => {
  const f = e.target.files && e.target.files[0]; e.target.value = "";
  if (!f) return;
  stopCam(); resetAll(); status = "loading";
  const url = URL.createObjectURL(f), img = new Image(), seq = ++scanSeq;
  img.onload = async () => {
    img.onload = img.onerror = null;
    if (seq !== scanSeq){ URL.revokeObjectURL(url); return; }
    const cv = document.createElement("canvas"), cx = cv.getContext("2d");
    const s = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high"; cx.drawImage(img, 0, 0, cv.width, cv.height);
    URL.revokeObjectURL(url);
    await runAnalysis(cv, "upload");
    shrink(cv);
  };
  img.onerror = () => { img.onload = img.onerror = null; URL.revokeObjectURL(url); if (seq === scanSeq) fail("הקובץ לא נפתח","בחרו קובץ תמונה JPG, PNG או WEBP."); };
  img.src = url;
};
$("file").addEventListener("change", onFile);
$("fileCam").addEventListener("change", onFile);

/* ---------------- analysis pipeline ---------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function runAnalysis(src, source){
  const seq = ++scanSeq; status = "analyzing";
  show("L-scan"); setProg(10, "מאתר פנים (MediaPipe)…");
  const det = await detect(src);
  if (seq !== scanSeq) return;
  if (det.error === "TIMEOUT"){ fail("זיהוי הפנים לא הגיב","המודל המקומי לא הגיב בזמן. טענו מחדש את הדף."); return; }
  setProg(35, "בודק איכות צילום…"); await sleep(0);
  if (seq !== scanSeq) return;
  const ev = evaluate(src, det);
  if (seq !== scanSeq) return;
  if (!det.lm || det.faces === 0){ fail("לא זוהו פנים","לא נמצאו פנים בתמונה. לא מוצגות תוצאות.", ev.gate); return; }
  if (!ev.gate.pass){ fail("הצילום לא עבר את בדיקת האיכות","לא מוצגות תוצאות עבור צילום שלא עבר את כל הבדיקות:", ev.gate); return; }
  lastGate = ev.gate;
  $("photo").getContext("2d").putImageData(ev.A.img, 0, 0);
  setProg(65, "מודד מאפיינים באזורים אנטומיים…"); await sleep(20);
  if (seq !== scanSeq) return;
  const r = analyze(ev.A, ev.R);
  if (seq !== scanSeq) return;
  r.source = source; r.gate = ev.gate; r.seq = seq; r.R = ev.R;
  result = r; shrink(acv); shrink(mcv);
  setProg(100, "מוכן"); await sleep(100);
  if (seq !== scanSeq || result !== r) return;
  status = "result";
  renderResult();
}
function setProg(p, m){ $("prog").style.width = p + "%"; if (m) $("scanMsg").textContent = m; }

/* ---------------- rendering ---------------- */
function renderGate(gate){
  const q = $("qlist"); q.replaceChildren(); $("qEmpty").hidden = true;
  for (const c of gate.checks){ const li = document.createElement("li"); li.className = c.ok ? "ok" : "fail"; li.dataset.check = c.id;
    const b = document.createElement("b"); b.textContent = c.he; const s = document.createElement("span"); s.textContent = c.value; s.dir = "ltr"; li.append(b, s); q.appendChild(li); }
  $("kGate").textContent = `${gate.checks.filter(c => c.ok).length}/${gate.checks.length}`;
  const f = gate.checks[0]; $("kFace").textContent = f.ok ? (gate.checks[1].ok ? "468 נקודות" : "פנים אחת") : `פנים: ${f.value}`;
}
function renderResult(){
  const Rz = result; if (!Rz) return;
  show("L-res"); renderGate(Rz.gate);
  $("kCount").textContent = `${IND.filter(m => Rz.ind[m.k].valid).length}/${IND.length}`;
  setState(Rz.source === "camera" ? "נותח מהמצלמה" : "נותח מתמונה", "live");
  const covBody = $("covBody"); $("covEmpty").hidden = true;
  for (const [name, c] of Object.entries(Rz.cov)){
    const tr = document.createElement("tr"); tr.className = c.valid ? "" : "abstain"; tr.dataset.region = name;
    const td = t => { const x = document.createElement("td"); x.textContent = t; return x; };
    const pct = td(`${Math.round(c.coverage*100)}%`); pct.className = "num"; pct.dir = "ltr";
    tr.append(td(REGION_HE[name]), pct, td(c.valid ? `תקף · קווים דקים ${Math.round(c.hairFrac*100)}%` : `נמנע · ${c.reason}`)); covBody.appendChild(tr);
  }
  const chips = $("chips"), rows = $("rows"), zones = $("zones");
  $("rowsEmpty").hidden = true; $("zonesEmpty").hidden = true;
  const chip = (key, label, value) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.k = key;
    const c = document.createElement("span"); c.className = "c"; c.textContent = value; c.dir = "ltr"; const e = document.createElement("em"); e.textContent = label; b.append(c, e);
    b.addEventListener("click", () => select(key)); chips.appendChild(b); };
  chip("map", "אזורי מדידה", "◎");
  const SHORT = {spots:"כהים קטנים", blem:"אדמדמים", red:"פיזור a*", tex:"תדר גבוה", lines:"קווים", dark:"לחי/עין"};
  for (const m of IND){
    const it = Rz.ind[m.k];
    chip(m.k, SHORT[m.k], it.valid ? it.display.split(" · ")[0] : "—");
    const b = document.createElement("button"); b.type = "button"; b.className = "row" + (it.valid ? "" : " na"); b.dataset.k = m.k;
    const n = document.createElement("span"); n.className = "n"; n.textContent = m.he; const sm = document.createElement("small"); sm.textContent = m.en; n.appendChild(sm);
    const v = document.createElement("span"); v.className = "v"; v.textContent = it.display; v.dir = "ltr";
    const d = document.createElement("span"); d.className = "d"; d.textContent = it.valid ? `${m.what} · יחידה: ${m.unit}` : `לא זמין · ${it.reason}`;
    const x = document.createElement("span"); x.className = "exp"; x.textContent = EXP;
    b.append(n, v, d, x); b.addEventListener("click", () => select(m.k)); rows.appendChild(b);
  }
  for (const z of ZONES){
    const it = Rz.zones[z.k];
    const b = document.createElement("button"); b.type = "button"; b.className = "zone"; b.dataset.k = "z:" + z.k;
    const s = document.createElement("strong"); s.textContent = it.valid ? it.display : "—"; s.dir = "ltr"; const sm = document.createElement("small"); sm.textContent = z.he;
    b.append(s, sm); b.addEventListener("click", () => select("z:" + z.k)); zones.appendChild(b);
    chip("z:" + z.k, "קווים · " + z.he, it.valid ? it.display : "—");
  }
  select("map");
}
function select(key){
  if (!result) return;
  sel = key;
  document.querySelectorAll(".chip,.row,.zone").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.k === key)));
  const isZone = key.startsWith("z:");
  const meta = key === "map" ? {he:"אזורי מדידה"} : isZone ? ZONES.find(z => "z:" + z.k === key) : IND.find(m => m.k === key);
  const it = key === "map" ? null : isZone ? result.zones[meta.k] : result.ind[meta.k];
  $("badge").textContent = isZone ? "קווים · " + meta.he : meta.he;
  const det = $("detail"); det.replaceChildren();
  if (it){
    const b = document.createElement("b"); b.textContent = `${isZone ? "קווים · " + meta.he : meta.he}: ${it.display}`;
    det.append(b, document.createTextNode(" · " + (it.valid ? (isZone ? "פיקסלי עמקים צרים מוארכים לכל 1,000 פיקסלים באזור." : meta.what) : it.reason) + " · " + EXP));
  } else det.textContent = "אזורי המדידה האנטומיים: ירוק = תקף, אפור מקווקו = נמנע. " + EXP;
  drawOverlay(key, it);
}
function drawOverlay(key, it){
  const Rz = result, c = $("ov").getContext("2d"), polys = Rz.R.polys;
  c.clearRect(0,0,W,H);
  if (it && !it.valid) return;
  const path = pts => { c.beginPath(); pts.forEach(([x,y],j) => j ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); };
  const outline = (pts, col, w=1.6, dash) => { path(pts); c.setLineDash(dash || []); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.setLineDash([]); };
  const pixLayer = fn => { const im = c.createImageData(W,H); for (let i=0;i<W*H;i++){ const col = fn(i); if (col){ im.data[i*4]=col[0]; im.data[i*4+1]=col[1]; im.data[i*4+2]=col[2]; im.data[i*4+3]=col[3]; } } tcv.width=W; tcv.height=H; tcv.getContext("2d").putImageData(im,0,0); c.drawImage(tcv,0,0); shrink(tcv); };
  const regionsOf = names => names.flatMap(n => polys[n] || []);
  switch (key){
    case "map": for (const [n, pl] of Object.entries(polys)) for (const p of pl) outline(p, Rz.cov[n].valid ? "rgba(228,201,166,.95)" : "rgba(255,255,255,.55)", 1.6, Rz.cov[n].valid ? null : [4,4]); break;
    case "spots": for (const s of it.overlay){ c.beginPath(); c.arc(s.cx, s.cy, Math.max(4, s.r+3), 0, Math.PI*2); c.strokeStyle = "#D9A441"; c.lineWidth = 1.8; c.stroke(); } break;
    case "blem": for (const s of it.overlay){ c.beginPath(); c.arc(s.cx, s.cy, Math.max(4, s.r+3), 0, Math.PI*2); c.strokeStyle = "#FF6B3D"; c.lineWidth = 2; c.stroke(); } break;
    case "red": pixLayer(i => it.overlay[i] > MET.red ? [235,30,60, Math.min(170, (it.overlay[i]-MET.red)*30 + 40)] : null); break;
    case "tex": { const {lf, l2, texM} = it.overlay; pixLayer(i => texM[i] ? (() => { const h = Math.abs(lf[i]-l2[i]); return h > 0.02 ? [255,255,255, Math.min(200, h*2500)] : null; })() : null); break; }
    case "dark": for (const p of regionsOf(["underR","underL","cheekR","cheekL"])) outline(p, "rgba(255,255,255,.85)"); break;
    default: {
      const lv = Rz.layers.lineVal;
      const zm = key === "lines" ? OR(...Object.values(Rz.layers.zoneMask)) : Rz.layers.zoneMask[key.slice(2)];
      pixLayer(i => zm[i] && lv[i] > 0 ? (lv[i] > MET.line*2 ? [20,120,40,240] : lv[i] > MET.line*1.4 ? [60,170,70,230] : [140,220,110,220]) : null);
      const zr = {forehead:["forehead"], glabella:["glabella"], crows:["crowR","crowL"], perioc:["underR","underL"]};
      const names = key === "lines" ? Object.values(zr).flat() : zr[key.slice(2)];
      for (const p of regionsOf(names)) outline(p, "rgba(255,255,255,.85)");
    }
  }
}

/* ---------------- wiring ---------------- */
// Artifact build: the claude.ai viewer frame refuses getUserMedia, so the camera button opens the device's own
// camera through a file input. The still photo then goes through the same quality gate as any upload.
$("bCam").addEventListener("click", () => $("fileCam").click());
$("bUp").addEventListener("click", () => $("file").click());
$("bCamX").addEventListener("click", () => { stopCam(); resetAll(); status = "idle"; show("L-intro"); });
$("bNew").addEventListener("click", () => { stopCam(); resetAll(); status = "idle"; show("L-intro"); });
$("bErr").addEventListener("click", () => { resetAll(); status = "idle"; show("L-intro"); });
document.addEventListener("visibilitychange", () => { if (document.hidden && camOn){ stopCam(); resetAll(); status = "idle"; show("L-intro"); } });
window.addEventListener("pagehide", () => { stopCam(); resetAll(); });

show("L-intro");
resetAll();
initMesh();

/* Test hook: only with ?test=1. Exposes state, numbers and canvas sizes; never image data. */
if (TEST){
  const sum = c => { if (!c.width || !c.height) return 0; const d = c.getContext("2d").getImageData(0,0,c.width,c.height).data; let s = 0; for (let i=0;i<d.length;i+=97) s += d[i]; return s; };
  window.__skinmapTest = Object.freeze({
    get status(){ return status; }, get ready(){ return fmReady; }, get seq(){ return scanSeq; },
    get gate(){ return lastGate && {pass: lastGate.pass, checks: lastGate.checks.map(c => ({id:c.id, ok:c.ok, value:c.value}))}; },
    get result(){ return result && {seq: result.seq, source: result.source,
      ind: Object.fromEntries(IND.map(m => [m.k, {valid: result.ind[m.k].valid, value: result.ind[m.k].value, reason: result.ind[m.k].reason}])),
      zones: Object.fromEntries(ZONES.map(z => [z.k, {valid: result.zones[z.k].valid, value: result.zones[z.k].value}])),
      coverage: Object.fromEntries(Object.entries(result.cov).map(([k,v]) => [k, {coverage: v.coverage, hairFrac: v.hairFrac, valid: v.valid, reason: v.reason}]))}; },
    retained(){ return {fcv:[fcv.width,fcv.height], acv:[acv.width,acv.height], mcv:[mcv.width,mcv.height], tcv:[tcv.width,tcv.height], photoSum: sum($("photo")), ovSum: sum($("ov"))}; },
    hangNextDetection(ms){ hangNext = true; timeoutMs = ms; },
    async detectBurst(n){ maxInFlight = 0; const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const rs = await Promise.all(Array.from({length:n}, () => detect(c))); shrink(c); return {resolved: rs.length, maxInFlight, errors: rs.filter(r => r.error).length}; },
  });
}
})();
