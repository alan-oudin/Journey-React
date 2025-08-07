<?php
/**
 * Script d'import CSV pour la whitelist des agents
 * 
 * Format CSV attendu (séparateur: virgule ou point-virgule):
 * Colonne 1: Code Personnel (ex: 1234567A)
 * Colonne 2: Nom (ex: DUPONT) 
 * Colonne 3: Prénom (ex: Jean)
 * 
 * INSTRUCTIONS EXCEL:
 * 1. Ouvrez votre fichier Excel
 * 2. Sélectionnez vos données (Code Personnel, Nom, Prénom)
 * 3. Fichier > Enregistrer sous > Format CSV (UTF-8)
 * 4. Utilisez ce script avec le fichier CSV généré
 * 
 * Usage: php import_whitelist_csv.php chemin/vers/fichier.csv
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

// Fonction pour détecter le séparateur CSV
function detectCSVDelimiter($file, $checkLines = 2) {
    $delimiters = [',', ';', "\t"];
    $results = [];
    
    $handle = fopen($file, 'r');
    if (!$handle) return ',';
    
    for ($i = 0; $i < $checkLines; $i++) {
        $line = fgets($handle);
        if (!$line) break;
        
        foreach ($delimiters as $delimiter) {
            $count = substr_count($line, $delimiter);
            if (!isset($results[$delimiter])) {
                $results[$delimiter] = 0;
            }
            $results[$delimiter] += $count;
        }
    }
    
    fclose($handle);
    
    return array_search(max($results), $results) ?: ',';
}

// Vérifier les arguments
if ($argc < 2) {
    echo "=== IMPORT WHITELIST DEPUIS CSV ===\n\n";
    echo "Usage: php import_whitelist_csv.php <chemin_vers_fichier.csv>\n\n";
    echo "Format CSV attendu:\n";
    echo "- Colonne 1: Code Personnel (7 chiffres + 1 lettre)\n";
    echo "- Colonne 2: Nom de famille\n";
    echo "- Colonne 3: Prénom\n";
    echo "- Première ligne peut contenir les en-têtes (sera ignorée si détectée)\n";
    echo "- Séparateur: virgule (,) ou point-virgule (;) détecté automatiquement\n\n";
    echo "COMMENT CRÉER LE CSV DEPUIS EXCEL:\n";
    echo "1. Ouvrez votre fichier Excel avec les colonnes CP, Nom, Prénom\n";
    echo "2. Sélectionnez vos données\n";
    echo "3. Fichier > Enregistrer sous > Choisir 'CSV UTF-8'\n";
    echo "4. Utilisez le fichier CSV créé avec ce script\n";
    exit(1);
}

$fichierCSV = $argv[1];

// Vérifier que le fichier existe
if (!file_exists($fichierCSV)) {
    echo "❌ Erreur: Le fichier '$fichierCSV' n'existe pas.\n";
    exit(1);
}

echo "=== IMPORT WHITELIST DEPUIS CSV ===\n";
echo "Fichier: $fichierCSV\n";

// Détecter le séparateur
$delimiter = detectCSVDelimiter($fichierCSV);
echo "Séparateur détecté: '$delimiter'\n\n";

// Charger le fichier .env
$envFile = __DIR__ . '/../.env';
if (!loadEnv($envFile)) {
    echo "❌ Erreur: Fichier .env non trouvé\n";
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
    
    // VIDER LA TABLE WHITELIST AVANT L'IMPORT
    echo "⚠️  ATTENTION: Suppression de toutes les données existantes de la whitelist...\n";
    $pdo->exec("DELETE FROM agents_whitelist");
    echo "✓ Table whitelist vidée\n\n";
    
    // Ouvrir le fichier CSV
    $handle = fopen($fichierCSV, 'r');
    if (!$handle) {
        throw new Exception("Impossible d'ouvrir le fichier CSV");
    }
    
    echo "📖 Lecture du fichier CSV...\n";
    
    $compteurs = [
        'total' => 0,
        'succes' => 0,
        'erreurs' => 0,
        'ignores' => 0
    ];
    
    $erreurs = [];
    $ligneCourante = 0;
    $premiereLigne = true;
    
    // Lire le CSV ligne par ligne
    while (($data = fgetcsv($handle, 1000, $delimiter)) !== FALSE) {
        $ligneCourante++;
        
        // Détecter et ignorer les en-têtes
        if ($premiereLigne) {
            $premiereLigne = false;
            $premierElement = isset($data[0]) ? trim($data[0]) : '';
            
            if (is_string($premierElement) && (
                stripos($premierElement, 'code') !== false || 
                stripos($premierElement, 'personnel') !== false ||
                stripos($premierElement, 'cp') !== false ||
                stripos($premierElement, 'nom') !== false
            )) {
                echo "ℹ️ En-têtes détectés à la ligne 1, ignorés\n";
                continue;
            }
        }
        
        // Récupérer les données
        $codePersonnel = isset($data[0]) ? trim($data[0]) : '';
        $nom = isset($data[1]) ? trim($data[1]) : '';
        $prenom = isset($data[2]) ? trim($data[2]) : '';
        
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
            $erreurs[] = "Ligne $ligneCourante: " . implode(', ', $erreurLigne) . " (CP: '$codePersonnel', Nom: '$nom', Prénom: '$prenom')";
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
            $erreurs[] = "Ligne $ligneCourante: {$result['message']} ($codePersonnel)";
            $compteurs['erreurs']++;
        }
    }
    
    fclose($handle);
    
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
    
    echo "\nPour tester la validation, vous pouvez maintenant essayer de vous inscrire\n";
    echo "avec un des codes personnels importés via l'interface web.\n";

} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
?>