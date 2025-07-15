<?php
/*
========================================
FICHIER: public/test-wamp.php
Test de connexion à la base de données pour WAMP
========================================
*/

// Démarrer la capture de sortie pour éviter les problèmes de headers
ob_start();

// Activer l'affichage des erreurs pour le débogage
error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    $envFile = __DIR__ . '/../.env.development';
    $envLoaded = loadEnv($envFile);
    
    if (!$envLoaded) {
        $envFile = __DIR__ . '/../.env';
        $envLoaded = loadEnv($envFile);
    }
    
    if (!$envLoaded) {
        throw new Exception('Aucun fichier .env ou .env.development trouvé.');
    }

    // Configuration base de données
    $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
    $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'journee_proches';
    $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
    $password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?? '';

    // Tenter la connexion
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password);
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
    
    // Vérifier le port d'Apache
    $apachePort = $_SERVER['SERVER_PORT'] ?? 'Inconnu';
    
    // Vérifier les variables d'environnement pour l'API
    $apiUrl = $_ENV['VITE_API_URL'] ?? getenv('VITE_API_URL') ?? 'Non défini';
    
    echo json_encode([
        'success' => true,
        'message' => 'Test de configuration WAMP réussi',
        'environment' => [
            'php_version' => PHP_VERSION,
            'mysql_version' => $mysqlVersion,
            'server' => $server,
            'server_type' => $serverType,
            'apache_port' => $apachePort,
            'os' => PHP_OS
        ],
        'database' => [
            'host' => $host,
            'port' => $port,
            'name' => $dbname,
            'user' => $username,
            'password_set' => !empty($password),
            'dsn' => $dsn,
            'table_agents_exists' => $tableExists
        ],
        'api' => [
            'url' => $apiUrl,
            'expected_url' => 'http://localhost:8080/journey/public/api.php'
        ],
        'env_file' => [
            'path' => $envFile,
            'exists' => file_exists($envFile),
            'loaded' => $envLoaded
        ],
        'instructions' => [
            'Si vous voyez ce message, votre configuration WAMP est correcte.',
            'Assurez-vous que l\'URL de l\'API correspond à l\'URL attendue.',
            'Pour tester l\'API, accédez à: http://localhost:8080/journey/public/api.php?path=test'
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
            'apache_port' => $_SERVER['SERVER_PORT'] ?? 'Inconnu',
            'os' => PHP_OS
        ],
        'database' => [
            'host' => $host ?? 'non défini',
            'port' => $port ?? 'non défini',
            'name' => $dbname ?? 'non défini',
            'user' => $username ?? 'non défini',
            'password_set' => isset($password) && !empty($password)
        ],
        'api' => [
            'url' => $_ENV['VITE_API_URL'] ?? getenv('VITE_API_URL') ?? 'Non défini',
            'expected_url' => 'http://localhost:8080/journey/public/api.php'
        ],
        'env_file' => [
            'path' => $envFile ?? 'non défini',
            'exists' => isset($envFile) && file_exists($envFile)
        ],
        'instructions' => [
            'Vérifiez que MySQL est en cours d\'exécution sur le port 3306.',
            'Vérifiez que la base de données "journee_proches" existe.',
            'Vérifiez que les identifiants de connexion sont corrects.',
            'Si vous utilisez un mot de passe, assurez-vous qu\'il est correctement défini dans le fichier .env.development.'
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
            'apache_port' => $_SERVER['SERVER_PORT'] ?? 'Inconnu',
            'os' => PHP_OS
        ],
        'instructions' => [
            'Vérifiez que le fichier .env.development existe à la racine du projet.',
            'Vérifiez que le fichier .env.development contient les variables DB_HOST, DB_PORT, DB_NAME, DB_USER et DB_PASSWORD.',
            'Vérifiez que le fichier .env.development contient la variable VITE_API_URL avec la valeur http://localhost:8080/journey/public/api.php.'
        ]
    ]);
}
?>