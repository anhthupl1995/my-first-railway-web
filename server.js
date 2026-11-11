const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const page = path.join(__dirname, "public", "index.html");

http.createServer((req, res) => {
  fs.readFile(page, (err, data) => {
    if (err) { res.writeHead(500); return res.end("Server error"); }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(data);
  });
}).listen(PORT, () => console.log("Server running on port " + PORT));
