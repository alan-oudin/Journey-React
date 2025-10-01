# Fonctionnalité: Blocage/Déblocage des Créneaux

## Description
Cette fonctionnalité permet aux administrateurs de bloquer ou débloquer des créneaux horaires spécifiques pour empêcher les inscriptions sur ces plages horaires.

## Base de Données

### Table `creneaux_bloques`
```sql
CREATE TABLE `creneaux_bloques` (
  `id` int NOT NULL AUTO_INCREMENT,
  `heure_creneau` time NOT NULL COMMENT 'Heure du créneau bloqué',
  `date_creneau` date NULL DEFAULT NULL COMMENT 'Date du créneau bloqué (NULL = bloqué pour toutes les dates)',
  `bloque` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Créneau bloqué (1) ou débloqué (0)',
  `raison` varchar(255) DEFAULT NULL COMMENT 'Raison du blocage',
  `created_by` varchar(50) DEFAULT NULL COMMENT 'Administrateur ayant créé le blocage',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_creneau` (`heure_creneau`, `date_creneau`),
  KEY `idx_heure_creneau` (`heure_creneau`),
  KEY `idx_bloque` (`bloque`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

## API Endpoints

### 1. Bloquer un créneau
**Endpoint:** `POST /api.php?path=creneaux/bloquer`
**Authentification:** Requise (Bearer Token)

**Body:**
```json
{
  "heure_creneau": "09:00",
  "date_creneau": null,  // null = bloqué pour toutes les dates
  "raison": "Maintenance"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Créneau 09:00 bloqué avec succès",
  "heure_creneau": "09:00",
  "raison": "Maintenance"
}
```

### 2. Débloquer un créneau
**Endpoint:** `DELETE /api.php?path=creneaux/bloquer&heure=09:00`
**Authentification:** Requise (Bearer Token)

**Paramètres:**
- `heure` : Heure du créneau (format HH:MM)
- `date` : (optionnel) Date du créneau (format YYYY-MM-DD)

**Réponse:**
```json
{
  "success": true,
  "message": "Créneau 09:00 débloqué avec succès",
  "heure_creneau": "09:00"
}
```

### 3. Lister tous les créneaux bloqués
**Endpoint:** `GET /api.php?path=creneaux/bloquer`
**Authentification:** Requise (Bearer Token)

**Réponse:**
```json
{
  "success": true,
  "creneaux_bloques": [
    {
      "id": 1,
      "heure_creneau": "09:00",
      "date_creneau": null,
      "bloque": 1,
      "raison": "Maintenance",
      "created_by": "admin",
      "created_at": "2025-01-15 10:30:00",
      "updated_at": "2025-01-15 10:30:00"
    }
  ]
}
```

### 4. GET /creneaux (modifié)
L'endpoint existant `/api.php?path=creneaux` retourne maintenant des informations sur les créneaux bloqués:

```json
{
  "matin": {
    "09:00": {
      "agents_inscrits": 2,
      "personnes_total": 5,
      "places_restantes": 9,
      "complet": false,
      "bloque": true,
      "raison_blocage": "Maintenance"
    }
  },
  "apres-midi": {
    // ...
  }
}
```

## Intégration Frontend

### Exemple de code pour bloquer un créneau:

```javascript
async function bloquerCreneau(heureCreneau, raison) {
  const token = localStorage.getItem('token');

  const response = await fetch('/backend/public/api.php?path=creneaux/bloquer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      heure_creneau: heureCreneau,
      date_creneau: null,  // null = bloquer pour toutes les dates
      raison: raison
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('Créneau bloqué:', data);
    // Rafraîchir la liste des créneaux
  }
}
```

### Exemple de code pour débloquer un créneau:

```javascript
async function debloquerCreneau(heureCreneau) {
  const token = localStorage.getItem('token');

  const response = await fetch(`/backend/public/api.php?path=creneaux/bloquer&heure=${heureCreneau}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.success) {
    console.log('Créneau débloqué:', data);
    // Rafraîchir la liste des créneaux
  }
}
```

### Exemple de code pour lister les créneaux bloqués:

```javascript
async function getCreneauxBloques() {
  const token = localStorage.getItem('token');

  const response = await fetch('/backend/public/api.php?path=creneaux/bloquer', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.success) {
    console.log('Créneaux bloqués:', data.creneaux_bloques);
    return data.creneaux_bloques;
  }
}
```

## Interface Utilisateur Suggérée

### Dans la page admin de gestion des créneaux:

1. **Liste des créneaux disponibles**
   - Afficher tous les créneaux (matin + après-midi)
   - Pour chaque créneau:
     - Afficher l'heure
     - Afficher le nombre d'inscrits
     - Afficher un badge "Bloqué" si le créneau est bloqué
     - Bouton "Bloquer" / "Débloquer"

2. **Modal de blocage**
   - Champ: Raison du blocage (optionnel, max 255 caractères)
   - Bouton: Confirmer le blocage
   - Bouton: Annuler

3. **Confirmation de déblocage**
   - Message: "Êtes-vous sûr de vouloir débloquer ce créneau?"
   - Boutons: Confirmer / Annuler

## Notes Importantes

- Les créneaux bloqués **empêchent les nouvelles inscriptions** mais ne supprimentsur pas les inscriptions existantes
- Un créneau bloqué est visible dans l'interface publique avec une indication "Créneau indisponible"
- Seuls les administrateurs authentifiés peuvent bloquer/débloquer des créneaux
- La raison du blocage est optionnelle mais recommandée pour la traçabilité
- Le système enregistre automatiquement l'administrateur qui a effectué le blocage

## Test de l'API

Vous pouvez tester l'API avec curl:

```bash
# Bloquer un créneau
curl -X POST "http://localhost/backend/public/api.php?path=creneaux/bloquer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"heure_creneau":"09:00","raison":"Test de blocage"}'

# Débloquer un créneau
curl -X DELETE "http://localhost/backend/public/api.php?path=creneaux/bloquer&heure=09:00" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Lister les créneaux bloqués
curl -X GET "http://localhost/backend/public/api.php?path=creneaux/bloquer" \
  -H "Authorization: Bearer YOUR_TOKEN"
```