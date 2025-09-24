<?php
/**
 * Script de migration pour mettre à jour les hashes existants
 * avec la nouvelle normalisation des accents
 */

// Charger les variables d'environnement
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
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

$envFile = __DIR__ . '/../.env';
if (!loadEnv($envFile)) {
    die('Fichier .env non trouvé dans : ' . $envFile . "\n");
}

// Charger la classe WhitelistValidator
require_once __DIR__ . '/../src/WhitelistValidator.php';

try {
    // Connexion à la base de données
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'journee_proches';
    $username = $_ENV['DB_USER'] ?? 'root';
    $password = $_ENV['DB_PASS'] ?? '';

    $pdo = new PDO("mysql:host={$host};dbname={$dbname};charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connexion à la base de données réussie\n";

    // Créer une instance du validator
    $validator = new WhitelistValidator($pdo);

    // Récupérer tous les agents de la whitelist
    $stmt = $pdo->query("SELECT code_personnel, nom, prenom FROM agents_whitelist");
    $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Trouvé " . count($agents) . " agents dans la whitelist\n";

    $updated = 0;

    foreach ($agents as $agent) {
        // Utiliser la méthode addAgent qui va recalculer les hashes avec la normalisation
        $result = $validator->addAgent(
            $agent['code_personnel'],
            $agent['nom'],
            $agent['prenom']
        );

        if ($result['success']) {
            $updated++;
            echo "✓ Mis à jour : {$agent['code_personnel']} - {$agent['nom']} {$agent['prenom']}\n";
        } else {
            echo "✗ Erreur pour : {$agent['code_personnel']} - {$agent['nom']} {$agent['prenom']}\n";
        }
    }

    echo "\n=== MIGRATION TERMINÉE ===\n";
    echo "Agents mis à jour : {$updated}/" . count($agents) . "\n";
    echo "Les hashes ont été recalculés avec la normalisation des accents.\n";
    echo "Les inscriptions fonctionneront maintenant avec ou sans accents.\n";

} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
    exit(1);
}