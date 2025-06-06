// server.js
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'renejay', // your password here
  database: 'announcement_app',
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// POST announcement with files
app.post('/api/announcements', upload.array('files'), (req, res) => {
  try {
    const contentBlocks = JSON.parse(req.body.contentBlocks);

    // Replace file/image blocks content with uploaded file URLs
    let fileIndex = 0;
    for (let i = 0; i < contentBlocks.length; i++) {
      if (contentBlocks[i].type === 'image' || contentBlocks[i].type === 'file') {
        const file = req.files[fileIndex];
        const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        contentBlocks[i].content = url;
        fileIndex++;
      }
    }

    const sql = 'INSERT INTO announcements (content) VALUES (?)';
    db.query(sql, [JSON.stringify(contentBlocks)], (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ error: 'Failed to insert announcement' });
      }
      res.status(201).json({ id: result.insertId });
    });
  } catch (error) {
    console.error('POST error:', error);
    res.status(400).json({ error: 'Invalid contentBlocks JSON' });
  }
});

// GET all announcements
app.get('/api/announcements', (req, res) => {
  db.query('SELECT * FROM announcements ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch announcements' });
    }
    try {
      const data = results.map(row => ({
        id: row.id,
        contentBlocks: JSON.parse(row.content),
        date: row.created_at,
      }));
      res.json(data);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).json({ error: 'Failed to parse announcement content' });
    }
  });
});

// DELETE announcement by id
app.delete('/api/announcements/:id', (req, res) => {
  db.query('DELETE FROM announcements WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete announcement' });
    }
    res.sendStatus(204);
  });
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
