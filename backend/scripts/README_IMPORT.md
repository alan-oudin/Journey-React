# 📋 Import Whitelist - Guide d'utilisation

Ce guide explique comment importer une liste d'agents autorisés depuis un fichier Excel ou CSV.

## 🎯 Objectif

Le système de whitelist sécurise l'inscription en n'autorisant que les agents préalablement enregistrés. Les données personnelles (noms/prénoms) sont hachées pour la protection RGPD.

## 📁 Format des données requis

### Colonnes attendues :
1. **Code Personnel** : Format SNCF (7 chiffres + 1 lettre, ex: `1234567A`)
2. **Nom** : Nom de famille (ex: `DUPONT`)  
3. **Prénom** : Prénom (ex: `Jean`)

## 📊 Méthode 1 : Import CSV (Recommandé)

### Étape 1 : Préparer le fichier Excel
1. Ouvrez votre fichier Excel avec les colonnes : Code Personnel, Nom, Prénom
2. Vérifiez le format des codes personnels (7 chiffres + 1 lettre)
3. Fichier > Enregistrer sous > **CSV UTF-8 (délimité par des virgules)**

### Étape 2 : Lancer l'import
```bash
cd C:\wamp64\www\journey\backend\scripts
php import_whitelist_csv.php chemin/vers/votre_fichier.csv
```

### Exemple avec le fichier d'exemple :
```bash
php import_whitelist_csv.php exemple_whitelist.csv
```

## 📈 Méthode 2 : Import Excel Direct

### Prérequis : Installer les dépendances
```bash
# Sur Windows, double-cliquez sur :
install_dependencies.bat

# Ou manuellement :
cd C:\wamp64\www\journey\backend
composer install
```

### Lancer l'import Excel :
```bash
php import_whitelist_excel.php chemin/vers/votre_fichier.xlsx
```

## ✅ Exemples de formats acceptés

### CSV valide :
```csv
Code Personnel,Nom,Prénom
1234567A,DUPONT,Jean
2345678B,MARTIN,Marie
```

### Excel valide :
| A (Code Personnel) | B (Nom) | C (Prénom) |
|-------------------|---------|------------|
| 1234567A          | DUPONT  | Jean       |
| 2345678B          | MARTIN  | Marie      |

## 🔍 Validation automatique

Le script vérifie automatiquement :
- ✅ Format du code personnel (7 chiffres + 1 lettre)
- ✅ Présence du nom et prénom
- ✅ Détection des en-têtes (ignorées automatiquement)
- ✅ Doublons (mis à jour automatiquement)

## 📊 Rapport d'import

Après l'import, vous obtenez :
```
=== RAPPORT D'IMPORT ===
Total lignes traitées: 150
Succès: 147
Erreurs: 3
Lignes ignorées (vides): 2

=== STATISTIQUES WHITELIST ===
Agents dans la whitelist: 147
- Actifs: 147
- Inactifs: 0
```

## ❌ Erreurs courantes

### Format code personnel invalide :
```
❌ Ligne 5: Format code personnel invalide (1234567) 
```
**Solution** : Le code doit contenir exactement 7 chiffres + 1 lettre

### Données manquantes :
```
❌ Ligne 12: Nom manquant (CP: 1234567A, Nom: '', Prénom: Jean)
```
**Solution** : Vérifiez que toutes les colonnes sont remplies

### Agent déjà existant :
```
✗ - Un agent avec ce code personnel existe déjà
```
**Note** : L'agent existant sera mis à jour avec les nouvelles données

## 🔐 Sécurité

- Les noms et prénoms sont automatiquement hachés avec SHA-256
- Seuls les codes personnels restent en clair (nécessaires pour les recherches)
- La clé de salage est configurable dans `.env` (`WHITELIST_SALT`)

## 🎮 Test du système

Après l'import, testez avec l'interface web :
1. Allez sur votre application Journey
2. Essayez de vous inscrire avec un code personnel importé
3. ✅ L'inscription devrait fonctionner
4. Essayez avec un code non-importé  
5. ❌ L'inscription devrait être refusée

## 📞 Support

En cas de problème :
1. Vérifiez les logs d'erreur du script
2. Vérifiez le format de vos données
3. Testez avec le fichier `exemple_whitelist.csv` fourni