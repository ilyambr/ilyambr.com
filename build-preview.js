const fs = require("fs");
const path = require("path");

const styles98 = fs.readFileSync(
  path.join(__dirname, "public/styles/98-inline.css"),
  "utf8"
);
const siteCss = fs.readFileSync(
  path.join(__dirname, "public/styles/site.css"),
  "utf8"
);
const pageCss = fs.readFileSync(
  path.join(__dirname, "public/styles/page.css"),
  "utf8"
);

const bodyMarkup = `
    <div class="window desktop-window">
      <div class="title-bar">
        <div class="title-bar-text">ilyambr.com</div>
        <div class="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>

      <div class="window-body">
        <div class="tabs">
          <input type="radio" id="tab-main" name="nav" checked />
          <input type="radio" id="tab-projects" name="nav" />
          <input type="radio" id="tab-links" name="nav" />
          <input type="radio" id="tab-socials" name="nav" />
          <input type="radio" id="tab-others" name="nav" />

          <div class="tab-bar">
            <label for="tab-main">Main</label>
            <label for="tab-projects">Projects</label>
            <label for="tab-links">Links</label>
            <label for="tab-socials">Socials</label>
            <label for="tab-others">Others</label>
          </div>

          <div class="panels">
            <section id="panel-main">
              <div class="main-header">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23000080'/%3E%3Crect x='2' y='2' width='12' height='9' fill='%2300a0a0'/%3E%3Crect x='2' y='12' width='12' height='2' fill='%23c0c0c0'/%3E%3C/svg%3E"
                  alt="ilyambr.com logo"
                />
                <div>
                  <h1>ilyambr.com</h1>
                  <p>welcome to my corner of the internet.</p>
                </div>
              </div>

              <div class="site-info window-body" style="margin: 0;">
                <fieldset>
                  <legend>Site Info</legend>
                  <dl>
                    <dt>Powered by:</dt>
                    <dd>Cloudflare Workers</dd>
                    <dt>Style:</dt>
                    <dd><a href="#">98.css</a></dd>
                    <dt>Source:</dt>
                    <dd><a href="#">GitHub</a></dd>
                  </dl>
                </fieldset>
              </div>
            </section>

            <section id="panel-projects">
              <div class="project-list">
                <div class="project-card window-body">
                  <a class="project-name" href="#">Backtrack</a>
                  <p>Backtrack for OBS &mdash; NVIDIA Shadowplay-style instant clipping, built for OBS.</p>
                </div>
                <div class="project-card window-body">
                  <a class="project-name" href="#">BAMS</a>
                  <p>BAMS clips of the day &mdash; see it live at <a href="#">ilyambr.com/cat</a>.</p>
                </div>
                <div class="project-card window-body">
                  <a class="project-name" href="#">Finch</a>
                  <p>A modern client for Zoho Mail.</p>
                </div>
              </div>
            </section>

            <section id="panel-links">
              <ul class="link-list">
                <li><a class="link-btn window-body" href="#">Twitch &mdash; ilyambrr</a></li>
                <li><a class="link-btn window-body" href="#">YouTube &mdash; @ilyambr</a></li>
                <li><a class="link-btn window-body" href="#">GitHub &mdash; ilyambr</a></li>
                <li><a class="link-btn window-body" href="#">Instagram &mdash; ilyambr_</a></li>
              </ul>
            </section>

            <section id="panel-socials">
              <div class="stat-grid">
                <a class="stat-card window-body" href="#">
                  <div class="stat-label">YouTube Subscribers</div>
                  <div class="stat-value">7</div>
                  <div class="stat-label">@ilyambr</div>
                </a>
                <a class="stat-card window-body" href="#">
                  <div class="stat-label">Twitch Followers</div>
                  <div class="stat-value">84</div>
                  <div class="stat-label">ilyambrr</div>
                </a>
              </div>
            </section>

            <section id="panel-others">
              <p>People I've collaborated with:</p>
              <div class="collab-list">
                <a class="collab-btn window-body" href="#" title="Alpha Tester">
                  <span>BAMS</span>
                  <span>Backtrack</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer class="window-body-footer">
        &copy; ilyambr &mdash; <a href="#">discord verified</a>
      </footer>
    </div>
`;

const pageMarkup = `
    <div class="retro-page">
      <header class="rp-nav">
        <span class="rp-wordmark">ilyambr<span class="rp-dot">.com</span></span>
        <nav>
          <a href="#rp-projects">Projects</a>
          <a href="#rp-links">Links</a>
          <a href="#rp-socials">Socials</a>
          <a href="#rp-others">Others</a>
        </nav>
      </header>

      <section class="rp-hero">
        <p class="rp-eyebrow">Welcome to</p>
        <h1>ilyambr<span class="rp-dot">.com</span></h1>
        <p class="rp-tagline">welcome to my corner of the internet.</p>
        <div class="rp-info">
          <span>Powered by Cloudflare Workers</span>
          <span>&middot;</span>
          <a href="#">Source on GitHub</a>
        </div>
      </section>

      <section class="rp-section" id="rp-projects">
        <h2>Projects</h2>
        <div class="rp-project-grid">
          <a class="rp-card" href="#">
            <h3>Backtrack</h3>
            <p>NVIDIA Shadowplay-style instant clipping, built for OBS.</p>
          </a>
          <a class="rp-card" href="#">
            <h3>BAMS</h3>
            <p>Clips of the day &mdash; see it live at ilyambr.com/cat.</p>
          </a>
          <a class="rp-card" href="#">
            <h3>Finch</h3>
            <p>A modern client for Zoho Mail.</p>
          </a>
          <a class="rp-card" href="#">
            <h3>Chat</h3>
            <p>Merges your YouTube and Twitch chats into one view.</p>
          </a>
        </div>
      </section>

      <section class="rp-section" id="rp-links">
        <h2>Links</h2>
        <div class="rp-link-row">
          <a class="rp-pill" href="#">Twitch</a>
          <a class="rp-pill" href="#">YouTube</a>
          <a class="rp-pill" href="#">GitHub</a>
          <a class="rp-pill" href="#">Instagram</a>
        </div>
      </section>

      <section class="rp-section" id="rp-socials">
        <h2>Socials</h2>
        <div class="rp-stat-row">
          <a class="rp-stat" href="#">
            <span class="rp-stat-num">7</span>
            <span class="rp-stat-label">YouTube Subscribers</span>
          </a>
          <a class="rp-stat" href="#">
            <span class="rp-stat-num">84</span>
            <span class="rp-stat-label">Twitch Followers</span>
          </a>
        </div>
      </section>

      <section class="rp-section" id="rp-others">
        <h2>Others</h2>
        <p class="rp-others-lead">People I've collaborated with:</p>
        <a class="rp-collab" href="#" title="Alpha Tester">
          <span>BAMS</span>
          <span class="rp-collab-arrow">&rarr;</span>
          <span>Backtrack</span>
        </a>
      </section>

      <footer class="rp-footer">
        &copy; ilyambr &mdash; <a href="#">discord verified</a>
      </footer>
    </div>
`;

