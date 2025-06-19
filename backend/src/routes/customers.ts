import { Router } from 'express';

const router = Router();

// List all customers or filter by email
router.get('/', (req, res) => {
  const customers = req.app.locals.customers;
  if (req.query.email) {
    const found = customers.find((c: any) => c.email === req.query.email);
    return res.json(found ? [found] : []);
  }
  res.json(customers);
});

// Login as a customer by email
router.post('/login', (req, res) => {
  const { email } = req.body;
  const customers = req.app.locals.customers;
  const customer = customers.find((c: any) => c.email === email);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json({ customer });
});

export default router; 