const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

// ---------- Bộ đếm lượt truy cập ----------
// Lưu trong DATA_DIR/visits.json. Trên Railway nên gắn Volume và đặt DATA_DIR = đường dẫn mount của volume,
// nếu không số đếm sẽ về 0 mỗi lần deploy lại.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const COUNT_FILE = path.join(DATA_DIR, "visits.json");
let visits = 0, saveTimer = null;
try { visits = JSON.parse(fs.readFileSync(COUNT_FILE, "utf8")).total || 0; } catch (e) { /* chưa có file */ }
function saveVisits() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.mkdir(DATA_DIR, { recursive: true }, () => {
      const tmp = COUNT_FILE + ".tmp";
      fs.writeFile(tmp, JSON.stringify({ total: visits }), (err) => { if (!err) fs.rename(tmp, COUNT_FILE, () => {}); });
    });
  }, 1000);
}

http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/api/visits") {
    if (req.method === "POST") { visits++; saveVisits(); }
    else if (req.method !== "GET") { res.writeHead(405); return res.end(); }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ total: visits }));
  }
  let p;
  try { p = decodeURIComponent(req.url.split("?")[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p.endsWith("/")) p += "index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Không tìm thấy trang"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Server running on port " + PORT));
