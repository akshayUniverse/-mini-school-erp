import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, SchoolClass } from '../models.js';
import { allow } from '../middleware.js';

const router = Router();
const safeUser = (user) => ({
  id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, subject: user.subject
});

router.get('/', async (req, res) => {
  const teachers = await User.find({ role: 'teacher' }).sort({ name: 1 });
  return res.json(teachers.map(safeUser));
});

router.post('/', allow('admin'), async (req, res) => {
  const { name, email, password, phone = '', subject = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string') {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const user = await User.create({
    name, email, passwordHash: await bcrypt.hash(password, 10), role: 'teacher', phone, subject
  });
  return res.status(201).json(safeUser(user));
});

router.put('/:id', allow('admin'), async (req, res) => {
  const { name, email, phone = '', subject = '', password } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const update = { name, email, phone, subject };
  if (password) update.passwordHash = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'teacher' }, update, { new: true, runValidators: true }
  );
  if (!user) return res.status(404).json({ message: 'Teacher not found' });
  return res.json(safeUser(user));
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  await SchoolClass.updateMany({ teacher: teacher._id }, { $unset: { teacher: 1 } });
  return res.status(204).end();
});

export default router;
