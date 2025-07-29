-- Script de migration pour ajouter la colonne 'note' à la table agents_inscriptions
-- À exécuter sur la base de données existante

USE journee_proches;

-- Ajouter la colonne note
ALTER TABLE `agents_inscriptions` 
ADD COLUMN `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL 
COMMENT 'Notes concernant l''agent (pointage jour J, remarques particulières)'
AFTER `heure_arrivee`;

-- Vérification que la colonne a été ajoutée
DESCRIBE agents_inscriptions;