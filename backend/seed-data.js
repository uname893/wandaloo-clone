/**
 * seed-data.js
 * Peuplement complet de la base de données avec les marques et modèles
 * du marché automobile marocain + fiches techniques détaillées.
 * Usage: node seed-data.js
 */

const { initDB, insertBrand, insertModel, insertImages, insertSpec } = require('./db');

// ===========================
// DONNÉES COMPLÈTES DU MARCHÉ
// ===========================
const BRANDS = [
  {
    id: 'renault', nom: 'Renault', pays: 'France', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-renault.png',
    site_officiel: 'https://www.renault.ma', nb_modeles: 5, prix_min: 89900, prix_max: 420000
  },
  {
    id: 'dacia', nom: 'Dacia', pays: 'Roumanie (Groupe Renault)', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-dacia.png',
    site_officiel: 'https://www.dacia.ma', nb_modeles: 4, prix_min: 89900, prix_max: 249900
  },
  {
    id: 'peugeot', nom: 'Peugeot', pays: 'France (Stellantis)', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-peugeot.png',
    site_officiel: 'https://www.peugeot.ma', nb_modeles: 5, prix_min: 139900, prix_max: 490000
  },
  {
    id: 'citroen', nom: 'Citroën', pays: 'France (Stellantis)', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-citroen.png',
    site_officiel: 'https://www.citroen.ma', nb_modeles: 4, prix_min: 119900, prix_max: 340000
  },
  {
    id: 'mg', nom: 'MG', pays: 'Chine (SAIC)', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-mg.png',
    site_officiel: 'https://www.mgmotor.ma', nb_modeles: 8, prix_min: 169000, prix_max: 680000
  },
  {
    id: 'volkswagen', nom: 'Volkswagen', pays: 'Allemagne', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-volkswagen.png',
    site_officiel: 'https://www.volkswagen.ma', nb_modeles: 5, prix_min: 179900, prix_max: 620000
  },
  {
    id: 'hyundai', nom: 'Hyundai', pays: 'Corée du Sud', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-hyundai.png',
    site_officiel: 'https://www.hyundai.ma', nb_modeles: 5, prix_min: 149900, prix_max: 520000
  },
  {
    id: 'kia', nom: 'Kia', pays: 'Corée du Sud', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-kia.png',
    site_officiel: 'https://www.kia.ma', nb_modeles: 4, prix_min: 159900, prix_max: 480000
  },
  {
    id: 'toyota', nom: 'Toyota', pays: 'Japon', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-toyota.png',
    site_officiel: 'https://www.toyota.ma', nb_modeles: 5, prix_min: 169000, prix_max: 740000
  },
  {
    id: 'ford', nom: 'Ford', pays: 'États-Unis', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-ford.png',
    site_officiel: 'https://www.ford.ma', nb_modeles: 3, prix_min: 199000, prix_max: 520000
  },
  {
    id: 'bmw', nom: 'BMW', pays: 'Allemagne', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-bmw.png',
    site_officiel: 'https://www.bmw.ma', nb_modeles: 4, prix_min: 349000, prix_max: 1250000
  },
  {
    id: 'mercedes', nom: 'Mercedes-Benz', pays: 'Allemagne', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-mercedes-benz.png',
    site_officiel: 'https://www.mercedes-benz.ma', nb_modeles: 4, prix_min: 375000, prix_max: 1500000
  },
  {
    id: 'audi', nom: 'Audi', pays: 'Allemagne (Groupe VW)', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-audi.png',
    site_officiel: 'https://www.audi.ma', nb_modeles: 3, prix_min: 349000, prix_max: 950000
  },
  {
    id: 'byd', nom: 'BYD', pays: 'Chine', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-byd.png',
    site_officiel: 'https://www.byd.com/ma', nb_modeles: 4, prix_min: 319000, prix_max: 749000
  },
  {
    id: 'chery', nom: 'Chery', pays: 'Chine', logo: 'https://www.wandaloo.com/backoffice/uploads/constructeur/logo/logo-chery.png',
    site_officiel: 'https://www.chery.ma', nb_modeles: 3, prix_min: 159900, prix_max: 320000
  },
];

