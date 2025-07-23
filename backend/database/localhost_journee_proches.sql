-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 23, 2025 at 08:10 AM
-- Server version: 8.0.30
-- PHP Version: 8.3.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `journee_proches`
--
CREATE DATABASE IF NOT EXISTS `journee_proches` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `journee_proches`;

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$kHgoCcAnNdkfsmO4lGCTZusT.MLf4mXWOn7Ed6WcMCNIjULgki0rO', 'admin', '2025-06-07 01:01:51', '2025-06-07 01:01:51');

-- --------------------------------------------------------

--
-- Table structure for table `agents_inscriptions`
--

CREATE TABLE `agents_inscriptions` (
  `id` int NOT NULL,
  `code_personnel` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Format: 7 chiffres + 1 lettre (ex: 1234567A)',
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de famille de l''agent',
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Prénom de l''agent',
  `nombre_proches` int NOT NULL DEFAULT '0' COMMENT 'Nombre de proches accompagnants (0 à 4)',
  `statut` enum('inscrit','present','absent','annule') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inscrit',
  `heure_validation` timestamp NULL DEFAULT NULL COMMENT 'Heure de validation de présence (pointage automatique)',
  `heure_arrivee` time NOT NULL COMMENT 'Heure d''arrivée prévue - créneaux de 20 minutes',
  `note` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Notes concernant l''agent (pointage jour J, remarques particulières)',
  `date_inscription` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date et heure d''inscription',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Table des inscriptions pour la journée des proches';

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `agents_inscriptions`
--
ALTER TABLE `agents_inscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_personnel` (`code_personnel`),
  ADD KEY `idx_statut` (`statut`),
  ADD KEY `idx_heure_arrivee` (`heure_arrivee`),
  ADD KEY `idx_date_inscription` (`date_inscription`),
  ADD KEY `idx_statut_heure` (`statut`,`heure_arrivee`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `agents_inscriptions`
--
ALTER TABLE `agents_inscriptions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;
