<?php
/*
========================================
SCRIPT: add_admin.php
Utilitaire pour ajouter un administrateur via ligne de commande
========================================
*/

// Configuration base de données
$host = 'localhost';
$port = '3306';
$dbname = 'journee_proches';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    echo "❌ Erreur de connexion à la base de données: " . $e->getMessage() . "\n";
    exit(1);
}

// Fonction pour demander une saisie utilisateur
function prompt($message) {
    echo $message;
    return trim(fgets(STDIN));
}

// Fonction pour demander un mot de passe (masqué si possible)
function promptPassword($message) {
    echo $message;
    
    // Essayer de masquer la saisie sur Unix/Linux
    if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
        system('stty -echo');
        $password = trim(fgets(STDIN));
        system('stty echo');
        echo "\n";
    } else {
        // Sur Windows, saisie normale
        $password = trim(fgets(STDIN));
    }
    
    return $password;
}

echo "🛡️  AJOUT D'UN NOUVEL ADMINISTRATEUR\n";
echo "=====================================\n\n";

// Vérifier les administrateurs existants
try {
    $stmt = $pdo->query("SELECT username, role, created_at FROM admins ORDER BY created_at");
    $admins = $stmt->fetchAll();
    
    if (count($admins) > 0) {
        echo "👥 Administrateurs existants:\n";
        foreach ($admins as $admin) {
            echo "   - {$admin['username']} ({$admin['role']}) - Créé le " . date('d/m/Y', strtotime($admin['created_at'])) . "\n";
        }
        echo "\n";
    }
} catch (PDOException $e) {
    echo "❌ Erreur lors de la récupération des administrateurs: " . $e->getMessage() . "\n";
    exit(1);
}

// Demander les informations du nouvel administrateur
$newUsername = prompt("📝 Nom d'utilisateur: ");
if (empty($newUsername)) {
    echo "❌ Le nom d'utilisateur ne peut pas être vide.\n";
    exit(1);
}

// Vérifier si l'utilisateur existe déjà
try {
    $stmt = $pdo->prepare("SELECT id FROM admins WHERE username = ?");
    $stmt->execute([$newUsername]);
    if ($stmt->fetch()) {
        echo "❌ Un utilisateur avec ce nom existe déjà.\n";
        exit(1);
    }
} catch (PDOException $e) {
    echo "❌ Erreur lors de la vérification: " . $e->getMessage() . "\n";
    exit(1);
}

$newPassword = promptPassword("🔒 Mot de passe: ");
if (empty($newPassword)) {
    echo "❌ Le mot de passe ne peut pas être vide.\n";
    exit(1);
}

$confirmPassword = promptPassword("🔒 Confirmer le mot de passe: ");
if ($newPassword !== $confirmPassword) {
    echo "❌ Les mots de passe ne correspondent pas.\n";
    exit(1);
}

echo "\n👤 Rôle:\n";
echo "  1. admin (Administrateur standard)\n";
echo "  2. super-admin (Super administrateur)\n";
$roleChoice = prompt("Choisir (1 ou 2): ");

$role = 'admin';
switch ($roleChoice) {
    case '1':
        $role = 'admin';
        break;
    case '2':
        $role = 'super-admin';
        break;
    default:
        echo "⚠️  Choix invalide, rôle par défaut 'admin' sélectionné.\n";
}

// Confirmation
echo "\n📋 RÉCAPITULATIF:\n";
echo "   Nom d'utilisateur: $newUsername\n";
echo "   Rôle: $role\n";
$confirm = prompt("\n✅ Confirmer la création (o/N): ");

if (strtolower($confirm) !== 'o' && strtolower($confirm) !== 'oui') {
    echo "❌ Création annulée.\n";
    exit(0);
}

// Créer l'administrateur
try {
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO admins (username, password, role) 
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$newUsername, $hashedPassword, $role]);
    
    echo "\n✅ Administrateur créé avec succès!\n";
    echo "   ID: " . $pdo->lastInsertId() . "\n";
    echo "   Nom d'utilisateur: $newUsername\n";
    echo "   Rôle: $role\n";
    echo "   Date de création: " . date('d/m/Y H:i:s') . "\n";
    
    echo "\n🔐 Vous pouvez maintenant vous connecter avec ces identifiants.\n";
    
} catch (PDOException $e) {
    echo "❌ Erreur lors de la création: " . $e->getMessage() . "\n";
    exit(1);
}
?>