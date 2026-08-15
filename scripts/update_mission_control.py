import os
import requests
import re
from datetime import datetime

# Configuration
USERNAME = "Techside-Pragyan"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
TEMPLATE_PATH = "assets/mission_control_template.svg"
OUTPUT_PATH = "assets/mission_control.svg"

def get_github_stats():
    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    print("Fetching user data...")
    # Get basic user data (repos, followers)
    user_resp = requests.get(f"https://api.github.com/users/{USERNAME}", headers=headers)
    if user_resp.status_code != 200:
        print(f"Error fetching user: {user_resp.text}")
        return {"repos": "0", "stars": "0", "commits": "0"}
    
    user_data = user_resp.json()
    repos_count = user_data.get("public_repos", 0)

    print("Fetching repositories for stars...")
    # Get all repos to calculate total stars
    stars_count = 0
    page = 1
    while True:
        repos_resp = requests.get(f"https://api.github.com/users/{USERNAME}/repos?per_page=100&page={page}", headers=headers)
        if repos_resp.status_code != 200:
            break
        repos = repos_resp.json()
        if not repos:
            break
        for repo in repos:
            stars_count += repo.get("stargazers_count", 0)
        page += 1

    print("Fetching total contributions via GraphQL...")
    # Get total contributions using GraphQL (requires token)
    commits_count = 0
    if GITHUB_TOKEN:
        query = """
        query($userName:String!) {
          user(login: $userName){
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
        """
        graphql_resp = requests.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": {"userName": USERNAME}},
            headers=headers
        )
        if graphql_resp.status_code == 200:
            data = graphql_resp.json()
            try:
                commits_count = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]["totalContributions"]
            except KeyError:
                pass
    else:
        print("No GITHUB_TOKEN provided, skipping GraphQL contributions fetch.")
        # Fallback to followers if we can't get commits easily
        commits_count = user_data.get("followers", 0)

    # Format numbers (e.g. 1000 -> 1k)
    def format_num(num):
        if num >= 1000:
            return f"{num/1000:.1f}k"
        return str(num)

    return {
        "repos": format_num(repos_count),
        "stars": format_num(stars_count),
        "commits": format_num(commits_count)
    }

def update_svg(stats):
    print("Reading template...")
    with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
        svg_content = f.read()

    print("Replacing placeholders...")
    svg_content = svg_content.replace("{{REPOS}}", stats["repos"])
    svg_content = svg_content.replace("{{STARS}}", stats["stars"])
    svg_content = svg_content.replace("{{COMMITS}}", stats["commits"])

    # Optional: Update the "Terminal v2.0" text to show last updated date
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    svg_content = re.sub(
        r"Data updated automatically via GitHub Actions • Terminal v2.0",
        f"Data updated automatically via GitHub Actions • Last run: {date_str} UTC",
        svg_content
    )

    print("Writing final SVG...")
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Successfully generated {OUTPUT_PATH}")

if __name__ == "__main__":
    stats = get_github_stats()
    print(f"Gathered stats: {stats}")
    update_svg(stats)
