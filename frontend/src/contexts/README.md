# AlertDrawer Context

Ce contexte permet de gérer les alertes de façon centralisée dans l'application React.

## Installation

Le contexte est déjà intégré dans `App.jsx` avec la configuration par défaut.

## Utilisation

### 1. Importer le hook

```jsx
import { useAlertDrawer } from '../contexts/AlertContext';
```

### 2. Utiliser le hook dans votre composant

```jsx
function MonComposant() {
    const { showAlert } = useAlertDrawer();

    const handleSuccess = () => {
        showAlert({
            title: 'Succès',
            subtitle: 'Opération réussie !',
            intent: 'success',
            showProgressBar: true,
            timeout: 5000
        });
    };

    const handleError = () => {
        showAlert({
            title: 'Erreur',
            subtitle: 'Une erreur est survenue',
            intent: 'error',
            showProgressBar: true,
            timeout: 8000
        });
    };

    return (
        <div>
            <wcs-button onClick={handleSuccess}>Succès</wcs-button>
            <wcs-button onClick={handleError}>Erreur</wcs-button>
        </div>
    );
}
```

## Types d'alertes disponibles

- `success` : Alerte de succès (verte)
- `error` : Alerte d'erreur (rouge)  
- `warning` : Alerte d'avertissement (orange)
- `information` : Alerte d'information (bleue)

## Configuration

La configuration par défaut dans `App.jsx` :

```jsx
<AlertDrawerProvider 
  config={{
    position: 'top-right',    // Position des alertes
    showProgressBar: true,    // Afficher la barre de progression
    timeout: 5000            // Durée par défaut (ms)
  }}
>
```

## Exemple complet

Voir `ExampleAlertUsage.jsx` pour un exemple d'utilisation complète avec tous les types d'alertes.