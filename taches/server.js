const http = require('http');
const fs = require('fs');

const worker = () => {
    let total = 0;
    for (let i = 0; i < 1e7; i++) total += i;
}

const readFiles = () => {
    try {
        const data = fs.readFileSync('taches.json', 'utf8'); // Lit le fichier JSON
        const jsonData = JSON.parse(data); // Parse le contenu JSON
        return jsonData; // Retourne les données JSON si nécessaire
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier JSON :', error);
        return [];
    }
};

const writeFile = (newTache) => {
    try {
        // Lire le fichier existant
        const data = fs.readFileSync('taches.json', 'utf8');
        const jsonData = JSON.parse(data);

        // Ajouter la nouvelle tâche
        jsonData.taches.push(newTache);

        // Réécrire le fichier avec les données mises à jour
        fs.writeFileSync('taches.json', JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur lors de l\'écriture dans le fichier JSON :', error);
    }
};

const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        if (req.method === 'GET' && req.url.includes('taches')) {
            // URL: /taches
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            const data = fs.createReadStream('taches.json', 'utf8'); // Crée un flux de lecture pour le fichier JSON
            data.on('data', chunk => {
                const taches = JSON.parse(chunk).taches || []; // Parse le contenu JSON
                res.end(taches.map(tache => `ID: ${tache.id}, Tache: ${tache.nom}`).join('\n'));
            });

            worker();
        } else if (req.method === 'POST' && req.url.includes('taches')) {
            try {
                // URL: /taches
                // Attendu
                // {"id": 3,"tache": "abc"}
                const parsedBody = JSON.parse(body); // Analyse le corps en tant que JSON

                // Vérifiez que le JSON contient les propriétés nécessaires
                if (!parsedBody.id || !parsedBody.tache) {
                    throw new Error('Le JSON doit contenir les propriétés "id" et "tache".');
                }

                const newTache = { id: parsedBody.id, nom: parsedBody.tache }; // Crée une nouvelle tâche

                // Ajoutez la tâche dans le fichier
                writeFile(newTache);

                worker();
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Tâche ajoutée : ${JSON.stringify(newTache)}\n`);
            } catch (error) {
                console.error("Erreur lors de l'analyse du corps :", error.message);
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Erreur : ${error.message}\n`);
            }
        } else if (req.method === 'PUT' && req.url.includes('taches')) {
            // URL: /taches/:id
            // Attendu
            // {"nom": "abc"}
            const urlParts = req.url.split('/'); // Divise l'URL pour récupérer l'ID
            const taskId = parseInt(urlParts[2], 10); // Récupère l'ID de la tâche à modifier

            if (isNaN(taskId)) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Erreur : ID invalide\n');
                return;
            }

            try {
                const parsedBody = JSON.parse(body);
                // Vérifiez que le JSON contient les propriétés nécessaires
                if (!parsedBody.nom) {
                    throw new Error('Le JSON doit contenir la propriété "nom".');
                }

                const data = readFiles(); // Récupère toutes les tâches
                const taches = data.taches || [];

                // Trouve la tâche à modifier
                const tacheIndex = taches.findIndex(tache => tache.id === taskId);

                if (tacheIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(`Erreur : La tâche avec l'ID "${taskId}" n'existe pas\n`);
                    return;
                }

                // Modifie la tâche
                taches[tacheIndex].nom = parsedBody.nom;

                // Réécrit le fichier avec les tâches mises à jour
                fs.writeFileSync('taches.json', JSON.stringify({ taches }, null, 2), 'utf8');

                worker();
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Tâche "${taskId}" modifiée avec succès\n`);
            } catch (error) {
                console.error("Erreur lors de l'analyse du corps :", error.message);
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Erreur : ${error.message}\n`);
            }
        } else if (req.method === 'DELETE' && req.url.includes('taches')) {
            // URL: /taches/:id

            const urlParts = req.url.split('/'); // Divise l'URL pour récupérer l'ID ou la tâche
            const taskToDelete = decodeURIComponent(urlParts[2]); // Récupère la tâche à supprimer

            if (!taskToDelete) {
                res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Erreur : Aucune tâche spécifiée pour suppression\n');
                return;
            }

            const data = readFiles(); // Récupère toutes les tâches
            const updatedTaches = data.taches.filter(tache => tache.id != taskToDelete); // Supprime la tâche correspondante
            if (data.taches.length === updatedTaches.length) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Erreur : La tâche "${taskToDelete}" n'existe pas\n`);
                return;
            }

            // Réécrit le fichier avec les tâches restantes
            fs.writeFileSync('taches.json', JSON.stringify({ taches: updatedTaches }, null, 2), 'utf8');
            worker();
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Tâche "${taskToDelete}" supprimée avec succès\n`);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found\n');
        }
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});