import { db } from './database.js';
import type { ItineraryItem } from '../types/index.js';

interface RawItineraryRow {
  id: number;
  place_id: string;
  name: string;
  location: string;
  category: string;
  image_url: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  visit_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: RawItineraryRow): ItineraryItem {
  return {
    id: row.id,
    placeId: row.place_id,
    name: row.name,
    location: row.location,
    category: row.category,
    imageUrl: row.image_url,
    description: row.description || undefined,
    lat: row.lat !== null ? Number(row.lat) : undefined,
    lng: row.lng !== null ? Number(row.lng) : undefined,
    notes: row.notes || '',
    visitDate: row.visit_date || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const itineraryRepo = {
  getAll(): ItineraryItem[] {
    const stmt = db.prepare('SELECT * FROM itinerary ORDER BY created_at DESC');
    const rows = stmt.all() as unknown as RawItineraryRow[];
    return rows.map(mapRow);
  },

  getById(id: number): ItineraryItem | null {
    const stmt = db.prepare('SELECT * FROM itinerary WHERE id = ?');
    const row = stmt.get(id) as unknown as RawItineraryRow | undefined;
    return row ? mapRow(row) : null;
  },

  getByPlaceId(placeId: string): ItineraryItem | null {
    const stmt = db.prepare('SELECT * FROM itinerary WHERE place_id = ?');
    const row = stmt.get(placeId) as unknown as RawItineraryRow | undefined;
    return row ? mapRow(row) : null;
  },

  add(data: {
    placeId: string;
    name: string;
    location: string;
    category: string;
    imageUrl: string;
    description?: string;
    lat?: number;
    lng?: number;
    notes?: string;
    visitDate?: string;
  }): ItineraryItem {
    // Check if exists
    const existing = this.getByPlaceId(data.placeId);
    if (existing) {
      return existing;
    }

    const stmt = db.prepare(`
      INSERT INTO itinerary (
        place_id, name, location, category, image_url, description, lat, lng, notes, visit_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.placeId,
      data.name,
      data.location,
      data.category,
      data.imageUrl,
      data.description || '',
      data.lat ?? null,
      data.lng ?? null,
      data.notes || '',
      data.visitDate || ''
    );

    const created = this.getByPlaceId(data.placeId);
    if (!created) {
      throw new Error('Failed to retrieve newly created itinerary item');
    }
    return created;
  },

  update(id: number, fields: { notes?: string; visitDate?: string }): ItineraryItem | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (fields.notes !== undefined) {
      updates.push('notes = ?');
      values.push(fields.notes);
    }
    if (fields.visitDate !== undefined) {
      updates.push('visit_date = ?');
      values.push(fields.visitDate);
    }

    if (updates.length === 0) return this.getById(id);

    updates.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE itinerary SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    return this.getById(id);
  },

  remove(id: number): boolean {
    const stmt = db.prepare('DELETE FROM itinerary WHERE id = ?');
    const result = stmt.run(id);
    return (result.changes ?? 0) > 0;
  },

  removeByPlaceId(placeId: string): boolean {
    const stmt = db.prepare('DELETE FROM itinerary WHERE place_id = ?');
    const result = stmt.run(placeId);
    return (result.changes ?? 0) > 0;
  },

  clearAll(): void {
    db.exec('DELETE FROM itinerary;');
  }
};
