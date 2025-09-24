<?php

/**
 * Validateur de whitelist pour agents SNCF
 * Validation sécurisée avec hachage des données sensibles
 */
class WhitelistValidator 
{
    private $pdo;
    private $salt;

    public function __construct($pdo) 
    {
        $this->pdo = $pdo;
        // Utiliser une clé de hashage depuis les variables d'environnement
        $this->salt = $_ENV['WHITELIST_SALT'] ?? 'default_salt_change_me';
    }

    /**
     * Normalise une chaîne en supprimant les accents
     */
    protected function normalizeString(string $str): string
    {
        // Supprimer les accents en convertissant vers ASCII
        $str = iconv('UTF-8', 'ASCII//TRANSLIT', $str);
        // Nettoyer les caractères spéciaux restants
        $str = preg_replace('/[^A-Za-z0-9\s\-]/', '', $str);
        return strtoupper(trim($str));
    }

    /**
     * Génère un hash sécurisé pour la whitelist
     */
    protected function hashValue(string $value): string
    {
        return hash('sha256', $this->normalizeString($value) . $this->salt);
    }

    /**
     * Valide si un agent est autorisé à s'inscrire
     * 
     * @param string $codePersonnel Code personnel (ex: 1234567A)
     * @param string $nom Nom de famille
     * @param string $prenom Prénom
     * @return array Résultat de validation
     */
    public function validateAgent(string $codePersonnel, string $nom, string $prenom): array 
    {
        try {
            // Nettoyer les données d'entrée
            $codePersonnel = strtoupper(trim($codePersonnel));
            $nom = strtoupper(trim($nom));
            $prenom = strtoupper(trim($prenom));

            // Générer les hashes pour comparaison
            $nomHash = $this->hashValue($nom);
            $prenomHash = $this->hashValue($prenom);

            // Vérifier dans la whitelist
            $stmt = $this->pdo->prepare("
                SELECT actif, created_at 
                FROM agents_whitelist 
                WHERE code_personnel = ? 
                AND nom_hash = ? 
                AND prenom_hash = ? 
                AND actif = 1
            ");
            
            $stmt->execute([$codePersonnel, $nomHash, $prenomHash]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return [
                    'success' => true,
                    'authorized' => true,
                    'message' => 'Agent autorisé à s\'inscrire',
                    'registered_since' => $result['created_at']
                ];
            } else {
                // Vérifier si le code personnel existe mais avec de mauvaises données
                $stmtCode = $this->pdo->prepare("
                    SELECT actif FROM agents_whitelist WHERE code_personnel = ?
                ");
                $stmtCode->execute([$codePersonnel]);
                $codeExists = $stmtCode->fetch();

                if ($codeExists) {
                    return [
                        'success' => false,
                        'authorized' => false,
                        'error_type' => 'IDENTITY_MISMATCH',
                        'message' => 'Code personnel trouvé mais nom/prénom incorrect'
                    ];
                } else {
                    return [
                        'success' => false,
                        'authorized' => false,
                        'error_type' => 'NOT_IN_WHITELIST',
                        'message' => 'Agent non autorisé à s\'inscrire'
                    ];
                }
            }

        } catch (Exception $e) {
            error_log("WhitelistValidator Error: " . $e->getMessage());
            return [
                'success' => false,
                'authorized' => false,
                'error_type' => 'SYSTEM_ERROR',
                'message' => 'Erreur système lors de la validation'
            ];
        }
    }

    /**
     * Ajoute un agent à la whitelist (fonction admin)
     */
    public function addAgent(string $codePersonnel, string $nom, string $prenom): array 
    {
        try {
            $codePersonnel = strtoupper(trim($codePersonnel));
            $nomHash = $this->hashValue($nom);
            $prenomHash = $this->hashValue($prenom);

            $stmt = $this->pdo->prepare("
                INSERT INTO agents_whitelist (code_personnel, nom, prenom, nom_hash, prenom_hash, actif) 
                VALUES (?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE 
                nom = VALUES(nom),
                prenom = VALUES(prenom),
                nom_hash = VALUES(nom_hash), 
                prenom_hash = VALUES(prenom_hash),
                actif = 1,
                updated_at = CURRENT_TIMESTAMP
            ");

            $stmt->execute([$codePersonnel, $this->normalizeString($nom), $this->normalizeString($prenom), $nomHash, $prenomHash]);

            return [
                'success' => true,
                'message' => 'Agent ajouté à la whitelist avec succès'
            ];

        } catch (Exception $e) {
            error_log("WhitelistValidator Add Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'ajout à la whitelist'
            ];
        }
    }

    /**
     * Désactive un agent de la whitelist
     */
    public function deactivateAgent(string $codePersonnel): array 
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE agents_whitelist 
                SET actif = 0, updated_at = CURRENT_TIMESTAMP 
                WHERE code_personnel = ?
            ");

            $stmt->execute([strtoupper(trim($codePersonnel))]);

            return [
                'success' => true,
                'message' => 'Agent désactivé de la whitelist'
            ];

        } catch (Exception $e) {
            error_log("WhitelistValidator Deactivate Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de la désactivation'
            ];
        }
    }

    /**
     * Réactive un agent dans la whitelist
     */
    public function reactivateAgent(string $codePersonnel): array 
    {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE agents_whitelist 
                SET actif = 1, updated_at = CURRENT_TIMESTAMP 
                WHERE code_personnel = ?
            ");

            $stmt->execute([strtoupper(trim($codePersonnel))]);

            return [
                'success' => true,
                'message' => 'Agent réactivé dans la whitelist'
            ];

        } catch (Exception $e) {
            error_log("WhitelistValidator Reactivate Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de la réactivation'
            ];
        }
    }

    /**
     * Obtient les statistiques de la whitelist (pour admin)
     */
    public function getStats(): array 
    {
        try {
            $stmt = $this->pdo->query("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN actif = 1 THEN 1 ELSE 0 END) as actifs,
                    SUM(CASE WHEN actif = 0 THEN 1 ELSE 0 END) as inactifs
                FROM agents_whitelist
            ");

            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'stats' => $stats
            ];

        } catch (Exception $e) {
            error_log("WhitelistValidator Stats Error: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ];
        }
    }
}