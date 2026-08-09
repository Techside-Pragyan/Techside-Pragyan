import urllib.request
import re

def generate_slider():
    # Icons configuration
    icons1 = "py,js,java,c,html,powershell,tf,pytorch,opencv,react,nextjs,nodejs,express,vite"
    icons2 = "jquery,mongodb,mysql,sqlite,postgres,aws,vercel,netlify,docker,git,github,postman,figma"
    
    url1 = f"https://skillicons.dev/icons?i={icons1}&theme=dark"
    url2 = f"https://skillicons.dev/icons?i={icons2}&theme=dark"
    
    # Fetch SVGs
    req1 = urllib.request.Request(url1, headers={'User-Agent': 'Mozilla/5.0'})
    svg1 = urllib.request.urlopen(req1).read().decode('utf-8')
    
    req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    svg2 = urllib.request.urlopen(req2).read().decode('utf-8')
    
    # Clean up SVGs so they can be grouped
    # skillicons returns an <svg> tag. We want to extract the inner content, or just embed the whole <svg> using a <g> and setting x,y.
    # Luckily, we can just use <g> with a transform and embed the SVG code directly as long as we keep it well-formed.
    # An easier way is to just embed them as data URIs in an <image> tag!
    import base64
    
    b64_1 = base64.b64encode(svg1.encode('utf-8')).decode('utf-8')
    b64_2 = base64.b64encode(svg2.encode('utf-8')).decode('utf-8')
    
    # SVG Width for animation (approx 14 icons * 60px = 840px, let's say 1000px)
    width1 = 800
    width2 = 800
    total_width = 800
    
    # Create the animated SVG wrapper
    # We will use two identical images sliding to create an infinite effect.
    animated_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="800" height="150">
    <style>
        .marquee1 {{
            animation: slide1 20s linear infinite;
        }}
        .marquee2 {{
            animation: slide2 20s linear infinite;
        }}
        @keyframes slide1 {{
            0% {{ transform: translateX(0); }}
            100% {{ transform: translateX(-100%); }}
        }}
        @keyframes slide2 {{
            0% {{ transform: translateX(0); }}
            100% {{ transform: translateX(100%); }}
        }}
    </style>
    
    <g transform="translate(0, 10)">
        <svg x="0" y="0" width="200%" height="60" class="marquee1">
            <image href="data:image/svg+xml;base64,{b64_1}" x="0" y="0" width="800" height="60" />
            <image href="data:image/svg+xml;base64,{b64_1}" x="800" y="0" width="800" height="60" />
        </svg>
    </g>
    
    <g transform="translate(-800, 80)">
        <svg x="0" y="0" width="200%" height="60" class="marquee2">
            <image href="data:image/svg+xml;base64,{b64_2}" x="0" y="0" width="800" height="60" />
            <image href="data:image/svg+xml;base64,{b64_2}" x="800" y="0" width="800" height="60" />
        </svg>
    </g>
</svg>"""

    with open('tech_stack_animated.svg', 'w', encoding='utf-8') as f:
        f.write(animated_svg)
        
    print("Successfully generated tech_stack_animated.svg")

if __name__ == "__main__":
    generate_slider()
