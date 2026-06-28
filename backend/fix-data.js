/**
 * fix-data.js
 * Corrige les problèmes de qualité des données :
 * 1. Catégories "Non spécifiée" → détection automatique
 * 2. Carburants des modèles scrapés (motorisations enrichies)
 * 3. Fiches techniques pour les modèles clés du scraper
 * Usage: node fix-data.js
 */

const { initDB, insertSpec, getModelById, getAllModels } = require('./db');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDB() {
  return new sqlite3.Database(path.join(__dirname, 'data', 'autoguide.db'));
}

// Détection de catégorie par nom
function detectCategorie(nom) {
  const n = nom.toLowerCase();
  if (n.includes('yaris') || n.includes('clio') || n.includes('208') || n.includes('polo') || 
      n.includes('i20') || n.includes('picanto') || n.includes('spring') || n.includes('sandero') ||
      n.includes('c3') || n.includes('opel corsa') || n.includes('swift') || n.includes('fiesta') ||
      n.includes('i10') || n.includes('viva') || n.includes('ax') || n.includes('bz') || n.includes('dolphin')) return 'Citadine';
  if (n.includes('suv') || n.includes('rav') || n.includes('tiguan') || n.includes('tucson') || 
      n.includes('sportage') || n.includes('captur') || n.includes('duster') || n.includes('2008') || 
      n.includes('c5') || n.includes('hs') || n.includes('zs') || n.includes('kona') || 
      n.includes('t-roc') || n.includes('puma') || n.includes('kuga') || n.includes('qashqai') ||
      n.includes('arkana') || n.includes('austral') || n.includes('kardian') || n.includes('jogger') ||
      n.includes('bigster') || n.includes('3008') || n.includes('5008') || n.includes('atto') ||
      n.includes('tiggo') || n.includes('omoda') || n.includes('c-hr') || n.includes('bz4x') ||
      n.includes('enyaq') || n.includes('id.4') || n.includes('id.5') || n.includes('ioniq') ||
      n.includes('sorento') || n.includes('santa fe') || n.includes('fortuner') ||
      n.includes('seal u') || n.includes('tang') || n.includes('jaecoo') || n.includes('deepal')) return 'SUV';
  if (n.includes('land cruiser') || n.includes('defender') || n.includes('discovery') || 
      n.includes('wrangler') || n.includes('prado')) return '4x4';
  if (n.includes('hilux') || n.includes('ranger') || n.includes('navara') || n.includes('l200') ||
      n.includes('pick-up') || n.includes('pickup')) return 'Pick-up';
  if (n.includes('berlingo') || n.includes('kangoo') || n.includes('jogger') || n.includes('express') ||
      n.includes('van') || n.includes('trafic') || n.includes('dokker')) return 'Monospace';
  if (n.includes('cabriolet') || n.includes('roadster') || n.includes('spider') || n.includes('cyberster')) return 'Cabriolet';
  if (n.includes('coupé') || n.includes('coupe') || n.includes('gt') || n.includes('mustang') ||
      n.includes('gts') || n.includes('mc20')) return 'Coupé';
  if (n.includes('break') || n.includes('avant') || n.includes('touring') || n.includes('estate') ||
      n.includes('combi') || n.includes('variant')) return 'Break';
  if (n.includes('sedan') || n.includes('berline') || n.includes('golf') || n.includes('classe a') ||
      n.includes('classe c') || n.includes('classe e') || n.includes('serie 1') || n.includes('serie 3') ||
      n.includes('serie 5') || n.includes('a3') || n.includes('a4') || n.includes('a6') ||
      n.includes('logan') || n.includes('corolla') || n.includes('508') || n.includes('408') ||
      n.includes('301') || n.includes('duster') || n.includes('marvel') || n.includes('seal') || 
      n.includes('atto 3') || n.includes('c4') || n.includes('megane') || n.includes('clio') ||
      n.includes('5 e-tech') || n.includes('r5')) return 'Berline';
  return null; // pas de détection → garder l'existant
}

