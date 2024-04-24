/*
node seed_to_scenario.js -t thi -m en -s ko -p "Pop Art style of" -v -i
*/
import { Command } from 'commander';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import axios from 'axios';
const program = new Command();
program
    .requiredOption('-t, --template <name>', 'Template name')
    .requiredOption('-m, --mainLang <lang>', 'Main language')
    .option('-p, --pictureStyle <styleprompt>', 'Picture style')
    .option('-s, --subLang <lang>', 'Sub language')
    .option('-v, --voice', 'Use Text-to-Speech (TTS)')
    .option('-i, --image', 'Generate image');

program.parse(process.argv);

const options = program.opts();

const openai = new OpenAI(); // OPENAI_API_KEY  export OPENAI_API_KEY="sk-...."         ~/.zshrc
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let templateName = options.template;
let mainLang = options.mainLang;
let subLang = options.subLang || null;
let pictureStyle = options.pictureStyle || '';
async function loadJSONFile(filename) {
    try {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    } catch { }
}
async function downloadImage(imageUrl, destination) {
    const writer = fs.createWriteStream(destination);
    try {
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error("다운로드 중 오류 발생:", error);
        throw error;
    }
}
function sanitizeFilename(description) {
    let sanitized = description.replace(/\s+/g, '_');
    sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
    return sanitized;
}

let basepath = path.resolve(`${__dirname}/contents/${templateName}`);
const base_template = await loadJSONFile(`${__dirname}/contents/.template/base_template.json`);
const seed = await loadJSONFile(path.resolve(`${basepath}/seed.json`));
const json = path.resolve(`${basepath}/scenario.json`);
if (seed) {
    let main = mainLang;
    let sub = subLang;
    for (let sentence of seed) {
        let nsen = {}
        nsen.audio = "";
        nsen.sentence = sentence[main];
        if (sub) {
            let sen = sentence[sub];
            if (!sen) sen = '';
            nsen.sentences = sub ? { [sub]: sen } : {};
        } else {
            delete nsen.sentences;
        }
        nsen.screen = { resource: "", prompt: sentence.img_prompt };
        delete nsen[main];
        delete nsen[sub];
        delete nsen.img_prompt;
        base_template.timeline.push(...[nsen, {
            "sleep_second": 0.1
        }]);
    }
    fs.writeFileSync(json, JSON.stringify(base_template, undefined, 3));
    let manifest = JSON.parse(fs.readFileSync(json, 'utf8'));
    async function save() {
        await fs.promises.writeFile(json, JSON.stringify(manifest, undefined, 3));
    }
    let count = 0;
    for (let i = 0; i < manifest.timeline.length; i++) {
        if (!manifest.timeline[i].sentence) continue;
        if (manifest.timeline[i].audio) continue;
        count++;
        let audio_filename = `speech${count}.mp3`;
        if (options.voice) {
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: "echo",
                input: manifest.timeline[i].sentence,
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            await fs.promises.writeFile(`${basepath}/resources/${audio_filename}`, buffer);
            manifest.timeline[i].audio = `${audio_filename}`;
            await save();
            console.log(`VOICE: GENERATED - ${manifest.timeline[i].sentence}`);
        }
        let prompt = manifest?.timeline[i]?.screen?.prompt;
        if (prompt) prompt = `${pictureStyle} ${prompt}`.trim();
        let image_filename = sanitizeFilename(prompt) + '.jpg';
        if (options.image && prompt) {
            const dalle = await openai.images.generate({
                model: "dall-e-3",
                n: 1,
                prompt: prompt,
                size: "1024x1024", // 1024x1024 $0.040 / image,  1024×1792, 1792×1024 $0.080 / image
            });
            manifest.timeline[i].url = dalle.data[0].url;
            await save();
            await downloadImage(dalle.data[0].url, `${basepath}/resources/${image_filename}`)
            manifest.timeline[i].screen.resource = `${image_filename}`;
            await save();
            console.log(`IMAGE: GENERATED - ${image_filename}`);
        } else {
            manifest.timeline[i].screen.resource = `${image_filename}`;
            await save();
        }
    }
}