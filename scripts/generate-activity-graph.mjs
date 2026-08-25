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
  const height = 380;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 70;
  const paddingBottom = 55;

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
  <text x="${paddingLeft - 12}" y="${y + 4}" text-anchor="end" fill="#7dcfff" font-size="11" font-weight="500" font-family="'Segoe UI', Ubuntu, sans-serif">${val}</text>`;
  }

  // X Axis labels (Every 5 days + last day)
  let xLabelsSvg = "";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  days.forEach((d, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const p = points[i];
      const dt = new Date(d.date);
      const label = `${monthNames[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
      xLabelsSvg += `
  <line x1="${p.x}" y1="${paddingTop + graphHeight}" x2="${p.x}" y2="${paddingTop + graphHeight + 6}" stroke="#7dcfff" stroke-width="1"/>
  <text x="${p.x}" y="${paddingTop + graphHeight + 22}" text-anchor="middle" fill="#7dcfff" font-size="11" font-weight="500" font-family="'Segoe UI', Ubuntu, sans-serif">${label}</text>`;
    }
  });

  // Circle points
  let pointsSvg = "";
  points.forEach((p) => {
    pointsSvg += `
  <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ffffff" stroke="#bb9af7" stroke-width="2"/>`;
  });

  const totalMonthContribs = counts.reduce((a, b) => a + b, 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="tokyoNightArea" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bb9af7" stop-opacity="0.4"/>
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

  <!-- Header -->
  <text x="${paddingLeft}" y="38" fill="#70a5fd" font-size="18" font-weight="700" font-family="'Segoe UI', Ubuntu, sans-serif">${username}'s Contribution Activity</text>
  <text x="${width - paddingRight}" y="38" text-anchor="end" fill="#a9b1d6" font-size="13" font-family="'Segoe UI', Ubuntu, sans-serif">Last 31 Days: <tspan fill="#bb9af7" font-weight="700">${totalMonthContribs} Contributions</tspan></text>

  <!-- Grid & Axis -->
  ${yGridSvg}
  <line x1="${paddingLeft}" y1="${paddingTop + graphHeight}" x2="${width - paddingRight}" y2="${paddingTop + graphHeight}" stroke="#414868" stroke-width="1.5"/>

  <!-- Area & Line Graph -->
  <path d="${areaD}" fill="url(#tokyoNightArea)"/>
  <path d="${pathD}" fill="none" stroke="url(#tokyoNightLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Points & Labels -->
  ${pointsSvg}
  ${xLabelsSvg}
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
