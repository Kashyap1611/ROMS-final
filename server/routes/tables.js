import { Router } from 'express';
import {
  listTables,
  createTable,
  deleteTable,
  updateTableStatusById,
  updateTableStatusByNumber,
} from '../controllers/tablesController.js';

const router = Router();
router.get('/', listTables);
router.post('/', createTable);
router.delete('/:id', deleteTable);
router.patch('/:id/status', updateTableStatusById);
router.patch('/number/:number/status', updateTableStatusByNumber);

export default router;
