class WavefrontLoader {

    static async loadObjFile(objFilePath) {
        const reqBuffer = {req: new XMLHttpRequest()};
        return new Promise(resolve => {
            function cb(e) {
                resolve(reqBuffer.req.responseText)
            }
            function loadSource(req, path, callback) {
                req.addEventListener("load", callback, false);
                req.open("GET", path);
                req.send();
            }
            loadSource(reqBuffer.req, objFilePath, cb)
        })
    }

    static parseVertexData(data) {
        let lines = data.split("\n");
        let vertices = lines.reduce((acc,line)=>{if (line.startsWith("v ")) {acc.push(line);} return acc;}, []);
        vertices = vertices.map(v => {let parts = v.split(" "); return [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]}).flat();
        let indices = lines.reduce((acc,line)=>{if (line.startsWith("f")) {acc.push(line);} return acc;}, []);
        indices = indices.map(i=>{let f = i.split(" "); let tri = []; f.shift(); f.forEach(c=>{tri.push(parseInt(c.split("/")[0]))}); return tri;}).flat();
        return [vertices, indices]
    }
}