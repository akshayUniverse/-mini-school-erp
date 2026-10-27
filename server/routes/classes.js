import { Router } from 'express';
import { SchoolClass, Student, User } from '../models.js';
import { allow } from '../middleware.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.mine === 'true' && req.user.role === 'teacher') filter.teacher = req.user.id;
  const classes = await SchoolClass.find(filter).populate('teacher', 'name email subject').sort({ name: 1, section: 1 });
  const result = await Promise.all(classes.map(async (item) => ({
    ...item.toObject(),
    studentCount: await Student.countDocuments({ classId: item._id })
  })));
  return res.json(result);
});

router.post('/', allow('admin'), async (req, res) => {
  const { name, section, teacher = null } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof section !== 'string' || !section.trim()) {
    return res.status(400).json({ message: 'Class name and section are required' });
  }
  if (teacher && !(await User.exists({ _id: teacher, role: 'teacher' }))) {
    return res.status(400).json({ message: 'Assigned teacher is invalid' });
  }
  const item = await SchoolClass.create({ name, section, teacher: teacher || null });
  await item.populate('teacher', 'name email subject');
  return res.status(201).json({ ...item.toObject(), studentCount: 0 });
});

router.put('/:id', allow('admin'), async (req, res) => {
  const { name, section, teacher = null } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof section !== 'string' || !section.trim()) {
    return res.status(400).json({ message: 'Class name and section are required' });
  }
  if (teacher && !(await User.exists({ _id: teacher, role: 'teacher' }))) {
    return res.status(400).json({ message: 'Assigned teacher is invalid' });
  }
  const item = await SchoolClass.findByIdAndUpdate(
    req.params.id, { name, section, teacher: teacher || null }, { new: true, runValidators: true }
  ).populate('teacher', 'name email subject');
  if (!item) return res.status(404).json({ message: 'Class not found' });
  return res.json({ ...item.toObject(), studentCount: await Student.countDocuments({ classId: item._id }) });
});

router.delete('/:id', allow('admin'), async (req, res) => {
  const item = await SchoolClass.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Class not found' });
  if (await Student.exists({ classId: item._id })) {
    return res.status(409).json({ message: 'Cannot delete a class that still has students' });
  }
  await item.deleteOne();
  return res.status(204).end();
});

export default router;
