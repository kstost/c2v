import { spawn, exec } from 'child_process';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import server from './server_body.js';
import axios from 'axios';
import getPort from 'get-port';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
(async () => {
    const portnum = await getPort({ port: 3262 });
    let sp = server(portnum)
    let templateName = process.argv[2];
    let url = `http://localhost:${portnum}/page/${templateName}/`;
    const manifest = (await axios.get(`${url}manifest.json`)).data;
    let merge = manifest.merge;
    let resolution = manifest.screen_size;
    resolution.width = Math.round(resolution.width * manifest.screen_scale);
    resolution.height = Math.round(resolution.height * manifest.screen_scale);
    let loop = merge ? 2 : 1;
    for (let i = 0; i < loop; i++) {
        const display = await findAvailableDisplay();
        const displayArgument = display + ".0";
        const xvfb = spawn('Xvfb', [display, '-screen', '0', `${resolution.width}x${resolution.height}x24`]);
        const browser = await puppeteer.launch({
            headless: false,
            ignoreDefaultArgs: ['--enable-automation'],
            args: ['--no-sandbox', '--disable-setuid-sandbox', `--display=${display}`, '--window-size=' + `${resolution.width},${resolution.height}`,
                '--autoplay-policy=no-user-gesture-required',
                '--window-position=0,0',
                '--font-render-hinting=medium',
            ],
            defaultViewport: resolution
        });
        const page = await browser.newPage();
        await page.goto(`${url}#puppeteer`);
        let firstWithAudio = i === 0;
        await page.waitForFunction(() => document.readyState === 'complete', { polling: 'raf', timeout: 0 });
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
        await page.waitForFunction(() => window.readyd === true, { polling: 'raf', timeout: 0 });
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

        await page.waitForFunction(() => window.doned === true, { polling: 'raf', timeout: 0 });
        if (merge) {
            ffmpeg.on('close', async (code) => {
                await browser.close();
                xvfb.kill();
                if (!firstWithAudio) {
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
                    ffmpeg.on('close', async (code) => {
                        fs.unlinkSync(`${outputPath}_video`);
                        fs.unlinkSync(`${outputPath}_audio`);
                        await new Promise(rr => sp.close(() => rr(null)));
                        console.log(`Video file has been generated at: ${outputPath}`);
                    });
                } else {
                    fs.copyFileSync(outputPath, `${outputPath}_audio`);
                }
            });
            ffmpeg.kill('SIGINT')
        } else {
            ffmpeg.on('close', async (code) => {
                await browser.close();
                xvfb.kill();
                await new Promise(rr => sp.close(() => rr(null)));
                console.log(`Video file has been generated at: ${outputPath}`);
            });
            ffmpeg.kill('SIGINT')
        }
    }
})();