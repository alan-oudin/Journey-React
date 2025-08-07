<?php
/**
 * Script d'import Excel pour la whitelist des agents
 * 
 * Format Excel attendu:
 * Colonne A: Code Personnel (ex: 1234567A)
 * Colonne B: Nom (ex: DUPONT) 
 * Colonne C: Prénom (ex: Jean)
 * 
 * Usage: php import_whitelist_excel.php chemin/vers/fichier.xlsx
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/WhitelistValidator.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

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

// Vérifier les arguments
if ($argc < 2) {
    echo "Usage: php import_whitelist_excel.php <chemin_vers_fichier.xlsx>\n";
    echo "\nFormat Excel attendu:\n";
    echo "- Colonne A: Code Personnel (7 chiffres + 1 lettre)\n";
    echo "- Colonne B: Nom de famille\n";
    echo "- Colonne C: Prénom\n";
    echo "- Première ligne peut contenir les en-têtes (sera ignorée si détectée)\n";
    exit(1);
}

$fichierExcel = $argv[1];

// Vérifier que le fichier existe
if (!file_exists($fichierExcel)) {
    echo "Erreur: Le fichier '$fichierExcel' n'existe pas.\n";
    exit(1);
}

echo "=== IMPORT WHITELIST DEPUIS EXCEL ===\n";
echo "Fichier: $fichierExcel\n\n";

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
    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Connexion à la base de données réussie\n";

    // Créer le validateur whitelist
    $whitelistValidator = new WhitelistValidator($pdo);
    
    // Charger le fichier Excel
    echo "📖 Lecture du fichier Excel...\n";
    $spreadsheet = IOFactory::load($fichierExcel);
    $worksheet = $spreadsheet->getActiveSheet();
    $highestRow = $worksheet->getHighestRow();
    
    echo "📊 Nombre de lignes détectées: $highestRow\n\n";
    
    // Détecter si la première ligne contient des en-têtes
    $premiereLigne = $worksheet->getCell('A1')->getValue();
    $startRow = 1;
    
    if (is_string($premiereLigne) && (
        stripos($premiereLigne, 'code') !== false || 
        stripos($premiereLigne, 'personnel') !== false ||
        stripos($premiereLigne, 'cp') !== false
    )) {
        $startRow = 2;
        echo "ℹ️ En-têtes détectés, début à la ligne 2\n";
    }
    
    $compteurs = [
        'total' => 0,
        'succes' => 0,
        'erreurs' => 0,
        'ignores' => 0
    ];
    
    $erreurs = [];
    
    // Parcourir les lignes
    for ($row = $startRow; $row <= $highestRow; $row++) {
        $codePersonnel = trim($worksheet->getCell('A' . $row)->getValue());
        $nom = trim($worksheet->getCell('B' . $row)->getValue());
        $prenom = trim($worksheet->getCell('C' . $row)->getValue());
        
        // Ignorer les lignes vides
        if (empty($codePersonnel) && empty($nom) && empty($prenom)) {
            $compteurs['ignores']++;
            continue;
        }
        
        $compteurs['total']++;
        
        // Validation des données
        $erreurLigne = [];
        
        if (empty($codePersonnel)) {
            $erreurLigne[] = "Code personnel manquant";
        } elseif (!preg_match('/^[0-9]{7}[A-Za-z]{1}$/', $codePersonnel)) {
            $erreurLigne[] = "Format code personnel invalide (doit être 7 chiffres + 1 lettre)";
        }
        
        if (empty($nom)) {
            $erreurLigne[] = "Nom manquant";
        }
        
        if (empty($prenom)) {
            $erreurLigne[] = "Prénom manquant";
        }
        
        if (!empty($erreurLigne)) {
            $erreurs[] = "Ligne $row: " . implode(', ', $erreurLigne) . " (CP: $codePersonnel, Nom: $nom, Prénom: $prenom)";
            $compteurs['erreurs']++;
            continue;
        }
        
        // Nettoyer et formater les données
        $codePersonnel = strtoupper($codePersonnel);
        $nom = strtoupper(trim($nom));
        $prenom = ucfirst(strtolower(trim($prenom)));
        
        // Ajouter à la whitelist
        echo "Ajout: $prenom $nom ($codePersonnel)... ";
        
        $result = $whitelistValidator->addAgent($codePersonnel, $nom, $prenom);
        
        if ($result['success']) {
            echo "✓\n";
            $compteurs['succes']++;
        } else {
            echo "✗ - {$result['message']}\n";
            $erreurs[] = "Ligne $row: {$result['message']} ($codePersonnel)";
            $compteurs['erreurs']++;
        }
    }
    
    // Rapport final
    echo "\n=== RAPPORT D'IMPORT ===\n";
    echo "Total lignes traitées: {$compteurs['total']}\n";
    echo "Succès: {$compteurs['succes']}\n";
    echo "Erreurs: {$compteurs['erreurs']}\n";
    echo "Lignes ignorées (vides): {$compteurs['ignores']}\n";
    
    if (!empty($erreurs)) {
        echo "\n=== DÉTAIL DES ERREURS ===\n";
        foreach ($erreurs as $erreur) {
            echo "❌ $erreur\n";
        }
    }
    
    // Statistiques finales
    echo "\n=== STATISTIQUES WHITELIST ===\n";
    $stats = $whitelistValidator->getStats();
    if ($stats['success']) {
        echo "Agents dans la whitelist: {$stats['stats']['total']}\n";
        echo "- Actifs: {$stats['stats']['actifs']}\n";
        echo "- Inactifs: {$stats['stats']['inactifs']}\n";
    }
    
    if ($compteurs['succes'] > 0) {
        echo "\n✅ Import terminé avec succès !\n";
        echo "🔐 {$compteurs['succes']} agents sont maintenant autorisés à s'inscrire.\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
?>