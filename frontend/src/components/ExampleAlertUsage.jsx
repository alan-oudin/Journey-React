import React from 'react';
import { useAlertDrawer } from '../contexts/AlertContext';

export default function ExampleAlertUsage() {
    const { showAlert } = useAlertDrawer();

    const showSuccessAlert = () => {
        showAlert({
            title: 'Opération réussie',
            subtitle: 'Vos modifications ont été sauvegardées avec succès',
            intent: 'success',
            showProgressBar: true,
            timeout: 5000
        });
    };

    const showErrorAlert = () => {
        showAlert({
            title: 'Erreur',
            subtitle: 'Une erreur est survenue lors de l\'opération',
            intent: 'error',
            showProgressBar: true,
            timeout: 8000
        });
    };

    const showWarningAlert = () => {
        showAlert({
            title: 'Attention',
            subtitle: 'Cette action nécessite votre confirmation',
            intent: 'warning',
            showProgressBar: true,
            timeout: 6000
        });
    };

    const showInfoAlert = () => {
        showAlert({
            title: 'Information',
            subtitle: 'Voici une information importante à retenir',
            intent: 'information',
            showProgressBar: true,
            timeout: 4000
        });
    };

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <wcs-button color="primary" onClick={showSuccessAlert}>
                Succès
            </wcs-button>
            <wcs-button color="danger" onClick={showErrorAlert}>
                Erreur
            </wcs-button>
            <wcs-button color="warning" onClick={showWarningAlert}>
                Attention
            </wcs-button>
            <wcs-button color="info" onClick={showInfoAlert}>
                Information
            </wcs-button>
        </div>
    );
}