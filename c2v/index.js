const { spawn, exec } = require('child_process');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
async function findAvailableDisplay() {
    return new Promise((resolve, reject) => {
        exec("ps ax | grep Xvfb | grep -v grep", (err, stdout, stderr) => {
            if (err) {
                if (false) console.log("No Xvfb process found, using default :99");
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
async function loadManifest(sourcePath) {
    let manifest = fs.readFileSync(sourcePath + '/manifest.json', 'utf8');
    try {
        return JSON.parse(manifest);
    } catch (error) { }
    return;
}
(async () => {
    const sourcePath = path.resolve(process.argv[2]);
    const manifest = await loadManifest(sourcePath);
    let merge = manifest.merge;
    let resolution = manifest.screen_size;
    resolution.width = Math.round(resolution.width * manifest.screen_scale);
    resolution.height = Math.round(resolution.height * manifest.screen_scale);
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
    await page.goto(`file://${sourcePath}/${manifest.main}#puppeteer`);

    let loop = merge ? 2 : 1;
    for (let i = 0; i < loop; i++) {
        let firstWithAudio = i === 0;
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
        let soundOption = [];
        if (!merge || (merge && firstWithAudio)) soundOption = ['-f', 'alsa', '-i', 'default',]; // pulse
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
        if (merge) {
            ffmpeg.on('close', async (code) => {
                if (!firstWithAudio) {
                    await browser.close();
                    xvfb.kill();
                    fs.renameSync(outputPath, `${outputPath}_video`);
                    const ffmpeg = spawn('ffmpeg', [
                        '-i', `${outputPath}_video`, // 비디오 파일(소리 없음) 입력
                        '-i', `${outputPath}_audio`, // 소리가 포함된 비디오 파일 입력
                        '-map', '0:v',               // 첫 번째 입력 파일의 비디오 스트림 선택
                        '-map', '1:a',               // 두 번째 입력 파일의 오디오 스트림 선택
                        '-c:v', 'copy',              // 비디오 코덱은 복사
                        '-c:a', 'aac',               // 오디오 코덱은 AAC
                        '-shortest',                 // 짧은 길이를 기준으로 출력 파일 생성
                        '-y', `${outputPath}`        // 결과 파일 이름
                    ]);
                    ffmpeg.on('close', (code) => {
                        fs.unlinkSync(`${outputPath}_video`);
                        fs.unlinkSync(`${outputPath}_audio`);
                        console.log(`Video file has been generated at: ${outputPath}`);
                    });
                } else {
                    fs.copyFileSync(outputPath, `${outputPath}_audio`);
                    page.reload()
                }
            });
            ffmpeg.kill('SIGINT')
        } else {
            ffmpeg.on('close', async (code) => {
                await browser.close();
                xvfb.kill();
                console.log(`Video file has been generated at: ${outputPath}`);
            });
            ffmpeg.kill('SIGINT')
        }
    }
})();