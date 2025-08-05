<?php

namespace Journey\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Journey\Validation;

class ValidationTest extends TestCase {
    
    public function testValidateCodePersonnelWithValidCodes() {
        $this->assertEquals(1, Validation::validateCodePersonnel('1234567A'));
        $this->assertEquals(1, Validation::validateCodePersonnel('7654321z'));
        $this->assertEquals(1, Validation::validateCodePersonnel('0000000B'));
    }
    
    public function testValidateCodePersonnelWithInvalidCodes() {
        $this->assertEquals(0, Validation::validateCodePersonnel(''));
        $this->assertEquals(0, Validation::validateCodePersonnel('123456A')); // trop court
        $this->assertEquals(0, Validation::validateCodePersonnel('12345678A')); // trop long
        $this->assertEquals(0, Validation::validateCodePersonnel('1234567AB')); // 2 lettres
        $this->assertEquals(0, Validation::validateCodePersonnel('123456AA')); // lettre au mauvais endroit
        $this->assertEquals(0, Validation::validateCodePersonnel('ABCDEFGA')); // pas de chiffres
        $this->assertEquals(0, Validation::validateCodePersonnel('1234567')); // pas de lettre
        $this->assertEquals(0, Validation::validateCodePersonnel(null));
    }
    
    public function testValidateNomWithValidNames() {
        $this->assertTrue(Validation::validateNom('Dupont'));
        $this->assertTrue(Validation::validateNom('Le')); // minimum 2 caractères
        $this->assertTrue(Validation::validateNom('Martin-Dubois'));
    }
    
    public function testValidateNomWithInvalidNames() {
        $this->assertFalse(Validation::validateNom(''));
        $this->assertFalse(Validation::validateNom('A')); // trop court
        $this->assertFalse(Validation::validateNom(null));
        $this->assertFalse(Validation::validateNom('  ')); // espaces seulement
    }
    
    public function testValidatePrenomWithValidNames() {
        $this->assertTrue(Validation::validatePrenom('Jean'));
        $this->assertTrue(Validation::validatePrenom('Al')); // minimum 2 caractères
        $this->assertTrue(Validation::validatePrenom('Marie-Claire'));
    }
    
    public function testValidatePrenomWithInvalidNames() {
        $this->assertFalse(Validation::validatePrenom(''));
        $this->assertFalse(Validation::validatePrenom('J')); // trop court
        $this->assertFalse(Validation::validatePrenom(null));
        $this->assertFalse(Validation::validatePrenom('  ')); // espaces seulement
    }
    
    public function testValidateNombreProcheWithValidNumbers() {
        $this->assertTrue(Validation::validateNombreProches(0));
        $this->assertTrue(Validation::validateNombreProches('1'));
        $this->assertTrue(Validation::validateNombreProches('2'));
        $this->assertTrue(Validation::validateNombreProches('3'));
        $this->assertTrue(Validation::validateNombreProches('4'));
    }
    
    public function testValidateNombreProcheWithInvalidNumbers() {
        $this->assertFalse(Validation::validateNombreProches(''));
        $this->assertFalse(Validation::validateNombreProches('5')); // trop élevé
        $this->assertFalse(Validation::validateNombreProches('-1')); // négatif
        $this->assertFalse(Validation::validateNombreProches('abc')); // pas un nombre
        $this->assertFalse(Validation::validateNombreProches(null));
    }
    
    public function testValidateHeureArriveeWithValidSlots() {
        // Créneaux du matin
        $this->assertTrue(Validation::validateHeureArrivee('09:00'));
        $this->assertTrue(Validation::validateHeureArrivee('12:40'));
        
        // Créneaux de l'après-midi
        $this->assertTrue(Validation::validateHeureArrivee('13:00'));
        $this->assertTrue(Validation::validateHeureArrivee('14:40'));
        
        // Créneaux manquants qui étaient problématiques
        $this->assertTrue(Validation::validateHeureArrivee('12:00'));
        $this->assertTrue(Validation::validateHeureArrivee('12:20'));
        $this->assertTrue(Validation::validateHeureArrivee('12:40'));
    }
    
    public function testValidateHeureArriveeWithInvalidSlots() {
        $this->assertFalse(Validation::validateHeureArrivee(''));
        $this->assertFalse(Validation::validateHeureArrivee('08:00')); // trop tôt
        $this->assertFalse(Validation::validateHeureArrivee('15:00')); // trop tard
        $this->assertFalse(Validation::validateHeureArrivee('12:30')); // pas dans les créneaux
        $this->assertFalse(Validation::validateHeureArrivee('invalid'));
        $this->assertFalse(Validation::validateHeureArrivee(null));
    }
    
