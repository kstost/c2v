import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default (port) => {
    const app = express();
    app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
    app.use('/page', express.static(path.join(__dirname, 'contents')));
    return app.listen(port, () => { });
}
/*
http://192.168.64.2:3262/page/sky/
http://192.168.64.2:3262/outputs/out.mp4
*/