// ===========================
// MODÈLES AVEC FICHES TECHNIQUES
// ===========================
const MODELS = [

  // ================================
  // RENAULT
  // ================================
  {
    id: 'renault-clio', marque: 'Renault', nom: 'Clio', slug: 'clio', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 89900, prix_max: 179900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/renault/Renault-Clio-5-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/renault/clio/',
    motorisations: [
      { version: 'Clio Zen 1.0L SCe', moteur: '1.0L SCe 3 cyl.', puissance: '65 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'Clio Zen 1.0L TCe', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Clio Techno 1.0L TCe', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'CVT', carburant: 'Essence' },
      { version: 'Clio E-Tech Hybrid', moteur: '1.6L + Moteur électrique', puissance: '143 ch', transmission: 'Automatique', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4050 mm', largeur: '1798 mm', hauteur: '1448 mm', empattement: '2583 mm',
      poids: '1040 kg', coffre: '391 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui (TCe)', vitesse_max: '183 km/h', acceleration: '11.6 s',
      conso_urbaine: '6.2 L/100km', conso_extra: '4.4 L/100km', conso_mixte: '5.1 L/100km',
      emission_co2: '115 g/km', reservoir: '42 L', roues: '16 pouces', pneus: '205/45 R16'
    }
  },
  {
    id: 'renault-logan', marque: 'Renault', nom: 'Logan', slug: 'logan', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 109900, prix_max: 159900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/renault/Renault-Logan-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/renault/logan/',
    motorisations: [
      { version: 'Logan Zen 1.0L SCe', moteur: '1.0L SCe 3 cyl.', puissance: '65 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'Logan Techno 1.0L TCe', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'CVT', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4369 mm', largeur: '1784 mm', hauteur: '1498 mm', empattement: '2634 mm',
      poids: '1095 kg', coffre: '510 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui (TCe)', vitesse_max: '168 km/h', acceleration: '13.2 s',
      conso_urbaine: '6.4 L/100km', conso_extra: '4.7 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '121 g/km', reservoir: '50 L', roues: '15 pouces', pneus: '185/65 R15'
    }
  },
  {
    id: 'renault-captur', marque: 'Renault', nom: 'Captur', slug: 'captur', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 199900, prix_max: 299900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/renault/Renault-Captur-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/renault/captur/',
    motorisations: [
      { version: 'Captur Zen 1.0L TCe 90', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Captur Techno 1.3L TCe 130', moteur: '1.3L TCe Turbo', puissance: '130 ch', transmission: 'EDC7', carburant: 'Essence' },
      { version: 'Captur E-Tech Hybrid 145', moteur: '1.6L + 2 moteurs élec.', puissance: '145 ch', transmission: 'Automatique', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4227 mm', largeur: '1797 mm', hauteur: '1576 mm', empattement: '2638 mm',
      poids: '1248 kg', coffre: '422 L', cylindree: '1333 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '194 km/h', acceleration: '9.8 s',
      conso_urbaine: '6.8 L/100km', conso_extra: '5.0 L/100km', conso_mixte: '5.7 L/100km',
      emission_co2: '129 g/km', reservoir: '48 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'renault-arkana', marque: 'Renault', nom: 'Arkana', slug: 'arkana', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 229900, prix_max: 340000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/renault/Renault-Arkana-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/renault/arkana/',
    motorisations: [
      { version: 'Arkana Zen 1.3L TCe 140', moteur: '1.3L TCe Turbo', puissance: '140 ch', transmission: 'EDC7', carburant: 'Essence' },
      { version: 'Arkana E-Tech Hybrid 145', moteur: '1.6L + 2 moteurs élec.', puissance: '145 ch', transmission: 'Automatique', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4568 mm', largeur: '1820 mm', hauteur: '1576 mm', empattement: '2720 mm',
      poids: '1457 kg', coffre: '513 L', cylindree: '1598 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '180 km/h', acceleration: '9.3 s',
      conso_urbaine: '5.4 L/100km', conso_extra: '5.2 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '120 g/km', reservoir: '50 L', roues: '18 pouces', pneus: '215/50 R18'
    }
  },
  {
    id: 'renault-megane', marque: 'Renault', nom: 'Mégane E-Tech', slug: 'megane', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 319000, prix_max: 420000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/renault/Renault-Megane-E-Tech-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/renault/megane/',
    motorisations: [
      { version: 'Mégane E-Tech 130 ch', moteur: 'Électrique 40 kWh', puissance: '130 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'Mégane E-Tech 220 ch', moteur: 'Électrique 60 kWh', puissance: '220 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4200 mm', largeur: '1768 mm', hauteur: '1505 mm', empattement: '2685 mm',
      poids: '1624 kg', coffre: '440 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '160 km/h', acceleration: '7.4 s',
      conso_urbaine: '14.8 kWh/100km', conso_extra: '12.0 kWh/100km', conso_mixte: '13.2 kWh/100km',
      emission_co2: '0 g/km', reservoir: '60 kWh', roues: '18 pouces', pneus: '215/50 R18'
    }
  },

  // ================================
  // DACIA
  // ================================
  {
    id: 'dacia-sandero', marque: 'Dacia', nom: 'Sandero', slug: 'sandero', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 89900, prix_max: 139900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/dacia/Dacia-Sandero-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/dacia/sandero/',
    motorisations: [
      { version: 'Sandero Essential 1.0L SCe 65', moteur: '1.0L SCe 3 cyl.', puissance: '65 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'Sandero Expression 1.0L TCe 90', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Sandero Bi-Fuel 1.0L TCe', moteur: '1.0L TCe', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4088 mm', largeur: '1769 mm', hauteur: '1497 mm', empattement: '2588 mm',
      poids: '993 kg', coffre: '328 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui (TCe)', vitesse_max: '164 km/h', acceleration: '13.5 s',
      conso_urbaine: '6.4 L/100km', conso_extra: '4.7 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '120 g/km', reservoir: '50 L', roues: '15 pouces', pneus: '185/65 R15'
    }
  },
  {
    id: 'dacia-duster', marque: 'Dacia', nom: 'Duster', slug: 'duster', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 179900, prix_max: 249900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/dacia/Dacia-Duster-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/dacia/duster/',
    motorisations: [
      { version: 'Duster Expression 1.0L TCe 90 2WD', moteur: '1.0L TCe Turbo', puissance: '90 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Duster Extreme 1.3L TCe 130 2WD', moteur: '1.3L TCe Turbo', puissance: '130 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Duster Extreme 1.3L TCe 130 4WD', moteur: '1.3L TCe Turbo', puissance: '130 ch', transmission: '4WD Manuelle 6', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4341 mm', largeur: '1804 mm', hauteur: '1694 mm', empattement: '2656 mm',
      poids: '1275 kg', coffre: '472 L', cylindree: '1333 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '184 km/h', acceleration: '10.7 s',
      conso_urbaine: '7.5 L/100km', conso_extra: '5.7 L/100km', conso_mixte: '6.4 L/100km',
      emission_co2: '145 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/60 R17'
    }
  },
  {
    id: 'dacia-jogger', marque: 'Dacia', nom: 'Jogger', slug: 'jogger', annee: 2024,
    categorie: 'Monospace', carrosserie: 'Monospace',
    prix_min: 159900, prix_max: 229900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/dacia/Dacia-Jogger-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/dacia/jogger/',
    motorisations: [
      { version: 'Jogger Essential 1.0L TCe 110', moteur: '1.0L TCe Turbo', puissance: '110 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Jogger Extreme 1.0L TCe 110 Bi-Fuel', moteur: '1.0L TCe', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4547 mm', largeur: '1777 mm', hauteur: '1632 mm', empattement: '2898 mm',
      poids: '1257 kg', coffre: '708 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '176 km/h', acceleration: '11.5 s',
      conso_urbaine: '7.2 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.1 L/100km',
      emission_co2: '140 g/km', reservoir: '50 L', roues: '16 pouces', pneus: '205/60 R16'
    }
  },
  {
    id: 'dacia-spring', marque: 'Dacia', nom: 'Spring', slug: 'spring', annee: 2024,
    categorie: 'Citadine', carrosserie: 'SUV',
    prix_min: 139900, prix_max: 169900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/dacia/Dacia-Spring-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/dacia/spring/',
    motorisations: [
      { version: 'Spring Expression 45 ch', moteur: 'Électrique 26.8 kWh', puissance: '45 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'Spring Extreme 65 ch', moteur: 'Électrique 26.8 kWh', puissance: '65 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '3701 mm', largeur: '1622 mm', hauteur: '1519 mm', empattement: '2423 mm',
      poids: '984 kg', coffre: '308 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '125 km/h', acceleration: '13.7 s',
      conso_urbaine: '14.5 kWh/100km', conso_extra: '11.5 kWh/100km', conso_mixte: '13.0 kWh/100km',
      emission_co2: '0 g/km', reservoir: '26.8 kWh', roues: '15 pouces', pneus: '165/70 R15'
    }
  },

  // ================================
  // PEUGEOT
  // ================================
  {
    id: 'peugeot-208', marque: 'Peugeot', nom: '208', slug: '208', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 139900, prix_max: 229900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/peugeot/Peugeot-208-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/peugeot/208/',
    motorisations: [
      { version: '208 Like 1.2L PureTech 75', moteur: '1.2L PureTech 3 cyl.', puissance: '75 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: '208 Active 1.2L PureTech 100', moteur: '1.2L PureTech Turbo', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: '208 Allure 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: 'e-208 136 ch', moteur: 'Électrique 51 kWh', puissance: '136 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4055 mm', largeur: '1745 mm', hauteur: '1444 mm', empattement: '2538 mm',
      poids: '1049 kg', coffre: '311 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui (PureTech)', vitesse_max: '194 km/h', acceleration: '9.9 s',
      conso_urbaine: '6.0 L/100km', conso_extra: '4.5 L/100km', conso_mixte: '5.1 L/100km',
      emission_co2: '116 g/km', reservoir: '44 L', roues: '16 pouces', pneus: '205/45 R16'
    }
  },
  {
    id: 'peugeot-2008', marque: 'Peugeot', nom: '2008', slug: '2008', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 199900, prix_max: 329900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/peugeot/Peugeot-2008-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/peugeot/2008/',
    motorisations: [
      { version: '2008 Active 1.2L PureTech 100', moteur: '1.2L PureTech Turbo', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: '2008 Allure 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: 'e-2008 136 ch', moteur: 'Électrique 51 kWh', puissance: '136 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4300 mm', largeur: '1770 mm', hauteur: '1550 mm', empattement: '2610 mm',
      poids: '1229 kg', coffre: '434 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '192 km/h', acceleration: '9.7 s',
      conso_urbaine: '6.8 L/100km', conso_extra: '5.0 L/100km', conso_mixte: '5.7 L/100km',
      emission_co2: '130 g/km', reservoir: '47 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'peugeot-3008', marque: 'Peugeot', nom: '3008', slug: '3008', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 299900, prix_max: 420000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/peugeot/Peugeot-3008-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/peugeot/3008/',
    motorisations: [
      { version: '3008 Active 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: '3008 GT 1.6L PureTech 180', moteur: '1.6L PureTech Turbo', puissance: '180 ch', transmission: 'EAT8', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4447 mm', largeur: '1841 mm', hauteur: '1624 mm', empattement: '2675 mm',
      poids: '1421 kg', coffre: '520 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '210 km/h', acceleration: '8.5 s',
      conso_urbaine: '7.3 L/100km', conso_extra: '5.6 L/100km', conso_mixte: '6.3 L/100km',
      emission_co2: '142 g/km', reservoir: '55 L', roues: '19 pouces', pneus: '235/50 R19'
    }
  },
  {
    id: 'peugeot-5008', marque: 'Peugeot', nom: '5008', slug: '5008', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 369000, prix_max: 490000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/peugeot/Peugeot-5008-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/peugeot/5008/',
    motorisations: [
      { version: '5008 Allure 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: '5008 GT 1.6L PureTech 180', moteur: '1.6L PureTech Turbo', puissance: '180 ch', transmission: 'EAT8', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4641 mm', largeur: '1894 mm', hauteur: '1680 mm', empattement: '2840 mm',
      poids: '1630 kg', coffre: '702 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '210 km/h', acceleration: '8.5 s',
      conso_urbaine: '7.5 L/100km', conso_extra: '5.8 L/100km', conso_mixte: '6.4 L/100km',
      emission_co2: '146 g/km', reservoir: '60 L', roues: '19 pouces', pneus: '235/50 R19'
    }
  },
  {
    id: 'peugeot-508', marque: 'Peugeot', nom: '508', slug: '508', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 349000, prix_max: 490000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/peugeot/Peugeot-508-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/peugeot/508/',
    motorisations: [
      { version: '508 Allure 1.6L PureTech 180', moteur: '1.6L PureTech Turbo', puissance: '180 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: '508 GT 1.6L PureTech 225', moteur: '1.6L PureTech Turbo', puissance: '225 ch', transmission: 'EAT8', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4750 mm', largeur: '1859 mm', hauteur: '1403 mm', empattement: '2793 mm',
      poids: '1497 kg', coffre: '487 L', cylindree: '1598 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '250 km/h', acceleration: '7.1 s',
      conso_urbaine: '7.4 L/100km', conso_extra: '5.8 L/100km', conso_mixte: '6.4 L/100km',
      emission_co2: '145 g/km', reservoir: '62 L', roues: '18 pouces', pneus: '235/45 R18'
    }
  },

  // ================================
  // CITROËN
  // ================================
  {
    id: 'citroen-c3', marque: 'Citroën', nom: 'C3', slug: 'c3', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 119900, prix_max: 179900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/citroen/Citroen-C3-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/citroen/c3/',
    motorisations: [
      { version: 'C3 You 1.2L PureTech 83', moteur: '1.2L PureTech 3 cyl.', puissance: '83 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'C3 Plus 1.2L PureTech 110', moteur: '1.2L PureTech Turbo', puissance: '110 ch', transmission: 'Automatique 6', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4015 mm', largeur: '1755 mm', hauteur: '1577 mm', empattement: '2540 mm',
      poids: '1046 kg', coffre: '316 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui (PureTech)', vitesse_max: '178 km/h', acceleration: '11.3 s',
      conso_urbaine: '5.9 L/100km', conso_extra: '4.4 L/100km', conso_mixte: '5.0 L/100km',
      emission_co2: '114 g/km', reservoir: '44 L', roues: '16 pouces', pneus: '195/55 R16'
    }
  },
  {
    id: 'citroen-c5-aircross', marque: 'Citroën', nom: 'C5 Aircross', slug: 'c5-aircross', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 249900, prix_max: 340000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/citroen/Citroen-C5-Aircross-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/citroen/c5-aircross/',
    motorisations: [
      { version: 'C5 Aircross You 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: 'C5 Aircross Plus 1.6L PureTech 180', moteur: '1.6L PureTech Turbo', puissance: '180 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: 'C5 Aircross Hybrid 225 PHEV', moteur: '1.6L + Moteur élec. PHEV', puissance: '225 ch', transmission: 'EAT8', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4500 mm', largeur: '1844 mm', hauteur: '1670 mm', empattement: '2730 mm',
      poids: '1447 kg', coffre: '580 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '210 km/h', acceleration: '8.9 s',
      conso_urbaine: '7.0 L/100km', conso_extra: '5.4 L/100km', conso_mixte: '6.0 L/100km',
      emission_co2: '137 g/km', reservoir: '53 L', roues: '18 pouces', pneus: '225/50 R18'
    }
  },
  {
    id: 'citroen-berlingo', marque: 'Citroën', nom: 'Berlingo', slug: 'berlingo', annee: 2024,
    categorie: 'Monospace', carrosserie: 'Monospace',
    prix_min: 189900, prix_max: 259900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/citroen/Citroen-Berlingo-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/citroen/berlingo/',
    motorisations: [
      { version: 'Berlingo Live 1.2L PureTech 110', moteur: '1.2L PureTech Turbo', puissance: '110 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Berlingo Max 1.5L BlueHDi 130', moteur: '1.5L BlueHDi', puissance: '130 ch', transmission: 'EAT8', carburant: 'Diesel' },
    ],
    specs: {
      longueur: '4403 mm', largeur: '1848 mm', hauteur: '1843 mm', empattement: '2785 mm',
      poids: '1405 kg', coffre: '775 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '182 km/h', acceleration: '10.3 s',
      conso_urbaine: '7.1 L/100km', conso_extra: '5.4 L/100km', conso_mixte: '6.0 L/100km',
      emission_co2: '138 g/km', reservoir: '50 L', roues: '16 pouces', pneus: '195/65 R16'
    }
  },
  {
    id: 'citroen-c4', marque: 'Citroën', nom: 'C4', slug: 'c4', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 219900, prix_max: 340000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/citroen/Citroen-C4-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/citroen/c4/',
    motorisations: [
      { version: 'C4 You 1.2L PureTech 100', moteur: '1.2L PureTech Turbo', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'C4 Plus 1.2L PureTech 130', moteur: '1.2L PureTech Turbo', puissance: '130 ch', transmission: 'EAT8', carburant: 'Essence' },
      { version: 'ë-C4 136 ch', moteur: 'Électrique 51 kWh', puissance: '136 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4360 mm', largeur: '1800 mm', hauteur: '1525 mm', empattement: '2670 mm',
      poids: '1232 kg', coffre: '380 L', cylindree: '1199 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '193 km/h', acceleration: '9.6 s',
      conso_urbaine: '6.5 L/100km', conso_extra: '5.0 L/100km', conso_mixte: '5.5 L/100km',
      emission_co2: '126 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },

  // ================================
  // MG
  // ================================
  {
    id: 'mg-zs', marque: 'MG', nom: 'MG ZS', slug: 'zs', annee: 2025,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 199000, prix_max: 219000,
    image: 'https://www.wandaloo.com/backoffice/uploads/images/modeles/photos/mg-zs-face.jpg',
    fiche_url: '/neuf/mg/zs/',
    motorisations: [
      { version: 'ZS Comfort 1.5L VTI', moteur: '1.5L VTI 4 cyl.', puissance: '106 ch', transmission: 'Automatique CVT', carburant: 'Essence' },
      { version: 'ZS Luxury 1.5L VTI', moteur: '1.5L VTI 4 cyl.', puissance: '106 ch', transmission: 'Automatique CVT', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4323 mm', largeur: '1809 mm', hauteur: '1664 mm', empattement: '2585 mm',
      poids: '1339 kg', coffre: '448 L', cylindree: '1499 cc', cylindres: '4',
      turbo: 'Non', vitesse_max: '175 km/h', acceleration: '11.8 s',
      conso_urbaine: '7.4 L/100km', conso_extra: '5.7 L/100km', conso_mixte: '6.3 L/100km',
      emission_co2: '144 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'mg-zs-ev', marque: 'MG', nom: 'ZS EV', slug: 'zs-ev', annee: 2025,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 231750, prix_max: 263000,
    image: 'https://www.wandaloo.com/files/2023/03/MG-Motors-MG-ZS-EV-2023-Neuve-Maroc-video.jpg',
    fiche_url: '/neuf/mg/zs-ev/',
    motorisations: [
      { version: 'ZS EV Standard Range 51 kWh', moteur: 'Électrique 51 kWh', puissance: '177 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'ZS EV Long Range 72 kWh', moteur: 'Électrique 72 kWh', puissance: '177 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4323 mm', largeur: '1809 mm', hauteur: '1664 mm', empattement: '2585 mm',
      poids: '1620 kg', coffre: '448 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '175 km/h', acceleration: '8.2 s',
      conso_urbaine: '17.5 kWh/100km', conso_extra: '14.0 kWh/100km', conso_mixte: '15.5 kWh/100km',
      emission_co2: '0 g/km', reservoir: '72 kWh', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'mg-hs', marque: 'MG', nom: 'HS', slug: 'hs', annee: 2025,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 270000, prix_max: 312900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mg/MG-HS-2025-Neuve-Maroc-12.jpg',
    fiche_url: '/neuf/mg/hs/',
    motorisations: [
      { version: 'HS 1.5T Comfort', moteur: '1.5L Turbo 4 cyl.', puissance: '162 ch', transmission: 'Automatique DCT 7', carburant: 'Essence' },
      { version: 'HS 1.5T Luxury', moteur: '1.5L Turbo 4 cyl.', puissance: '162 ch', transmission: 'Automatique DCT 7', carburant: 'Essence' },
      { version: 'HS Hybrid+ Comfort', moteur: '1.5L + Moteur élec.', puissance: '215 ch', transmission: 'Automatique', carburant: 'Hybride' },
      { version: 'HS Hybrid+ Luxury', moteur: '1.5L + Moteur élec.', puissance: '215 ch', transmission: 'Automatique', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4571 mm', largeur: '1876 mm', hauteur: '1693 mm', empattement: '2765 mm',
      poids: '1590 kg', coffre: '504 L', cylindree: '1499 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '200 km/h', acceleration: '8.6 s',
      conso_urbaine: '7.9 L/100km', conso_extra: '6.1 L/100km', conso_mixte: '6.8 L/100km',
      emission_co2: '155 g/km', reservoir: '55 L', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
  {
    id: 'mg-mg3', marque: 'MG', nom: 'MG3', slug: 'mg3', annee: 2025,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 169000, prix_max: 189000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mg/MG-3-HEV-2025-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/mg/mg3/',
    motorisations: [
      { version: 'MG3 Hybrid+ Comfort', moteur: '1.5L + Moteur élec.', puissance: '195 ch', transmission: 'Automatique', carburant: 'Hybride' },
      { version: 'MG3 Hybrid+ Luxury', moteur: '1.5L + Moteur élec.', puissance: '195 ch', transmission: 'Automatique', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4112 mm', largeur: '1760 mm', hauteur: '1502 mm', empattement: '2570 mm',
      poids: '1352 kg', coffre: '293 L', cylindree: '1499 cc', cylindres: '4',
      turbo: 'Non (Hybride)', vitesse_max: '185 km/h', acceleration: '7.0 s',
      conso_urbaine: '5.0 L/100km', conso_extra: '5.2 L/100km', conso_mixte: '5.1 L/100km',
      emission_co2: '115 g/km', reservoir: '40 L', roues: '17 pouces', pneus: '205/55 R17'
    }
  },

  // ================================
  // VOLKSWAGEN
  // ================================
  {
    id: 'vw-polo', marque: 'Volkswagen', nom: 'Polo', slug: 'polo', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 179900, prix_max: 259900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/volkswagen/Volkswagen-Polo-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/volkswagen/polo/',
    motorisations: [
      { version: 'Polo Life 1.0L TSI 95', moteur: '1.0L TSI 3 cyl.', puissance: '95 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'Polo Style 1.0L TSI 110', moteur: '1.0L TSI 3 cyl.', puissance: '110 ch', transmission: 'DSG7', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4074 mm', largeur: '1751 mm', hauteur: '1461 mm', empattement: '2564 mm',
      poids: '1095 kg', coffre: '351 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui (TSI)', vitesse_max: '194 km/h', acceleration: '10.8 s',
      conso_urbaine: '6.0 L/100km', conso_extra: '4.5 L/100km', conso_mixte: '5.1 L/100km',
      emission_co2: '116 g/km', reservoir: '40 L', roues: '15 pouces', pneus: '195/65 R15'
    }
  },
  {
    id: 'vw-golf', marque: 'Volkswagen', nom: 'Golf', slug: 'golf', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 269000, prix_max: 399000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/volkswagen/Volkswagen-Golf-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/volkswagen/golf/',
    motorisations: [
      { version: 'Golf Life 1.0L TSI 110', moteur: '1.0L TSI 3 cyl.', puissance: '110 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Golf Style 1.5L eTSI 150', moteur: '1.5L eTSI Mild-hybrid', puissance: '150 ch', transmission: 'DSG7', carburant: 'Hybride' },
      { version: 'Golf GTI 2.0L TSI 265', moteur: '2.0L TSI 4 cyl.', puissance: '265 ch', transmission: 'DSG7', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4284 mm', largeur: '1789 mm', hauteur: '1491 mm', empattement: '2619 mm',
      poids: '1285 kg', coffre: '380 L', cylindree: '1498 cc', cylindres: '4',
      turbo: 'Oui (TSI)', vitesse_max: '224 km/h', acceleration: '8.5 s',
      conso_urbaine: '6.5 L/100km', conso_extra: '4.8 L/100km', conso_mixte: '5.4 L/100km',
      emission_co2: '123 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'vw-tiguan', marque: 'Volkswagen', nom: 'Tiguan', slug: 'tiguan', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 349000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/volkswagen/Volkswagen-Tiguan-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/volkswagen/tiguan/',
    motorisations: [
      { version: 'Tiguan Life 1.5L TSI 150', moteur: '1.5L TSI evo2 4 cyl.', puissance: '150 ch', transmission: 'DSG7', carburant: 'Essence' },
      { version: 'Tiguan Elegance 2.0L TSI 190 4Motion', moteur: '2.0L TSI 4 cyl.', puissance: '190 ch', transmission: 'DSG7 4Motion', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4539 mm', largeur: '1839 mm', hauteur: '1664 mm', empattement: '2681 mm',
      poids: '1515 kg', coffre: '615 L', cylindree: '1498 cc', cylindres: '4',
      turbo: 'Oui (TSI)', vitesse_max: '210 km/h', acceleration: '8.8 s',
      conso_urbaine: '7.4 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.2 L/100km',
      emission_co2: '140 g/km', reservoir: '60 L', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
  {
    id: 'vw-id4', marque: 'Volkswagen', nom: 'ID.4', slug: 'id4', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 469000, prix_max: 620000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/volkswagen/Volkswagen-ID4-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/volkswagen/id4/',
    motorisations: [
      { version: 'ID.4 Pure 170 ch', moteur: 'Électrique 77 kWh', puissance: '170 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'ID.4 GTX 299 ch AWD', moteur: 'Électrique 77 kWh AWD', puissance: '299 ch', transmission: 'Automatique 4WD', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4584 mm', largeur: '1865 mm', hauteur: '1640 mm', empattement: '2766 mm',
      poids: '2124 kg', coffre: '543 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '180 km/h', acceleration: '6.2 s',
      conso_urbaine: '19.0 kWh/100km', conso_extra: '15.5 kWh/100km', conso_mixte: '17.0 kWh/100km',
      emission_co2: '0 g/km', reservoir: '77 kWh', roues: '20 pouces', pneus: '235/50 R20'
    }
  },

  // ================================
  // HYUNDAI
  // ================================
  {
    id: 'hyundai-i20', marque: 'Hyundai', nom: 'i20', slug: 'i20', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 149900, prix_max: 219900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/hyundai/Hyundai-i20-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/hyundai/i20/',
    motorisations: [
      { version: 'i20 Pure 1.2L MPi 84', moteur: '1.2L MPi 4 cyl.', puissance: '84 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'i20 Trend 1.0L T-GDi 100', moteur: '1.0L T-GDi 3 cyl.', puissance: '100 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'i20 N Line 1.0L T-GDi 100', moteur: '1.0L T-GDi Turbo', puissance: '100 ch', transmission: 'DCT7', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4040 mm', largeur: '1775 mm', hauteur: '1450 mm', empattement: '2580 mm',
      poids: '1080 kg', coffre: '352 L', cylindree: '998 cc', cylindres: '3',
      turbo: 'Oui (T-GDi)', vitesse_max: '185 km/h', acceleration: '10.3 s',
      conso_urbaine: '5.6 L/100km', conso_extra: '4.3 L/100km', conso_mixte: '4.8 L/100km',
      emission_co2: '108 g/km', reservoir: '40 L', roues: '16 pouces', pneus: '195/55 R16'
    }
  },
  {
    id: 'hyundai-tucson', marque: 'Hyundai', nom: 'Tucson', slug: 'tucson', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 289000, prix_max: 420000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/hyundai/Hyundai-Tucson-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/hyundai/tucson/',
    motorisations: [
      { version: 'Tucson Trend 1.6L CRDi 136', moteur: '1.6L CRDi Diesel 4 cyl.', puissance: '136 ch', transmission: 'Manuelle 6', carburant: 'Diesel' },
      { version: 'Tucson Premium 1.6L T-GDi 150', moteur: '1.6L T-GDi Turbo', puissance: '150 ch', transmission: 'DCT7', carburant: 'Essence' },
      { version: 'Tucson PHEV 265', moteur: '1.6L T-GDi + Moteur élec.', puissance: '265 ch', transmission: '6AT AWD', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4500 mm', largeur: '1865 mm', hauteur: '1650 mm', empattement: '2680 mm',
      poids: '1559 kg', coffre: '620 L', cylindree: '1598 cc', cylindres: '4',
      turbo: 'Oui (T-GDi)', vitesse_max: '205 km/h', acceleration: '8.5 s',
      conso_urbaine: '7.1 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.1 L/100km',
      emission_co2: '138 g/km', reservoir: '54 L', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
  {
    id: 'hyundai-ioniq5', marque: 'Hyundai', nom: 'IONIQ 5', slug: 'ioniq5', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 469000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/hyundai/Hyundai-IONIQ-5-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/hyundai/ioniq5/',
    motorisations: [
      { version: 'IONIQ 5 Standard Range 170 ch', moteur: 'Électrique 58 kWh', puissance: '170 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'IONIQ 5 Long Range 218 ch', moteur: 'Électrique 77.4 kWh', puissance: '218 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'IONIQ 5 Long Range AWD 320 ch', moteur: 'Électrique 77.4 kWh AWD', puissance: '320 ch', transmission: 'Automatique 4WD', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4635 mm', largeur: '1890 mm', hauteur: '1605 mm', empattement: '3000 mm',
      poids: '1985 kg', coffre: '527 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '185 km/h', acceleration: '5.1 s',
      conso_urbaine: '18.8 kWh/100km', conso_extra: '15.2 kWh/100km', conso_mixte: '16.7 kWh/100km',
      emission_co2: '0 g/km', reservoir: '77.4 kWh', roues: '20 pouces', pneus: '255/45 R20'
    }
  },
  {
    id: 'hyundai-santa-fe', marque: 'Hyundai', nom: 'Santa Fe', slug: 'santa-fe', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 389000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/hyundai/Hyundai-Santa-Fe-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/hyundai/santa-fe/',
    motorisations: [
      { version: 'Santa Fe Premium 2.5L T-GDi 230', moteur: '2.5L T-GDi Turbo', puissance: '230 ch', transmission: '8AT AWD', carburant: 'Essence' },
      { version: 'Santa Fe PHEV 253', moteur: '1.6L T-GDi + Moteur élec.', puissance: '253 ch', transmission: '6AT AWD', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4830 mm', largeur: '1900 mm', hauteur: '1700 mm', empattement: '2815 mm',
      poids: '1870 kg', coffre: '628 L', cylindree: '2497 cc', cylindres: '4',
      turbo: 'Oui (T-GDi)', vitesse_max: '220 km/h', acceleration: '7.8 s',
      conso_urbaine: '8.9 L/100km', conso_extra: '6.9 L/100km', conso_mixte: '7.7 L/100km',
      emission_co2: '175 g/km', reservoir: '67 L', roues: '20 pouces', pneus: '255/45 R20'
    }
  },
  {
    id: 'hyundai-kona', marque: 'Hyundai', nom: 'Kona', slug: 'kona', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 219000, prix_max: 349000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/hyundai/Hyundai-Kona-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/hyundai/kona/',
    motorisations: [
      { version: 'Kona Trend 1.0L T-GDi 120', moteur: '1.0L T-GDi 3 cyl.', puissance: '120 ch', transmission: 'DCT7', carburant: 'Essence' },
      { version: 'Kona Electric 218 ch', moteur: 'Électrique 65.4 kWh', puissance: '218 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4355 mm', largeur: '1825 mm', hauteur: '1575 mm', empattement: '2660 mm',
      poids: '1330 kg', coffre: '466 L', cylindree: '998 cc', cylindres: '3',
      turbo: 'Oui (T-GDi)', vitesse_max: '185 km/h', acceleration: '10.7 s',
      conso_urbaine: '6.1 L/100km', conso_extra: '4.9 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '121 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },

  // ================================
  // KIA
  // ================================
  {
    id: 'kia-sportage', marque: 'Kia', nom: 'Sportage', slug: 'sportage', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 289000, prix_max: 420000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/kia/Kia-Sportage-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/kia/sportage/',
    motorisations: [
      { version: 'Sportage Trend 1.6L CRDi 136', moteur: '1.6L CRDi Diesel', puissance: '136 ch', transmission: 'Manuelle 6', carburant: 'Diesel' },
      { version: 'Sportage Premium 1.6L T-GDi 150', moteur: '1.6L T-GDi Turbo', puissance: '150 ch', transmission: 'DCT7', carburant: 'Essence' },
      { version: 'Sportage HEV 230 ch', moteur: '1.6L T-GDi + Moteur élec.', puissance: '230 ch', transmission: '6AT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4516 mm', largeur: '1865 mm', hauteur: '1676 mm', empattement: '2680 mm',
      poids: '1579 kg', coffre: '587 L', cylindree: '1598 cc', cylindres: '4',
      turbo: 'Oui (T-GDi)', vitesse_max: '205 km/h', acceleration: '8.5 s',
      conso_urbaine: '7.2 L/100km', conso_extra: '5.7 L/100km', conso_mixte: '6.2 L/100km',
      emission_co2: '141 g/km', reservoir: '54 L', roues: '18 pouces', pneus: '235/55 R18'
    }
  },
  {
    id: 'kia-picanto', marque: 'Kia', nom: 'Picanto', slug: 'picanto', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 159900, prix_max: 219900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/kia/Kia-Picanto-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/kia/picanto/',
    motorisations: [
      { version: 'Picanto Trend 1.0L MPi 67', moteur: '1.0L MPi 3 cyl.', puissance: '67 ch', transmission: 'Manuelle 5', carburant: 'Essence' },
      { version: 'Picanto GT Line 1.0L T-GDi 100', moteur: '1.0L T-GDi 3 cyl.', puissance: '100 ch', transmission: 'DCT7', carburant: 'Essence' },
    ],
    specs: {
      longueur: '3595 mm', largeur: '1595 mm', hauteur: '1485 mm', empattement: '2400 mm',
      poids: '890 kg', coffre: '255 L', cylindree: '998 cc', cylindres: '3',
      turbo: 'Oui (T-GDi)', vitesse_max: '167 km/h', acceleration: '12.2 s',
      conso_urbaine: '5.4 L/100km', conso_extra: '4.0 L/100km', conso_mixte: '4.5 L/100km',
      emission_co2: '103 g/km', reservoir: '35 L', roues: '14 pouces', pneus: '165/65 R14'
    }
  },
  {
    id: 'kia-ev6', marque: 'Kia', nom: 'EV6', slug: 'ev6', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 429000, prix_max: 480000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/kia/Kia-EV6-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/kia/ev6/',
    motorisations: [
      { version: 'EV6 Standard Range 149 ch', moteur: 'Électrique 58 kWh', puissance: '149 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'EV6 Long Range 228 ch', moteur: 'Électrique 77.4 kWh', puissance: '228 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4695 mm', largeur: '1890 mm', hauteur: '1550 mm', empattement: '2900 mm',
      poids: '1960 kg', coffre: '490 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '185 km/h', acceleration: '5.2 s',
      conso_urbaine: '17.5 kWh/100km', conso_extra: '14.5 kWh/100km', conso_mixte: '15.7 kWh/100km',
      emission_co2: '0 g/km', reservoir: '77.4 kWh', roues: '20 pouces', pneus: '255/45 R20'
    }
  },
  {
    id: 'kia-sorento', marque: 'Kia', nom: 'Sorento', slug: 'sorento', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 389000, prix_max: 480000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/kia/Kia-Sorento-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/kia/sorento/',
    motorisations: [
      { version: 'Sorento Prestige 2.5L MPi 180', moteur: '2.5L MPi 4 cyl.', puissance: '180 ch', transmission: '8AT AWD', carburant: 'Essence' },
      { version: 'Sorento HEV 230 ch', moteur: '1.6L T-GDi + Moteur élec.', puissance: '230 ch', transmission: '6AT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4810 mm', largeur: '1900 mm', hauteur: '1700 mm', empattement: '2815 mm',
      poids: '1815 kg', coffre: '813 L', cylindree: '2497 cc', cylindres: '4',
      turbo: 'Non', vitesse_max: '220 km/h', acceleration: '8.6 s',
      conso_urbaine: '9.0 L/100km', conso_extra: '7.2 L/100km', conso_mixte: '7.9 L/100km',
      emission_co2: '179 g/km', reservoir: '67 L', roues: '20 pouces', pneus: '255/45 R20'
    }
  },

  // ================================
  // TOYOTA
  // ================================
  {
    id: 'toyota-yaris', marque: 'Toyota', nom: 'Yaris', slug: 'yaris', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 169000, prix_max: 249000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/toyota/Toyota-Yaris-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/toyota/yaris/',
    motorisations: [
      { version: 'Yaris Dynamic 1.5L CVT', moteur: '1.5L 4 cyl.', puissance: '125 ch', transmission: 'CVT Automatique', carburant: 'Essence' },
      { version: 'Yaris Dynamic Hybrid 116', moteur: '1.5L + Moteur élec.', puissance: '116 ch', transmission: 'Automatique CVT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '3940 mm', largeur: '1745 mm', hauteur: '1500 mm', empattement: '2560 mm',
      poids: '1035 kg', coffre: '286 L', cylindree: '1490 cc', cylindres: '4',
      turbo: 'Non', vitesse_max: '180 km/h', acceleration: '10.6 s',
      conso_urbaine: '5.0 L/100km', conso_extra: '4.2 L/100km', conso_mixte: '4.5 L/100km',
      emission_co2: '103 g/km', reservoir: '42 L', roues: '16 pouces', pneus: '195/50 R16'
    }
  },
  {
    id: 'toyota-corolla', marque: 'Toyota', nom: 'Corolla', slug: 'corolla', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 229000, prix_max: 340000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/toyota/Toyota-Corolla-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/toyota/corolla/',
    motorisations: [
      { version: 'Corolla Active 1.8L Hybrid 122', moteur: '1.8L + Moteur élec.', puissance: '122 ch', transmission: 'Automatique CVT', carburant: 'Hybride' },
      { version: 'Corolla GR Sport 2.0L Hybrid 196', moteur: '2.0L + Moteur élec.', puissance: '196 ch', transmission: 'Automatique CVT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4620 mm', largeur: '1780 mm', hauteur: '1435 mm', empattement: '2700 mm',
      poids: '1325 kg', coffre: '361 L', cylindree: '1798 cc', cylindres: '4',
      turbo: 'Non (Hybride)', vitesse_max: '180 km/h', acceleration: '10.9 s',
      conso_urbaine: '4.5 L/100km', conso_extra: '4.7 L/100km', conso_mixte: '4.6 L/100km',
      emission_co2: '104 g/km', reservoir: '43 L', roues: '17 pouces', pneus: '205/55 R17'
    }
  },
  {
    id: 'toyota-rav4', marque: 'Toyota', nom: 'RAV4', slug: 'rav4', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 369000, prix_max: 540000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/toyota/Toyota-RAV4-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/toyota/rav4/',
    motorisations: [
      { version: 'RAV4 Hybrid Active 222 ch', moteur: '2.5L + Moteur élec. AWD', puissance: '222 ch', transmission: 'Automatique E-CVT', carburant: 'Hybride' },
      { version: 'RAV4 PHEV 306 ch', moteur: '2.5L + Moteur élec. PHEV', puissance: '306 ch', transmission: 'Automatique E-CVT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4600 mm', largeur: '1855 mm', hauteur: '1685 mm', empattement: '2690 mm',
      poids: '1845 kg', coffre: '580 L', cylindree: '2487 cc', cylindres: '4',
      turbo: 'Non (Hybride)', vitesse_max: '180 km/h', acceleration: '7.9 s',
      conso_urbaine: '4.7 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '5.1 L/100km',
      emission_co2: '115 g/km', reservoir: '55 L', roues: '18 pouces', pneus: '225/60 R18'
    }
  },
  {
    id: 'toyota-land-cruiser', marque: 'Toyota', nom: 'Land Cruiser', slug: 'land-cruiser', annee: 2024,
    categorie: '4x4', carrosserie: 'SUV',
    prix_min: 590000, prix_max: 740000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/toyota/Toyota-Land-Cruiser-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/toyota/land-cruiser/',
    motorisations: [
      { version: 'Land Cruiser GX 2.8L Diesel', moteur: '2.8L D-4D 4 cyl.', puissance: '204 ch', transmission: '6AT 4WD', carburant: 'Diesel' },
      { version: 'Land Cruiser VX 3.5L Bi-Turbo', moteur: '3.5L V6 Bi-Turbo', puissance: '415 ch', transmission: '10AT 4WD', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4950 mm', largeur: '1980 mm', hauteur: '1885 mm', empattement: '2850 mm',
      poids: '2400 kg', coffre: '700 L', cylindree: '3445 cc', cylindres: '6',
      turbo: 'Oui (Bi-Turbo)', vitesse_max: '210 km/h', acceleration: '6.7 s',
      conso_urbaine: '11.2 L/100km', conso_extra: '8.8 L/100km', conso_mixte: '9.8 L/100km',
      emission_co2: '221 g/km', reservoir: '110 L', roues: '21 pouces', pneus: '275/50 R21'
    }
  },
  {
    id: 'toyota-hilux', marque: 'Toyota', nom: 'Hilux', slug: 'hilux', annee: 2024,
    categorie: 'Pick-up', carrosserie: 'Pick-up',
    prix_min: 369000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/toyota/Toyota-Hilux-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/toyota/hilux/',
    motorisations: [
      { version: 'Hilux SR5 2.4L D-4D 150', moteur: '2.4L D-4D Diesel 4 cyl.', puissance: '150 ch', transmission: 'Manuelle 6 4WD', carburant: 'Diesel' },
      { version: 'Hilux Invincible 2.8L D-4D 204', moteur: '2.8L D-4D Diesel 4 cyl.', puissance: '204 ch', transmission: '6AT 4WD', carburant: 'Diesel' },
    ],
    specs: {
      longueur: '5325 mm', largeur: '1855 mm', hauteur: '1815 mm', empattement: '3085 mm',
      poids: '1930 kg', coffre: '1270 L (benne)', cylindree: '2393 cc', cylindres: '4',
      turbo: 'Oui (D-4D)', vitesse_max: '175 km/h', acceleration: '10.8 s',
      conso_urbaine: '8.5 L/100km', conso_extra: '7.5 L/100km', conso_mixte: '7.9 L/100km',
      emission_co2: '208 g/km', reservoir: '80 L', roues: '17 pouces', pneus: '265/65 R17'
    }
  },

  // ================================
  // FORD
  // ================================
  {
    id: 'ford-puma', marque: 'Ford', nom: 'Puma', slug: 'puma', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 199000, prix_max: 299000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/ford/Ford-Puma-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/ford/puma/',
    motorisations: [
      { version: 'Puma Titanium 1.0L EcoBoost 125', moteur: '1.0L EcoBoost 3 cyl.', puissance: '125 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Puma ST-Line 1.0L EcoBoost 155', moteur: '1.0L EcoBoost Mild-Hybrid', puissance: '155 ch', transmission: 'DCT7', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4208 mm', largeur: '1805 mm', hauteur: '1537 mm', empattement: '2588 mm',
      poids: '1278 kg', coffre: '456 L', cylindree: '999 cc', cylindres: '3',
      turbo: 'Oui (EcoBoost)', vitesse_max: '200 km/h', acceleration: '9.0 s',
      conso_urbaine: '6.3 L/100km', conso_extra: '4.7 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '120 g/km', reservoir: '42 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'ford-kuga', marque: 'Ford', nom: 'Kuga', slug: 'kuga', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 329000, prix_max: 450000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/ford/Ford-Kuga-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/ford/kuga/',
    motorisations: [
      { version: 'Kuga Trend 1.5L EcoBoost 150', moteur: '1.5L EcoBoost 3 cyl.', puissance: '150 ch', transmission: 'Manuelle 6', carburant: 'Essence' },
      { version: 'Kuga ST-Line FHEV 190', moteur: '2.5L + Moteur élec. HEV', puissance: '190 ch', transmission: 'CVT', carburant: 'Hybride' },
      { version: 'Kuga ST-Line PHEV 225', moteur: '2.5L + Moteur élec. PHEV', puissance: '225 ch', transmission: 'CVT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4629 mm', largeur: '1882 mm', hauteur: '1679 mm', empattement: '2710 mm',
      poids: '1638 kg', coffre: '645 L', cylindree: '1497 cc', cylindres: '3',
      turbo: 'Oui (EcoBoost)', vitesse_max: '198 km/h', acceleration: '8.8 s',
      conso_urbaine: '7.0 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.1 L/100km',
      emission_co2: '139 g/km', reservoir: '52 L', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
  {
    id: 'ford-mustang', marque: 'Ford', nom: 'Mustang', slug: 'mustang', annee: 2024,
    categorie: 'Coupé', carrosserie: 'Coupé',
    prix_min: 449000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/ford/Ford-Mustang-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/ford/mustang/',
    motorisations: [
      { version: 'Mustang EcoBoost 2.3L 290', moteur: '2.3L EcoBoost 4 cyl.', puissance: '290 ch', transmission: 'Manuelle 6 / Automatique 10', carburant: 'Essence' },
      { version: 'Mustang GT 5.0L V8 450', moteur: '5.0L V8 Ti-VCT', puissance: '450 ch', transmission: 'Manuelle 6 / Automatique 10', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4785 mm', largeur: '1916 mm', hauteur: '1381 mm', empattement: '2720 mm',
      poids: '1680 kg', coffre: '408 L', cylindree: '4951 cc', cylindres: '8',
      turbo: 'Non (V8 atmosphérique)', vitesse_max: '250 km/h', acceleration: '4.6 s',
      conso_urbaine: '15.8 L/100km', conso_extra: '9.4 L/100km', conso_mixte: '11.9 L/100km',
      emission_co2: '270 g/km', reservoir: '61 L', roues: '19 pouces', pneus: '255/40 R19'
    }
  },

  // ================================
  // BMW
  // ================================
  {
    id: 'bmw-serie-1', marque: 'BMW', nom: 'Série 1', slug: 'serie-1', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 349000, prix_max: 480000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/bmw/BMW-Serie-1-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/bmw/serie-1/',
    motorisations: [
      { version: '118i Business 136 ch', moteur: '1.5L 3 cyl. Turbo', puissance: '136 ch', transmission: 'DCT7', carburant: 'Essence' },
      { version: 'M135i xDrive 300 ch', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '300 ch', transmission: '8AT xDrive', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4361 mm', largeur: '1800 mm', hauteur: '1452 mm', empattement: '2670 mm',
      poids: '1385 kg', coffre: '380 L', cylindree: '1499 cc', cylindres: '3',
      turbo: 'Oui', vitesse_max: '240 km/h', acceleration: '6.1 s',
      conso_urbaine: '6.2 L/100km', conso_extra: '4.8 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '120 g/km', reservoir: '47 L', roues: '17 pouces', pneus: '205/55 R17'
    }
  },
  {
    id: 'bmw-serie-3', marque: 'BMW', nom: 'Série 3', slug: 'serie-3', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 490000, prix_max: 750000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/bmw/BMW-Serie-3-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/bmw/serie-3/',
    motorisations: [
      { version: '320i 170 ch Business', moteur: '2.0L 4 cyl. Turbo', puissance: '170 ch', transmission: '8AT', carburant: 'Essence' },
      { version: '330i 245 ch M Sport', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '245 ch', transmission: '8AT', carburant: 'Essence' },
      { version: 'M340i xDrive 374 ch', moteur: '3.0L 6 cyl. Turbo', puissance: '374 ch', transmission: '8AT xDrive', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4709 mm', largeur: '1827 mm', hauteur: '1435 mm', empattement: '2851 mm',
      poids: '1510 kg', coffre: '480 L', cylindree: '1998 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '250 km/h', acceleration: '5.8 s',
      conso_urbaine: '7.2 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.1 L/100km',
      emission_co2: '139 g/km', reservoir: '59 L', roues: '18 pouces', pneus: '225/50 R18'
    }
  },
  {
    id: 'bmw-x3', marque: 'BMW', nom: 'X3', slug: 'x3', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 620000, prix_max: 950000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/bmw/BMW-X3-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/bmw/x3/',
    motorisations: [
      { version: 'X3 sDrive20i 190 ch', moteur: '2.0L 4 cyl. Turbo', puissance: '190 ch', transmission: '8AT', carburant: 'Essence' },
      { version: 'X3 xDrive30i 245 ch', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '245 ch', transmission: '8AT xDrive', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4708 mm', largeur: '1897 mm', hauteur: '1676 mm', empattement: '2864 mm',
      poids: '1745 kg', coffre: '570 L', cylindree: '1998 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '235 km/h', acceleration: '6.4 s',
      conso_urbaine: '8.0 L/100km', conso_extra: '6.2 L/100km', conso_mixte: '6.9 L/100km',
      emission_co2: '157 g/km', reservoir: '65 L', roues: '18 pouces', pneus: '225/60 R18'
    }
  },
  {
    id: 'bmw-serie-5', marque: 'BMW', nom: 'Série 5', slug: 'serie-5', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 720000, prix_max: 1250000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/bmw/BMW-Serie-5-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/bmw/serie-5/',
    motorisations: [
      { version: '520i 208 ch', moteur: '2.0L 4 cyl. Turbo', puissance: '208 ch', transmission: '8AT', carburant: 'Essence' },
      { version: '540i xDrive 340 ch', moteur: '3.0L 6 cyl. Turbo', puissance: '340 ch', transmission: '8AT xDrive', carburant: 'Essence' },
      { version: 'i5 eDrive40 340 ch', moteur: 'Électrique 84 kWh', puissance: '340 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '5060 mm', largeur: '1900 mm', hauteur: '1515 mm', empattement: '2995 mm',
      poids: '1730 kg', coffre: '520 L', cylindree: '1998 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '250 km/h', acceleration: '6.2 s',
      conso_urbaine: '7.5 L/100km', conso_extra: '5.8 L/100km', conso_mixte: '6.4 L/100km',
      emission_co2: '146 g/km', reservoir: '69 L', roues: '19 pouces', pneus: '245/45 R19'
    }
  },

  // ================================
  // MERCEDES-BENZ
  // ================================
  {
    id: 'mercedes-classe-a', marque: 'Mercedes-Benz', nom: 'Classe A', slug: 'classe-a', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 375000, prix_max: 530000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mercedes-benz/Mercedes-Classe-A-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/mercedes/classe-a/',
    motorisations: [
      { version: 'A 180 136 ch Progressive', moteur: '1.3L 4 cyl. Turbo', puissance: '136 ch', transmission: 'DCT7', carburant: 'Essence' },
      { version: 'A 250 4MATIC 224 ch AMG Line', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '224 ch', transmission: 'DCT8 4MATIC', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4419 mm', largeur: '1796 mm', hauteur: '1433 mm', empattement: '2729 mm',
      poids: '1375 kg', coffre: '370 L', cylindree: '1332 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '232 km/h', acceleration: '7.1 s',
      conso_urbaine: '6.6 L/100km', conso_extra: '5.2 L/100km', conso_mixte: '5.7 L/100km',
      emission_co2: '130 g/km', reservoir: '43 L', roues: '17 pouces', pneus: '225/45 R17'
    }
  },
  {
    id: 'mercedes-classe-c', marque: 'Mercedes-Benz', nom: 'Classe C', slug: 'classe-c', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 530000, prix_max: 850000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mercedes-benz/Mercedes-Classe-C-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/mercedes/classe-c/',
    motorisations: [
      { version: 'C 200 204 ch Avantgarde', moteur: '1.5L 4 cyl. Mild-Hybrid', puissance: '204 ch', transmission: '9AT', carburant: 'Hybride' },
      { version: 'C 300 258 ch AMG Line', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '258 ch', transmission: '9AT', carburant: 'Essence' },
      { version: 'C 300e PHEV 313 ch', moteur: '1.5L + Moteur élec. PHEV', puissance: '313 ch', transmission: '9AT', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4751 mm', largeur: '1820 mm', hauteur: '1438 mm', empattement: '2865 mm',
      poids: '1625 kg', coffre: '455 L', cylindree: '1497 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '250 km/h', acceleration: '7.3 s',
      conso_urbaine: '6.8 L/100km', conso_extra: '5.3 L/100km', conso_mixte: '5.9 L/100km',
      emission_co2: '134 g/km', reservoir: '66 L', roues: '18 pouces', pneus: '225/55 R18'
    }
  },
  {
    id: 'mercedes-glc', marque: 'Mercedes-Benz', nom: 'GLC', slug: 'glc', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 720000, prix_max: 1100000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mercedes-benz/Mercedes-GLC-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/mercedes/glc/',
    motorisations: [
      { version: 'GLC 200 204 ch Avantgarde', moteur: '1.5L 4 cyl. Mild-Hybrid', puissance: '204 ch', transmission: '9AT 4MATIC', carburant: 'Hybride' },
      { version: 'GLC 300 258 ch AMG Line', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '258 ch', transmission: '9AT 4MATIC', carburant: 'Essence' },
      { version: 'GLC 300e PHEV 313 ch', moteur: '1.5L + Moteur élec. PHEV', puissance: '313 ch', transmission: '9AT 4MATIC', carburant: 'Hybride' },
    ],
    specs: {
      longueur: '4716 mm', largeur: '1890 mm', hauteur: '1640 mm', empattement: '2888 mm',
      poids: '1945 kg', coffre: '620 L', cylindree: '1497 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '230 km/h', acceleration: '6.5 s',
      conso_urbaine: '7.4 L/100km', conso_extra: '6.1 L/100km', conso_mixte: '6.6 L/100km',
      emission_co2: '150 g/km', reservoir: '70 L', roues: '19 pouces', pneus: '235/55 R19'
    }
  },
  {
    id: 'mercedes-classe-e', marque: 'Mercedes-Benz', nom: 'Classe E', slug: 'classe-e', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 850000, prix_max: 1500000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/mercedes-benz/Mercedes-Classe-E-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/mercedes/classe-e/',
    motorisations: [
      { version: 'E 200 204 ch Avantgarde', moteur: '1.5L 4 cyl. Mild-Hybrid', puissance: '204 ch', transmission: '9AT', carburant: 'Hybride' },
      { version: 'E 300 258 ch AMG Line', moteur: '2.0L 4 cyl. Bi-Turbo', puissance: '258 ch', transmission: '9AT', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4949 mm', largeur: '1880 mm', hauteur: '1468 mm', empattement: '2961 mm',
      poids: '1870 kg', coffre: '540 L', cylindree: '1497 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '250 km/h', acceleration: '7.4 s',
      conso_urbaine: '7.1 L/100km', conso_extra: '5.7 L/100km', conso_mixte: '6.2 L/100km',
      emission_co2: '141 g/km', reservoir: '66 L', roues: '19 pouces', pneus: '245/45 R19'
    }
  },

  // ================================
  // AUDI
  // ================================
  {
    id: 'audi-a3', marque: 'Audi', nom: 'A3', slug: 'a3', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 349000, prix_max: 520000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/audi/Audi-A3-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/audi/a3/',
    motorisations: [
      { version: 'A3 35 TFSI 150 ch Advanced', moteur: '1.5L 4 cyl. TFSI', puissance: '150 ch', transmission: 'S tronic 7', carburant: 'Essence' },
      { version: 'S3 2.0L TFSI 300 ch', moteur: '2.0L 4 cyl. TFSI', puissance: '300 ch', transmission: 'S tronic 7 Quattro', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4504 mm', largeur: '1816 mm', hauteur: '1432 mm', empattement: '2636 mm',
      poids: '1325 kg', coffre: '325 L', cylindree: '1498 cc', cylindres: '4',
      turbo: 'Oui (TFSI)', vitesse_max: '225 km/h', acceleration: '8.2 s',
      conso_urbaine: '6.2 L/100km', conso_extra: '4.8 L/100km', conso_mixte: '5.3 L/100km',
      emission_co2: '120 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/50 R17'
    }
  },
  {
    id: 'audi-a4', marque: 'Audi', nom: 'A4', slug: 'a4', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 520000, prix_max: 780000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/audi/Audi-A4-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/audi/a4/',
    motorisations: [
      { version: 'A4 35 TFSI 150 ch Advanced', moteur: '2.0L 4 cyl. TFSI', puissance: '150 ch', transmission: 'S tronic 7', carburant: 'Essence' },
      { version: 'A4 40 TFSI 204 ch S Line', moteur: '2.0L 4 cyl. TFSI', puissance: '204 ch', transmission: 'S tronic 7', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4762 mm', largeur: '1847 mm', hauteur: '1410 mm', empattement: '2826 mm',
      poids: '1495 kg', coffre: '460 L', cylindree: '1984 cc', cylindres: '4',
      turbo: 'Oui (TFSI)', vitesse_max: '240 km/h', acceleration: '7.9 s',
      conso_urbaine: '7.0 L/100km', conso_extra: '5.5 L/100km', conso_mixte: '6.0 L/100km',
      emission_co2: '138 g/km', reservoir: '58 L', roues: '17 pouces', pneus: '225/55 R17'
    }
  },
  {
    id: 'audi-q5', marque: 'Audi', nom: 'Q5', slug: 'q5', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 720000, prix_max: 950000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/audi/Audi-Q5-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/audi/q5/',
    motorisations: [
      { version: 'Q5 35 TDI 163 ch Advanced', moteur: '2.0L 4 cyl. TDI Diesel', puissance: '163 ch', transmission: 'S tronic 7 Quattro', carburant: 'Diesel' },
      { version: 'Q5 40 TFSI 204 ch S Line', moteur: '2.0L 4 cyl. TFSI', puissance: '204 ch', transmission: 'S tronic 7 Quattro', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4682 mm', largeur: '1893 mm', hauteur: '1659 mm', empattement: '2825 mm',
      poids: '1755 kg', coffre: '550 L', cylindree: '1984 cc', cylindres: '4',
      turbo: 'Oui', vitesse_max: '235 km/h', acceleration: '7.4 s',
      conso_urbaine: '7.5 L/100km', conso_extra: '6.0 L/100km', conso_mixte: '6.5 L/100km',
      emission_co2: '148 g/km', reservoir: '75 L', roues: '18 pouces', pneus: '235/60 R18'
    }
  },

  // ================================
  // BYD
  // ================================
  {
    id: 'byd-atto3', marque: 'BYD', nom: 'Atto 3', slug: 'atto3', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 319000, prix_max: 379000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/byd/BYD-Atto-3-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/byd/atto3/',
    motorisations: [
      { version: 'Atto 3 Standard Range 201 ch', moteur: 'Électrique 49.9 kWh', puissance: '201 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'Atto 3 Extended Range 201 ch', moteur: 'Électrique 60.5 kWh', puissance: '201 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4455 mm', largeur: '1875 mm', hauteur: '1615 mm', empattement: '2720 mm',
      poids: '1750 kg', coffre: '440 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '160 km/h', acceleration: '7.3 s',
      conso_urbaine: '18.5 kWh/100km', conso_extra: '14.5 kWh/100km', conso_mixte: '16.2 kWh/100km',
      emission_co2: '0 g/km', reservoir: '60.5 kWh', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
  {
    id: 'byd-seal', marque: 'BYD', nom: 'Seal', slug: 'seal', annee: 2024,
    categorie: 'Berline', carrosserie: 'Berline',
    prix_min: 419000, prix_max: 549000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/byd/BYD-Seal-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/byd/seal/',
    motorisations: [
      { version: 'Seal Comfort 313 ch RWD', moteur: 'Électrique 82.5 kWh RWD', puissance: '313 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'Seal Performance AWD 530 ch', moteur: 'Électrique 82.5 kWh AWD', puissance: '530 ch', transmission: 'Automatique AWD', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4800 mm', largeur: '1875 mm', hauteur: '1460 mm', empattement: '2920 mm',
      poids: '2150 kg', coffre: '400 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '180 km/h', acceleration: '3.8 s',
      conso_urbaine: '19.0 kWh/100km', conso_extra: '15.5 kWh/100km', conso_mixte: '17.0 kWh/100km',
      emission_co2: '0 g/km', reservoir: '82.5 kWh', roues: '19 pouces', pneus: '235/45 R19'
    }
  },
  {
    id: 'byd-tang', marque: 'BYD', nom: 'Tang', slug: 'tang', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 569000, prix_max: 679000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/byd/BYD-Tang-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/byd/tang/',
    motorisations: [
      { version: 'Tang AWD 456 ch', moteur: 'Électrique 108.8 kWh AWD', puissance: '456 ch', transmission: 'Automatique 4WD', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4870 mm', largeur: '1955 mm', hauteur: '1725 mm', empattement: '2820 mm',
      poids: '2618 kg', coffre: '235 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '190 km/h', acceleration: '4.6 s',
      conso_urbaine: '26.5 kWh/100km', conso_extra: '21.5 kWh/100km', conso_mixte: '23.6 kWh/100km',
      emission_co2: '0 g/km', reservoir: '108.8 kWh', roues: '22 pouces', pneus: '265/45 R22'
    }
  },
  {
    id: 'byd-dolphin', marque: 'BYD', nom: 'Dolphin', slug: 'dolphin', annee: 2024,
    categorie: 'Citadine', carrosserie: 'Berline',
    prix_min: 249000, prix_max: 319000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/byd/BYD-Dolphin-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/byd/dolphin/',
    motorisations: [
      { version: 'Dolphin Comfort 95 ch', moteur: 'Électrique 44.9 kWh', puissance: '95 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
      { version: 'Dolphin Extended 204 ch', moteur: 'Électrique 60.4 kWh', puissance: '204 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4290 mm', largeur: '1770 mm', hauteur: '1570 mm', empattement: '2700 mm',
      poids: '1490 kg', coffre: '345 L', cylindree: 'N/A (Électrique)', cylindres: 'N/A',
      turbo: 'N/A', vitesse_max: '160 km/h', acceleration: '7.0 s',
      conso_urbaine: '15.0 kWh/100km', conso_extra: '12.5 kWh/100km', conso_mixte: '13.5 kWh/100km',
      emission_co2: '0 g/km', reservoir: '60.4 kWh', roues: '17 pouces', pneus: '205/55 R17'
    }
  },

  // ================================
  // CHERY
  // ================================
  {
    id: 'chery-tiggo-4', marque: 'Chery', nom: 'Tiggo 4 Pro', slug: 'tiggo-4-pro', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 159900, prix_max: 219900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/chery/Chery-Tiggo-4-Pro-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/chery/tiggo-4-pro/',
    motorisations: [
      { version: 'Tiggo 4 Pro Comfort 1.5L 147', moteur: '1.5L 4 cyl. TGDI Turbo', puissance: '147 ch', transmission: 'CVT Automatique', carburant: 'Essence' },
      { version: 'Tiggo 4 Pro Luxury 1.5L 147', moteur: '1.5L 4 cyl. TGDI Turbo', puissance: '147 ch', transmission: 'CVT Automatique', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4318 mm', largeur: '1818 mm', hauteur: '1669 mm', empattement: '2630 mm',
      poids: '1371 kg', coffre: '385 L', cylindree: '1497 cc', cylindres: '4',
      turbo: 'Oui (TGDI)', vitesse_max: '178 km/h', acceleration: '9.8 s',
      conso_urbaine: '7.8 L/100km', conso_extra: '5.9 L/100km', conso_mixte: '6.6 L/100km',
      emission_co2: '149 g/km', reservoir: '50 L', roues: '17 pouces', pneus: '215/55 R17'
    }
  },
  {
    id: 'chery-tiggo-7', marque: 'Chery', nom: 'Tiggo 7 Pro', slug: 'tiggo-7-pro', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 249900, prix_max: 299900,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/chery/Chery-Tiggo-7-Pro-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/chery/tiggo-7-pro/',
    motorisations: [
      { version: 'Tiggo 7 Pro Comfort 1.6L TGDI 197', moteur: '1.6L 4 cyl. TGDI Turbo', puissance: '197 ch', transmission: 'CVT Automatique', carburant: 'Essence' },
    ],
    specs: {
      longueur: '4547 mm', largeur: '1862 mm', hauteur: '1694 mm', empattement: '2672 mm',
      poids: '1600 kg', coffre: '507 L', cylindree: '1597 cc', cylindres: '4',
      turbo: 'Oui (TGDI)', vitesse_max: '195 km/h', acceleration: '7.9 s',
      conso_urbaine: '8.3 L/100km', conso_extra: '6.5 L/100km', conso_mixte: '7.2 L/100km',
      emission_co2: '163 g/km', reservoir: '60 L', roues: '18 pouces', pneus: '235/55 R18'
    }
  },
  {
    id: 'chery-omoda5', marque: 'Chery', nom: 'Omoda 5', slug: 'omoda5', annee: 2024,
    categorie: 'SUV', carrosserie: 'SUV',
    prix_min: 229900, prix_max: 320000,
    image: 'https://www.wandaloo.com/files/Voiture-Neuve/chery/Chery-Omoda-5-2024-Neuve-Maroc-01.jpg',
    fiche_url: '/neuf/chery/omoda5/',
    motorisations: [
      { version: 'Omoda 5 1.6L TGDI 150', moteur: '1.6L 4 cyl. TGDI Turbo', puissance: '150 ch', transmission: 'CVT Automatique', carburant: 'Essence' },
      { version: 'Omoda 5 EV 204 ch', moteur: 'Électrique 61 kWh', puissance: '204 ch', transmission: 'Automatique 1 rapport', carburant: 'Électrique' },
    ],
    specs: {
      longueur: '4400 mm', largeur: '1833 mm', hauteur: '1588 mm', empattement: '2630 mm',
      poids: '1520 kg', coffre: '390 L', cylindree: '1597 cc', cylindres: '4',
      turbo: 'Oui (TGDI)', vitesse_max: '185 km/h', acceleration: '9.0 s',
      conso_urbaine: '8.0 L/100km', conso_extra: '6.0 L/100km', conso_mixte: '6.8 L/100km',
      emission_co2: '154 g/km', reservoir: '50 L', roues: '18 pouces', pneus: '235/50 R18'
    }
  },
];

// ===========================
// IMPORT FUNCTION
// ===========================
async function run() {
  console.log('🚀 Démarrage du peuplement de la base de données...\n');
  initDB();
  await new Promise(r => setTimeout(r, 500));

  // 1. Import brands
  console.log(`📦 Import de ${BRANDS.length} marques...`);
  for (const brand of BRANDS) {
    await new Promise((resolve, reject) => {
      insertBrand(brand, (err) => {
        if (err) { console.error(`  ❌ Erreur marque ${brand.nom}:`, err.message); reject(err); }
        else { console.log(`  ✅ ${brand.nom}`); resolve(); }
      });
    }).catch(() => {});
  }

  // 2. Import models with motorisations and specs
  console.log(`\n🚗 Import de ${MODELS.length} modèles avec fiches techniques...\n`);
  for (const model of MODELS) {
    const { specs, ...modelData } = model;

    // Insert model + motorisations
    await new Promise((resolve, reject) => {
      insertModel(modelData, (err) => {
        if (err) { console.error(`  ❌ Erreur modèle ${model.nom}:`, err.message); reject(err); }
        else resolve();
      });
    }).catch(() => {});

    // Insert technical specs
    if (specs) {
      await new Promise((resolve, reject) => {
        insertSpec(model.id, specs, (err) => {
          if (err) { console.error(`  ❌ Erreur specs ${model.nom}:`, err.message); reject(err); }
          else resolve();
        });
      }).catch(() => {});
    }

    // Insert sample images
    const images = [
      { url: model.image, alt: `${model.nom} vue de face`, is_primary: 1 },
    ];
    await new Promise((resolve, reject) => {
      insertImages(model.id, images, (err) => {
        if (err) reject(err); else resolve();
      });
    }).catch(() => {});

    console.log(`  ✅ ${model.marque} ${model.nom} (${model.motorisations.length} motorisations, specs complètes)`);
  }

  console.log(`\n✅ Terminé! ${BRANDS.length} marques, ${MODELS.length} modèles importés avec fiches techniques.`);
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