// Détection de carburant par nom + version
function detectCarburant(nom, version) {
  const n = (nom + ' ' + (version || '')).toLowerCase();
  if (n.includes('ev') || n.includes('electr') || n.includes('électr') || n.includes('e-tech electric') ||
      n.includes('bz') || n.includes(' eq') || n.includes('atto') || n.includes('dolphin') || 
      n.includes('ioniq 5') || n.includes('ioniq 6') || n.includes('ev6') || n.includes('kona electric') ||
      n.includes('spring') || n.includes('id.3') || n.includes('id.4') || n.includes('id.5') ||
      n.includes('enyaq') || n.includes('seal') || n.includes('tang ') || n.includes('mega') ||
      n.includes('cyberster') || n.includes('5 e-tech') || n.includes('r5') || n.includes('e-208') ||
      n.includes('e-c4') || n.includes('byd')) return 'Électrique';
  if (n.includes('hybride') || n.includes('hybrid') || n.includes('hev') || n.includes('phev') ||
      n.includes('e-tech') || n.includes('mild hybrid') || n.includes('mhev') || n.includes('rechargeable') ||
      n.includes('plug-in') || n.includes('etsi') || n.includes('techno h') || n.includes('-hev') ||
      n.includes('hev') || n.includes('200e') || n.includes('300e')) return 'Hybride';
  if (n.includes('diesel') || n.includes('dci') || n.includes('tdi') || n.includes('hdi') ||
      n.includes('cdi') || n.includes('crdi') || n.includes('blue d') || n.includes('d-4d') ||
      n.includes('d4d') || n.includes('bluehdI') || n.includes('bluehdi')) return 'Diesel';
  return 'Essence';
}

