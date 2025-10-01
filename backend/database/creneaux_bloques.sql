-- Table pour gérer le blocage des créneaux
CREATE TABLE IF NOT EXISTS `creneaux_bloques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `heure_creneau` time NOT NULL COMMENT 'Heure du créneau bloqué',
  `date_creneau` date NULL DEFAULT NULL COMMENT 'Date du créneau bloqué (NULL = bloqué pour toutes les dates)',
  `bloque` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Créneau bloqué (1) ou débloqué (0)',
  `raison` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Raison du blocage',
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Administrateur ayant créé le blocage',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_creneau` (`heure_creneau`, `date_creneau`),
  KEY `idx_heure_creneau` (`heure_creneau`),
  KEY `idx_bloque` (`bloque`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table pour gérer le blocage des créneaux horaires';