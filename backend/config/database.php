<?php
// Configuration de la base de données selon l'environnement

// Détection automatique de l'environnement
function getEnvironment() {
    // Variables d'environnement système
    if (isset($_ENV['APP_ENV'])) {
        return $_ENV['APP_ENV'];
    }
    
    // Détection basée sur le serveur
    if (isset($_SERVER['HTTP_HOST'])) {
        $host = $_SERVER['HTTP_HOST'];
        if (in_array($host, ['localhost', '127.0.0.1']) || strpos($host, '.local') !== false) {
            return 'development';
        }
    }
    
    // Par défaut, considérer comme production
    return 'production';
}

// Configuration des environnements
$config = [
    'development' => [
        'host' => 'localhost',
        'database' => 'journee_proches',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
        'debug' => true
    ],
    'production' => [
        'host' => 'localhost',
        'database' => 'journee_proches_prod',
        'username' => 'app_user',
        'password' => 'secure_password_here',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
        'debug' => false
    ],
    'test' => [
        'host' => 'localhost',
        'database' => 'journee_proches_test',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
        'debug' => true
    ]
];

// Obtenir la configuration pour l'environnement actuel
$currentEnv = getEnvironment();
$dbConfig = $config[$currentEnv];

// Helper pour le logging en développement
function devLog($message, $data = null) {
    global $dbConfig;
    if ($dbConfig['debug']) {
        error_log("[DEV] $message " . ($data ? json_encode($data) : ''));
    }
}

// Fonction pour créer la connexion PDO
function createDbConnection() {
    global $dbConfig;
    
    try {
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}";
        $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $dbConfig['options']);
        
        devLog("Database connection established", ['environment' => getEnvironment()]);
        return $pdo;
        
    } catch (PDOException $e) {
        devLog("Database connection failed", ['error' => $e->getMessage()]);
        
        if ($dbConfig['debug']) {
            throw $e;
        } else {
            throw new PDOException("Database connection failed");
        }
    }
}

// Export des variables pour compatibilité
$host = $dbConfig['host'];
$database = $dbConfig['database'];
$username = $dbConfig['username'];
$password = $dbConfig['password'];
$isDebug = $dbConfig['debug'];
$environment = $currentEnv;