const { spawn, exec } = require('child_process');
const puppeteer = require('puppeteer');
const path = require('path');
async function findAvailableDisplay() {
    return new Promise((resolve, reject) => {
        exec("ps ax | grep Xvfb | grep -v grep", (err, stdout, stderr) => {
            if (err) {
                console.log("No Xvfb process found, using default :99");
                resolve(":99");
            } else {
                const usedDisplays = new Set();
                stdout.trim().split('\n').forEach((line) => {
                    const match = line.match(/Xvfb\s+(\S+)/);
                    if (match && match[1]) {
                        usedDisplays.add(match[1]);
                    }
                });
                let displayNumber = 99;
                while (usedDisplays.has(`:${displayNumber}`)) {
                    displayNumber++;
                }
                resolve(`:${displayNumber}`);
            }
        });
    });
}
let resolution = { width: 1080, height: 1920 };
let ratio = 1;
resolution.width = Math.round(resolution.width * ratio);
resolution.height = Math.round(resolution.height * ratio);
(async () => {
    const display = await findAvailableDisplay();
    const displayArgument = display + ".0";
    const xvfb = spawn('Xvfb', [display, '-screen', '0', `${resolution.width}x${resolution.height}x24`]);
    if (false) console.log(`Display set to: ${displayArgument}`);
    if (false) console.log(`Xvfb started on display ${display}`);

    const browser = await puppeteer.launch({
        headless: false,
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--no-sandbox', '--disable-setuid-sandbox', `--display=${display}`, '--window-size=' + `${resolution.width},${resolution.height}`,
            '--autoplay-policy=no-user-gesture-required',
        ],
        defaultViewport: resolution
    });

    const page = await browser.newPage();
    await page.goto(`file://${path.resolve(process.argv[2])}#puppeteer`);
    await page.waitForFunction(() => document.readyState === 'complete', { polling: 'raf' });
    await page.evaluate(() => {
        const audio = document.createElement('audio');
        audio.id = 'myAudio';
        audio.style.display = 'none';
        audio.controls = true;
        audio.autoplay = true;
        audio.loop = true;
        audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA/+NAwAAAAAAAAAAAAEluZm8AAAAPAAAABAAAAnIAf39/f39/f39/f39/f39/f39/f39/f39/qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dX/////////////////////////////////AAAAAExhdmM1OS4zNwAAAAAAAAAAAAAAACQCcgAAAAAAAAJyUSIlkgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/jIMQAAAADSAAAAABMQU1FMy4xMDBVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MixFsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MgxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/4yLEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
        audio.volume = 1;
        document.body.appendChild(audio);
    });

    await page.evaluate(() => document.documentElement.requestFullscreen());
    await page.waitForFunction(() => window.readyd === true, { polling: 'raf' });
    let soundOption;
    if (true) {
        soundOption = ['-f', 'alsa', '-i', 'default',]; // pulse
    } else {
        soundOption = [];
    }
    const outputPath = `${path.resolve(process.argv[3])}`;
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'x11grab',
        '-draw_mouse', '0',
        '-video_size', `${resolution.width}x${resolution.height}`,
        '-framerate', '60',
        '-i', `${displayArgument}+0,0`,
        ...soundOption,
        '-codec:v', 'libx264',
        '-preset', 'veryfast',
        '-profile:v', 'high',
        '-level', '5.1',
        '-pix_fmt', 'yuv420p',
        '-crf', '18',
        '-codec:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-y', outputPath
    ]);

    await page.waitForFunction(() => window.doned === true, { polling: 'raf' });
    ffmpeg.on('close', async (code) => {
        if (false) console.log(`FFmpeg exited with code ${code}`);
        await browser.close();
        if (false) console.log("Browser closed, stopping Xvfb...");
        xvfb.kill();
        console.log(`Video file has been generated at: ${outputPath}`);
    });
    ffmpeg.kill('SIGINT')
})();