<?php
/**
 * Test simple de la normalisation des accents
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
loadEnv($envFile);

// Charger la classe WhitelistValidator
require_once __DIR__ . '/../src/WhitelistValidator.php';

// Classe test pour accéder aux méthodes privées
class WhitelistValidatorTest extends WhitelistValidator
{
    public function testNormalizeString($str) {
        // Utilise la méthode privée normalizeString via une méthode publique de test
        return $this->normalizeString($str);
    }

    public function testHashValue($str) {
        // Utilise la méthode privée hashValue via une méthode publique de test
        return $this->hashValue($str);
    }
}

try {
    // Créer une instance test (pas besoin de DB pour ce test)
    $validator = new WhitelistValidatorTest(null);

    echo "=== TEST DE NORMALISATION DES ACCENTS ===\n\n";

    // Cas de test
    $testCases = [
        ['José', 'JOSE'],
        ['François', 'FRANCOIS'],
        ['Müller', 'MULLER'],
        ['Léa', 'LEA'],
        ['Gaëlle', 'GAELLE'],
        ['Noël', 'NOEL'],
        ['Gérard', 'GERARD'],
        ['Stéphane', 'STEPHANE'],
        ['Cédric', 'CEDRIC'],
        ['Aurélie', 'AURELIE']
    ];

    $success = 0;
    $total = count($testCases);

    foreach ($testCases as $test) {
        $input = $test[0];
        $expected = $test[1];
        $result = $validator->testNormalizeString($input);

        $status = ($result === $expected) ? '✓' : '✗';
        if ($result === $expected) {
            $success++;
        }

        echo "{$status} '{$input}' → '{$result}' (attendu: '{$expected}')\n";
    }

    echo "\n=== TEST DE CONSISTANCE DES HASHES ===\n\n";

    // Tester que les hashes sont identiques pour des noms avec et sans accents
    $hashTests = [
        ['José', 'JOSE'],
        ['François', 'francois'],
        ['Müller', 'muller'],
    ];

    foreach ($hashTests as $test) {
        $hash1 = $validator->testHashValue($test[0]);
        $hash2 = $validator->testHashValue($test[1]);

        $status = ($hash1 === $hash2) ? '✓' : '✗';
        echo "{$status} Hash('{$test[0]}') === Hash('{$test[1]}')\n";

        if ($hash1 === $hash2) {
            $success++;
        }
        $total++;
    }

    echo "\n=== RÉSULTATS ===\n";
    echo "Tests réussis : {$success}/{$total}\n";

    if ($success === $total) {
        echo "✅ Tous les tests sont passés ! La normalisation fonctionne correctement.\n";
    } else {
        echo "❌ Certains tests ont échoué. Vérifiez la normalisation.\n";
    }

} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage() . "\n";
    exit(1);
}