import { Router, Request, Response } from 'express';
import { itineraryRepo } from '../db/itineraryRepo.js';

const router = Router();

// GET /api/itinerary - Get all saved destinations
router.get('/', (_req: Request, res: Response) => {
  try {
    const items = itineraryRepo.getAll();
    res.json({
      success: true,
      data: items,
      total: items.length
    });
  } catch (error: any) {
    console.error('Error fetching itinerary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch itinerary' });
  }
});

// POST /api/itinerary - Add destination to itinerary
router.post('/', (req: Request, res: Response) => {
  try {
    const { placeId, name, location, category, imageUrl, description, lat, lng, notes, visitDate } = req.body;

    if (!placeId || !name || !location) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: placeId, name, and location are required.'
      });
      return;
    }

    const item = itineraryRepo.add({
      placeId,
      name,
      location,
      category: category || 'Historical & Landmarks',
      imageUrl: imageUrl || '',
      description,
      lat: lat !== undefined ? Number(lat) : undefined,
      lng: lng !== undefined ? Number(lng) : undefined,
      notes,
      visitDate
    });

    res.status(201).json({
      success: true,
      message: 'Destination added to itinerary',
      data: item
    });
  } catch (error: any) {
    console.error('Error adding to itinerary:', error);
    res.status(500).json({ success: false, error: 'Failed to add destination to itinerary' });
  }
});

// PATCH /api/itinerary/:id - Update notes or visit date
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid itinerary item ID' });
      return;
    }

    const { notes, visitDate } = req.body;
    const updated = itineraryRepo.update(id, { notes, visitDate });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Itinerary item not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Itinerary item updated',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating itinerary item:', error);
    res.status(500).json({ success: false, error: 'Failed to update itinerary item' });
  }
});

// DELETE /api/itinerary/:id - Remove by numeric ID
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid itinerary item ID' });
      return;
    }

    const deleted = itineraryRepo.remove(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Itinerary item not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Destination removed from itinerary'
    });
  } catch (error: any) {
    console.error('Error deleting itinerary item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete itinerary item' });
  }
});

// DELETE /api/itinerary/place/:placeId - Remove by placeId
router.delete('/place/:placeId', (req: Request, res: Response) => {
  try {
    const { placeId } = req.params;
    const deleted = itineraryRepo.removeByPlaceId(placeId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Place was not in itinerary' });
      return;
    }

    res.json({
      success: true,
      message: 'Destination removed from itinerary'
    });
  } catch (error: any) {
    console.error('Error deleting itinerary by placeId:', error);
    res.status(500).json({ success: false, error: 'Failed to remove from itinerary' });
  }
});

// DELETE /api/itinerary - Clear all items
router.delete('/', (_req: Request, res: Response) => {
  try {
    itineraryRepo.clearAll();
    res.json({
      success: true,
      message: 'Itinerary cleared successfully'
    });
  } catch (error: any) {
    console.error('Error clearing itinerary:', error);
    res.status(500).json({ success: false, error: 'Failed to clear itinerary' });
  }
});

export default router;
