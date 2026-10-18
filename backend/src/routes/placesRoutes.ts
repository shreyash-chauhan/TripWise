import { Router, Request, Response } from 'express';
import { placesService } from '../services/placesService.js';
import type { PlacesQueryParams } from '../types/index.js';

const router = Router();

// GET /api/places/categories
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = placesService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/places
router.get('/', async (req: Request, res: Response) => {
  try {
    const { query, category, sort } = req.query as {
      query?: string;
      category?: string;
      sort?: PlacesQueryParams['sort'];
    };

    const result = await placesService.search({ query, category, sort });
    res.json({
      success: true,
      data: result.places,
      meta: {
        total: result.total,
        query: result.query,
        category: result.category,
        sort: result.sort
      }
    });
  } catch (error: any) {
    console.error('Error fetching places:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search destinations. Please try again.'
    });
  }
});

// GET /api/places/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const place = await placesService.getById(id);

    if (!place) {
      res.status(404).json({ success: false, error: 'Destination not found' });
      return;
    }

    res.json({ success: true, data: place });
  } catch (error: any) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch destination details' });
  }
});

export default router;
