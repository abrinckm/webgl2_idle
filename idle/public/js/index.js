async function main() {
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    // set line stroke and line width
    ctx.strokeStyle = "rgb(200,0,0)";
    ctx.fillStyle = "rgb(200, 0, 0)";
    ctx.lineWidth = 1;

    // draw a red triangle
    // ctx.beginPath();
    // ctx.moveTo(100, 300);
    // ctx.lineTo(300, 300);
    // ctx.lineTo(200, 200)
    // ctx.lineTo(100, 300);
    // ctx.fill();

    // show alpha channel
    ctx.fillStyle = "rgb(200, 0, 0)";
    ctx.fillRect(100, 100, 500, 500);

    ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
    ctx.fillRect(300, 300, 500, 500);
}


main();
