# 🛡️ Guide d'Administration - Journée des Proches

## Vue d'ensemble

Ce système d'administration vous permet de gérer les inscriptions et les administrateurs de l'application "Journée des Proches".

**🔒 PAGES PROTÉGÉES** : Les pages Gestion et Recherche nécessitent désormais une authentification administrateur.

## Méthodes pour ajouter un administrateur

### 1. 🌐 Via l'interface web (Recommandé)

1. **Connectez-vous** : Accédez à `/admin` et connectez-vous avec vos identifiants
2. **Onglet Administrateurs** : Cliquez sur "👥 Gestion des administrateurs"
3. **Ajouter** : Cliquez sur "➕ Ajouter un administrateur"
4. **Remplir le formulaire** :
   - Nom d'utilisateur
   - Mot de passe
   - Rôle (admin ou super-admin)
5. **Valider** : Cliquez sur "Ajouter"

### 2. 💻 Via ligne de commande (Script PHP)

```bash
# Dans le dossier backend
php add_admin.php
```

Le script vous guidera interactivement pour :
- Voir les administrateurs existants
- Saisir le nom d'utilisateur
- Saisir le mot de passe (masqué)
- Choisir le rôle
- Confirmer la création

### 3. 🗄️ Directement en base de données (SQL)

```sql
-- Remplacez 'nouveau_user' et 'mot_de_passe' par vos valeurs
INSERT INTO admins (username, password, role) 
VALUES (
    'nouveau_user', 
    '$2y$10$hash_du_mot_de_passe', 
    'admin'
);
```

**⚠️ Important** : Le mot de passe doit être hashé avec `password_hash()` de PHP.

## Comptes administrateur par défaut

- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`
- **Rôle** : `admin`

## Rôles disponibles

- **admin** : Administrateur standard
- **super-admin** : Super administrateur (fonctionnalités étendues)

## Accès aux fonctionnalités

### 🏠 Page d'accueil (Libre)
- Inscription des agents
- Sélection des créneaux
- **Accessible à tous**

### 🔒 Pages protégées (Authentification requise)
- **Gestion** (`/gestion`) : Vue d'ensemble et administration des inscriptions
- **Recherche** (`/recherche`) : Recherche d'agents inscrits
- **Administration** (`/admin`) : Panneau d'administration complet

## Fonctionnalités de l'administration

### 📊 Gestion des inscriptions (Pages protégées)
- Vue d'ensemble des statistiques
- Liste des agents inscrits
- Modification des statuts
- Gestion des notes
- Export CSV
- Gestion des créneaux

### 👥 Gestion des administrateurs (Page admin)
- Liste des administrateurs
- Ajout de nouveaux administrateurs
- Suppression d'administrateurs
- Protection contre l'auto-suppression

## Sécurité

### Protection automatique
- ✅ Authentification par token JWT
- ✅ Vérification des permissions
- ✅ Protection contre l'auto-suppression
- ✅ Protection de l'admin par défaut (ID 1)
- ✅ Hachage sécurisé des mots de passe

### Bonnes pratiques
- Utilisez des mots de passe forts
- Changez le mot de passe par défaut
- Supprimez les comptes inutilisés
- Vérifiez régulièrement les accès

## API Endpoints pour les administrateurs

### 🔐 Authentification
```
POST /api.php?path=login
GET /api.php?path=verify-token
```

### 👥 Gestion des administrateurs
```
GET /api.php?path=admins          # Lister
POST /api.php?path=admins         # Ajouter
DELETE /api.php?path=admins&id=X  # Supprimer
```

## Dépannage

### Problème de connexion
1. Vérifiez les identifiants
2. Vérifiez que le token n'a pas expiré (1 heure)
3. Effacez le cache du navigateur

### Erreur "Token invalide"
- Reconnectez-vous
- Le token expire après 1 heure

### Impossible de supprimer un admin
- Vous ne pouvez pas supprimer votre propre compte
- L'admin par défaut (ID 1) est protégé

## Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez les logs du serveur
3. Contactez le développeur

---

*Guide mis à jour le : ${new Date().toLocaleDateString('fr-FR')}*