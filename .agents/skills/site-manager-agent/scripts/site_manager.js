#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
module.paths.push(path.join(__dirname, '../../../../backend/node_modules'));
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cheerio = require('cheerio');

const DB_PATH = path.join(__dirname, '../../../../backend/data/autoguide.db');
const STATIC_DATA_PATH = path.join(__dirname, '../../../../frontend/js/data.js');

// Helper to open DB
function getDB() {
  return new sqlite3.Database(DB_PATH);
}

// 1. AUDIT COMMAND
function handleAudit() {
  console.log('🔍 Examen de la base de données SQLite...');
  const db = getDB();
  const report = {
    emptySpecs: [],
    emptyGalleries: [],
    incoherentPrices: [],
    missingLogos: []
  };

  db.all('SELECT * FROM models', [], (err, models) => {
    if (err) {
      console.error('Erreur SQL models:', err);
      db.close();
      process.exit(1);
    }

    db.all('SELECT * FROM specifications', [], (err2, specs) => {
      if (err2) {
        console.error('Erreur SQL specs:', err2);
        db.close();
        process.exit(1);
      }

      db.all('SELECT * FROM images', [], (err3, images) => {
        if (err3) {
          console.error('Erreur SQL images:', err3);
          db.close();
          process.exit(1);
        }

        db.all('SELECT * FROM brands', [], (err4, brands) => {
          db.close();

          const specsMap = {};
          specs.forEach(s => { specsMap[s.model_id] = s; });

          const imageCountMap = {};
          images.forEach(img => {
            imageCountMap[img.model_id] = (imageCountMap[img.model_id] || 0) + 1;
          });

          // Check models
          models.forEach(m => {
            const spec = specsMap[m.id];
            if (!spec || !spec.longueur || spec.longueur.trim() === '') {
              report.emptySpecs.push({ id: m.id, nom: m.marque + ' ' + m.nom });
            }

            const imgCount = imageCountMap[m.id] || 0;
            if (imgCount === 0) {
              report.emptyGalleries.push({ id: m.id, nom: m.marque + ' ' + m.nom });
            }

            if (m.prix_min <= 0 || m.prix_min > m.prix_max) {
              report.incoherentPrices.push({ id: m.id, nom: m.marque + ' ' + m.nom, prix_min: m.prix_min, prix_max: m.prix_max });
            }
          });

          // Check brands
          brands.forEach(b => {
            if (!b.logo || b.logo.includes('placeholder') || b.logo.trim() === '') {
              report.missingLogos.push({ id: b.id, nom: b.nom });
            }
          });

          // Write output to file as per Rule 4
          const reportPath = path.join(process.cwd(), 'audit_report.json');
          fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
          console.log(`✅ Audit terminé !`);
          console.log(`- Fiches techniques vides : ${report.emptySpecs.length}`);
          console.log(`- Galeries photos vides : ${report.emptyGalleries.length}`);
          console.log(`- Anomalies de prix : ${report.incoherentPrices.length}`);
          console.log(`- Logos manquants : ${report.missingLogos.length}`);
          console.log(`Rapport complet écrit dans : ${reportPath}`);
        });
      });
    });
  });
}

// 2. GENERATE NEWS COMMAND
async function handleGenerateNews(topic) {
  if (!topic) {
    console.error('Erreur : Veuillez spécifier un sujet avec --topic');
    process.exit(1);
  }

  console.log(`🤖 Interrogation de l'IA Gemini pour rédiger un article sur : "${topic}"...`);
  const db = getDB();

  db.get('SELECT value FROM settings WHERE id = 1', [], async (err, row) => {
    let apiKey = process.env.GEMINI_API_KEY;
    if (row) {
      try {
        const settings = JSON.parse(row.value);
        if (settings.gemini_api_key) apiKey = settings.gemini_api_key;
      } catch (e) {}
    }

    if (!apiKey) {
      db.close();
      console.error("Erreur : Clé API Gemini manquante. Veuillez la configurer dans l'admin ou définir la variable d'environnement GEMINI_API_KEY.");
      process.exit(1);
    }

    try {
      const prompt = `Génère un article de presse automobile en français sur le sujet : "${topic}".
      Renvoie UNIQUEMENT un objet JSON valide (sans markdown, sans balise \`\`\`json) contenant les clés :
      - "titre": titre professionnel accrocheur
      - "resume": résumé court de 2 phrases
      - "tag": ex: "Nouveauté", "Actualité Maroc", "Marché", "Salon"
      - "contenu": le corps complet de l'article formaté en HTML propre avec des balises <p> et <h2>.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );

      let text = response.data.candidates[0].content.parts[0].text.trim();
      // Nettoyer si l'IA a quand même mis des backticks markdown
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();

      const articleData = JSON.parse(text);

      // Générer une image par défaut élégante selon le tag/sujet
      const image = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800";

      db.run(
        `INSERT INTO news (titre, date_publication, image, resume, contenu_complet, lien_article) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          articleData.titre,
          new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          image,
          articleData.resume,
          articleData.contenu,
          `ai-generated-${Date.now()}`
        ],
        function(errInsert) {
          db.close();
          if (errInsert) {
            console.error('Erreur SQL insertion news:', errInsert);
            process.exit(1);
          }
          console.log(`✅ Article généré et inséré avec succès ! ID : ${this.lastID}`);
          console.log(`Titre : ${articleData.titre}`);
          
          // Reconstruire data.js
          runRebuild();
        }
      );

    } catch (e) {
      db.close();
      console.error('Erreur de génération IA :', e.response ? e.response.data : e.message);
      process.exit(1);
    }
  });
}

