const { Client } = require('pg');
const async = require('async');
const path = require('path');
const fs = require('fs');


/*
Runs migrations and tracks which migrations have already been run
*/

const client = new Client({ connectionString: process.env.PM_DB_URL });

const waitForDb = function(dbUrl, cb) {
  async.doUntil(
    (cb) => {
      console.log('waiting on postgres...');
      return setTimeout(() => {
        client.connect(function(err) {
          return cb(null, err);
        });
      }, 1000);
    },
    dbErr => (dbErr == null),
    (err, dbErr) => cb(err)
  );
};

const runMigrations = function(migrationDir, cb) {
  client.query('CREATE TABLE IF NOT EXISTS migrations (migration VARCHAR(255))', (err) => {
    if (err) return cb(err);

    fs.readdir(migrationDir, function(err, folders) {
      if (err) return cb(err);

      let sortedFolders = folders.sort();

      async.eachSeries(sortedFolders, (folder, cb) => {
        client.query('SELECT * FROM migrations WHERE migration = $1', [folder], (err, result) => {
          if (err) return cb(err);
          if (result.rows.length > 0) {
            console.log(`Migration ${folder} already run`);
            return cb();
          }

          console.log(`Running migration ${folder}`);
          let file = path.join(migrationDir, folder, 'up.sql');
          fs.readFile(file, { encoding: 'utf8' }, (err, data) => {
            if (err) return cb(err);
            client.query(data, (err) => {
              client.query('INSERT INTO migrations VALUES ($1)', [folder], cb);
            });
          });
        });
      }, (err) => {
        client.end();
        cb(err);
      });
    });
  });
};

async.series([
  waitForDb.bind(null, process.env.PM_DB_URL),
  runMigrations.bind(null, path.join(__dirname, '../db/migrations')),
], (err) => {
  if (err) throw err;
});
