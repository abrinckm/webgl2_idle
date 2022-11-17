async function main() {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    function flipBook() {
        ctx.clearRect(0, 0, 1280, 720);
        ctx.save()
        ctx.translate(300, 300)
        ctx.rotate(.001);
        ctx.translate(-300, -300)
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(100, 100, 500, 500);
        // ctx.restore()

        window.requestAnimationFrame(flipBook);
    }

    window.requestAnimationFrame(flipBook);
}


main();
