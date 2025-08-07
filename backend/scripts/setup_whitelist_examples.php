<?php
/**
 * Script pour ajouter des exemples d'agents à la whitelist
 * À utiliser uniquement pour le développement et les tests
 */

require_once __DIR__ . '/../src/WhitelistValidator.php';

// Fonction pour charger les variables d'environnement
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }

            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
    return true;
}

// Charger le fichier .env
$envFile = __DIR__ . '/../.env';
if (!loadEnv($envFile)) {
    echo "Erreur: Fichier .env non trouvé\n";
    exit(1);
}

// Configuration base de données
$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'journee_proches';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASSWORD'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connexion à la base de données réussie\n";

    // Créer le validateur whitelist
    $whitelistValidator = new WhitelistValidator($pdo);

    // Exemples d'agents pour les tests
    $exemples = [
        ['1234567A', 'DUPONT', 'Jean'],
        ['2345678B', 'MARTIN', 'Marie'],
        ['3456789C', 'BERNARD', 'Pierre'],
        ['4567890D', 'DURAND', 'Sophie'],
        ['5678901E', 'MOREAU', 'Luc']
    ];

    echo "Ajout des agents exemples à la whitelist...\n";

    foreach ($exemples as $agent) {
        list($code, $nom, $prenom) = $agent;
        
        echo "Ajout de {$prenom} {$nom} ({$code})... ";
        
        $result = $whitelistValidator->addAgent($code, $nom, $prenom);
        
        if ($result['success']) {
            echo "✓\n";
        } else {
            echo "✗ - {$result['message']}\n";
        }
    }

    // Afficher les statistiques
    echo "\nStatistiques de la whitelist:\n";
    $stats = $whitelistValidator->getStats();
    if ($stats['success']) {
        echo "- Total: {$stats['stats']['total']} agents\n";
        echo "- Actifs: {$stats['stats']['actifs']} agents\n";
        echo "- Inactifs: {$stats['stats']['inactifs']} agents\n";
    }

    echo "\nSetup terminé avec succès !\n";
    echo "Les agents suivants sont maintenant autorisés à s'inscrire:\n";
    
    foreach ($exemples as $agent) {
        list($code, $nom, $prenom) = $agent;
        echo "- {$prenom} {$nom} : {$code}\n";
    }

} catch (PDOException $e) {
    echo "Erreur de connexion: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
?>