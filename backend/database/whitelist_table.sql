-- --------------------------------------------------------
--
-- Table structure for table `agents_whitelist` 
-- Whitelist sécurisée pour validation des codes personnels
--
CREATE TABLE `agents_whitelist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code_personnel` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code personnel SNCF (7 chiffres + 1 lettre)',
  `nom_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 du nom (sécurisé)',
  `prenom_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash SHA-256 du prénom (sécurisé)', 
  `actif` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Agent autorisé à s''inscrire (1=oui, 0=non)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_personnel` (`code_personnel`),
  KEY `idx_actif` (`actif`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Whitelist sécurisée des agents autorisés - données hachées pour protection RGPD';

-- --------------------------------------------------------
--
-- Table structure for table `agents_history`
-- Historique des modifications (manquante dans votre schéma actuel)
--
CREATE TABLE `agents_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_code_personnel` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du champ modifié',
  `old_value` text COLLATE utf8mb4_unicode_ci COMMENT 'Ancienne valeur',
  `new_value` text COLLATE utf8mb4_unicode_ci COMMENT 'Nouvelle valeur',
  `modified_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'system' COMMENT 'Utilisateur ayant fait la modification',
  `modification_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_agent_code` (`agent_code_personnel`),
  KEY `idx_field_name` (`field_name`),
  KEY `idx_modification_date` (`modification_date`),
  CONSTRAINT `fk_history_agent` FOREIGN KEY (`agent_code_personnel`) 
    REFERENCES `agents_inscriptions` (`code_personnel`) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Historique des modifications des agents inscriptions';

-- --------------------------------------------------------
--
-- Exemples de données pour la whitelist (hachées pour sécurité)
-- Les vrais hashes seront générés côté PHP
--
INSERT INTO `agents_whitelist` (`code_personnel`, `nom_hash`, `prenom_hash`, `actif`) VALUES
('1234567A', 'hash_nom_dupont_exemple', 'hash_prenom_jean_exemple', 1),
('2345678B', 'hash_nom_martin_exemple', 'hash_prenom_marie_exemple', 1),
('3456789C', 'hash_nom_bernard_exemple', 'hash_prenom_pierre_exemple', 0);

-- --------------------------------------------------------
--
-- Fonction PHP helper pour générer les hashes (à utiliser côté backend)
-- 
-- <?php
-- function hashForWhitelist($value) {
--     return hash('sha256', strtoupper(trim($value)) . $_ENV['WHITELIST_SALT']);
-- }
-- ?>