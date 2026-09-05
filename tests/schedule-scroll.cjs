// Run with: node tests/schedule-scroll.cjs
// Uses an installed Chromium browser and the project's React 18 dependencies.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ts = require("typescript");
const WebSocket = require("next/dist/compiled/ws");

const root = path.resolve(__dirname, "..");
const browserPath = process.env.CHROME_PATH || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(fs.existsSync);
assert.ok(browserPath, "Set CHROME_PATH to an installed Chromium browser");

const sourcePath = process.argv[2] || "src/components/ScheduleScrollContainer.js";
const compiled = ts.transpileModule(fs.readFileSync(path.resolve(root, sourcePath), "utf8"), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const html = `<!doctype html><html><head><style>
  .overflow-x-auto { overflow: auto; width: 500px; height: 180px; }
  table { width: 2400px; height: 400px; table-layout: fixed; }
</style></head><body><div id="root"></div>
<script src="/react.js"></script><script src="/react-dom.js"></script><script>
  const exports = {};
  const require = name => name === 'react' ? React : {
    jsx: (type, props, key) => React.createElement(type, { ...props, key }),
    jsxs: (type, props, key) => React.createElement(type, { ...props, key })
  };
  ${compiled}
  const Scroll = exports.default;
  const root = ReactDOM.createRoot(document.getElementById('root'));
  window.draw = (scope = 'tijana-2026-9', version = 0) => ReactDOM.flushSync(() =>
    root.render(React.createElement(Scroll, { scrollKey: scope, key: scope },
      React.createElement('table', null, React.createElement('tbody', null,
        React.createElement('tr', null, Array.from({ length: 30 }, (_, day) =>
          React.createElement('td', { key: day }, day + 1,
            React.createElement('select', { defaultValue: version % 2 },
              React.createElement('option', { value: 0 }, 'A'),
              React.createElement('option', { value: 1 }, 'B'))))))))));
  window.removeTable = () => ReactDOM.flushSync(() => root.render(null));
  window.box = () => document.querySelector('.overflow-x-auto');
  window.settle = () => new Promise(resolve => setTimeout(resolve, 50));
  draw();
</script></body></html>`;

const server = http.createServer((req, res) => {
  const scripts = {
    "/react.js": "node_modules/react/umd/react.development.js",
    "/react-dom.js": "node_modules/react-dom/umd/react-dom.development.js",
  };
  res.setHeader("Content-Type", scripts[req.url] ? "text/javascript" : "text/html");
  res.end(scripts[req.url] ? fs.readFileSync(path.join(root, scripts[req.url])) : html);
});

(async () => {
  let browser, socket;
  const profile = path.resolve(root, ".next", `scroll-test-${process.pid}`);
  try {
    console.log("Starting browser scroll regression test...");
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    browser = spawn(browserPath, ["--headless=new", "--no-first-run", "--no-default-browser-check",
      "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
      "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    const endpoint = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Browser startup timed out")), 20000);
      let output = "";
      browser.once("error", reject);
      browser.stderr.on("data", chunk => {
        output += chunk;
        const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.once("open", resolve); socket.once("error", reject); });
    let id = 0;
    const waiting = new Map();
    socket.on("message", data => {
      const message = JSON.parse(data);
      const pending = waiting.get(message.id);
      if (!pending) return;
      waiting.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    function send(method, params = {}, sessionId) {
      return new Promise((resolve, reject) => {
        const requestId = ++id;
        const timeout = setTimeout(() => {
          waiting.delete(requestId);
          reject(new Error(`Browser command timed out: ${method}`));
        }, 15000);
        waiting.set(requestId, {
          resolve: value => { clearTimeout(timeout); resolve(value); },
          reject: error => { clearTimeout(timeout); reject(error); },
        });
        socket.send(JSON.stringify({ id: requestId, method, params, sessionId }));
      });
    }
    const { targetId } = await send("Target.createTarget", { url: `http://127.0.0.1:${server.address().port}` });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    await send("Page.bringToFront", {}, sessionId);
    async function evaluate(expression) {
      const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "Browser evaluation failed");
      return result.result.value;
    }
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate("typeof window.draw === 'function'")) break;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    const result = await evaluate(`(async () => {
      box().scrollLeft = box().scrollWidth - box().clientWidth;
      box().scrollTop = 100;
      await settle();
      const expected = { left: box().scrollLeft, top: box().scrollTop };
      const select = document.querySelectorAll('select')[29];
      select.value = '1';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      removeTable(); await settle(); draw(); await settle();
      const remounted = { left: box().scrollLeft, top: box().scrollTop };
      draw('tijana-2026-9', 1); await settle();
      const updated = box().scrollLeft;
      box().style.display = 'none';
      box().dispatchEvent(new Event('scroll')); await settle();
      removeTable(); draw(); await settle();
      const revealed = box().scrollLeft;
      draw('milanka-2026-9'); await settle();
      const otherUser = box().scrollLeft;
      draw('tijana-2026-10'); await settle();
      const otherMonth = box().scrollLeft;
      return { expected, remounted, updated, revealed, otherUser, otherMonth };
    })()`);
    assert.ok(result.expected.left > 1000, "Fixture must scroll to the last days");
    assert.deepEqual(result.remounted, result.expected, "First edit must survive a full table remount");
    assert.equal(result.updated, result.expected.left, "Subsequent updates must preserve scroll");
    assert.equal(result.revealed, result.expected.left, "Hidden table must not overwrite saved scroll with zero");
    assert.equal(result.otherUser, 0, "Different users must have separate positions");
    assert.equal(result.otherMonth, 0, "A new month must start at the beginning");
    console.log("PASS: first-edit remount, subsequent update, hidden table, user/month isolation", result);
    await send("Browser.close");
  } finally {
    socket?.close();
    if (browser && browser.exitCode === null) {
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 3000);
        browser.once("exit", () => { clearTimeout(timeout); resolve(); });
        browser.kill();
      });
    }
    server.close();
    // Only remove the exact test profile inside this workspace's build directory.
    if (path.dirname(profile) === path.resolve(root, ".next") && path.basename(profile) === `scroll-test-${process.pid}`) {
      fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
