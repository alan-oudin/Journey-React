-- Script de migration pour ajouter la colonne 'restauration_sur_place' à la table agents_inscriptions
-- À exécuter sur la base de données existante

USE journee_proches;

-- Ajouter la colonne restauration_sur_place
ALTER TABLE `agents_inscriptions` 
ADD COLUMN `restauration_sur_place` tinyint(1) NOT NULL DEFAULT 0 
COMMENT 'Indique si l''agent est intéressé par la restauration sur place (0=Non, 1=Oui)'
AFTER `note`;

-- Vérification que la colonne a été ajoutée
DESCRIBE agents_inscriptions;