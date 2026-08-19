// Serves the static site as-is, plus a small /api/stats endpoint that
// fetches live Twitch follower count + YouTube subscriber count
// server-side (avoids CORS, and avoids exposing any API keys since
// neither source requires one).

const TWITCH_USER = "ilyambrr";
const YOUTUBE_HANDLE = "ilyambr";
const GITHUB_USER = "ilyambr";

async function getTwitchFollowers() {
  try {
    const res = await fetch(`https://decapi.me/twitch/followcount/${TWITCH_USER}`);
    const text = (await res.text()).trim();
    const n = parseInt(text.replace(/,/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function getYoutubeSubscribers() {
  try {
    const res = await fetch(`https://www.youtube.com/@${YOUTUBE_HANDLE}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ilyambr.com stats)" },
    });
    const html = await res.text();
    const match = html.match(/"content":"([\d,.]+[KM]?) subscribers?"/);
    if (!match) return null;
    return match[1];
  } catch {
    return null;
  }
}

async function getGithubStars() {
  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`,
      { headers: { "User-Agent": "ilyambr.com", Accept: "application/vnd.github+json" } }
    );
    const repos = await res.json();
    if (!Array.isArray(repos)) return null;
    return repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  } catch {
    return null;
  }
}

// Generic "connector" system for pulling a collaborator's avatar from
// whatever platform they're set to, so adding a new collaborator later
// is just adding a {platform, user} entry — no new code.
const AVATAR_CONNECTORS = {
  twitch: async (user) => {
    const res = await fetch(`https://decapi.me/twitch/avatar/${user}`);
    const avatarUrl = (await res.text()).trim();
    return avatarUrl.startsWith("http") ? avatarUrl : null;
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/avatar") {
      const platform = url.searchParams.get("platform");
      const user = url.searchParams.get("user");
      const connector = AVATAR_CONNECTORS[platform];
      if (!connector || !user) {
        return new Response("unknown connector", { status: 404 });
      }
      try {
        const avatarUrl = await connector(user);
        if (!avatarUrl) return new Response("not found", { status: 404 });
        return Response.redirect(avatarUrl, 302);
      } catch {
        return new Response("upstream error", { status: 502 });
      }
    }

    if (url.pathname === "/api/stats") {
      const [twitchFollowers, youtubeSubscribers, githubStars] = await Promise.all([
        getTwitchFollowers(),
        getYoutubeSubscribers(),
        getGithubStars(),
      ]);

      return new Response(
        JSON.stringify({ twitchFollowers, youtubeSubscribers, githubStars }),
        {
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=60",
          },
        }
      );
    }

    // Everything else falls through to the static assets.
    return env.ASSETS.fetch(request);
  },
};
