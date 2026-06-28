const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/autoguide.db');

// Delete bad specs (comments from users)
db.run("DELETE FROM specifications WHERE longueur LIKE '%précisions%' OR longueur LIKE '%matelot%' OR longueur LIKE '%commentaire%' OR longueur LIKE '%août%'", [], function(err) {
  if (err) console.error('Error:', err);
  console.log('Deleted rows:', this.changes);
  
  // Count remaining
  db.get('SELECT COUNT(*) as count FROM specifications', [], (err2, row) => {
    console.log('Remaining specs:', row?.count || 0);
    db.close();
  });
});