    public function testIsMatinCreneau() {
        $this->assertTrue(Validation::isMatinCreneau('09:00'));
        $this->assertTrue(Validation::isMatinCreneau('12:40'));
        $this->assertTrue(Validation::isMatinCreneau('12:59'));
        
        $this->assertFalse(Validation::isMatinCreneau('13:00'));
        $this->assertFalse(Validation::isMatinCreneau('14:40'));
        $this->assertFalse(Validation::isMatinCreneau(''));
    }
    
    public function testIsApresMidiCreneau() {
        $this->assertTrue(Validation::isApresMidiCreneau('13:00'));
        $this->assertTrue(Validation::isApresMidiCreneau('14:40'));
        $this->assertTrue(Validation::isApresMidiCreneau('15:00'));
        
        $this->assertFalse(Validation::isApresMidiCreneau('12:59'));
        $this->assertFalse(Validation::isApresMidiCreneau('09:00'));
        $this->assertFalse(Validation::isApresMidiCreneau(''));
    }
    
    public function testGetCreneauxMatin() {
        $matin = Validation::getCreneauxMatin();
        $this->assertCount(12, $matin);
        $this->assertEquals('09:00', $matin[0]);
        $this->assertEquals('12:40', $matin[count($matin) - 1]);
        
        // Vérifier que les créneaux problématiques sont présents
        $this->assertContains('12:00', $matin);
        $this->assertContains('12:20', $matin);
        $this->assertContains('12:40', $matin);
    }
    
    public function testGetCreneauxApresMidi() {
        $apresMidi = Validation::getCreneauxApresMidi();
        $this->assertCount(6, $apresMidi);
        $this->assertEquals('13:00', $apresMidi[0]);
        $this->assertEquals('14:40', $apresMidi[count($apresMidi) - 1]);
    }
    
    public function testGetAllCreneaux() {
        $tous = Validation::getAllCreneaux();
        $this->assertCount(18, $tous); // 12 + 6
        $this->assertEquals('09:00', $tous[0]);
        $this->assertEquals('14:40', $tous[count($tous) - 1]);
        
        // Vérifier que tous les créneaux sont présents
        $this->assertContains('12:00', $tous);
        $this->assertContains('12:20', $tous);
        $this->assertContains('12:40', $tous);
    }
    
    public function testValidatePlacesDisponibles() {
        // Cas valides
        $this->assertTrue(Validation::validatePlacesDisponibles(5, 0)); // 1 personne, 5 places
        $this->assertTrue(Validation::validatePlacesDisponibles(5, 4)); // 5 personnes, 5 places
        $this->assertTrue(Validation::validatePlacesDisponibles(10, 2)); // 3 personnes, 10 places
        
        // Cas invalides
        $this->assertFalse(Validation::validatePlacesDisponibles(2, 4)); // 5 personnes, 2 places
        $this->assertFalse(Validation::validatePlacesDisponibles(0, 0)); // 1 personne, 0 places
        $this->assertFalse(Validation::validatePlacesDisponibles(1, 1)); // 2 personnes, 1 place
        
        // Cas limites
        $this->assertTrue(Validation::validatePlacesDisponibles(1, 0)); // exactement assez
    }
    
    public function testValidateAgentWithValidData() {
        $validData = [
            'code_personnel' => '1234567A',
            'nom' => 'Dupont',
            'prenom' => 'Jean',
            'nombre_proches' => 2,
            'heure_arrivee' => '09:00'
        ];
        
        $errors = Validation::validateAgent($validData);
        $this->assertEmpty($errors);
    }
    
    public function testValidateAgentWithInvalidData() {
        $invalidData = [
            'code_personnel' => '123456A', // invalide
            'nom' => 'A', // trop court
            'prenom' => '', // vide
            'nombre_proches' => 5, // trop élevé
            'heure_arrivee' => '08:00' // pas dans les créneaux
        ];
        
        $errors = Validation::validateAgent($invalidData);
        $this->assertNotEmpty($errors);
        $this->assertArrayHasKey('code_personnel', $errors);
        $this->assertArrayHasKey('nom', $errors);
        $this->assertArrayHasKey('prenom', $errors);
        $this->assertArrayHasKey('nombre_proches', $errors);
        $this->assertArrayHasKey('heure_arrivee', $errors);
    }
}