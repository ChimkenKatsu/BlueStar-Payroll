import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

/**
 * Tiny synchronous JSON-file "database". This plays the same role that the
 * bound Google Sheet played in the original Apps Script version: a single
 * source of truth with three collections — admin, teachers, payroll.
 *
 * Kept intentionally simple (no ORM, no external DB) so the project can run
 * with zero external services, mirroring the "just works" spirit of the
 * original Sheet-backed app. Swap this module out for a real database layer
 * (Postgres, Mongo, etc.) later without touching the routes, since callers
 * only ever go through readDb()/writeDb().
 */

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    writeDb({ admin: [], teachers: [], payroll: [] });
  }
}

export function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/** Convenience helper: read, mutate via callback, then persist. */
export function updateDb(mutator) {
  const data = readDb();
  const result = mutator(data);
  writeDb(data);
  return result;
}
