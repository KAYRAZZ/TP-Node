const http = require('http');
const WebSocket = require('ws');

// Crée un serveur HTTP
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket Server is running');
});

// Initialise le serveur WebSocket
const wss = new WebSocket.Server({ server });

// Stocke les utilisateurs connectés
const clients = new Map();

wss.on('connection', (ws) => {
    console.log('Un client est connecté');

    // Écoute les messages envoyés par le client
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'setUsername') {
            // Associe le WebSocket à un nom d'utilisateur
            clients.set(ws, data.username);
            console.log(`Utilisateur connecté : ${data.username}`);
            ws.send(`Bienvenue, ${data.username}!`);
        } else if (data.type === 'message') {
            const username = clients.get(ws);
            if (username) {
                const fullMessage = `${username} : ${data.message}`;
                console.log(fullMessage);

                // Diffuse le message à tous les clients connectés
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(fullMessage);
                    }
                });
            }
        }
    });

    // Gère la déconnexion
    ws.on('close', () => {
        const username = clients.get(ws);
        console.log(`Utilisateur déconnecté : ${username}`);
        clients.delete(ws);
    });
});

// Démarre le serveur
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Serveur WebSocket en écoute sur http://localhost:${PORT}`);
});