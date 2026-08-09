import os

categories = [
    {"name": "Languages", "file": "cat_languages.svg", "width": 140, "text": "LANGUAGES"},
    {"name": "AI_ML", "file": "cat_aiml.svg", "width": 100, "text": "AI / ML"},
    {"name": "Web_Technologies", "file": "cat_web.svg", "width": 240, "text": "WEB TECHNOLOGIES"},
    {"name": "Databases", "file": "cat_databases.svg", "width": 140, "text": "DATABASES"},
    {"name": "Cloud_DevOps", "file": "cat_cloud.svg", "width": 210, "text": "CLOUD & DEVOPS"},
    {"name": "Tools", "file": "cat_tools.svg", "width": 90, "text": "TOOLS"},
]

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="40" viewBox="0 0 {width} 40">
  <defs>
    <!-- Tokyo Night Animated Gradient -->
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7aa2f7">
        <animate attributeName="stop-color" values="#7aa2f7;#bb9af7;#f7768e;#7aa2f7" dur="3s" repeatCount="indefinite" />
      </stop>
      <stop offset="50%" stop-color="#bb9af7">
        <animate attributeName="stop-color" values="#bb9af7;#f7768e;#7aa2f7;#bb9af7" dur="3s" repeatCount="indefinite" />
      </stop>
      <stop offset="100%" stop-color="#f7768e">
        <animate attributeName="stop-color" values="#f7768e;#7aa2f7;#bb9af7;#f7768e" dur="3s" repeatCount="indefinite" />
      </stop>
    </linearGradient>

    <!-- Soft Drop Shadow -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="2" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g transform="translate(0, 0)">
    <!-- Levitation Animation -->
    <animateTransform attributeName="transform" type="translate" values="0,2; 0,0; 0,2" dur="3s" repeatCount="indefinite" />

    <!-- Animated Underline -->
    <rect x="0" y="32" width="{width}" height="2" rx="1" fill="url(#glow)">
       <animate attributeName="width" values="{half_width};{width};{half_width}" dur="4s" repeatCount="indefinite" />
       <animate attributeName="x" values="{quarter_width};0;{quarter_width}" dur="4s" repeatCount="indefinite" />
    </rect>

    <!-- Text -->
    <text x="0" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="800" fill="url(#glow)" text-anchor="start" dominant-baseline="middle" letter-spacing="1" filter="url(#shadow)">
      {text}
    </text>
  </g>
</svg>"""

for cat in categories:
    w = cat["width"]
    content = svg_template.format(
        width=w,
        half_width=w // 2,
        quarter_width=w // 4,
        text=cat["text"]
    )
    with open(cat["file"], "w", encoding="utf-8") as f:
        f.write(content)

print("Generated all SVGs!")
