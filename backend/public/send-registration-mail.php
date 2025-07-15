<?php
// public/send-registration-mail.php
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Fonction utilitaire pour loguer dans plusieurs emplacements
function log_debug($message) {
    $log1 = __DIR__ . '/mail_debug.log';
    $log2 = sys_get_temp_dir() . '/mail_debug.log';
    $ok1 = @file_put_contents($log1, $message . "\n", FILE_APPEND);
    $ok2 = @file_put_contents($log2, $message . "\n", FILE_APPEND);
    if ($ok1 === false && $ok2 === false) {
        error_log("[PHPMailer] Impossible d'écrire dans mail_debug.log : $message");
    }
}

// Récupérer les données POST (JSON)
$input = json_decode(file_get_contents('php://input'), true);
log_debug("Données reçues : " . print_r($input, true));
$email = isset($input['email']) ? $input['email'] : '';
console_log("Email reçu : $email");
$nom = isset($input['nom']) ? $input['nom'] : '';

if (!$email || !$nom) {
    http_response_code(400);
    echo json_encode(['error' => 'Email et nom requis']);
    exit;
}

// Compléter l'adresse email avec le domaine SNCF si besoin
$fullEmail = (strpos($email, '@') !== false) ? $email : $email . '@sncf.fr';

// Vérification stricte : format prenom.nom@sncf.fr (lettres, chiffres et tirets acceptés)
if (!preg_match('/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+@sncf\.fr$/', $fullEmail)) {
    http_response_code(400);
    echo json_encode(['error' => "Le format de l'adresse doit être prenom.nom@sncf.fr (lettres, chiffres et tirets autorisés)."]);
    exit;
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'messagerie.sncf.fr';
    $mail->Port = 25;
    $mail->SMTPAuth = true;
    $mail->SMTPAutoTLS = false;
    $mail->SMTPSecure = false;
    $mail->Username = 'fleet-mgr_svc';
    $mail->Password = '847HFT?PvC!wiOIb,2TWcf7r478iopMl.@60';
    $mail->CharSet = 'UTF-8';
    $mail->setFrom('cen_cvl_stf_sct@sncf.fr', 'STF SCT Fleet manager');
    $mail->addAddress($fullEmail);
    $mail->Subject = 'Bienvenue sur notre plateforme';
    $mail->Body = "Bonjour $nom,\n\nMerci pour votre inscription !";
    $mail->isHTML(false);
    $mail->send();
    log_debug("Envoi réussi à : $fullEmail pour $nom");
    // Affichage direct pour debug (sera visible dans la réponse HTTP)
    echo json_encode([
        'message' => 'Email envoyé avec succès',
        'debug_email_utilise' => $fullEmail
    ]);
} catch (Exception $e) {
    log_debug("Erreur d'envoi à : $fullEmail pour $nom : " . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode(['error' => "Erreur lors de l'envoi de l'email", 'details' => $mail->ErrorInfo]);
}
