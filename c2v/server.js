import server from './server_body.js';
import getPort from 'get-port';
const portnum = await getPort({ port: 3262 });
let sp = server(portnum)
console.log(`${portnum} open`);