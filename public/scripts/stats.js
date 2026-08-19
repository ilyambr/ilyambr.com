(async () => {
  const youtubeEl = document.getElementById("stat-youtube");
  const twitchEl = document.getElementById("stat-twitch");
  const githubEl = document.getElementById("stat-github");

  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    youtubeEl.textContent = data.youtubeSubscribers ?? "—";
    twitchEl.textContent =
      data.twitchFollowers != null ? data.twitchFollowers.toLocaleString() : "—";
    githubEl.textContent =
      data.githubStars != null ? data.githubStars.toLocaleString() : "—";
  } catch {
    youtubeEl.textContent = "—";
    twitchEl.textContent = "—";
    githubEl.textContent = "—";
  }
})();
