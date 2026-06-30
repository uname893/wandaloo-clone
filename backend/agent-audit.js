/**
 * Agent IA d'Audit et de Cohérence des Données
 * Analyse la base SQLite pour identifier les anomalies (images cassées, prix invalides, données manquantes)
 */
const { getDB } = require('./db');

async function runAuditAgent() {
  console.log('🤖 Agent IA Audit: Lancement de l\'inspection générale du catalogue...');
  const db = getDB();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Créer la table de rapports d'audit
      db.run(`CREATE TABLE IF NOT EXISTS audit_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anomalies_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      const anomalies = [];

      // 1. Détecter les modèles sans image ou avec image placeholder
      db.all(`SELECT id, nom, marque, image FROM models`, [], (err, models) => {
        if (err) return reject(err);

        for (const m of models) {
          if (!m.image || m.image.includes('placeholder') || m.image.includes('via.placeholder') || m.image.includes('logo-wandaloo')) {
            anomalies.push({
              type: 'IMAGE_MANQUANTE',
              severite: 'HAUTE',
              cible: `Modèle: ${m.marque} ${m.nom}`,
              details: `L'image de présentation (${m.image || 'Aucune'}) est invalide ou manquante.`,
              action: `UPDATE models SET image = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=60' WHERE id = '${m.id}'`,
              id_cible: m.id,
              table_cible: 'models'
            });
          }
        }

        // 2. Détecter les prix erronés
        db.all(`SELECT id, nom, marque, prix_min FROM models WHERE prix_min <= 0`, [], (err2, zeroPrice) => {
          for (const m of zeroPrice || []) {
            anomalies.push({
              type: 'PRIX_INCOHÉRENT',
              severite: 'CRITIQUE',
              cible: `Modèle: ${m.marque} ${m.nom}`,
              details: `Le prix minimum du véhicule est de 0 DH.`,
              action: `UPDATE models SET prix_min = 150000, prix_max = 180000 WHERE id = '${m.id}'`,
              id_cible: m.id,
              table_cible: 'models'
            });
          }

          // 3. Détecter les modèles sans motorisations associées
          db.all(`SELECT m.id, m.nom, m.marque, COUNT(mo.id) as count FROM models m LEFT JOIN motorisations mo ON m.id = mo.model_id GROUP BY m.id HAVING count = 0`, [], (err3, noEngine) => {
            for (const m of noEngine || []) {
              anomalies.push({
                type: 'MOTORISATION_ABSENTE',
                severite: 'MOYENNE',
                cible: `Modèle: ${m.marque} ${m.nom}`,
                details: `Aucune version ou moteur n'est configuré pour ce modèle.`,
                action: `INSERT INTO motorisations (model_id, version, moteur, puissance, transmission, carburant) VALUES ('${m.id}', 'Standard', '1.5L', '6 CV', 'Manuelle', 'Essence')`,
                id_cible: m.id,
                table_cible: 'motorisations'
              });
            }

            // Enregistrer le rapport d'anomalies
            db.run(`INSERT INTO audit_reports (anomalies_json) VALUES (?)`, [JSON.stringify(anomalies)], (err4) => {
              db.close();
              if (err4) {
                console.error('❌ Impossible de sauvegarder le rapport d\'audit:', err4.message);
                reject(err4);
              } else {
                console.log(`🤖 Agent IA Audit: Inspection terminée. ${anomalies.length} anomalies détectées et consignées.`);
                resolve(anomalies);
              }
            });
          });
        });
      });
    });
  });
}

module.exports = { runAuditAgent };

if (require.main === module) {
  runAuditAgent().catch(console.error);
}
