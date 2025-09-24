<?php

namespace Journey;

class Validation {
    
    public static function validateCodePersonnel($code) {
        if (empty($code)) {
            return false;
        }
        return preg_match('/^[0-9]{7}[A-Za-z]{1}$/', $code);
    }
    
    public static function validateNom($nom) {
        if (empty($nom)) {
            return false;
        }
        return strlen(trim($nom)) >= 2;
    }
    
    public static function validatePrenom($prenom) {
        if (empty($prenom)) {
            return false;
        }
        return strlen(trim($prenom)) >= 2;
    }
    
    public static function validateNombreProches($nombre) {
        if (!is_numeric($nombre)) {
            return false;
        }
        $num = (int) $nombre;
        return $num >= 0 && $num <= 4;
    }
    
    public static function validateHeureArrivee($heure) {
        if (empty($heure)) {
            return false;
        }
        
        $creneauxValides = [
            '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
            '11:00', '11:20', '11:40', '12:00', '12:20',
            '13:00', '13:20', '13:40', '14:00', '14:20', '14:40'
        ];
        
        return in_array($heure, $creneauxValides);
    }
    
    public static function isMatinCreneau($heure) {
        if (empty($heure)) {
            return false;
        }
        return $heure < '13:00';
    }
    
    public static function isApresMidiCreneau($heure) {
        if (empty($heure)) {
            return false;
        }
        return $heure >= '13:00';
    }
    
    public static function getCreneauxMatin() {
        return [
            '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
            '11:00', '11:20', '11:40', '12:00', '12:20'
        ];
    }
    
    public static function getCreneauxApresMidi() {
        return [
            '13:00', '13:20', '13:40', '14:00', '14:20', '14:40'
        ];
    }
    
    public static function getAllCreneaux() {
        return array_merge(self::getCreneauxMatin(), self::getCreneauxApresMidi());
    }
    
    public static function validatePlacesDisponibles($placesRestantes, $nombreProches) {
        $personnesAInscrire = (int) $nombreProches + 1; // +1 pour l'agent
        return $placesRestantes >= $personnesAInscrire;
    }
    
    public static function validateAgent($data) {
        $errors = [];
        
        if (!self::validateCodePersonnel($data['code_personnel'] ?? '')) {
            $errors['code_personnel'] = 'Code personnel invalide (format attendu: 7 chiffres + 1 lettre)';
        }
        
        if (!self::validateNom($data['nom'] ?? '')) {
            $errors['nom'] = 'Nom invalide (minimum 2 caractères)';
        }
        
        if (!self::validatePrenom($data['prenom'] ?? '')) {
            $errors['prenom'] = 'Prénom invalide (minimum 2 caractères)';
        }
        
        if (!self::validateNombreProches($data['nombre_proches'] ?? '')) {
            $errors['nombre_proches'] = 'Nombre de proches invalide (0 à 4)';
        }
        
        if (!self::validateHeureArrivee($data['heure_arrivee'] ?? '')) {
            $errors['heure_arrivee'] = 'Heure d\'arrivée invalide';
        }
        
        return $errors;
    }
}