---
name: site-manager-agent
description: >-
  Audits database, updates fiches techniques, creates news articles via Gemini, imports specs from raw HTML, and deploys the site.
---

# Site Manager Agent

## Overview
Ce skill équipe l'assistant d'outils en ligne de commande pour auditer la cohérence de la base de données, générer automatiquement des articles d'actualités réels avec l'IA, importer des fiches techniques à partir de copier-coller de tableaux HTML de sites externes, et rebâtir le site de manière autonome.

## Dependencies
Aucune dépendance externe requise. Le script utilise l'environnement Node.js existant de l'application.

## Quick Start
Pour utiliser le script CLI, positionnez-vous dans le dossier de script et lancez :
```bash
node .agents/skills/site-manager-agent/scripts/site_manager.js audit
```

## Utility Scripts
Le script de gestion supporte les sous-commandes suivantes :

### 1. Auditer la base de données
Analyse la base SQLite pour lister les données manquantes ou incohérentes :
```bash
node .agents/skills/site-manager-agent/scripts/site_manager.js audit
```
*Génère un rapport dans `audit_report.json`.*

### 2. Rédiger un article par IA Gemini
Génère et publie un article d'actualité automobile de qualité :
```bash
node .agents/skills/site-manager-agent/scripts/site_manager.js generate-news --topic "Lancement de la Dacia Spring 2026 au Maroc"
```
*Reconstruit le site et le publie automatiquement en ligne.*

### 3. Importer une fiche technique HTML
Extrait et intègre les données d'un tableau HTML copié-collé d'un site tiers :
```bash
node .agents/skills/site-manager-agent/scripts/site_manager.js import-specs --model-id "peugeot-208" --html-file "scratch/table.html"
```
*Remplit automatiquement les dimensions, consommations et équipements QCM.*

### 4. Reconstruire et publier le site
Reconstruit data.js et déploie immédiatement sur Firebase Hosting :
```bash
node .agents/skills/site-manager-agent/scripts/site_manager.js rebuild
```

## Rate Limiting
* L'API Gemini est limitée aux seuils configurés sur votre clé API. En cas d'erreur de taux (429), le script attend automatiquement avec un backoff exponentiel avant de retenter.
* L'importation HTML de fichiers locaux n'est soumise à aucune limite.

## Common Mistakes
* **Oubli de la clé Gemini** : Assurez-vous d'avoir configuré la clé dans l'administration (onglet configuration page d'accueil) ou d'avoir défini la variable d'environnement `GEMINI_API_KEY` avant d'exécuter `generate-news`.
* **Fichiers HTML mal formés** : Pour `import-specs`, assurez-vous que le fichier HTML contient des balises de tableau standards (`<tr>` et `<td>`) pour que cheerio puisse faire correspondre les clés de caractéristiques.
