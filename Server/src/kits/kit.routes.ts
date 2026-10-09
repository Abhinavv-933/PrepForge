import { Router } from 'express';

import { requireAuth } from '../auth/auth.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { runKitGeneration } from './kit.generation.js';
import { createKitSchema } from './kit.schema.js';
import { createKit, deleteKit, getKit, listKits } from './kit.service.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createKitSchema), async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    const result = await createKit(req.user.id, req.body);

    if (result.duplicate) {
      res.status(200).json({
        id: result.kit._id.toString(),
        status: result.kit.generation?.status ?? 'queued',
        duplicate: true,
      });

      return;
    }

    const kitId = result.kit._id.toString();

    void runKitGeneration(kitId, {
      jd: req.body.jd,
      companyUrl: req.body.companyUrl,
      days: req.body.days,
    });

    res.status(202).json({
      id: kitId,
      status: 'queued',
      duplicate: false,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    const kits = await listKits(req.user.id);

    res.json({
      kits,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/status', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    const kit = await getKit(req.user.id, req.params.id);

    res.json({
      id: kit._id.toString(),
      generation: kit.generation,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    const kit = await getKit(req.user.id, req.params.id);

    res.json({
      kit,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new Error('Authenticated user missing from request.');
    }

    await deleteKit(req.user.id, req.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
