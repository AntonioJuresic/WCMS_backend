-- MySQL Script generated by MySQL Workbench
-- Tue Nov  9 21:35:31 2021
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema wcms
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `wcms` ;

-- -----------------------------------------------------
-- Schema wcms
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `wcms` DEFAULT CHARACTER SET utf8 ;
USE `wcms` ;

-- -----------------------------------------------------
-- Table `wcms`.`authority`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`authority` ;

CREATE TABLE IF NOT EXISTS `wcms`.`authority` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `level` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`user` ;

CREATE TABLE IF NOT EXISTS `wcms`.`user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `imagePath` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `dateOfCreation` DATETIME NOT NULL,
  `deleted` TINYINT NOT NULL,
  `authorityId` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_user_authority1_idx` (`authorityId` ASC) VISIBLE,
  CONSTRAINT `fk_user_authority1`
    FOREIGN KEY (`authorityId`)
    REFERENCES `wcms`.`authority` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = INNODB;


-- -----------------------------------------------------
-- Table `wcms`.`category`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`category` ;

CREATE TABLE IF NOT EXISTS `wcms`.`category` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = INNODB;


-- -----------------------------------------------------
-- Table `wcms`.`post`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`post` ;

CREATE TABLE IF NOT EXISTS `wcms`.`post` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `imagePath` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `dateOfCreation` DATETIME NOT NULL,
  `userId` INT NOT NULL,
  `categoryId` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_article_author_idx` (`userId` ASC) VISIBLE,
  INDEX `fk_article_category1_idx` (`categoryId` ASC) VISIBLE,
  CONSTRAINT `fk_article_author`
    FOREIGN KEY (`userId`)
    REFERENCES `wcms`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_article_category1`
    FOREIGN KEY (`categoryId`)
    REFERENCES `wcms`.`category` (`id`)
    ON DELETE SET NULL
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`meta`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`meta` ;

CREATE TABLE IF NOT EXISTS `wcms`.`meta` (
  `id` INT NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `imagePath` TEXT NOT NULL,
  `charset` TEXT NOT NULL,
  `keywords` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `author` TEXT NOT NULL,
  `viewport` TEXT NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`comment`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`comment` ;

CREATE TABLE IF NOT EXISTS `wcms`.`comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `content` TEXT NOT NULL,
  `dateOfCreation` DATETIME NOT NULL,
  `userId` INT NOT NULL,
  `postId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_comment_user1_idx` (`userId` ASC) VISIBLE,
  INDEX `fk_comment_post1_idx` (`postId` ASC) VISIBLE,
  CONSTRAINT `fk_comment_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `wcms`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comment_post1`
    FOREIGN KEY (`postId`)
    REFERENCES `wcms`.`post` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`invitation`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`invitation` ;

CREATE TABLE IF NOT EXISTS `wcms`.`invitation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `emailAddress` VARCHAR(255) NOT NULL,
  `emailSubject` TEXT NOT NULL,
  `emailMessage` TEXT NOT NULL,
  `authorityId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_invitation_authority1_idx` (`authorityId` ASC) VISIBLE,
  CONSTRAINT `fk_invitation_authority1`
    FOREIGN KEY (`authorityId`)
    REFERENCES `wcms`.`authority` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`passwordReset`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`passwordReset` ;

CREATE TABLE IF NOT EXISTS `wcms`.`passwordReset` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(255) NOT NULL,
  `dateOfCreation` DATETIME NOT NULL,
  `dateOfExpiration` DATETIME NOT NULL,
  `userId` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_resetPassword_user1_idx` (`userId` ASC) VISIBLE,
  CONSTRAINT `fk_resetPassword_user1`
    FOREIGN KEY (`userId`)
    REFERENCES `wcms`.`user` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`header`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`header` ;

CREATE TABLE IF NOT EXISTS `wcms`.`header` (
  `id` INT NOT NULL DEFAULT 1,
  `content` TEXT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `wcms`.`footer`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `wcms`.`footer` ;

CREATE TABLE IF NOT EXISTS `wcms`.`footer` (
  `id` INT NOT NULL DEFAULT 1,
  `content` TEXT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
