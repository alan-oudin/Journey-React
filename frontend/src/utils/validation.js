// Fonctions de validation utilitaires
export const validateCodePersonnel = (code) => {
  if (!code) return false;
  return /^[0-9]{7}[A-Za-z]{1}$/.test(code);
};

export const validateNom = (nom) => {
  if (!nom) return false;
  return nom.length >= 2;
};

export const validatePrenom = (prenom) => {
  if (!prenom) return false;
  return prenom.length >= 2;
};

export const validateNombreProches = (nombre) => {
  if (nombre === '') return false;
  const num = parseInt(nombre);
  return num >= 0 && num <= 4;
};

export const validateHeureArrivee = (heure) => {
  if (!heure) return false;
  
  // Vérifier que l'heure est dans les créneaux valides
  const creneauxValides = [
    '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
    '11:00', '11:20', '11:40', '12:00', '12:20',
    '13:00', '13:20', '13:40', '14:00', '14:20', '14:40'
  ];
  
  return creneauxValides.includes(heure);
};

export const isMatinCreneau = (heure) => {
  if (!heure) return false;
  return heure < '13:00';
};

export const isApresMidiCreneau = (heure) => {
  if (!heure) return false;
  return heure >= '13:00';
};

export const getCreneauxMatin = () => {
  return [
    '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
    '11:00', '11:20', '11:40', '12:00', '12:20'
  ];
};

export const getCreneauxApresMidi = () => {
  return [
    '13:00', '13:20', '13:40', '14:00', '14:20', '14:40'
  ];
};

export const getTousCreneaux = () => {
  return [...getCreneauxMatin(), ...getCreneauxApresMidi()];
};

export const validatePlacesDisponibles = (placesRestantes, nombreProches) => {
  const personnesAInscrire = parseInt(nombreProches) + 1; // +1 pour l'agent
  return placesRestantes >= personnesAInscrire;
};