// 3. IMPORT SPECS COMMAND (HTML PARSER)
function handleImportSpecs(modelId, htmlFilePath) {
  if (!modelId || !htmlFilePath) {
    console.error('Erreur : Veuillez renseigner --model-id et --html-file');
    process.exit(1);
  }

  console.log(`📂 Lecture et analyse du fichier HTML : ${htmlFilePath}...`);
  if (!fs.existsSync(htmlFilePath)) {
    console.error(`Erreur : Fichier introuvable : ${htmlFilePath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(htmlFilePath, 'utf8');
  const $ = cheerio.load(html);

  const specs = {
    longueur: '', largeur: '', hauteur: '', empattement: '',
    poids: '', coffre: '', conso_mixte: '', cylindree: '',
    vitesse_max: '', acceleration: '', options: {}
  };

  // Generic crawler for key-value tables
  $('tr').each((i, el) => {
    const key = $(el).find('td').first().text().trim().toLowerCase();
    const val = $(el).find('td').last().text().trim();

    if (key.includes('longueur')) specs.longueur = val;
    else if (key.includes('largeur')) specs.largeur = val;
    else if (key.includes('hauteur')) specs.hauteur = val;
    else if (key.includes('empattement')) specs.empattement = val;
    else if (key.includes('poids')) specs.poids = val;
    else if (key.includes('coffre')) specs.coffre = val;
    else if (key.includes('consommation') || key.includes('mixte')) specs.conso_mixte = val;
    else if (key.includes('cylindrée')) specs.cylindree = val;
    else if (key.includes('vitesse max') || key.includes('vitesse maximale')) specs.vitesse_max = val;
    else if (key.includes('0-100') || key.includes('accélération')) specs.acceleration = val;
  });

  // Extract common options
  const pageText = $.text().toLowerCase();
  const checkOptions = {
    'Airbags': ['airbag', 'airbags'],
    'ABS': ['abs'],
    'ESP': ['esp', 'contrôle de stabilité'],
    'Alarme': ['alarme', 'antivol'],
    'Fixations Isofix': ['isofix'],
    'Climatisation': ['climatisation', 'clim '],
    'Régulateur de vitesse': ['régulateur'],
    'Limiteur de vitesse': ['limiteur'],
    'Démarrage sans clé': ['démarrage sans clé', 'keyless'],
    'Volant réglable': ['volant réglable'],
    'Système audio': ['système audio', 'haut-parleurs'],
    'Compatibilité smartphone': ['carplay', 'android auto', 'bluetooth'],
    'Caméra de recul': ['caméra de recul'],
    'Aide au stationnement': ['radar de recul', 'aide au stationnement'],
    'Feux de jour': ['led', 'phares led'],
    'Toit ouvrant': ['toit ouvrant', 'toit panoramique']
  };

  Object.entries(checkOptions).forEach(([label, keywords]) => {
    const present = keywords.some(kw => pageText.includes(kw));
    specs.options[label] = present ? 'Oui' : 'Non';
  });

  console.log('Dimensions extraites :', {
    longueur: specs.longueur,
    largeur: specs.largeur,
    hauteur: specs.hauteur,
    poids: specs.poids,
    coffre: specs.coffre
  });

  const db = getDB();
  db.run('DELETE FROM specifications WHERE model_id = ?', [modelId], (errDel) => {
    if (errDel) {
      db.close();
      console.error('Erreur SQL delete specs:', errDel);
      process.exit(1);
    }

    const stmt = db.prepare(`INSERT INTO specifications 
      (model_id, longueur, largeur, hauteur, empattement, poids, coffre,
       cylindree, cylindres, turbo, vitesse_max, acceleration,
       conso_urbaine, conso_extra, conso_mixte, emission_co2, reservoir, roues, pneus, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run(
      modelId,
      specs.longueur, specs.largeur, specs.hauteur, specs.empattement,
      specs.poids, specs.coffre, specs.cylindree, '', '', specs.vitesse_max, specs.acceleration,
      '', '', specs.conso_mixte, '', '', '', '', JSON.stringify(specs.options),
      (errInsert) => {
        stmt.finalize();
        db.close();
        if (errInsert) {
          console.error('Erreur SQL insert specs:', errInsert);
          process.exit(1);
        }
        console.log(`✅ Fiche technique importée avec succès en base de données pour le modèle : ${modelId} !`);
        
        // Reconstruire data.js
        runRebuild();
      }
    );
  });
}

// 4. REBUILD & PUBLISH FUNCTION
function runRebuild() {
  console.log('⚡ Reconstruction de data.js...');
  const { exec } = require('child_process');
  
  // Call server static rebuilder internally if server is running,
  // or write the static data directly by loading DB
  const db = getDB();
  
  db.all('SELECT * FROM brands ORDER BY nom', [], (err, brands) => {
    db.all('SELECT * FROM models', [], (err2, models) => {
      db.all('SELECT * FROM specifications', [], (err3, specs) => {
        db.all('SELECT * FROM images', [], (err4, images) => {
          db.all('SELECT * FROM news ORDER BY id DESC', [], (err5, news) => {
            db.get('SELECT value FROM settings WHERE id = 1', [], (err6, settingsRow) => {
              db.close();

              if (err || err2 || err3 || err4 || err5) {
                console.error('Erreur de lecture DB pour reconstruction');
                return;
              }

              // Map specs and images to models
              const specsMap = {};
              specs.forEach(s => {
                try { s.options = typeof s.options === 'string' ? JSON.parse(s.options) : s.options; } catch(e) {}
                specsMap[s.model_id] = s;
              });

              const imagesMap = {};
              images.forEach(img => {
                if (!imagesMap[img.model_id]) imagesMap[img.model_id] = [];
                imagesMap[img.model_id].push(img);
              });

              models.forEach(m => {
                m.specifications = specsMap[m.id] || null;
                m.images = imagesMap[m.id] || [];
              });

              let settings = { hero_title: 'Trouvez votre voiture neuve au meilleur prix', hero_subtitle: 'Prix officiels, fiches techniques et comparateur de toutes les marques disponibles au Maroc' };
              if (settingsRow) {
                try { settings = JSON.parse(settingsRow.value); } catch(e) {}
              }

              let wallpapers = [];
              try {
                wallpapers = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../backend/data/wallpapers.json'), 'utf8'));
              } catch(e) {}

              const finalData = {
                brands,
                models,
                categories: [...new Set(models.map(m => m.categorie).filter(Boolean))],
                carburants: ['Essence', 'Diesel', 'Hybride', 'Électrique'],
                promos: models.slice(0, 12), // default promos
                news,
                settings,
                wallpapers
              };

              fs.writeFileSync(STATIC_DATA_PATH, 'const STATIC_DATA = ' + JSON.stringify(finalData, null, 2) + ';');
              console.log('⚡ [Build] data.js régénéré et prêt.');

              // Trigger git + firebase publish
              console.log('🚀 Publication en ligne (Git + Firebase)...');
              exec('git add . && git commit -m "Auto-update via CLI site manager" && git push origin main && firebase deploy --only hosting', (errExec, stdout, stderr) => {
                if (errExec) {
                  console.error('Erreur auto-publication :', stderr || errExec.message);
                } else {
                  console.log('✅ Publication et déploiement Firebase Hosting terminés avec succès !');
                }
              });
            });
          });
        });
      });
    });
  });
}

// MAIN CLI PARSER
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
Site Manager Agent CLI - Commandes disponibles :
  node site_manager.js audit                     : Examine la base de données
  node site_manager.js generate-news --topic "X" : Rédige un article avec l'IA Gemini
  node site_manager.js import-specs --model-id "Y" --html-file "Z" : Importe une fiche technique HTML
  node site_manager.js rebuild                   : Régénère et déploie le site
  `);
  process.exit(0);
}

if (command === 'audit') {
  handleAudit();
} else if (command === 'generate-news') {
  const topicIdx = args.indexOf('--topic');
  const topic = topicIdx !== -1 ? args[topicIdx + 1] : null;
  handleGenerateNews(topic);
} else if (command === 'import-specs') {
  const modelIdx = args.indexOf('--model-id');
  const fileIdx = args.indexOf('--html-file');
  const modelId = modelIdx !== -1 ? args[modelIdx + 1] : null;
  const htmlFile = fileIdx !== -1 ? args[fileIdx + 1] : null;
  handleImportSpecs(modelId, htmlFile);
} else if (command === 'rebuild') {
  runRebuild();
} else {
  console.error(`Commande inconnue : ${command}`);
  process.exit(1);
}
