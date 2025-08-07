-- Script pour ajouter les colonnes nom et prenom à la table agents_whitelist
-- Les données hachées restent pour la validation, les données en clair pour l'affichage

ALTER TABLE agents_whitelist 
ADD COLUMN nom VARCHAR(100) NULL AFTER code_personnel,
ADD COLUMN prenom VARCHAR(100) NULL AFTER nom;

-- Index pour les recherches par nom/prénom
CREATE INDEX idx_agents_whitelist_nom ON agents_whitelist(nom);
CREATE INDEX idx_agents_whitelist_prenom ON agents_whitelist(prenom);