const chromeCss = `
:root {
  --picker-bg: #f4f3f1;
  --picker-panel: #ffffff;
  --picker-border: #ddd9d2;
  --picker-text: #24211d;
  --picker-text-dim: #78726a;
  --picker-accent: #b5652f;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --picker-bg: #171512;
    --picker-panel: #201d19;
    --picker-border: #35312b;
    --picker-text: #eeeae4;
    --picker-text-dim: #948d83;
    --picker-accent: #e08a4f;
  }
}

:root[data-theme="dark"] {
  --picker-bg: #171512;
  --picker-panel: #201d19;
  --picker-border: #35312b;
  --picker-text: #eeeae4;
  --picker-text-dim: #948d83;
  --picker-accent: #e08a4f;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--picker-bg);
  color: var(--picker-text);
  font-family: -apple-system, "Segoe UI", Inter, Arial, sans-serif;
  min-height: 100%;
}

.chrome-header {
  padding: 28px 24px 16px;
  text-align: center;
}

.chrome-header h1 {
  margin: 0 0 4px;
  font-size: 20px;
  letter-spacing: -0.01em;
}

.chrome-header p {
  margin: 0;
  color: var(--picker-text-dim);
  font-size: 13px;
}

.picker-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0 24px 24px;
}

.picker-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--picker-panel);
  border: 1px solid var(--picker-border);
  border-radius: 999px;
  padding: 4px;
}

.picker-group span.group-label {
  font-size: 11px;
  color: var(--picker-text-dim);
  padding-left: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.picker-group button {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--picker-text);
  font: inherit;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
}

.picker-group button.active {
  background: var(--picker-accent);
  color: #fff;
  font-weight: 600;
}

.swatch {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.swatch.grey { background: #999; }
.swatch.green { background: #39ff6a; }
.swatch.red { background: #ff3939; }

.preview-stage {
  display: flex;
  justify-content: center;
  padding: 8px 24px 48px;
  min-height: 640px;
}

.preview-frame {
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: center;
}

.preview-frame[data-style="page"] {
  max-width: 900px;
  display: block;
  border: 1px solid var(--picker-border);
}

#window-markup,
#page-markup {
  width: 100%;
}

.preview-frame:not([data-style="page"]) #page-markup {
  display: none;
}

.preview-frame[data-style="page"] #window-markup {
  display: none;
}
`;

const html = `<!doctype html>
<title>Site Style Picker</title>
<div class="chrome-header">
  <h1>ilyambr.com &mdash; style picker</h1>
  <p>Pick a chrome style and a color theme. This is the exact CSS your site would use.</p>
</div>

<div class="picker-bar">
  <div class="picker-group" id="style-group">
    <span class="group-label">Style</span>
    <button data-style="98" class="active">Windows 98</button>
    <button data-style="modern">Modern flat</button>
    <button data-style="terminal">Terminal</button>
    <button data-style="page">Retro page</button>
  </div>
  <div class="picker-group" id="theme-group">
    <span class="group-label">Theme</span>
    <button data-theme="grey" class="active"><span class="swatch grey"></span>Grey</button>
    <button data-theme="green"><span class="swatch green"></span>Green</button>
    <button data-theme="red"><span class="swatch red"></span>Red</button>
  </div>
</div>

<div class="preview-stage">
  <div class="preview-frame" id="preview-root" data-style="98" data-theme="grey">
    <div id="window-markup">${bodyMarkup}</div>
    <div id="page-markup">${pageMarkup}</div>
  </div>
</div>

<style>
${chromeCss}
</style>
<style>
${styles98}
</style>
<style>
${siteCss}
</style>
<style>
${pageCss}
</style>

<script>
  const root = document.getElementById('preview-root');
  document.getElementById('style-group').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-style]');
    if (!btn) return;
    root.setAttribute('data-style', btn.dataset.style);
    document.querySelectorAll('#style-group button').forEach(b => b.classList.toggle('active', b === btn));
  });
  document.getElementById('theme-group').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    root.setAttribute('data-theme', btn.dataset.theme);
    document.querySelectorAll('#theme-group button').forEach(b => b.classList.toggle('active', b === btn));
  });
</script>
`;

fs.writeFileSync(path.join(__dirname, "preview.html"), html);
console.log("wrote preview.html,", html.length, "bytes");
