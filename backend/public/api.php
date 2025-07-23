<?php
/*
========================================
FICHIER: public/api.php
Version 2.4 - API Journée des Proches
SUPPRESSION DU CHAMP SERVICE
========================================
*/

// Avant tout output
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");

// Si c'est une requête OPTIONS (préflight), on arrête ici
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Démarrer la capture de sortie pour éviter les problèmes de headers
ob_start();

// Désactiver l'affichage des erreurs en production
error_reporting(0);
ini_set('display_errors', 0);


// Fonction pour charger les variables d'environnement depuis un fichier .env
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorer les commentaires
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Traiter les lignes avec le format KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Supprimer les guillemets si présents
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }

            // Définir la variable d'environnement
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
    return true;
}

// Charger les variables d'environnement
$envFile = __DIR__ . '/../.env';
if (!loadEnv($envFile)) {
    error_log('Fichier .env non trouvé. Utilisation des valeurs par défaut.');
}

// Configuration base de données
$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'journee_proches';
$username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de connexion à la base de données',
        'details' => $e->getMessage()
    ]);
    exit();
}

// Création de la table admin si elle n'existe pas
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");

    // Vérifier si un admin par défaut existe déjà
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM admins");
    $result = $stmt->fetch();

    // Si aucun admin n'existe, créer un admin par défaut (admin/admin123)
    if ($result['count'] == 0) {
        $defaultUsername = 'admin';
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO admins (username, password, role) 
            VALUES (?, ?, 'admin')
        ");
        $stmt->execute([$defaultUsername, $defaultPassword]);

        error_log('Admin par défaut créé: admin/admin123');
    }
} catch (PDOException $e) {
    error_log('Erreur lors de la création de la table admins: ' . $e->getMessage());
}

// Récupération du path
$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Nettoyer la sortie buffer avant de continuer
ob_end_clean();

