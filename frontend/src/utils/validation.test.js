import {
  validateCodePersonnel,
  validateNom,
  validatePrenom,
  validateNombreProches,
  validateHeureArrivee,
  isMatinCreneau,
  isApresMidiCreneau,
  getCreneauxMatin,
  getCreneauxApresMidi,
  getTousCreneaux,
  validatePlacesDisponibles
} from './validation';

describe('Validation Functions', () => {
  describe('validateCodePersonnel', () => {
    test('should validate correct format', () => {
      expect(validateCodePersonnel('1234567A')).toBe(true);
      expect(validateCodePersonnel('7654321z')).toBe(true);
      expect(validateCodePersonnel('0000000B')).toBe(true);
    });

    test('should reject incorrect format', () => {
      expect(validateCodePersonnel('')).toBe(false);
      expect(validateCodePersonnel('123456A')).toBe(false); // trop court
      expect(validateCodePersonnel('12345678A')).toBe(false); // trop long
      expect(validateCodePersonnel('1234567AB')).toBe(false); // 2 lettres
      expect(validateCodePersonnel('123456AA')).toBe(false); // lettre au mauvais endroit
      expect(validateCodePersonnel('ABCDEFGA')).toBe(false); // pas de chiffres
      expect(validateCodePersonnel('1234567')).toBe(false); // pas de lettre
      expect(validateCodePersonnel(null)).toBe(false);
      expect(validateCodePersonnel(undefined)).toBe(false);
    });
  });

  describe('validateNom', () => {
    test('should validate correct names', () => {
      expect(validateNom('Dupont')).toBe(true);
      expect(validateNom('Le')).toBe(true); // minimum 2 caractères
      expect(validateNom('Martin-Dubois')).toBe(true);
    });

    test('should reject incorrect names', () => {
      expect(validateNom('')).toBe(false);
      expect(validateNom('A')).toBe(false); // trop court
      expect(validateNom(null)).toBe(false);
      expect(validateNom(undefined)).toBe(false);
    });
  });

  describe('validatePrenom', () => {
    test('should validate correct first names', () => {
      expect(validatePrenom('Jean')).toBe(true);
      expect(validatePrenom('Al')).toBe(true); // minimum 2 caractères
      expect(validatePrenom('Marie-Claire')).toBe(true);
    });

    test('should reject incorrect first names', () => {
      expect(validatePrenom('')).toBe(false);
      expect(validatePrenom('J')).toBe(false); // trop court
      expect(validatePrenom(null)).toBe(false);
      expect(validatePrenom(undefined)).toBe(false);
    });
  });

  describe('validateNombreProches', () => {
    test('should validate correct numbers', () => {
      expect(validateNombreProches('0')).toBe(true);
      expect(validateNombreProches('1')).toBe(true);
      expect(validateNombreProches('2')).toBe(true);
      expect(validateNombreProches('3')).toBe(true);
      expect(validateNombreProches('4')).toBe(true);
    });

    test('should reject incorrect numbers', () => {
      expect(validateNombreProches('')).toBe(false);
      expect(validateNombreProches('5')).toBe(false); // trop élevé
      expect(validateNombreProches('-1')).toBe(false); // négatif
      expect(validateNombreProches('abc')).toBe(false); // pas un nombre
      expect(validateNombreProches(null)).toBe(false);
      expect(validateNombreProches(undefined)).toBe(false);
    });
  });

  describe('validateHeureArrivee', () => {
    test('should validate correct time slots', () => {
      // Créneaux du matin
      expect(validateHeureArrivee('09:00')).toBe(true);
      expect(validateHeureArrivee('12:20')).toBe(true);
      
      // Créneaux de l'après-midi
      expect(validateHeureArrivee('13:00')).toBe(true);
      expect(validateHeureArrivee('14:40')).toBe(true);
    });

    test('should reject incorrect time slots', () => {
      expect(validateHeureArrivee('')).toBe(false);
      expect(validateHeureArrivee('08:00')).toBe(false); // trop tôt
      expect(validateHeureArrivee('15:00')).toBe(false); // trop tard
      expect(validateHeureArrivee('12:30')).toBe(false); // pas dans les créneaux
      expect(validateHeureArrivee('invalid')).toBe(false);
      expect(validateHeureArrivee(null)).toBe(false);
      expect(validateHeureArrivee(undefined)).toBe(false);
    });
  });

  describe('isMatinCreneau and isApresMidiCreneau', () => {
    test('should correctly identify morning slots', () => {
      expect(isMatinCreneau('09:00')).toBe(true);
      expect(isMatinCreneau('12:20')).toBe(true);
      expect(isMatinCreneau('12:59')).toBe(true);
    });

    test('should correctly identify afternoon slots', () => {
      expect(isApresMidiCreneau('13:00')).toBe(true);
      expect(isApresMidiCreneau('14:40')).toBe(true);
      expect(isApresMidiCreneau('15:00')).toBe(true);
    });

    test('should handle edge cases', () => {
      expect(isMatinCreneau('13:00')).toBe(false);
      expect(isApresMidiCreneau('12:59')).toBe(false);
      expect(isMatinCreneau('')).toBe(false);
      expect(isApresMidiCreneau('')).toBe(false);
    });
  });

  describe('Creneaux getters', () => {
    test('should return correct morning slots', () => {
      const matin = getCreneauxMatin();
      expect(matin).toHaveLength(11);
      expect(matin[0]).toBe('09:00');
      expect(matin[matin.length - 1]).toBe('12:20');
      expect(matin).toContain('12:00');
      expect(matin).toContain('12:20');
      expect(matin).not.toContain('12:40');
    });

    test('should return correct afternoon slots', () => {
      const apresMidi = getCreneauxApresMidi();
      expect(apresMidi).toHaveLength(6);
      expect(apresMidi[0]).toBe('13:00');
      expect(apresMidi[apresMidi.length - 1]).toBe('14:40');
    });

    test('should return all slots correctly', () => {
      const tous = getTousCreneaux();
      expect(tous).toHaveLength(17); // 11 + 6
      expect(tous[0]).toBe('09:00');
      expect(tous[tous.length - 1]).toBe('14:40');
      
      // Vérifier que les créneaux manquants sont bien présents
      expect(tous).toContain('12:00');
      expect(tous).toContain('12:20');
      expect(tous).not.toContain('12:40');
    });
  });

  describe('validatePlacesDisponibles', () => {
    test('should validate sufficient places', () => {
      expect(validatePlacesDisponibles(5, '0')).toBe(true); // 1 personne, 5 places
      expect(validatePlacesDisponibles(5, '4')).toBe(true); // 5 personnes, 5 places
      expect(validatePlacesDisponibles(10, '2')).toBe(true); // 3 personnes, 10 places
    });

    test('should reject insufficient places', () => {
      expect(validatePlacesDisponibles(2, '4')).toBe(false); // 5 personnes, 2 places
      expect(validatePlacesDisponibles(0, '0')).toBe(false); // 1 personne, 0 places
      expect(validatePlacesDisponibles(1, '1')).toBe(false); // 2 personnes, 1 place
    });

    test('should handle edge cases', () => {
      expect(validatePlacesDisponibles(1, '0')).toBe(true); // exactement assez
      expect(validatePlacesDisponibles(14, '4')).toBe(true); // 5 personnes, 14 places disponibles
    });
  });
});