async function fixData() {
  console.log('🔧 Démarrage correction des données...\n');
  initDB();
  await new Promise(r => setTimeout(r, 500));

  const db = getDB();

  // ===== 1. CORRIGER LES CATÉGORIES "Non spécifiée" =====
  console.log('1️⃣  Correction des catégories "Non spécifiée"...');
  
  await new Promise((resolve, reject) => {
    db.all(`SELECT id, nom FROM models WHERE categorie = 'Non spécifiée' OR categorie = '' OR categorie IS NULL`, [], (err, rows) => {
      if (err) { reject(err); return; }
      
      console.log(`   → ${rows.length} modèles à corriger`);
      let done = 0;
      if (rows.length === 0) { resolve(); return; }
      
      rows.forEach(row => {
        const newCat = detectCategorie(row.nom);
        if (newCat) {
          db.run(`UPDATE models SET categorie = ?, carrosserie = ? WHERE id = ?`, 
            [newCat, newCat, row.id], 
            (err2) => {
              if (!err2) console.log(`   ✅ ${row.nom} → ${newCat}`);
              done++;
              if (done === rows.length) resolve();
            }
          );
        } else {
          done++;
          if (done === rows.length) resolve();
        }
      });
    });
  });

  // ===== 2. CORRIGER LES CARBURANTS =====
  console.log('\n2️⃣  Correction des carburants dans motorisations...');
  
  await new Promise((resolve, reject) => {
    db.all(`SELECT id, version, model_id FROM motorisations WHERE carburant = 'Essence' OR carburant IS NULL OR carburant = ''`, [], async (err, rows) => {
      if (err) { reject(err); return; }
      
      // Get model names for context
      db.all(`SELECT id, nom FROM models`, [], (err2, modelRows) => {
        if (err2) { reject(err2); return; }
        const modelMap = {};
        for (const m of modelRows) modelMap[m.id] = m.nom;
        
        let corrected = 0;
        let done = 0;
        if (rows.length === 0) { resolve(); return; }
        
        rows.forEach(row => {
          const modelNom = modelMap[row.model_id] || '';
          const detected = detectCarburant(modelNom, row.version);
          
          if (detected !== 'Essence') {
            db.run(`UPDATE motorisations SET carburant = ? WHERE id = ?`, [detected, row.id], (err3) => {
              if (!err3) {
                console.log(`   ✅ ${modelNom} / ${row.version} → ${detected}`);
                corrected++;
              }
              done++;
              if (done === rows.length) { console.log(`   → ${corrected} carburants corrigés`); resolve(); }
            });
          } else {
            done++;
            if (done === rows.length) { console.log(`   → ${corrected} carburants corrigés`); resolve(); }
          }
        });
      });
    });
  });

  // ===== 3. CORRIGER catégorie SPÉCIFIQUE des mauvaises détections du scraper =====
  console.log('\n3️⃣  Corrections manuelles de catégories incorrectes...');
  
  const manualFixes = [
    // Scraper a mal détecté certains modèles
    { id: 'toyota-bz4x', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'toyota-land-cruiser-prado', categorie: '4x4', carrosserie: 'SUV' },
    { id: 'toyota-rav-4', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'dacia-bigster', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'dacia-bigster-hev', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'mg-marvel-r', categorie: 'SUV Premium', carrosserie: 'SUV' },
    { id: 'mg-cyberster', categorie: 'Cabriolet', carrosserie: 'Cabriolet' },
    { id: 'renault-5-e-tech', categorie: 'Citadine', carrosserie: 'Citadine' },
    { id: 'renault-kangoo', categorie: 'Monospace', carrosserie: 'Monospace' },
    { id: 'renault-megane-sedan', categorie: 'Berline', carrosserie: 'Berline' },
    { id: 'dacia-logan', categorie: 'Berline', carrosserie: 'Berline' },
    { id: 'dacia-spring', categorie: 'Citadine', carrosserie: 'Citadine' },
    { id: 'mg-mg-5', categorie: 'Berline', carrosserie: 'Break' },
    { id: 'toyota-fortuner', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'toyota-c-hr', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'renault-austral', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'renault-kardian', categorie: 'SUV', carrosserie: 'SUV' },
    { id: 'renault-megane-e-tech', categorie: 'Berline', carrosserie: 'Berline' },
    { id: 'toyota-corolla-prestige', categorie: 'Berline', carrosserie: 'Berline' },
    { id: 'toyota-corolla-sport', categorie: 'Berline', carrosserie: 'Berline' },
    { id: 'toyota-corolla-x-suv', categorie: 'SUV', carrosserie: 'SUV' },
  ];

  for (const fix of manualFixes) {
    await new Promise(resolve => {
      db.run(`UPDATE models SET categorie = ?, carrosserie = ? WHERE id = ?`, 
        [fix.categorie, fix.carrosserie, fix.id],
        (err) => {
          if (!err) console.log(`   ✅ ${fix.id} → ${fix.categorie}`);
          resolve();
        }
      );
    });
  }

  // ===== 4. CORRIGER les modèles HEV/PHEV/E-Tech qui ont un carburant Essence =====
  console.log('\n4️⃣  Correction des motorisations HEV/PHEV incorrectes...');
  const hevPatterns = [
    { pattern: '%-HEV%', carburant: 'Hybride' },
    { pattern: '%-hev%', carburant: 'Hybride' },
    { pattern: '%E-Tech%', carburant: 'Hybride' },
    { pattern: '%e-tech%', carburant: 'Hybride' },
  ];
  
  for (const hp of hevPatterns) {
    await new Promise(resolve => {
      db.run(`UPDATE motorisations SET carburant = ? WHERE (version LIKE ? OR model_id LIKE ?) AND carburant = 'Essence'`,
        [hp.carburant, hp.pattern, hp.pattern],
        function(err) {
          if (!err && this.changes > 0) console.log(`   ✅ Pattern '${hp.pattern}' → ${hp.carburant} (${this.changes} lignes)`);
          resolve();
        }
      );
    });
  }

  // Update les model_ids HEV dans motorisations
  await new Promise(resolve => {
    db.run(`UPDATE motorisations SET carburant = 'Hybride' 
      WHERE model_id IN (
        SELECT id FROM models 
        WHERE id LIKE '%-hev' OR id LIKE '%-e-tech' OR nom LIKE '%HEV%' 
           OR nom LIKE '%E-Tech%' OR nom LIKE '%Hybrid%' OR nom LIKE '%Hybride%'
      ) AND carburant = 'Essence'`,
      function(err) {
        if (!err && this.changes > 0) console.log(`   ✅ Modèles HEV → Hybride (${this.changes} lignes)`);
        resolve();
      }
    );
  });

  // Update les models électriques
  await new Promise(resolve => {
    db.run(`UPDATE motorisations SET carburant = 'Électrique' 
      WHERE model_id IN (
        SELECT id FROM models 
        WHERE id LIKE '%-ev' OR id LIKE '%-electric' OR nom LIKE '%EV%' 
           OR nom LIKE '%électrique%' OR nom LIKE '%E-Tech%' AND nom LIKE '%bZ%'
           OR id LIKE '%spring%' OR id LIKE '%byd-%' OR id LIKE '%zs-ev%'
           OR id LIKE '%ioniq%' OR id LIKE '%ev6%' OR id LIKE '%id.4%'
           OR id LIKE '%bz4x%' OR id LIKE '%5-e-tech%' OR id LIKE '%megane-e-tech%'
      ) AND carburant = 'Essence'`,
      function(err) {
        if (!err && this.changes > 0) console.log(`   ✅ Modèles EV → Électrique (${this.changes} lignes)`);
        resolve();
      }
    );
  });

  db.close();
  console.log('\n✅ Corrections terminées!');
}

fixData().catch(console.error);
