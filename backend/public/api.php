<?php
/*
========================================
FICHIER: public/api.php
Version 2.4 - API Journée des Proches
SUPPRESSION DU CHAMP SERVICE
========================================
*/

// Les en-têtes CORS seront définis après la détection d'environnement

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

// Charger le fichier .env unique
$envFile = __DIR__ . '/../.env';
if (!loadEnv($envFile)) {
    error_log('Fichier .env non trouvé dans : ' . $envFile);
}

// Détecter automatiquement l'environnement selon l'host
$environment = 'development';
$corsOrigin = 'http://localhost:3000';

if (isset($_SERVER['HTTP_HOST'])) {
    $host = $_SERVER['HTTP_HOST'];
    $hostname = explode(':', $host)[0];
    
    // Si ce n'est pas localhost, c'est la production
    if (!in_array($hostname, ['localhost', '127.0.0.1']) && strpos($hostname, '.local') === false) {
        $environment = 'production';
        $corsOrigin = 'https://tmtercvdl.sncf.fr';
    }
}

// Autoriser l'origine de la requête si elle correspond
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin === 'https://tmtercvdl.sncf.fr' || $requestOrigin === 'http://localhost:3000') {
    $corsOrigin = $requestOrigin;
}

$appDebug = filter_var($_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?? true, FILTER_VALIDATE_BOOLEAN);

// Log pour debugging
error_log("=== CORS DEBUG START ===");
error_log("Environment detected: $environment");
error_log("CORS Origin: $corsOrigin");
error_log("Request Origin: $requestOrigin");
error_log("HTTP Host: " . ($_SERVER['HTTP_HOST'] ?? 'undefined'));
error_log("Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'undefined'));
error_log("Path: " . ($_GET['path'] ?? 'undefined'));
error_log("=== CORS DEBUG END ===");

// Définir les en-têtes CORS et Content-Type
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: $corsOrigin");
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

// Configuration des erreurs basée sur l'environnement
if ($appDebug) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}


