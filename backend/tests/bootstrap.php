<?php

require_once __DIR__ . '/../vendor/autoload.php';

// Configuration pour les tests
$_ENV['TESTING'] = true;

// Mock de PDO pour les tests
class MockPDO extends PDO {
    public function __construct() {
        // Ne pas appeler le constructeur parent pour éviter la connexion réelle
    }
    
    public function prepare($statement, $driver_options = []) {
        return new MockPDOStatement();
    }
    
    public function query($statement) {
        return new MockPDOStatement();
    }
    
    public function exec($statement) {
        return 1; // Simule une ligne affectée
    }
    
    public function lastInsertId($name = null) {
        return '123'; // ID simulé
    }
}

class MockPDOStatement extends PDOStatement {
    private $data = [];
    
    public function execute($input_parameters = null) {
        return true;
    }
    
    public function fetch($fetch_style = null, $cursor_orientation = PDO::FETCH_ORI_NEXT, $cursor_offset = 0) {
        return array_shift($this->data) ?: false;
    }
    
    public function fetchAll($fetch_style = null, $fetch_argument = null, $ctor_args = null) {
        return $this->data;
    }
    
    public function rowCount() {
        return count($this->data);
    }
    
    public function bindParam($parameter, &$variable, $data_type = PDO::PARAM_STR, $length = null, $driver_options = null) {
        return true;
    }
    
    public function bindValue($parameter, $value, $data_type = PDO::PARAM_STR) {
        return true;
    }
    
    public function setMockData($data) {
        $this->data = $data;
    }
}

// Helper functions pour les tests
function createMockDatabase() {
    return new MockPDO();
}

function getMockAgentData() {
    return [
        'code_personnel' => '1234567A',
        'nom' => 'Dupont',
        'prenom' => 'Jean',
        'nombre_proches' => 2,
        'heure_arrivee' => '09:00',
        'restauration_sur_place' => 1
    ];
}

function getMockCreneauxData() {
    return [
        'matin' => [
            '09:00' => ['places_restantes' => 10, 'complet' => false],
            '09:20' => ['places_restantes' => 8, 'complet' => false],
            '09:40' => ['places_restantes' => 12, 'complet' => false],
            '10:00' => ['places_restantes' => 15, 'complet' => false],
            '10:20' => ['places_restantes' => 9, 'complet' => false],
            '10:40' => ['places_restantes' => 11, 'complet' => false],
            '11:00' => ['places_restantes' => 7, 'complet' => false],
            '11:20' => ['places_restantes' => 13, 'complet' => false],
            '11:40' => ['places_restantes' => 6, 'complet' => false],
            '12:00' => ['places_restantes' => 10, 'complet' => false],
            '12:20' => ['places_restantes' => 5, 'complet' => false],
            '12:40' => ['places_restantes' => 14, 'complet' => false]
        ],
        'apres-midi' => [
            '13:00' => ['places_restantes' => 8, 'complet' => false],
            '13:20' => ['places_restantes' => 12, 'complet' => false],
            '13:40' => ['places_restantes' => 9, 'complet' => false],
            '14:00' => ['places_restantes' => 11, 'complet' => false],
            '14:20' => ['places_restantes' => 7, 'complet' => false],
            '14:40' => ['places_restantes' => 2, 'complet' => false]
        ]
    ];
}