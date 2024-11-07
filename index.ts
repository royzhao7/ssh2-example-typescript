import http from 'http';
import { WebSocketServer } from 'ws';
import { Client as SSHClient } from 'ssh2';
import fs from 'fs';
import path from 'path';

// Create an HTTP server
const server = http.createServer((req, res) => {
     // res.writeHead(200, { 'Content-Type': 'text/plain' });
    // res.end('HTTP server is running.\n');
    if (req.method === 'GET') {
        const routeName = req.url?.slice(1)||"";
       // console.log('routeName:'+routeName)
        const assetObj = {
            '': { file: "index.html", contentType: "text/html" },
             'client.js': { file: "client.js", contentType: "text/javascript" }
        }[routeName];

      //  console.log('assetObj:'+assetObj?.file)
        if (!assetObj) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Path not found');
        }

        const filePath = path.join(__dirname, assetObj.file);

        fs.readFile(filePath, (err, data) => {
            // console.log('readFile:'+filePath)
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Failed to load file');
            } else {
                res.writeHead(200, { 'Content-Type': assetObj.contentType });
                res.end(data);
            }
        });
    }
});

// Create a WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established.');

    // Create an SSH client
    const sshClient = new SSHClient();

    // Connect to the SSH server
    sshClient.on('ready', () => {
        console.log('SSH Client: Connection established.');

        // Start a shell session
        sshClient.shell((err, stream) => {
            if (err) throw err;

            // Handle data from the SSH stream
            stream.on('data', (data:any) => {
                console.log(`SSH Data: ${data}`);
                // Send SSH output back to WebSocket clients
                ws.send(data.toString());
            });

            // Handle input from WebSocket clients and send to SSH shell
            ws.on('message', (message: string) => {
                console.log(`Received from WebSocket: ${message}`);
                stream.write(message); // Send to SSH shell
            });

            // Handle WebSocket close event
            ws.on('close', () => {
                console.log('WebSocket connection closed.');
                sshClient.end(); // Close the SSH connection
            });
        });
    }).connect({
        host: '192.168.31.190', // SSH server address
        port: 22,                // SSH port
        username: 'zhaos', // SSH username
        password: '123456'  // SSH password
        // You can also use privateKey instead of password if needed
    });

    // Handle SSH errors
    sshClient.on('error', (err) => {
        console.error(`SSH Client Error: ${err}`);
        ws.send('Error connecting to SSH server.');
        ws.close();
    });
});

// Upgrade the HTTP server to handle WebSocket connections
server.on('upgrade', (request: any, socket: any, head: any) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('upgrade')
        wss.emit('connection', ws, request);
    });
});

// Start the HTTP server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
});