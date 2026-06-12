require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const err502 = (err, req, res) => res.status(502).json({ message: 'Service tidak tersedia' });
const proxy = (target) => createProxyMiddleware({ target, changeOrigin: true, on: { error: err502 } });

app.use('/auth', proxy('http://localhost:3001'));
app.use('/avatars', proxy('http://localhost:3001'));
app.use('/seller/products', proxy('http://localhost:3002'));
app.use('/admin/products', proxy('http://localhost:3002'));
app.use('/products', proxy('http://localhost:3002'));
app.use('/product-images', proxy('http://localhost:3002'));
app.use('/stores', proxy('http://localhost:3005'));
app.use('/store-images', proxy('http://localhost:3005'));
app.use('/admin/stores', proxy('http://localhost:3005'));
app.use('/chats', proxy('http://localhost:3003'));
app.use('/payments', proxy('http://localhost:3004'));
app.use('/admin/orders', proxy('http://localhost:3004'));
app.use('/admin/stats', proxy('http://localhost:3004'));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'gateway' }));
app.listen(8080, () => console.log('Gateway: http://localhost:8080'));