// Router principal
try {
    switch ($path) {
        case 'test':
            if ($method === 'GET') {
                echo json_encode([
                    'status' => 'OK',
                    'message' => 'API v2.4 fonctionnelle - Sans champ service',
                    'timestamp' => date('Y-m-d H:i:s'),
                    'database' => 'Connecté à ' . $dbname,
                    'version' => '2.4',
                    'features' => [
                        'Gestion des statuts (inscrit, present, absent, annule)',
                        'Pointage automatique avec heure de validation',
                        'Modification des statuts en temps réel',
                        'Statistiques avancées par statut',
                        'Export CSV et sauvegarde JSON',
                        'Pointage en masse',
                        'Structure simplifiée sans champ service'
                    ]
                ]);
            } else {
                throw new Exception('Méthode non autorisée pour /test');
            }
            break;

        case 'agents':
            if ($method === 'GET') {
                // Récupérer tous les agents avec leur statut et heure de validation
                $stmt = $pdo->query("
                    SELECT id, code_personnel, nom, prenom, nombre_proches, 
                           statut, heure_validation, heure_arrivee, note, date_inscription, updated_at 
                    FROM agents_inscriptions 
                    ORDER BY nom, prenom
                ");
                $agents = $stmt->fetchAll();
                echo json_encode($agents);

            } elseif ($method === 'POST') {
                // Ajouter un nouvel agent
                $input = json_decode(file_get_contents('php://input'), true);

                if (!$input) {
                    throw new Exception('Données JSON invalides');
                }

                // Validation des champs requis (service retiré)
                $required = ['code_personnel', 'nom', 'prenom', 'nombre_proches', 'heure_arrivee'];
                foreach ($required as $field) {
                    if (!isset($input[$field])) {
                        throw new Exception("Champ requis manquant: $field");
                    }
                }

                // Validation des données
                if (!preg_match('/^[0-9]{7}[A-Za-z]{1}$/', $input['code_personnel'])) {
                    throw new Exception('Le code personnel doit contenir exactement 7 chiffres suivis d\'une lettre (ex: 1234567A)');
                }

                if ($input['nombre_proches'] < 0 || $input['nombre_proches'] > 4) {
                    throw new Exception('Le nombre de proches doit être entre 0 et 4');
                }

                // Statut par défaut
                $statut = $input['statut'] ?? 'inscrit';
                $statutsValides = ['inscrit', 'present', 'absent', 'annule'];
                if (!in_array($statut, $statutsValides)) {
                    throw new Exception('Statut invalide. Valeurs autorisées: ' . implode(', ', $statutsValides));
                }

                // Vérifier que l'agent n'existe pas déjà
                $stmt = $pdo->prepare("SELECT id FROM agents_inscriptions WHERE code_personnel = ?");
                $stmt->execute([$input['code_personnel']]);
                if ($stmt->fetch()) {
                    throw new Exception('Un agent avec ce code personnel est déjà inscrit');
                }

                // Vérifier la capacité du créneau (seulement pour les statuts 'inscrit' et 'present')
                if (in_array($statut, ['inscrit', 'present'])) {
                    $stmt = $pdo->prepare("
                        SELECT COALESCE(SUM(nombre_proches + 1), 0) as personnes_total 
                        FROM agents_inscriptions 
                        WHERE heure_arrivee = ? AND statut IN ('inscrit', 'present')
                    ");
                    $stmt->execute([$input['heure_arrivee']]);
                    $result = $stmt->fetch();
                    $personnesActuelles = $result['personnes_total'];
                    $personnesTotal = $personnesActuelles + $input['nombre_proches'] + 1;

                    if ($personnesTotal > 14) {
                        throw new Exception("Capacité du créneau dépassée. Places restantes: " . (14 - $personnesActuelles));
                    }
                }

                // Insérer l'agent (sans service)
                $stmt = $pdo->prepare("
                    INSERT INTO agents_inscriptions 
                    (code_personnel, nom, prenom, nombre_proches, statut, heure_arrivee) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $input['code_personnel'],
                    strtoupper(trim($input['nom'])),
                    ucfirst(strtolower(trim($input['prenom']))),
                    (int)$input['nombre_proches'],
                    $statut,
                    $input['heure_arrivee']
                ]);

                $id = $pdo->lastInsertId();

                echo json_encode([
                    'success' => true,
                    'message' => 'Agent inscrit avec succès',
                    'id' => $id,
                    'agent' => [
                        'id' => $id,
                        'code_personnel' => $input['code_personnel'],
                        'nom' => strtoupper(trim($input['nom'])),
                        'prenom' => ucfirst(strtolower(trim($input['prenom']))),
                        'nombre_proches' => (int)$input['nombre_proches'],
                        'statut' => $statut,
                        'heure_validation' => null,
                        'heure_arrivee' => $input['heure_arrivee'],
                        'date_inscription' => date('Y-m-d H:i:s')
                    ]
                ]);

            } elseif ($method === 'PUT') {
                // Modifier un agent (notamment le statut)
                $input = json_decode(file_get_contents('php://input'), true);
                $code = $_GET['code'] ?? '';

                if (empty($code)) {
                    throw new Exception('Code personnel manquant pour la modification');
                }

                if (!$input) {
                    throw new Exception('Données JSON invalides');
                }

                // Vérifier que l'agent existe
                $stmt = $pdo->prepare("SELECT * FROM agents_inscriptions WHERE code_personnel = ?");
                $stmt->execute([$code]);
                $agent = $stmt->fetch();

                if (!$agent) {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Agent non trouvé',
                        'code_personnel' => $code
                    ]);
                    return;
                }

                // Préparer les champs à modifier
                $updates = [];
                $params = [];

                if (isset($input['statut'])) {
                    $statutsValides = ['inscrit', 'present', 'absent', 'annule'];
                    if (!in_array($input['statut'], $statutsValides)) {
                        throw new Exception('Statut invalide. Valeurs autorisées: ' . implode(', ', $statutsValides));
                    }
                    $updates[] = "statut = ?";
                    $params[] = $input['statut'];

                    // Si on passe au statut "present", enregistrer l'heure de validation
                    if ($input['statut'] === 'present' && $agent['statut'] !== 'present') {
                        $updates[] = "heure_validation = NOW()";
                    }
                    // Si on quitte le statut "present", remettre heure_validation à NULL
                    elseif ($input['statut'] !== 'present' && $agent['statut'] === 'present') {
                        $updates[] = "heure_validation = NULL";
                    }
                }

                if (isset($input['heure_arrivee'])) {
                    $updates[] = "heure_arrivee = ?";
                    $params[] = $input['heure_arrivee'];
                }

                if (isset($input['nombre_proches'])) {
                    if ($input['nombre_proches'] < 0 || $input['nombre_proches'] > 4) {
                        throw new Exception('Le nombre de proches doit être entre 0 et 4');
                    }
                    $updates[] = "nombre_proches = ?";
                    $params[] = (int)$input['nombre_proches'];
                }

                if (isset($input['note'])) {
                    $updates[] = "note = ?";
                    $params[] = $input['note'];
                }

                if (empty($updates)) {
                    throw new Exception('Aucune modification spécifiée');
                }

                // Ajouter la mise à jour du timestamp
                $updates[] = "updated_at = NOW()";
                $params[] = $code;

                // Exécuter la mise à jour
                $sql = "UPDATE agents_inscriptions SET " . implode(', ', $updates) . " WHERE code_personnel = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                // Récupérer l'agent mis à jour
                $stmt = $pdo->prepare("SELECT * FROM agents_inscriptions WHERE code_personnel = ?");
                $stmt->execute([$code]);
                $agentMisAJour = $stmt->fetch();

                echo json_encode([
                    'success' => true,
                    'message' => "Agent {$agent['prenom']} {$agent['nom']} mis à jour avec succès",
                    'agent' => $agentMisAJour
                ]);

            } elseif ($method === 'DELETE') {
                // Supprimer un agent
                $code = $_GET['code'] ?? '';
                if (empty($code)) {
                    throw new Exception('Code personnel manquant pour la suppression');
                }

                // Vérifier que l'agent existe
                $stmt = $pdo->prepare("SELECT id, nom, prenom FROM agents_inscriptions WHERE code_personnel = ?");
                $stmt->execute([$code]);
                $agent = $stmt->fetch();

                if (!$agent) {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Agent non trouvé',
                        'code_personnel' => $code
                    ]);
                    return;
                }

                // Supprimer l'agent
                $stmt = $pdo->prepare("DELETE FROM agents_inscriptions WHERE code_personnel = ?");
                $stmt->execute([$code]);

                echo json_encode([
                    'success' => true,
                    'message' => "Agent {$agent['prenom']} {$agent['nom']} supprimé avec succès",
                    'code_personnel' => $code
                ]);

            } else {
                throw new Exception('Méthode non autorisée pour /agents');
            }
            break;

        case 'search':
            if ($method === 'GET') {
                $q = $_GET['q'] ?? '';
                if (empty($q)) {
                    throw new Exception('Paramètre de recherche manquant');
                }

                $stmt = $pdo->prepare("
                    SELECT id, code_personnel, nom, prenom, nombre_proches, 
                           statut, heure_validation, heure_arrivee, note, date_inscription, updated_at
                    FROM agents_inscriptions 
                    WHERE code_personnel = ?
                ");
                $stmt->execute([$q]);
                $agent = $stmt->fetch();

                if ($agent) {
                    echo json_encode($agent);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Agent non trouvé',
                        'code_personnel' => $q
                    ]);
                }
            } else {
                throw new Exception('Méthode non autorisée pour /search');
            }
            break;

        case 'creneaux':
            if ($method === 'GET') {
                // Définir tous les créneaux possibles
                $creneauxMatin = ['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40'];
                $creneauxApresMidi = ['13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40'];

                // Récupérer les statistiques (seulement les agents inscrits et présents comptent pour la capacité)
                $stmt = $pdo->query("
                    SELECT 
                        TIME_FORMAT(heure_arrivee, '%H:%i') as heure_creneau,
                        COUNT(*) as agents_inscrits,
                        SUM(nombre_proches + 1) as personnes_total
                    FROM agents_inscriptions 
                    WHERE statut IN ('inscrit', 'present')
                    GROUP BY heure_arrivee
                    ORDER BY heure_arrivee
                ");

                $stats = [];
                while ($row = $stmt->fetch()) {
                    $stats[$row['heure_creneau']] = [
                        'agents_inscrits' => (int)$row['agents_inscrits'],
                        'personnes_total' => (int)$row['personnes_total']
                    ];
                }

                // Construire la réponse
                $response = [
                    'matin' => [],
                    'apres-midi' => []
                ];

                foreach ($creneauxMatin as $heure) {
                    $personnesTotal = isset($stats[$heure]) ? $stats[$heure]['personnes_total'] : 0;
                    $agentsInscrits = isset($stats[$heure]) ? $stats[$heure]['agents_inscrits'] : 0;
                    $placesRestantes = max(0, 14 - $personnesTotal);

                    $response['matin'][$heure] = [
                        'agents_inscrits' => $agentsInscrits,
                        'personnes_total' => $personnesTotal,
                        'places_restantes' => $placesRestantes,
                        'complet' => $personnesTotal >= 14
                    ];
                }

                foreach ($creneauxApresMidi as $heure) {
                    $personnesTotal = isset($stats[$heure]) ? $stats[$heure]['personnes_total'] : 0;
                    $agentsInscrits = isset($stats[$heure]) ? $stats[$heure]['agents_inscrits'] : 0;
                    $placesRestantes = max(0, 14 - $personnesTotal);

                    $response['apres-midi'][$heure] = [
                        'agents_inscrits' => $agentsInscrits,
                        'personnes_total' => $personnesTotal,
                        'places_restantes' => $placesRestantes,
                        'complet' => $personnesTotal >= 14
                    ];
                }

                echo json_encode($response);
            } else {
                throw new Exception('Méthode non autorisée pour /creneaux');
            }
            break;

        case 'stats':
            if ($method === 'GET') {
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total_agents,
                        SUM(nombre_proches) as total_proches,
                        SUM(nombre_proches + 1) as total_personnes,
                        SUM(CASE WHEN heure_arrivee BETWEEN '09:00' AND '11:40' THEN 1 ELSE 0 END) as agents_matin,
                        SUM(CASE WHEN heure_arrivee BETWEEN '13:00' AND '15:40' THEN 1 ELSE 0 END) as agents_apres_midi,
                        SUM(CASE WHEN heure_arrivee BETWEEN '09:00' AND '11:40' THEN (nombre_proches + 1) ELSE 0 END) as personnes_matin,
                        SUM(CASE WHEN heure_arrivee BETWEEN '13:00' AND '15:40' THEN (nombre_proches + 1) ELSE 0 END) as personnes_apres_midi,
                        -- Statistiques par statut
                        SUM(CASE WHEN statut = 'inscrit' THEN 1 ELSE 0 END) as agents_inscrits,
                        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as agents_presents,
                        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as agents_absents,
                        SUM(CASE WHEN statut = 'annule' THEN 1 ELSE 0 END) as agents_annules,
                        -- Statistiques de pointage
                        COUNT(CASE WHEN heure_validation IS NOT NULL THEN 1 END) as agents_pointes,
                        -- Taux de présence
                        ROUND(
                            (SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) * 100.0) / 
                            NULLIF(SUM(CASE WHEN statut IN ('inscrit', 'present', 'absent') THEN 1 ELSE 0 END), 0), 
                            2
                        ) as taux_presence
                    FROM agents_inscriptions
                ");
                $stats = $stmt->fetch();

                // Convertir en entiers
                foreach ($stats as $key => $value) {
                    if ($key !== 'taux_presence') {
                        $stats[$key] = (int)$value;
                    } else {
                        $stats[$key] = (float)$value;
                    }
                }

                // Ajouter des métadonnées
                $stats['timestamp'] = date('Y-m-d H:i:s');
                $stats['capacite_max_par_creneau'] = 14;
                $stats['nb_creneaux_matin'] = 9;
                $stats['nb_creneaux_apres_midi'] = 9;

                echo json_encode($stats);
            } else {
                throw new Exception('Méthode non autorisée pour /stats');
            }
            break;

        case 'export':
            if ($method === 'GET') {
                // Exporter toutes les données en CSV (sans service)
                $stmt = $pdo->query("
                    SELECT 
                        code_personnel,
                        nom,
                        prenom,
                        nombre_proches,
                        (nombre_proches + 1) as total_personnes,
                        heure_arrivee,
                        CASE 
                            WHEN heure_arrivee BETWEEN '09:00' AND '11:40' THEN 'Matin'
                            WHEN heure_arrivee BETWEEN '13:00' AND '15:40' THEN 'Après-midi'
                            ELSE 'Autre'
                        END as periode,
                        statut,
                        heure_validation,
                        date_inscription,
                        updated_at
                    FROM agents_inscriptions 
                    ORDER BY heure_arrivee, nom, prenom
                ");

                $agents = $stmt->fetchAll();

                // Headers CSV (sans service)
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="inscriptions_journee_proches_' . date('Y-m-d_H-i') . '.csv"');
                header('Cache-Control: max-age=0');

                // Créer le fichier CSV
                $output = fopen('php://output', 'w');

                // BOM pour UTF-8
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

                // En-têtes (sans service)
                fputcsv($output, [
                    'Code Personnel',
                    'Nom',
                    'Prénom',
                    'Nb Proches',
                    'Total Personnes',
                    'Heure Arrivée',
                    'Période',
                    'Statut',
                    'Heure Pointage',
                    'Date Inscription',
                    'Dernière Modification'
                ], ';');

                // Données (sans service)
                foreach ($agents as $agent) {
                    fputcsv($output, [
                        $agent['code_personnel'],
                        $agent['nom'],
                        $agent['prenom'],
                        $agent['nombre_proches'],
                        $agent['total_personnes'],
                        $agent['heure_arrivee'],
                        $agent['periode'],
                        ucfirst($agent['statut']),
                        $agent['heure_validation'] ? date('d/m/Y H:i', strtotime($agent['heure_validation'])) : '',
                        date('d/m/Y H:i', strtotime($agent['date_inscription'])),
                        $agent['updated_at'] ? date('d/m/Y H:i', strtotime($agent['updated_at'])) : ''
                    ], ';');
                }

                fclose($output);
                exit();

            } else {
                throw new Exception('Méthode non autorisée pour /export');
            }
            break;

        case 'login':
            if ($method === 'POST') {
                // Authentification
                $input = json_decode(file_get_contents('php://input'), true);

                if (!$input || !isset($input['username']) || !isset($input['password'])) {
                    throw new Exception('Identifiants manquants');
                }

                $username = $input['username'];
                $password = $input['password'];

                // Rechercher l'utilisateur dans la base de données
                $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch();

                if (!$user || !password_verify($password, $user['password'])) {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Identifiants incorrects'
                    ]);
                    return;
                }

                // Générer un token JWT simple (en production, utilisez une bibliothèque JWT)
                $tokenPayload = [
                    'sub' => $user['id'],
                    'username' => $user['username'],
                    'role' => $user['role'],
                    'exp' => time() + 3600 // Expire dans 1 heure
                ];

                // Encodage simple (en production, utilisez une bibliothèque JWT)
                $token = base64_encode(json_encode($tokenPayload));

                echo json_encode([
                    'success' => true,
                    'message' => 'Authentification réussie',
                    'token' => $token,
                    'username' => $user['username'],
                    'role' => $user['role']
                ]);
            } else {
                throw new Exception('Méthode non autorisée pour /login');
            }
            break;

        case 'verify-token':
            if ($method === 'GET') {
                // Vérifier le token d'authentification
                $headers = getallheaders();
                $authHeader = $headers['Authorization'] ?? '';

                if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                    http_response_code(401);
                    echo json_encode([
                        'valid' => false,
                        'message' => 'Token manquant ou invalide'
                    ]);
                    return;
                }

                $token = $matches[1];

                try {
                    // Décodage simple (en production, utilisez une bibliothèque JWT)
                    $payload = json_decode(base64_decode($token), true);

                    // Vérifier si le token a expiré
                    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                        throw new Exception('Token expiré ou invalide');
                    }

                    // Vérifier si l'utilisateur existe toujours
                    $stmt = $pdo->prepare("SELECT id FROM admins WHERE id = ? AND username = ?");
                    $stmt->execute([$payload['sub'], $payload['username']]);

                    if (!$stmt->fetch()) {
                        throw new Exception('Utilisateur non trouvé');
                    }

                    echo json_encode([
                        'valid' => true,
                        'username' => $payload['username'],
                        'role' => $payload['role']
                    ]);
                } catch (Exception $e) {
                    http_response_code(401);
                    echo json_encode([
                        'valid' => false,
                        'message' => $e->getMessage()
                    ]);
                }
            } else {
                throw new Exception('Méthode non autorisée pour /verify-token');
            }
            break;

        default:
            // Page d'accueil de l'API avec documentation complète
            echo json_encode([
                'api' => 'Journée des Proches API v2.4',
                'status' => 'Prêt et fonctionnel - Sans champ service',
                'timestamp' => date('Y-m-d H:i:s'),
                'database' => $dbname,
                'endpoints' => [
                    'GET /' => 'Cette page d\'accueil',
                    'GET /test' => 'Test de connexion et santé de l\'API',
                    'GET /agents' => 'Liste de tous les agents inscrits',
                    'POST /agents' => 'Ajouter un nouvel agent',
                    'PUT /agents?code=CODE' => 'Modifier un agent (statut, etc.)',
                    'DELETE /agents?code=CODE' => 'Supprimer un agent',
                    'GET /search?q=CODE' => 'Rechercher un agent par code personnel',
                    'GET /creneaux' => 'Disponibilités de tous les créneaux',
                    'GET /stats' => 'Statistiques complètes avec statuts',
                    'GET /export' => 'Télécharger export CSV complet',
                    'POST /login' => 'Authentification (username, password)',
                    'GET /verify-token' => 'Vérifier la validité d\'un token d\'authentification'
                ],
                'statuts_disponibles' => ['inscrit', 'present', 'absent', 'annule'],
                'capacite_max_par_creneau' => 14,
                'champs_agent' => ['code_personnel', 'nom', 'prenom', 'nombre_proches', 'heure_arrivee'],
                'exemple_usage' => [
                    'recherche' => '/api.php?path=search&q=1234567A',
                    'modification_statut' => 'PUT /api.php?path=agents&code=1234567A avec {"statut": "present"}',
                    'export_csv' => '/api.php?path=export'
                ]
            ]);
            break;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage(),
        'path' => $path,
        'method' => $method,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de base de données',
        'details' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
