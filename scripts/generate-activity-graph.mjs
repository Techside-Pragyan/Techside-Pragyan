import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERNAME = process.env.GH_USERNAME || process.env.GITHUB_REPOSITORY_OWNER || "Techside-Pragyan";
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.join(__dirname, "../assets/activity-graph.svg");

async function fetchContributions(username) {
  return new Promise((resolve, reject) => {
    https.get(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      { headers: { "User-Agent": "GitHub-Profile-Activity-Graph" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on("error", reject);
  });
}

function generateSvg(days, username) {
  const width = 850;
  const height = 400;
  const paddingLeft = 50;
  const paddingRight = 35;
  const paddingTop = 70;
  const paddingBottom = 85;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const counts = days.map((d) => d.count);
  const maxVal = Math.max(...counts, 4);
  const yMax = Math.ceil(maxVal / 4) * 4;

  const stepX = graphWidth / (days.length - 1);

  const points = days.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + graphHeight - (d.count / yMax) * graphHeight;
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      count: d.count,
      date: d.date,
      dayIndex: i,
    };
  });

  // Smooth bezier curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = Number(((curr.x + next.x) / 2).toFixed(2));
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

  // Horizontal Gridlines & Y-values
  let yGridSvg = "";
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((yMax / ySteps) * i);
    const y = paddingTop + graphHeight - (i / ySteps) * graphHeight;
    yGridSvg += `
  <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="#24283b" stroke-dasharray="3 3" stroke-width="1"/>
  <text x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end" fill="#7dcfff" font-size="11" font-weight="600" font-family="'Segoe UI', Ubuntu, sans-serif">${val}</text>`;
  }

  // Vertical guidelines and everyday details
  let verticalGuidesSvg = "";
  let everydayLabelsSvg = "";
  let commitBadgesSvg = "";
  let pointsSvg = "";

  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Detect month spans
  const monthSpans = [];
  let currentMonth = null;
  days.forEach((d, i) => {
    const dt = new Date(d.date);
    const m = dt.getUTCMonth();
    if (m !== currentMonth) {
      if (monthSpans.length > 0) {
        monthSpans[monthSpans.length - 1].endIndex = i - 1;
      }
      monthSpans.push({
        monthName: monthNamesShort[m],
        year: dt.getUTCFullYear(),
        startIndex: i,
        endIndex: days.length - 1,
      });
      currentMonth = m;
    }
  });

  days.forEach((d, i) => {
    const p = points[i];
    const dt = new Date(d.date);
    const dayNum = dt.getUTCDate();
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const isActive = d.count > 0;

    // Subtle vertical guide line for every day
    verticalGuidesSvg += `
  <line x1="${p.x}" y1="${paddingTop}" x2="${p.x}" y2="${paddingTop + graphHeight}" stroke="${isActive ? "#3b4261" : "#1f2335"}" stroke-width="${isActive ? "1" : "0.75"}" stroke-dasharray="${isActive ? "none" : "2 2"}"/>`;

    // Vertical stem for days with commits
    if (isActive) {
      verticalGuidesSvg += `
  <line x1="${p.x}" y1="${p.y}" x2="${p.x}" y2="${paddingTop + graphHeight}" stroke="#bb9af7" stroke-width="1.5" stroke-opacity="0.4"/>`;
    }

    // Everyday X-Axis Labels (Date & Commit box)
    const labelColor = isActive ? "#7dcfff" : "#565f89";
    const labelWeight = isActive ? "700" : "500";
    everydayLabelsSvg += `
  <g transform="translate(${p.x}, ${paddingTop + graphHeight})">
    <line x1="0" y1="0" x2="0" y2="5" stroke="${isActive ? "#7dcfff" : "#414868"}" stroke-width="1"/>
    <text x="0" y="18" text-anchor="middle" fill="${labelColor}" font-size="9.5" font-weight="${labelWeight}" font-family="'Segoe UI', Ubuntu, sans-serif">${dayStr}</text>
    <rect x="-9" y="24" width="18" height="14" rx="3" fill="${isActive ? "#24283b" : "#16161e"}" stroke="${isActive ? "#bb9af7" : "#1f2335"}" stroke-width="0.75"/>
    <text x="0" y="34.5" text-anchor="middle" fill="${isActive ? "#ffffff" : "#414868"}" font-size="8.5" font-weight="${isActive ? "700" : "400"}" font-family="'Segoe UI', Ubuntu, sans-serif">${d.count}</text>
  </g>`;

    // Circle point
    pointsSvg += `
  <circle cx="${p.x}" cy="${p.y}" r="${isActive ? "4" : "2.5"}" fill="${isActive ? "#ffffff" : "#414868"}" stroke="${isActive ? "#bb9af7" : "#1a1b26"}" stroke-width="${isActive ? "2" : "1"}"/>`;

    // Floating Commit Badges above active peaks
    if (isActive) {
      const badgeY = Math.max(paddingTop + 14, p.y - 10);
      const countText = `${d.count}`;
      const badgeWidth = countText.length > 2 ? 26 : 20;
      commitBadgesSvg += `
  <g transform="translate(${p.x}, ${badgeY})">
    <rect x="${-badgeWidth / 2}" y="-13" width="${badgeWidth}" height="14" rx="3" fill="#1f2335" stroke="#bb9af7" stroke-width="1"/>
    <text x="0" y="-3" text-anchor="middle" fill="#7dcfff" font-size="9" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${countText}</text>
  </g>`;
    }
  });

  // Month headers
  let monthHeadersSvg = "";
  monthSpans.forEach((m) => {
    const startX = points[m.startIndex].x;
    const endX = points[m.endIndex].x;
    const midX = (startX + endX) / 2;
    monthHeadersSvg += `
  <g transform="translate(${midX}, ${paddingTop + graphHeight + 54})">
    <rect x="-32" y="-10" width="64" height="16" rx="8" fill="#24283b" stroke="#414868" stroke-width="1"/>
    <text x="0" y="2" text-anchor="middle" fill="#bb9af7" font-size="10" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${m.monthName} ${m.year}</text>
  </g>`;
  });

  const totalMonthContribs = counts.reduce((a, b) => a + b, 0);
  const activeDaysCount = counts.filter((c) => c > 0).length;
  const maxDayCommits = Math.max(...counts);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="tokyoNightArea" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bb9af7" stop-opacity="0.4"/>
      <stop offset="60%" stop-color="#7aa2f7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#bb9af7" stop-opacity="0.0"/>
    </linearGradient>
    <linearGradient id="tokyoNightLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7dcfff"/>
      <stop offset="50%" stop-color="#bb9af7"/>
      <stop offset="100%" stop-color="#7aa2f7"/>
    </linearGradient>
  </defs>

  <!-- Background card -->
  <rect width="100%" height="100%" fill="#1a1b26" rx="8"/>

  <!-- Header Section -->
  <text x="${paddingLeft}" y="34" fill="#70a5fd" font-size="17" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">Contribution &amp; Time Analytics</text>
  <text x="${width - paddingRight}" y="34" text-anchor="end" fill="#a9b1d6" font-size="12" font-family="'Segoe UI', Ubuntu, sans-serif">Last 31 Days: <tspan fill="#bb9af7" font-weight="700">${totalMonthContribs} Commits</tspan> &bull; Active: <tspan fill="#7dcfff" font-weight="600">${activeDaysCount}/31 Days</tspan> &bull; Peak: <tspan fill="#7dcfff" font-weight="600">${maxDayCommits}/Day</tspan></text>

  <!-- Vertical & Horizontal Grid -->
  ${verticalGuidesSvg}
  ${yGridSvg}
  <line x1="${paddingLeft}" y1="${paddingTop + graphHeight}" x2="${width - paddingRight}" y2="${paddingTop + graphHeight}" stroke="#414868" stroke-width="1.5"/>

  <!-- Area & Line Graph -->
  <path d="${areaD}" fill="url(#tokyoNightArea)"/>
  <path d="${pathD}" fill="none" stroke="url(#tokyoNightLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Floating Commit Badges -->
  ${commitBadgesSvg}

  <!-- Interactive Points -->
  ${pointsSvg}

  <!-- Everyday Day & Commit Labels Row -->
  ${everydayLabelsSvg}

  <!-- Month Indicators -->
  ${monthHeadersSvg}

  <!-- Legend -->
  <g transform="translate(${paddingLeft}, ${paddingTop + graphHeight + 54})">
    <text x="0" y="2" fill="#565f89" font-size="9.5" font-family="'Segoe UI', Ubuntu, sans-serif">Date (Top) &bull; Commits (Box)</text>
  </g>
</svg>`;
}

async function main() {
  try {
    console.log(`Fetching contributions for ${USERNAME}...`);
    const data = await fetchContributions(USERNAME);
    const contributions = data.contributions || [];
    if (contributions.length === 0) {
      throw new Error("No contribution data found.");
    }
    const last31Days = contributions.slice(-31);
    const svgContent = generateSvg(last31Days, USERNAME);

    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, svgContent, "utf8");
    console.log(`Activity graph generated successfully at: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error("Error generating activity graph:", error);
    process.exit(1);
  }
}

main();
