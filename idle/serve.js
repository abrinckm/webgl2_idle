const http = require('http');
const fs = require('fs');
const path = require('path');


/*
Inserts the shader code for the referenced headers
@param {Buffer} content The binary content for the fragment shader
@returns {Buffer} The expanded fragment shader with the inserted header code
*/
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

/*
@const SERVER {string}

An http server which serves a file based on the url path, filename, and content type
Will only serve content that is listed in `contentTypes`
*/
const SERVER = http.createServer(function(req, res) {
    let contentTypes = {
        '.html': 'text/javascript',           // canvas and script loading
        '.js': 'text/javascript',             // gfx scripts
        '.css': 'text/css',
        '.ico': 'image/x-icon',               // icon
        '.png': 'image/png',                  // icons & textures
        '.jpg': 'image/jpeg',                 // textures
        '.jpeg': 'image/jpeg',                // textures
        '.hdr': 'image/vnd.radiance',         // mostly for hdr cubemap
        '.bin': 'application/octet-stream',   // objects
        '.gltf': 'application/json',          // objects
        '.vert': 'text/plain',                // shaders
        '.frag': 'text/plain',                // shaders
    };

    // favicon
    if (match = req.url.match('favicon(\.\\w+)$')) {
        res.setHeader('Content-Type', 'image/x-icon');
        fs.createReadStream(path.join(__dirname, 'public', req.url)).pipe(res);
    }
    // canvas UI
    else if (req.url === "/") {
        fs.readFile("./public/index.html", "UTF-8", function(err, html) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(html);
        });
    }
    // content - shaders, scripts, materials, and textures
    else if (match = req.url.match("\.\\w+$")) {
        let ext = match[0];
        if (ext in contentTypes) {
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
    // not found
    else {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("Not Found");
    }
})


console.log("listening on: http://localhost:3000");
SERVER.listen(3000);
