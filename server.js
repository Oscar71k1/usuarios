const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let db;
try {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509
  };

  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.log('⚠️ Firebase no configurado. Usando memoria para desarrollo.');
  db = null;
}

let usuariosEnMemoria = [
  {
    id: '1',
    nombre: 'Admin Sistema',
    email: 'admin@universidad.com',
    contraseña: '$2b$10$rQZ8K9vL2mN3pO4q...',
    rol: 'Admin'
  }
];

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET || 'clave-secreta-desarrollo',
    { expiresIn: '24h' }
  );
}

function autenticarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de acceso requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-desarrollo', (err, usuario) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.usuario = usuario;
    next();
  });
}

/* ===== RUTAS CON PREFIJO /api ===== */

app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, contraseña, rol = 'Alumno' } = req.body;
    if (!nombre || !email || !contraseña)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });

    let usuarioExistente;
    if (db) {
      const query = await db.collection('usuarios').where('email', '==', email).get();
      usuarioExistente = !query.empty;
    } else {
      usuarioExistente = usuariosEnMemoria.find(u => u.email === email);
    }

    if (usuarioExistente) return res.status(400).json({ error: 'El usuario ya existe' });

    const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);
    const nuevoUsuario = { nombre, email, contraseña: contraseñaEncriptada, rol, fechaCreacion: new Date().toISOString() };

    let usuarioId;
    if (db) {
      const docRef = await db.collection('usuarios').add(nuevoUsuario);
      usuarioId = docRef.id;
    } else {
      usuarioId = (usuariosEnMemoria.length + 1).toString();
      nuevoUsuario.id = usuarioId;
      usuariosEnMemoria.push(nuevoUsuario);
    }

    const token = generarToken({ id: usuarioId, email, rol });
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: { id: usuarioId, nombre, email, rol }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    if (!email || !contraseña) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    let usuario;
    if (db) {
      const query = await db.collection('usuarios').where('email', '==', email).get();
      if (query.empty) return res.status(401).json({ error: 'Credenciales inválidas' });
      usuario = { id: query.docs[0].id, ...query.docs[0].data() };
    } else {
      usuario = usuariosEnMemoria.find(u => u.email === email);
      if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });
    res.json({ mensaje: 'Login exitoso', usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/perfil/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;
    let usuario;
    if (db) {
      const doc = await db.collection('usuarios').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
      usuario = { id: doc.id, ...doc.data() };
    } else {
      usuario = usuariosEnMemoria.find(u => u.id === id);
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    delete usuario.contraseña;
    res.json({ mensaje: 'Perfil obtenido exitosamente', usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/validar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let usuario;
    if (db) {
      const doc = await db.collection('usuarios').doc(id).get();
      usuario = doc.exists ? { id: doc.id, ...doc.data() } : null;
    } else {
      usuario = usuariosEnMemoria.find(u => u.id === id);
    }
    if (!usuario) return res.status(404).json({ existe: false, mensaje: 'Usuario no encontrado' });
    delete usuario.contraseña;
    res.json({ existe: true, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ mensaje: 'Microservicio de Usuarios funcionando', timestamp: new Date().toISOString() });
});

// Iniciar servidor solo si no estamos en Vercel
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Microservicio de Usuarios ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check disponible en: http://localhost:${PORT}/api/health`);
  });
}

// Exportar app para Vercel
module.exports = app;
