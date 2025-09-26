import jsPDF from 'jspdf';
import { EVENT_CONFIG } from '../constants/event';

export const generateReservationPDF = (formData) => {
  const doc = new jsPDF();

  // Configuration de la police
  doc.setFont('helvetica');

  // En-tête du document
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CONFIRMATION DE RÉSERVATION', 20, 30);

  doc.setFontSize(16);
  doc.setTextColor(211, 47, 47);
  doc.text(EVENT_CONFIG.name, 20, 45);

  // Date de l'événement
  doc.setFontSize(14);
  doc.setTextColor(76, 175, 80);
  doc.text(`Date: ${EVENT_CONFIG.date}`, 20, 60);

  // Ligne de séparation
  doc.setDrawColor(0, 0, 0);
  doc.line(20, 70, 190, 70);

  // Informations de l'agent
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('INFORMATIONS DE L\'AGENT', 20, 85);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);

  let yPosition = 100;

  doc.text(`Code Personnel: ${formData.codePersonnel}`, 20, yPosition);
  yPosition += 10;

  doc.text(`Nom: ${formData.nom}`, 20, yPosition);
  yPosition += 10;

  doc.text(`Prénom: ${formData.prenom}`, 20, yPosition);
  yPosition += 10;

  doc.text(`Nombre de proches: ${formData.nombreProches}`, 20, yPosition);
  yPosition += 10;

  const totalPersonnes = parseInt(formData.nombreProches) + 1;
  doc.text(`Total de personnes: ${totalPersonnes}`, 20, yPosition);
  yPosition += 20;

  // Informations du créneau
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('DÉTAILS DE LA RÉSERVATION', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);

  doc.text(`Date: ${EVENT_CONFIG.date}`, 20, yPosition);
  yPosition += 10;

  doc.text(`Heure d'arrivée: ${formData.heureArrivee}`, 20, yPosition);
  yPosition += 10;

  // Période de la journée
  const heure = parseInt(formData.heureArrivee.split(':')[0]);
  const periode = heure < 13 ? 'Matin' : 'Après-midi';
  doc.text(`Période: ${periode}`, 20, yPosition);
  yPosition += 20;

  // Rappels importants
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('RAPPELS IMPORTANTS', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  const rappels = [
    '- Stationnement obligatoire sur le site uniquement',
    '- Stationnement en marche arrière obligatoire',
    '- Se signaler a l\'entree du site aupres de la personne responsable',
    '- Se presenter 5-10 minutes avant le debut du creneau',
    '- Duree de visite limitee a 2 heures maximum',
    '- Piece d\'identite obligatoire pour tous les visiteurs',
    '- Ponctualite requise pour respecter les creneaux'
  ];

  rappels.forEach(rappel => {
    doc.text(rappel, 20, yPosition);
    yPosition += 8;
  });

  // Pied de page
  yPosition += 20;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, yPosition);

  // Ligne de séparation en bas
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition + 10, 190, yPosition + 10);

  // Informations de contact (exemple)
  doc.setFontSize(8);
  doc.text('Pour toute question, veuillez contacter le service des ressources humaines', 20, yPosition + 20);

  return doc;
};

export const downloadReservationPDF = (formData) => {
  const doc = generateReservationPDF(formData);
  const fileName = `reservation_${formData.codePersonnel}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};