// Charger la classe WhitelistValidator
require_once __DIR__ . '/../src/WhitelistValidator.php';

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

    // Créer la table d'historique des modifications
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS agent_modifications_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agent_id INT NOT NULL,
            code_personnel VARCHAR(8) NOT NULL,
            field_name VARCHAR(50) NOT NULL,
            old_value TEXT,
            new_value TEXT,
            modified_by VARCHAR(50),
            modification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_agent_code (code_personnel),
            INDEX idx_modification_date (modification_date)
        )
    ");

    // Créer la table whitelist pour les agents autorisés
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS agents_whitelist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code_personnel VARCHAR(8) NOT NULL UNIQUE COMMENT 'Code personnel SNCF (7 chiffres + 1 lettre)',
            nom VARCHAR(100) NULL COMMENT 'Nom en clair pour affichage',
            prenom VARCHAR(100) NULL COMMENT 'Prénom en clair pour affichage',
            nom_hash VARCHAR(64) NOT NULL COMMENT 'Hash SHA-256 du nom (sécurisé)',
            prenom_hash VARCHAR(64) NOT NULL COMMENT 'Hash SHA-256 du prénom (sécurisé)',
            actif TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Agent autorisé à s\'inscrire (1=oui, 0=non)',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_actif (actif),
            INDEX idx_created (created_at),
            INDEX idx_nom (nom),
            INDEX idx_prenom (prenom)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Whitelist sécurisée des agents autorisés - données hachées pour protection RGPD'
    ");

    // Créer la table pour le blocage des créneaux
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS creneaux_bloques (
            id INT AUTO_INCREMENT PRIMARY KEY,
            heure_creneau TIME NOT NULL COMMENT 'Heure du créneau bloqué',
            date_creneau DATE NULL DEFAULT NULL COMMENT 'Date du créneau bloqué (NULL = bloqué pour toutes les dates)',
            bloque TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Créneau bloqué (1) ou débloqué (0)',
            raison VARCHAR(255) DEFAULT NULL COMMENT 'Raison du blocage',
            created_by VARCHAR(50) DEFAULT NULL COMMENT 'Administrateur ayant créé le blocage',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_creneau (heure_creneau, date_creneau),
            INDEX idx_heure_creneau (heure_creneau),
            INDEX idx_bloque (bloque)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Table pour gérer le blocage des créneaux horaires'
    ");

    // Créer la table pour la configuration des créneaux disponibles
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS creneaux_config (
            id INT AUTO_INCREMENT PRIMARY KEY,
            heure_creneau TIME NOT NULL UNIQUE COMMENT 'Heure du créneau',
            periode VARCHAR(20) NOT NULL COMMENT 'Période: matin ou apres-midi',
            capacite INT NOT NULL DEFAULT 14 COMMENT 'Capacité maximale (999 = illimité)',
            actif TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Créneau actif (1) ou supprimé (0)',
            created_by VARCHAR(50) DEFAULT NULL COMMENT 'Administrateur ayant créé le créneau',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_actif (actif),
            INDEX idx_periode (periode)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Configuration des créneaux horaires disponibles'
    ");

    // Insérer les créneaux par défaut s'ils n'existent pas
    $pdo->exec("
        INSERT IGNORE INTO creneaux_config (heure_creneau, periode, capacite) VALUES
        ('09:00', 'matin', 14),
        ('09:20', 'matin', 14),
        ('09:40', 'matin', 14),
        ('10:00', 'matin', 14),
        ('10:20', 'matin', 14),
        ('10:40', 'matin', 14),
        ('11:00', 'matin', 14),
        ('11:20', 'matin', 14),
        ('11:40', 'matin', 14),
        ('12:00', 'matin', 14),
        ('12:20', 'matin', 14),
        ('13:00', 'apres-midi', 14),
        ('13:20', 'apres-midi', 14),
        ('13:40', 'apres-midi', 14),
        ('14:00', 'apres-midi', 14),
        ('14:20', 'apres-midi', 14),
        ('14:40', 'apres-midi', 14),
        ('15:00', 'apres-midi', 999)
    ");
    
    // Ajouter les colonnes nom et prenom si elles n'existent pas déjà
    try {
        // Vérifier si les colonnes existent
        $stmt = $pdo->query("SHOW COLUMNS FROM agents_whitelist LIKE 'nom'");
        if ($stmt->rowCount() == 0) {
            // Ajouter la colonne nom
            $pdo->exec("ALTER TABLE agents_whitelist ADD COLUMN nom VARCHAR(100) NULL AFTER code_personnel");
            error_log("Colonne 'nom' ajoutée à agents_whitelist");
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM agents_whitelist LIKE 'prenom'");
        if ($stmt->rowCount() == 0) {
            // Ajouter la colonne prenom
            $pdo->exec("ALTER TABLE agents_whitelist ADD COLUMN prenom VARCHAR(100) NULL AFTER nom");
            error_log("Colonne 'prenom' ajoutée à agents_whitelist");
        }
        
        // Créer les index si ils n'existent pas
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_agents_whitelist_nom ON agents_whitelist(nom)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_agents_whitelist_prenom ON agents_whitelist(prenom)");
        
    } catch (PDOException $e) {
        // Les colonnes existent peut-être déjà ou erreur, continuer
        error_log("Erreur lors de l'ajout des colonnes nom/prenom: " . $e->getMessage());
    }

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
    error_log('Erreur lors de la création des tables: ' . $e->getMessage());
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
                        'Structure simplifiée sans champ service',
                        'Whitelist sécurisée pour l\'autorisation d\'inscription'
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
                           statut, heure_validation, heure_arrivee, note, restauration_sur_place, 
                           date_inscription, updated_at 
                    FROM agents_inscriptions 
                    ORDER BY nom, prenom
                ");
                $agents = $stmt->fetchAll();
                echo json_encode($agents);

            } elseif ($method === 'POST') {
                // Ajouter un nouvel agent
                $rawInput = file_get_contents('php://input');

                // S'assurer que les données sont en UTF-8
                if (!mb_check_encoding($rawInput, 'UTF-8')) {
                    $rawInput = mb_convert_encoding($rawInput, 'UTF-8');
                }

                $input = json_decode($rawInput, true);

                if (!$input) {
                    error_log("Erreur JSON decode: " . json_last_error_msg());
                    error_log("Données reçues: " . $rawInput);
                    throw new Exception('Données JSON invalides: ' . json_last_error_msg());
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

                // VALIDATION WHITELIST - Vérifier si l'agent est autorisé à s'inscrire
                try {
                    $whitelistValidator = new WhitelistValidator($pdo);
                    $validationResult = $whitelistValidator->validateAgent(
                        $input['code_personnel'],
                        $input['nom'],
                        $input['prenom']
                    );

                    if (!$validationResult['success'] || !$validationResult['authorized']) {
                        http_response_code(403);
                        echo json_encode([
                            'error' => 'Agent non autorisé',
                            'message' => $validationResult['message'],
                            'error_type' => $validationResult['error_type'] ?? 'VALIDATION_ERROR',
                            'code_personnel' => $input['code_personnel']
                        ]);
                        return;
                    }
                } catch (Exception $e) {
                    error_log('Erreur whitelist validation: ' . $e->getMessage());
                    throw new Exception('Erreur lors de la validation de l\'autorisation d\'inscription');
                }

                if ($input['nombre_proches'] < 0 || $input['nombre_proches'] > 4) {
                    throw new Exception('Le nombre de proches doit être entre 0 et 4');
                }

                // Vérifier si le créneau est bloqué
                $stmt = $pdo->prepare("
                    SELECT bloque, raison
                    FROM creneaux_bloques
                    WHERE heure_creneau = ?
                      AND bloque = 1
                      AND (date_creneau IS NULL OR date_creneau = CURDATE())
                ");
                $stmt->execute([$input['heure_arrivee']]);
                $creneauBloque = $stmt->fetch();

                if ($creneauBloque) {
                    $message = 'Le créneau ' . $input['heure_arrivee'] . ' est actuellement bloqué et n\'accepte pas de nouvelles inscriptions.';
                    if ($creneauBloque['raison']) {
                        $message .= ' Raison: ' . $creneauBloque['raison'];
                    }
                    http_response_code(403);
                    echo json_encode([
                        'error' => 'Créneau bloqué',
                        'message' => $message,
                        'error_type' => 'CRENEAU_BLOQUE',
                        'raison' => $creneauBloque['raison']
                    ]);
                    return;
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

                // Vérifier si le créneau est réservé aux administrateurs
                $stmt = $pdo->prepare("
                    SELECT admin_only
                    FROM creneaux_config
                    WHERE heure_creneau = ? AND actif = 1
                ");
                $stmt->execute([$input['heure_arrivee']]);
                $creneauConfig = $stmt->fetch();

                if ($creneauConfig && $creneauConfig['admin_only']) {
                    // Vérifier l'authentification admin
                    $headers = getallheaders();
                    $authHeader = $headers['Authorization'] ?? '';
                    $isAdmin = false;

                    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                        $token = $matches[1];
                        try {
                            $payload = json_decode(base64_decode($token), true);
                            if ($payload && isset($payload['exp']) && $payload['exp'] >= time()) {
                                // Vérifier que l'utilisateur existe encore dans la base
                                if (isset($payload['sub']) && isset($payload['username'])) {
                                    $stmt = $pdo->prepare("SELECT role FROM admins WHERE id = ? AND username = ?");
                                    $stmt->execute([$payload['sub'], $payload['username']]);
                                    $admin = $stmt->fetch();

                                    if ($admin) {
                                        $isAdmin = true;
                                        error_log("Admin validé pour créneau admin-only " . $input['heure_arrivee'] . ": " . $payload['username']);
                                    }
                                }
                            }
                        } catch (Exception $e) {
                            error_log("Erreur décodage token admin: " . $e->getMessage());
                        }
                    }

                    if (!$isAdmin) {
                        error_log("Accès refusé au créneau admin-only " . $input['heure_arrivee'] . " - utilisateur non admin");
                        http_response_code(403);
                        echo json_encode([
                            'error' => 'Créneau réservé aux bénévoles',
                            'message' => 'Ce créneau est réservé aux bénévoles. Veuillez contacter un administrateur pour vous inscrire sur ce créneau.',
                            'error_type' => 'CRENEAU_RESERVE',
                            'contact_admin' => true
                        ]);
                        return;
                    }
                }

                // Vérifier si l'inscription est pour le créneau de 15h (réservé aux administrateurs) - LEGACY CODE
                if ($input['heure_arrivee'] === '15:00') {
                    // Vérifier l'authentification admin
                    $headers = getallheaders();
                    $authHeader = $headers['Authorization'] ?? '';
                    $isAdmin = false;

                    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                        $token = $matches[1];
                        try {
                            $payload = json_decode(base64_decode($token), true);
                            if ($payload && isset($payload['exp']) && $payload['exp'] >= time()) {
                                // Vérifier que l'utilisateur existe encore dans la base
                                if (isset($payload['sub']) && isset($payload['username'])) {
                                    $stmt = $pdo->prepare("SELECT role FROM admins WHERE id = ? AND username = ?");
                                    $stmt->execute([$payload['sub'], $payload['username']]);
                                    $admin = $stmt->fetch();

                                    if ($admin) {
                                        $isAdmin = true;
                                        error_log("Admin validé pour créneau 15h: " . $payload['username'] . " (role: " . $admin['role'] . ")");
                                    } else {
                                        error_log("Admin non trouvé en base: " . $payload['username']);
                                    }
                                } else {
                                    error_log("Token admin invalide: champs sub ou username manquants");
                                }
                            } else {
                                error_log("Token admin expiré ou invalide");
                            }
                        } catch (Exception $e) {
                            error_log("Erreur décodage token admin: " . $e->getMessage());
                        }
                    } else {
                        error_log("Header Authorization manquant ou invalide pour créneau 15h");
                    }

                    if (!$isAdmin) {
                        error_log("Accès refusé au créneau 15h - utilisateur non admin");
                        http_response_code(403);
                        echo json_encode([
                            'error' => 'Créneau réservé aux bénévoles',
                            'message' => 'Le créneau de 15h00 est réservé aux bénévoles. Veuillez contacter un administrateur pour vous inscrire sur ce créneau.',
                            'error_type' => 'CRENEAU_RESERVE',
                            'contact_admin' => true,
                            'debug_auth' => $appDebug ? [
                                'has_auth_header' => !empty($authHeader),
                                'token_present' => !empty($matches[1] ?? ''),
                            ] : null
                        ]);
                        return;
                    } else {
                        error_log("Accès autorisé au créneau 15h pour admin");
                    }
                }

                // Vérifier la capacité du créneau (seulement pour les statuts 'inscrit' et 'present')
                // Exception: pas de limite pour le créneau de 15h00 réservé aux bénévoles
                if (in_array($statut, ['inscrit', 'present']) && $input['heure_arrivee'] !== '15:00') {
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

                // Récupérer la valeur de restauration sur place (par défaut 0)
                $restaurationSurPlace = isset($input['restauration_sur_place']) ? (int)$input['restauration_sur_place'] : 0;

                // Insérer l'agent (avec restauration sur place)
                $stmt = $pdo->prepare("
                    INSERT INTO agents_inscriptions 
                    (code_personnel, nom, prenom, nombre_proches, statut, heure_arrivee, restauration_sur_place) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $input['code_personnel'],
                    strtoupper(trim($input['nom'])),
                    trim($input['prenom']), // Garder la casse originale pour le prénom
                    (int)$input['nombre_proches'],
                    $statut,
                    $input['heure_arrivee'],
                    $restaurationSurPlace
                ]);

                $id = $pdo->lastInsertId();

                // Recalculer les places restantes pour ce créneau après l'inscription
                $stmt = $pdo->prepare("
                    SELECT COALESCE(SUM(nombre_proches + 1), 0) as personnes_total
                    FROM agents_inscriptions
                    WHERE heure_arrivee = ? AND statut IN ('inscrit', 'present')
                ");
                $stmt->execute([$input['heure_arrivee']]);
                $result = $stmt->fetch();
                $personnesActuelles = $result['personnes_total'];

                // Récupérer la capacité configurée pour ce créneau
                $stmt = $pdo->prepare("
                    SELECT capacite
                    FROM creneaux_config
                    WHERE heure_creneau = ? AND actif = 1
                ");
                $stmt->execute([$input['heure_arrivee']]);
                $creneauConfig = $stmt->fetch();
                $capacite = $creneauConfig ? (int)$creneauConfig['capacite'] : 14;

                $placesRestantes = ($capacite === 999) ? 999 : max(0, $capacite - $personnesActuelles);

                echo json_encode([
                    'success' => true,
                    'message' => 'Agent inscrit avec succès',
                    'id' => $id,
                    'agent' => [
                        'id' => $id,
                        'code_personnel' => $input['code_personnel'],
                        'nom' => strtoupper(trim($input['nom'])),
                        'prenom' => trim($input['prenom']),
                        'nombre_proches' => (int)$input['nombre_proches'],
                        'statut' => $statut,
                        'heure_validation' => null,
                        'heure_arrivee' => $input['heure_arrivee'],
                        'date_inscription' => date('Y-m-d H:i:s')
                    ],
                    'creneau_info' => [
                        'heure' => $input['heure_arrivee'],
                        'personnes_total' => $personnesActuelles,
                        'places_restantes' => $placesRestantes,
                        'capacite' => $capacite
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

                if (isset($input['nom'])) {
                    $updates[] = "nom = ?";
                    $params[] = strtoupper(trim($input['nom']));
                }

                if (isset($input['prenom'])) {
                    $updates[] = "prenom = ?";
                    $params[] = ucfirst(strtolower(trim($input['prenom'])));
                }

                if (isset($input['restauration_sur_place'])) {
                    $updates[] = "restauration_sur_place = ?";
                    $params[] = (int)$input['restauration_sur_place'];
                }

                if (empty($updates)) {
                    throw new Exception('Aucune modification spécifiée');
                }

                // Ajouter la mise à jour du timestamp
                $updates[] = "updated_at = NOW()";
                $params[] = $code;

                // Préparer l'historique des modifications avant la mise à jour
                $changesHistory = [];
                foreach ($input as $field => $newValue) {
                    if (isset($agent[$field]) && $agent[$field] != $newValue) {
                        $changesHistory[] = [
                            'field' => $field,
                            'old_value' => $agent[$field],
                            'new_value' => $newValue
                        ];
                    }
                }

                // Exécuter la mise à jour
                $sql = "UPDATE agents_inscriptions SET " . implode(', ', $updates) . " WHERE code_personnel = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                // Enregistrer l'historique des modifications
                if (!empty($changesHistory)) {
                    // Récupérer les informations de l'utilisateur administrateur connecté
                    $headers = getallheaders();
                    $authHeader = $headers['Authorization'] ?? '';
                    $modifiedBy = 'unknown';
                    
                    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                        $token = $matches[1];
                        try {
                            $payload = json_decode(base64_decode($token), true);
                            if ($payload && isset($payload['username'])) {
                                $modifiedBy = $payload['username'];
                            }
                        } catch (Exception $e) {
                            // Si on ne peut pas décoder le token, on garde 'unknown'
                        }
                    }

                    // Insérer chaque modification dans l'historique
                    $historyStmt = $pdo->prepare("
                        INSERT INTO agent_modifications_history 
                        (agent_id, code_personnel, field_name, old_value, new_value, modified_by) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    
                    foreach ($changesHistory as $change) {
                        $historyStmt->execute([
                            $agent['id'],
                            $code,
                            $change['field'],
                            $change['old_value'],
                            $change['new_value'],
                            $modifiedBy
                        ]);
                    }
                }

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
                           statut, heure_validation, heure_arrivee, note, restauration_sur_place, 
                           date_inscription, updated_at
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

        case 'history':
            if ($method === 'GET') {
                // Vérifier l'authentification
                $headers = getallheaders();
                $authHeader = $headers['Authorization'] ?? '';
                
                if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Token d\'authentification requis']);
                    return;
                }
                
                $token = $matches[1];
                try {
                    $payload = json_decode(base64_decode($token), true);
                    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                        throw new Exception('Token expiré');
                    }
                } catch (Exception $e) {
                    http_response_code(401);
                    echo json_encode(['error' => 'Token invalide']);
                    return;
                }

                $code = $_GET['code'] ?? '';
                if (empty($code)) {
                    throw new Exception('Code personnel manquant pour l\'historique');
                }

                // Récupérer l'historique des modifications pour cet agent
                $stmt = $pdo->prepare("
                    SELECT 
                        h.id,
                        h.field_name,
                        h.old_value,
                        h.new_value,
                        h.modified_by,
                        h.modification_date,
                        a.nom,
                        a.prenom
                    FROM agent_modifications_history h
                    LEFT JOIN agents_inscriptions a ON h.agent_id = a.id
                    WHERE h.code_personnel = ?
                    ORDER BY h.modification_date DESC
                    LIMIT 50
                ");
                $stmt->execute([$code]);
                $history = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'history' => $history,
                    'code_personnel' => $code
                ]);
            } else {
                throw new Exception('Méthode non autorisée pour /history');
            }
            break;

        case 'creneaux':
            if ($method === 'GET') {
                // Récupérer les créneaux depuis la configuration
                $stmtConfig = $pdo->query("
                    SELECT TIME_FORMAT(heure_creneau, '%H:%i') as heure_creneau, periode, capacite, admin_only
                    FROM creneaux_config
                    WHERE actif = 1
                    ORDER BY heure_creneau
                ");

                $creneauxMatin = [];
                $creneauxApresMidi = [];
                $capacites = [];
                $adminOnly = [];

                while ($row = $stmtConfig->fetch()) {
                    $heure = $row['heure_creneau'];
                    $capacites[$heure] = (int)$row['capacite'];
                    $adminOnly[$heure] = (bool)$row['admin_only'];

                    if ($row['periode'] === 'matin') {
                        $creneauxMatin[] = $heure;
                    } else {
                        $creneauxApresMidi[] = $heure;
                    }
                }

                // Récupérer les créneaux bloqués
                $stmt = $pdo->query("
                    SELECT TIME_FORMAT(heure_creneau, '%H:%i') as heure_creneau, bloque, raison
                    FROM creneaux_bloques
                    WHERE bloque = 1 AND (date_creneau IS NULL OR date_creneau = CURDATE())
                ");
                $creneauxBloques = [];
                while ($row = $stmt->fetch()) {
                    $creneauxBloques[$row['heure_creneau']] = [
                        'bloque' => (bool)$row['bloque'],
                        'raison' => $row['raison']
                    ];
                }

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
                    $capacite = isset($capacites[$heure]) ? $capacites[$heure] : 14;
                    $placesRestantes = ($capacite === 999) ? 999 : max(0, $capacite - $personnesTotal);
                    $isBloque = isset($creneauxBloques[$heure]);

                    $response['matin'][$heure] = [
                        'agents_inscrits' => $agentsInscrits,
                        'personnes_total' => $personnesTotal,
                        'places_restantes' => $placesRestantes,
                        'complet' => ($capacite !== 999 && $personnesTotal >= $capacite),
                        'bloque' => $isBloque,
                        'raison_blocage' => $isBloque ? $creneauxBloques[$heure]['raison'] : null,
                        'admin_only' => isset($adminOnly[$heure]) ? $adminOnly[$heure] : false
                    ];
                }

                foreach ($creneauxApresMidi as $heure) {
                    $personnesTotal = isset($stats[$heure]) ? $stats[$heure]['personnes_total'] : 0;
                    $agentsInscrits = isset($stats[$heure]) ? $stats[$heure]['agents_inscrits'] : 0;
                    $isBloque = isset($creneauxBloques[$heure]);
                    $capacite = isset($capacites[$heure]) ? $capacites[$heure] : 14;

                    // Utiliser la capacité configurée
                    if ($capacite === 999) {
                        $placesRestantes = 999; // Nombre illimité
                        $complet = false;
                    } else {
                        $placesRestantes = max(0, $capacite - $personnesTotal);
                        $complet = $personnesTotal >= $capacite;
                    }

                    $response['apres-midi'][$heure] = [
                        'agents_inscrits' => $agentsInscrits,
                        'personnes_total' => $personnesTotal,
                        'places_restantes' => $placesRestantes,
                        'complet' => $complet,
                        'bloque' => $isBloque,
                        'raison_blocage' => $isBloque ? $creneauxBloques[$heure]['raison'] : null,
                        'admin_only' => isset($adminOnly[$heure]) ? $adminOnly[$heure] : false
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
                        SUM(CASE WHEN heure_arrivee BETWEEN '09:00' AND '12:20' THEN 1 ELSE 0 END) as agents_matin,
                        SUM(CASE WHEN heure_arrivee BETWEEN '13:00' AND '15:00' THEN 1 ELSE 0 END) as agents_apres_midi,
                        SUM(CASE WHEN heure_arrivee BETWEEN '09:00' AND '12:20' THEN (nombre_proches + 1) ELSE 0 END) as personnes_matin,
                        SUM(CASE WHEN heure_arrivee BETWEEN '13:00' AND '15:00' THEN (nombre_proches + 1) ELSE 0 END) as personnes_apres_midi,
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
                        ) as taux_presence,
                        -- Statistiques restauration
                        SUM(CASE WHEN restauration_sur_place = 1 THEN 1 ELSE 0 END) as agents_restauration,
                        FLOOR(
                            (SUM(CASE WHEN restauration_sur_place = 1 THEN 1 ELSE 0 END) * 100.0) / 
                            NULLIF(COUNT(*), 0)
                        ) as taux_restauration
                    FROM agents_inscriptions
                ");
                $stats = $stmt->fetch();

                // Convertir en entiers et floats
                foreach ($stats as $key => $value) {
                    if (in_array($key, ['taux_presence', 'taux_restauration'])) {
                        $stats[$key] = (float)$value;
                    } else {
                        $stats[$key] = (int)$value;
                    }
                }

                // Ajouter des métadonnées
                $stats['timestamp'] = date('Y-m-d H:i:s');
                $stats['capacite_max_par_creneau'] = 14;
                $stats['nb_creneaux_matin'] = 12;
                $stats['nb_creneaux_apres_midi'] = 6;

                echo json_encode($stats);
            } else {
                throw new Exception('Méthode non autorisée pour /stats');
            }
            break;

        case 'export':
            if ($method === 'GET') {
                // Exporter toutes les données en CSV (avec note et restauration)
                $stmt = $pdo->query("
                    SELECT 
                        code_personnel,
                        nom,
                        prenom,
                        nombre_proches,
                        (nombre_proches + 1) as total_personnes,
                        heure_arrivee,
                        CASE 
                            WHEN heure_arrivee BETWEEN '09:00' AND '12:20' THEN 'Matin'
                            WHEN heure_arrivee BETWEEN '13:00' AND '15:00' THEN 'Après-midi'
                            ELSE 'Autre'
                        END as periode,
                        statut,
                        heure_validation,
                        CASE 
                            WHEN restauration_sur_place = 1 THEN 'Oui'
                            ELSE 'Non'
                        END as restauration_sur_place,
                        note,
                        date_inscription,
                        updated_at
                    FROM agents_inscriptions 
                    ORDER BY heure_arrivee, nom, prenom
                ");

                $agents = $stmt->fetchAll();

                // Headers CSV (avec note et restauration)
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="inscriptions_journee_proches_' . date('Y-m-d_H-i') . '.csv"');
                header('Cache-Control: max-age=0');

                // Créer le fichier CSV
                $output = fopen('php://output', 'w');

                // BOM pour UTF-8
                fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

                // En-têtes (avec note et restauration)
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
                    'Restauration Sur Place',
                    'Note',
                    'Date Inscription',
                    'Dernière Modification'
                ], ';');

                // Données (avec note et restauration)
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
                        $agent['restauration_sur_place'],
                        $agent['note'] ? $agent['note'] : '',
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

        case 'admins':
            // Vérifier l'authentification pour les routes admin
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token d\'authentification requis']);
                return;
            }
            
            $token = $matches[1];
            try {
                $payload = json_decode(base64_decode($token), true);
                if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                    throw new Exception('Token expiré');
                }
                
                $stmt = $pdo->prepare("SELECT id, role FROM admins WHERE id = ? AND username = ?");
                $stmt->execute([$payload['sub'], $payload['username']]);
                $currentUser = $stmt->fetch();
                
                if (!$currentUser) {
                    throw new Exception('Utilisateur non trouvé');
                }
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }
            
            if ($method === 'GET') {
                // Lister tous les administrateurs
                $stmt = $pdo->query("
                    SELECT id, username, role, created_at, updated_at,
                           CASE WHEN id = 1 THEN 1 ELSE 0 END as is_default
                    FROM admins 
                    ORDER BY created_at DESC
                ");
                $admins = $stmt->fetchAll();
                
                // Convertir is_default en boolean
                foreach ($admins as &$admin) {
                    $admin['is_default'] = (bool)$admin['is_default'];
                }
                
                echo json_encode($admins);
                
            } elseif ($method === 'POST') {
                // Ajouter un nouvel administrateur
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['username']) || !isset($input['password'])) {
                    throw new Exception('Nom d\'utilisateur et mot de passe requis');
                }
                
                // Vérifier que l'utilisateur n'existe pas déjà
                $stmt = $pdo->prepare("SELECT id FROM admins WHERE username = ?");
                $stmt->execute([$input['username']]);
                if ($stmt->fetch()) {
                    throw new Exception('Un utilisateur avec ce nom existe déjà');
                }
                
                $role = $input['role'] ?? 'admin';
                if (!in_array($role, ['admin', 'super-admin'])) {
                    throw new Exception('Rôle invalide');
                }
                
                // Hacher le mot de passe
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                
                // Insérer le nouvel administrateur
                $stmt = $pdo->prepare("
                    INSERT INTO admins (username, password, role) 
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$input['username'], $hashedPassword, $role]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Administrateur ajouté avec succès',
                    'id' => $pdo->lastInsertId()
                ]);
                
            } elseif ($method === 'DELETE') {
                // Supprimer un administrateur
                $adminId = $_GET['id'] ?? '';
                if (empty($adminId)) {
                    throw new Exception('ID de l\'administrateur manquant');
                }
                
                // Empêcher la suppression de l'admin par défaut (ID 1)
                if ($adminId == 1) {
                    throw new Exception('Impossible de supprimer l\'administrateur par défaut');
                }
                
                // Empêcher de se supprimer soi-même
                if ($adminId == $currentUser['id']) {
                    throw new Exception('Vous ne pouvez pas supprimer votre propre compte');
                }
                
                // Vérifier que l'admin existe
                $stmt = $pdo->prepare("SELECT username FROM admins WHERE id = ?");
                $stmt->execute([$adminId]);
                $admin = $stmt->fetch();
                
                if (!$admin) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Administrateur non trouvé']);
                    return;
                }
                
                // Supprimer l'administrateur
                $stmt = $pdo->prepare("DELETE FROM admins WHERE id = ?");
                $stmt->execute([$adminId]);
                
                echo json_encode([
                    'success' => true,
                    'message' => "Administrateur {$admin['username']} supprimé avec succès"
                ]);
                
            } else {
                throw new Exception('Méthode non autorisée pour /admins');
            }
            break;

        case 'admins/set-default':
            // Vérifier l'authentification pour les routes admin
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token d\'authentification requis']);
                return;
            }
            
            $token = $matches[1];
            try {
                $payload = json_decode(base64_decode($token), true);
                if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                    throw new Exception('Token expiré');
                }
                
                $stmt = $pdo->prepare("SELECT id, role FROM admins WHERE id = ? AND username = ?");
                $stmt->execute([$payload['sub'], $payload['username']]);
                $currentUser = $stmt->fetch();
                
                if (!$currentUser) {
                    throw new Exception('Utilisateur non trouvé');
                }
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }
            
            if ($method === 'POST') {
                // Changer l'administrateur par défaut
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['id'])) {
                    throw new Exception('ID de l\'administrateur requis');
                }
                
                $newDefaultId = $input['id'];
                
                // Vérifier que l'administrateur existe
                $stmt = $pdo->prepare("SELECT username FROM admins WHERE id = ?");
                $stmt->execute([$newDefaultId]);
                $newAdmin = $stmt->fetch();
                
                if (!$newAdmin) {
                    throw new Exception('Administrateur non trouvé');
                }
                
                try {
                    $pdo->beginTransaction();
                    
                    // Nouvelle approche: utiliser des noms temporaires pour éviter les conflits de contraintes
                    
                    // 1. Sauvegarder les données de l'ancien admin par défaut
                    $stmt = $pdo->prepare("SELECT username, password, role FROM admins WHERE id = 1");
                    $stmt->execute();
                    $oldDefault = $stmt->fetch();
                    
                    // 2. Sauvegarder les données du nouveau admin par défaut
                    $stmt = $pdo->prepare("SELECT username, password, role FROM admins WHERE id = ?");
                    $stmt->execute([$newDefaultId]);
                    $newDefault = $stmt->fetch();
                    
                    // 3. Créer des noms temporaires uniques
                    $tempName1 = 'temp_' . time() . '_1';
                    $tempName2 = 'temp_' . time() . '_2';
                    
                    // 4. Mettre des noms temporaires pour éviter les conflits
                    $stmt = $pdo->prepare("UPDATE admins SET username = ? WHERE id = 1");
                    $stmt->execute([$tempName1]);
                    
                    $stmt = $pdo->prepare("UPDATE admins SET username = ? WHERE id = ?");
                    $stmt->execute([$tempName2, $newDefaultId]);
                    
                    // 5. Maintenant échanger les vraies données
                    $stmt = $pdo->prepare("UPDATE admins SET username = ?, password = ?, role = ? WHERE id = 1");
                    $stmt->execute([$newDefault['username'], $newDefault['password'], $newDefault['role']]);
                    
                    $stmt = $pdo->prepare("UPDATE admins SET username = ?, password = ?, role = ? WHERE id = ?");
                    $stmt->execute([$oldDefault['username'], $oldDefault['password'], $oldDefault['role'], $newDefaultId]);
                    
                    $pdo->commit();
                    
                    // Régénérer le token pour l'utilisateur connecté si ses données ont changé
                    $newToken = null;
                    if ($currentUser['id'] == 1 || $currentUser['id'] == $newDefaultId) {
                        // L'utilisateur connecté a été affecté par l'échange, régénérer son token
                        $stmt = $pdo->prepare("SELECT id, username, role FROM admins WHERE id = ?");
                        $stmt->execute([$currentUser['id']]);
                        $updatedUser = $stmt->fetch();
                        
                        if ($updatedUser) {
                            $tokenPayload = [
                                'sub' => $updatedUser['id'],
                                'username' => $updatedUser['username'],
                                'role' => $updatedUser['role'],
                                'exp' => time() + 3600 // Expire dans 1 heure
                            ];
                            $newToken = base64_encode(json_encode($tokenPayload));
                        }
                    }
                    
                    $response = [
                        'success' => true,
                        'message' => "Administrateur par défaut changé vers {$newAdmin['username']}"
                    ];
                    
                    if ($newToken) {
                        $response['new_token'] = $newToken;
                        $response['token_updated'] = true;
                    }
                    
                    echo json_encode($response);
                    
                } catch (Exception $e) {
                    $pdo->rollBack();
                    throw new Exception('Erreur lors du changement: ' . $e->getMessage());
                }
                
            } else {
                throw new Exception('Méthode non autorisée pour /admins/set-default');
            }
            break;

        case 'whitelist':
            $whitelistValidator = new WhitelistValidator($pdo);
            
            if ($method === 'GET') {
                // Récupérer les statistiques de la whitelist
                $statsResult = $whitelistValidator->getStats();
                if ($statsResult['success']) {
                    echo json_encode([
                        'success' => true,
                        'stats' => $statsResult['stats'],
                        'message' => 'Statistiques whitelist récupérées'
                    ]);
                } else {
                    throw new Exception($statsResult['message']);
                }
                
            } elseif ($method === 'POST') {
                // Ajouter un agent à la whitelist
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['code_personnel']) || !isset($input['nom']) || !isset($input['prenom'])) {
                    throw new Exception('Code personnel, nom et prénom requis');
                }
                
                // Validation du format du code personnel
                if (!preg_match('/^[0-9]{7}[A-Za-z]{1}$/', $input['code_personnel'])) {
                    throw new Exception('Le code personnel doit contenir exactement 7 chiffres suivis d\'une lettre');
                }
                
                $result = $whitelistValidator->addAgent(
                    $input['code_personnel'],
                    $input['nom'],
                    $input['prenom']
                );
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    throw new Exception($result['message']);
                }
                
            } elseif ($method === 'DELETE') {
                // Désactiver un agent de la whitelist
                $code = $_GET['code'] ?? '';
                if (empty($code)) {
                    throw new Exception('Code personnel manquant pour la désactivation');
                }
                
                $result = $whitelistValidator->deactivateAgent($code);
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    throw new Exception($result['message']);
                }
                
            } elseif ($method === 'PUT') {
                // Réactiver un agent de la whitelist
                $input = json_decode(file_get_contents('php://input'), true);
                $code = $input['code'] ?? '';
                
                if (empty($code)) {
                    throw new Exception('Code personnel manquant pour la réactivation');
                }
                
                $result = $whitelistValidator->reactivateAgent($code);
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    throw new Exception($result['message']);
                }
                
            } else {
                throw new Exception('Méthode non autorisée pour /whitelist');
            }
            break;

        case 'whitelist/download-example':
            if ($method === 'GET') {
                // Télécharger le fichier exemple CSV
                $csvExamplePath = __DIR__ . '/../scripts/exemple_whitelist.csv';
                
                if (!file_exists($csvExamplePath)) {
                    throw new Exception('Fichier d\'exemple CSV non trouvé');
                }
                
                // Headers CSV
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename="exemple_whitelist.csv"');
                header('Cache-Control: max-age=0');
                
                // Lire et envoyer le fichier
                readfile($csvExamplePath);
                exit();
            } else {
                throw new Exception('Méthode non autorisée pour /whitelist/download-example');
            }
            break;

        case 'whitelist/upload':
            if ($method === 'POST') {
                // Upload et traitement du fichier CSV
                if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
                    throw new Exception('Fichier CSV requis');
                }
                
                $uploadedFile = $_FILES['csv_file'];
                $tmpPath = $uploadedFile['tmp_name'];
                
                // Vérifier l'extension
                $fileInfo = pathinfo($uploadedFile['name']);
                $allowedExtensions = ['csv', 'txt'];
                if (!isset($fileInfo['extension']) || !in_array(strtolower($fileInfo['extension']), $allowedExtensions)) {
                    throw new Exception('Seuls les fichiers CSV sont autorisés');
                }
                
                // Vérifier la taille (max 2MB)
                if ($uploadedFile['size'] > 2 * 1024 * 1024) {
                    throw new Exception('Fichier trop volumineux (max 2MB)');
                }
                
                // Traiter le fichier CSV
                $whitelistValidator = new WhitelistValidator($pdo);
                
                // VIDER LA TABLE WHITELIST AVANT L'IMPORT
                $pdo->exec("DELETE FROM agents_whitelist");
                
                $results = [
                    'total' => 0,
                    'success' => 0,
                    'errors' => 0,
                    'ignored' => 0,
                    'details' => []
                ];
                
                // Détecter le délimiteur
                $delimiter = ',';
                $handle = fopen($tmpPath, 'r');
                if ($handle) {
                    $firstLine = fgets($handle);
                    if ($firstLine) {
                        if (substr_count($firstLine, ';') > substr_count($firstLine, ',')) {
                            $delimiter = ';';
                        }
                    }
                    fclose($handle);
                }
                
                // Lire et traiter le CSV
                $handle = fopen($tmpPath, 'r');
                if (!$handle) {
                    throw new Exception('Impossible de lire le fichier CSV');
                }
                
                $lineNumber = 0;
                $isFirstLine = true;
                
                while (($data = fgetcsv($handle, 1000, $delimiter)) !== FALSE) {
                    $lineNumber++;
                    
                    // Ignorer les en-têtes si détectés
                    if ($isFirstLine) {
                        $isFirstLine = false;
                        $firstCell = isset($data[0]) ? trim($data[0]) : '';
                        if (stripos($firstCell, 'code') !== false || stripos($firstCell, 'personnel') !== false) {
                            continue;
                        }
                    }
                    
                    $codePersonnel = isset($data[0]) ? trim($data[0]) : '';
                    $nom = isset($data[1]) ? trim($data[1]) : '';
                    $prenom = isset($data[2]) ? trim($data[2]) : '';
                    
                    // Ignorer lignes vides
                    if (empty($codePersonnel) && empty($nom) && empty($prenom)) {
                        $results['ignored']++;
                        continue;
                    }
                    
                    $results['total']++;
                    
                    // Validation
                    $errors = [];
                    if (empty($codePersonnel)) {
                        $errors[] = 'Code personnel manquant';
                    } elseif (!preg_match('/^[0-9]{7}[A-Za-z]{1}$/', $codePersonnel)) {
                        $errors[] = 'Format code personnel invalide';
                    }
                    
                    if (empty($nom)) $errors[] = 'Nom manquant';
                    if (empty($prenom)) $errors[] = 'Prénom manquant';
                    
                    if (!empty($errors)) {
                        $results['errors']++;
                        $results['details'][] = [
                            'line' => $lineNumber,
                            'code' => $codePersonnel,
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'status' => 'error',
                            'message' => implode(', ', $errors)
                        ];
                        continue;
                    }
                    
                    // Ajouter à la whitelist
                    $result = $whitelistValidator->addAgent(
                        strtoupper($codePersonnel),
                        strtoupper(trim($nom)),
                        ucfirst(strtolower(trim($prenom)))
                    );
                    
                    if ($result['success']) {
                        $results['success']++;
                        $results['details'][] = [
                            'line' => $lineNumber,
                            'code' => $codePersonnel,
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'status' => 'success',
                            'message' => 'Ajouté avec succès'
                        ];
                    } else {
                        $results['errors']++;
                        $results['details'][] = [
                            'line' => $lineNumber,
                            'code' => $codePersonnel,
                            'nom' => $nom,
                            'prenom' => $prenom,
                            'status' => 'error',
                            'message' => $result['message']
                        ];
                    }
                }
                
                fclose($handle);
                unlink($tmpPath); // Nettoyer le fichier temporaire
                
                echo json_encode([
                    'success' => true,
                    'results' => $results,
                    'message' => "Import terminé: {$results['success']} succès, {$results['errors']} erreurs"
                ]);
                
            } else {
                throw new Exception('Méthode non autorisée pour /whitelist/upload');
            }
            break;

        case 'whitelist/list':
            if ($method === 'GET') {
                // Lister les agents de la whitelist avec nom et prénom
                $stmt = $pdo->query("
                    SELECT
                        code_personnel,
                        nom,
                        prenom,
                        actif,
                        created_at,
                        updated_at
                    FROM agents_whitelist
                    ORDER BY code_personnel
                ");

                $whitelist = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'whitelist' => $whitelist
                ]);
            } else {
                throw new Exception('Méthode non autorisée pour /whitelist/list');
            }
            break;

        case 'creneaux/bloquer':
            // Vérifier l'authentification
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';

            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token d\'authentification requis']);
                return;
            }

            $token = $matches[1];
            try {
                $payload = json_decode(base64_decode($token), true);
                if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                    throw new Exception('Token expiré');
                }
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }

            if ($method === 'POST') {
                // Bloquer un créneau
                $input = json_decode(file_get_contents('php://input'), true);

                if (!$input || !isset($input['heure_creneau'])) {
                    throw new Exception('Heure du créneau requise');
                }

                $heureCreneau = $input['heure_creneau'];
                $dateCreneau = $input['date_creneau'] ?? null;
                $raison = $input['raison'] ?? null;
                $createdBy = $payload['username'] ?? 'admin';

                // Vérifier si le créneau existe déjà
                $stmt = $pdo->prepare("
                    SELECT id FROM creneaux_bloques
                    WHERE heure_creneau = ? AND (date_creneau IS NULL OR date_creneau = ?)
                ");
                $stmt->execute([$heureCreneau, $dateCreneau]);
                $existing = $stmt->fetch();

                if ($existing) {
                    // Mettre à jour
                    $stmt = $pdo->prepare("
                        UPDATE creneaux_bloques
                        SET bloque = 1, raison = ?, created_by = ?, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$raison, $createdBy, $existing['id']]);
                } else {
                    // Insérer
                    $stmt = $pdo->prepare("
                        INSERT INTO creneaux_bloques
                        (heure_creneau, date_creneau, bloque, raison, created_by)
                        VALUES (?, ?, 1, ?, ?)
                    ");
                    $stmt->execute([$heureCreneau, $dateCreneau, $raison, $createdBy]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => "Créneau $heureCreneau bloqué avec succès",
                    'heure_creneau' => $heureCreneau,
                    'raison' => $raison
                ]);

            } elseif ($method === 'DELETE') {
                // Débloquer un créneau
                $heureCreneau = $_GET['heure'] ?? '';
                $dateCreneau = $_GET['date'] ?? null;

                if (empty($heureCreneau)) {
                    throw new Exception('Heure du créneau manquante');
                }

                // Soit supprimer, soit mettre bloque à 0
                $stmt = $pdo->prepare("
                    UPDATE creneaux_bloques
                    SET bloque = 0, updated_at = NOW()
                    WHERE heure_creneau = ? AND (date_creneau IS NULL OR date_creneau = ?)
                ");
                $stmt->execute([$heureCreneau, $dateCreneau]);

                if ($stmt->rowCount() > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => "Créneau $heureCreneau débloqué avec succès",
                        'heure_creneau' => $heureCreneau
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Créneau bloqué non trouvé',
                        'heure_creneau' => $heureCreneau
                    ]);
                }

            } elseif ($method === 'GET') {
                // Lister tous les créneaux bloqués
                $stmt = $pdo->query("
                    SELECT
                        id,
                        heure_creneau,
                        date_creneau,
                        bloque,
                        raison,
                        created_by,
                        created_at,
                        updated_at
                    FROM creneaux_bloques
                    WHERE bloque = 1
                    ORDER BY heure_creneau
                ");

                $creneauxBloques = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'creneaux_bloques' => $creneauxBloques
                ]);

            } else {
                throw new Exception('Méthode non autorisée pour /creneaux/bloquer');
            }
            break;

        case 'creneaux/config':
            // Vérifier l'authentification
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';

            if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Token d\'authentification requis']);
                return;
            }

            $token = $matches[1];
            try {
                $payload = json_decode(base64_decode($token), true);
                if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
                    throw new Exception('Token expiré');
                }
            } catch (Exception $e) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }

            if ($method === 'POST') {
                // Ajouter un nouveau créneau
                $input = json_decode(file_get_contents('php://input'), true);

                if (!$input || !isset($input['heure_creneau']) || !isset($input['periode'])) {
                    throw new Exception('Heure du créneau et période requis');
                }

                $heureCreneau = $input['heure_creneau'];
                $periode = $input['periode'];
                $capacite = $input['capacite'] ?? 14;
                $createdBy = $payload['username'] ?? 'admin';

                // Valider la période
                if (!in_array($periode, ['matin', 'apres-midi'])) {
                    throw new Exception('Période invalide. Doit être "matin" ou "apres-midi"');
                }

                // Vérifier si le créneau existe déjà
                $stmt = $pdo->prepare("
                    SELECT id, actif FROM creneaux_config
                    WHERE heure_creneau = ?
                ");
                $stmt->execute([$heureCreneau]);
                $existing = $stmt->fetch();

                if ($existing) {
                    if ($existing['actif'] == 1) {
                        throw new Exception('Ce créneau existe déjà');
                    }
                    // Réactiver le créneau
                    $stmt = $pdo->prepare("
                        UPDATE creneaux_config
                        SET actif = 1, periode = ?, capacite = ?, created_by = ?, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$periode, $capacite, $createdBy, $existing['id']]);
                } else {
                    // Insérer le nouveau créneau
                    $stmt = $pdo->prepare("
                        INSERT INTO creneaux_config
                        (heure_creneau, periode, capacite, created_by)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([$heureCreneau, $periode, $capacite, $createdBy]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => "Créneau $heureCreneau ajouté avec succès",
                    'heure_creneau' => $heureCreneau,
                    'periode' => $periode,
                    'capacite' => $capacite
                ]);

            } elseif ($method === 'PUT') {
                // Modifier un créneau (capacité, admin_only, etc.)
                $input = json_decode(file_get_contents('php://input'), true);
                $heureCreneau = $_GET['heure'] ?? '';

                if (empty($heureCreneau)) {
                    throw new Exception('Heure du créneau manquante');
                }

                if (!$input) {
                    throw new Exception('Données JSON invalides');
                }

                // Vérifier que le créneau existe
                $stmt = $pdo->prepare("SELECT id FROM creneaux_config WHERE heure_creneau = ?");
                $stmt->execute([$heureCreneau]);
                $creneau = $stmt->fetch();

                if (!$creneau) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Créneau non trouvé']);
                    return;
                }

                // Préparer les champs à modifier
                $updates = [];
                $params = [];

                if (isset($input['admin_only'])) {
                    $updates[] = "admin_only = ?";
                    $params[] = $input['admin_only'] ? 1 : 0;
                }

                if (isset($input['capacite'])) {
                    $updates[] = "capacite = ?";
                    $params[] = (int)$input['capacite'];
                }

                if (isset($input['periode'])) {
                    if (!in_array($input['periode'], ['matin', 'apres-midi'])) {
                        throw new Exception('Période invalide');
                    }
                    $updates[] = "periode = ?";
                    $params[] = $input['periode'];
                }

                if (empty($updates)) {
                    throw new Exception('Aucune modification spécifiée');
                }

                // Ajouter la mise à jour du timestamp
                $updates[] = "updated_at = NOW()";
                $params[] = $heureCreneau;

                // Exécuter la mise à jour
                $sql = "UPDATE creneaux_config SET " . implode(', ', $updates) . " WHERE heure_creneau = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);

                echo json_encode([
                    'success' => true,
                    'message' => "Créneau $heureCreneau mis à jour avec succès"
                ]);

            } elseif ($method === 'DELETE') {
                // Supprimer un créneau (soft delete)
                $heureCreneau = $_GET['heure'] ?? '';

                if (empty($heureCreneau)) {
                    throw new Exception('Heure du créneau manquante');
                }

                // Vérifier que le créneau n'a pas d'inscriptions
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count FROM agents
                    WHERE heure_creneau = ?
                ");
                $stmt->execute([$heureCreneau]);
                $result = $stmt->fetch();

                if ($result['count'] > 0) {
                    throw new Exception('Impossible de supprimer ce créneau car des agents y sont inscrits');
                }

                // Soft delete
                $stmt = $pdo->prepare("
                    UPDATE creneaux_config
                    SET actif = 0, updated_at = NOW()
                    WHERE heure_creneau = ?
                ");
                $stmt->execute([$heureCreneau]);

                if ($stmt->rowCount() > 0) {
                    echo json_encode([
                        'success' => true,
                        'message' => "Créneau $heureCreneau supprimé avec succès",
                        'heure_creneau' => $heureCreneau
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'error' => 'Créneau non trouvé',
                        'heure_creneau' => $heureCreneau
                    ]);
                }

            } elseif ($method === 'GET') {
                // Lister tous les créneaux (y compris inactifs pour admin)
                $stmt = $pdo->query("
                    SELECT
                        id,
                        heure_creneau,
                        periode,
                        capacite,
                        actif,
                        created_by,
                        created_at,
                        updated_at
                    FROM creneaux_config
                    ORDER BY heure_creneau
                ");

                $creneauxConfig = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'creneaux_config' => $creneauxConfig
                ]);

            } else {
                throw new Exception('Méthode non autorisée pour /creneaux/config');
            }
            break;

        default:
            // Page d'accueil de l'API avec documentation complète
            echo json_encode([
                'api' => 'Journée des Proches API v2.4',
                'status' => 'Prêt et fonctionnel - Sans champ service',
                'evenement_date' => '04 octobre 2025',
                'timestamp' => date('Y-m-d H:i:s'),
                'database' => $dbname,
                'endpoints' => [
                    'GET /' => 'Cette page d\'accueil',
                    'GET /test' => 'Test de connexion et santé de l\'API',
                    'GET /agents' => 'Liste de tous les agents inscrits',
                    'POST /agents' => 'Ajouter un nouvel agent (avec validation whitelist)',
                    'PUT /agents?code=CODE' => 'Modifier un agent (statut, etc.)',
                    'DELETE /agents?code=CODE' => 'Supprimer un agent',
                    'GET /search?q=CODE' => 'Rechercher un agent par code personnel',
                    'GET /history?code=CODE' => 'Historique des modifications d\'un agent',
                    'GET /creneaux' => 'Disponibilités de tous les créneaux',
                    'GET /stats' => 'Statistiques complètes avec statuts',
                    'GET /export' => 'Télécharger export CSV complet',
                    'POST /login' => 'Authentification (username, password)',
                    'GET /verify-token' => 'Vérifier la validité d\'un token d\'authentification',
                    'POST /whitelist' => 'Gestion de la whitelist (admin uniquement)'
                ],
                'statuts_disponibles' => ['inscrit', 'present', 'absent', 'annule'],
                'capacite_max_par_creneau' => '14 (sauf 15h00: illimité)',
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
