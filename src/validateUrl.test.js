const request = require('supertest');
const express = require('express');
const validateUrl = require('./validateUrl');

const app = express();
app.use(express.json());
app.post('/api/analyze', validateUrl, (req, res) => {
  res.status(200).json({ message: 'Valid URL' });
});

describe('POST /api/analyze', () => {
  it('should return 400 if url is missing', async () => {
    const res = await request(app).post('/api/analyze').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('URL is required');
  });

  it('should return 400 if url is invalid', async () => {
    const res = await request(app).post('/api/analyze').send({ url: 'not-a-url' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Invalid URL format');
  });

  it('should return 200 if url is valid', async () => {
    const res = await request(app).post('/api/analyze').send({ url: 'https://example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Valid URL');
  });
});
