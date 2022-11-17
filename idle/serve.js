const http = require('http');
const fs = require('fs');
const path = require('path');


contentTypes = {
    '.html': 'text/javascript',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.hdr': 'image/vnd.radiance',
    '.bin': 'application/octet-stream',
    '.gltf': 'application/json',
    '.vert': 'text/plain',
    '.frag': 'text/plain',
};


function includeHeaders(content) {
    const re = /\/\/include\s{1}<([\.\w]+)>/gm;
    let str = content.toString();
    let matches = [];
    while (matches = re.exec(content)) {
        let headerName = matches[1];
        let header = fs.readFileSync("./public/glsl/headers/" + headerName);
        str = str.replace("//include <" + headerName + ">", header);
    }
    return Buffer.from(str);
}


const server = http.createServer(function(req, res) {
    notFound = true;
    if (match = req.url.match('favicon(\.\\w+)$')) {
        ext = match[1];
        res.setHeader('Content-Type', 'image/x-icon');
        fs.createReadStream(path.join(__dirname, 'public', req.url)).pipe(res);
    }
    else if (req.url === "/") {
        fs.readFile("./public/index.html", "UTF-8", function(err, html) {
            notFound = false;
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    else if (match = req.url.match("\.\\w+$")) {
        let ext = match[0];
        if (ext in contentTypes) {
            notFound = false;
            let filePath = path.join(__dirname, 'public', req.url);
            res.writeHead(200, {"Content-Type":  contentTypes[ext]});
            fs.readFile(filePath, function(err, content) {
                if (req.url.match("\.frag")) {
                    content = includeHeaders(content);
                }
                res.end(content);
            });
        }
    }
    else if (notFound) {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("No Page Found");
    }
})


console.log("listening on: http://localhost:3000");
server.listen(3000);
