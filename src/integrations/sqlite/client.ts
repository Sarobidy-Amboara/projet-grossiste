import Database from 'better-sqlite3';

const db = new Database('mada-brew-boss.db', { verbose: console.log });

export default db;
