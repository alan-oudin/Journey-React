<?php
/*
========================================
FICHIER: public/test-db.php
Test de connexion à la base de données
========================================
*/

// Démarrer la capture de sortie pour éviter les problèmes de headers
ob_start();

// Headers JSON
header('Content-Type: application/json; charset=utf-8');

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

// Nettoyer la sortie buffer avant de continuer
ob_end_clean();

try {
    // Charger les variables d'environnement
    $envFile = __DIR__ . '/../.env';
    if (!loadEnv($envFile)) {
        throw new Exception('Fichier .env non trouvé. Utilisation des valeurs par défaut.');
    }

    // Configuration base de données
    $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'journee_proches';
    $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '';

    // Tenter la connexion
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vérifier si la table agents_inscriptions existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'agents_inscriptions'");
    $tableExists = $stmt->rowCount() > 0;
    
    // Récupérer la version de MySQL
    $stmt = $pdo->query("SELECT VERSION() as version");
    $mysqlVersion = $stmt->fetch(PDO::FETCH_ASSOC)['version'];
    
    // Récupérer le serveur web
    $server = $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu';
    
    // Déterminer si c'est WAMP ou XAMPP
    $serverType = 'Inconnu';
    if (stripos($server, 'apache') !== false) {
        if (stripos($server, 'win') !== false || stripos(PHP_OS, 'WIN') !== false) {
            if (file_exists('C:\\wamp64') || file_exists('C:\\wamp')) {
                $serverType = 'WAMP';
            } elseif (file_exists('C:\\xampp')) {
                $serverType = 'XAMPP';
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Connexion à la base de données réussie',
        'environment' => [
            'php_version' => PHP_VERSION,
            'mysql_version' => $mysqlVersion,
            'server' => $server,
            'server_type' => $serverType,
            'os' => PHP_OS
        ],
        'database' => [
            'host' => $host,
            'name' => $dbname,
            'user' => $username,
            'password_set' => !empty($password),
            'table_agents_exists' => $tableExists
        ],
        'env_file' => [
            'path' => $envFile,
            'exists' => file_exists($envFile)
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur de connexion à la base de données',
        'details' => $e->getMessage(),
        'environment' => [
            'php_version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
            'os' => PHP_OS
        ],
        'database' => [
            'host' => $host ?? 'non défini',
            'name' => $dbname ?? 'non défini',
            'user' => $username ?? 'non défini',
            'password_set' => isset($password) && !empty($password)
        ],
        'env_file' => [
            'path' => $envFile ?? 'non défini',
            'exists' => isset($envFile) && file_exists($envFile)
        ]
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'environment' => [
            'php_version' => PHP_VERSION,
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu',
            'os' => PHP_OS
        ]
    ]);
}
?>