const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './findshop.db';
let db;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(path.resolve(DB_PATH));
    db.serialize(() => {
      db.run('PRAGMA journal_mode = WAL');
      db.run('PRAGMA foreign_keys = ON');
    });
  }
  return db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function initSchema() {
  return new Promise((resolve, reject) => {
    getDb().serialize(() => {
      getDb().run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT "visitor", shop_name TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
      getDb().run('CREATE TABLE IF NOT EXISTS commerces (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, description TEXT, categorie TEXT, quartier TEXT, adresse TEXT, telephone TEXT, horaires TEXT, latitude REAL, longitude REAL, image TEXT, created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
      getDb().run('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, description TEXT, prix REAL NOT NULL, categorie TEXT, image TEXT, commerce_id INTEGER NOT NULL, created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = { getDb, runAsync, getAsync, allAsync, initSchema };
