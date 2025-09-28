const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Firebase Admin
let db;
try {
  // Configuración de Firebase directamente en el código
  const serviceAccount = {
    type: "service_account",
    project_id: "micro-7f26b",
    private_key_id: "7777c8b7332b5f939c5f2178d1ecb3e852a5fa34",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDnOUPJTFW/q7Xe\nZuMzOch0dMspfnwS2sXX+Cg1I1ROjZM9YgMEIBNh/P+s+d7u2JVKe9PFuJitVZsS\nogAGO6X8jjo+btlanKIgojs+AlOEf8fadeSLw3jJ9gZvUGvQuhvYLGRo1iAT5cwr\ngpzumyHl8AhaL3T4gv1plv/cUPLnbAR4iQztmRL5qpUp2B561z/9jbztHIROZz24\nOESjSD154D/97xQa5lkCXS9Pe9p4hWp6YNftsfPE17L5sizxtZP0ylZGgLGD7iGf\nBHax+0dGZ4Eo0WAAlyGQj+DJ7r+Uw+ZqnnMM2RvJcxgNyW/PX5CC7Z1aceyregta\nU0ToXJ/HAgMBAAECggEAGiFHD027QldXIgSHjXJCEc23EyqHk/aO4CAGTzGoZTOA\n8wa1/OExFORAnTLO+40/RcpmPWm7MJoZgGANV6b6/uZbH6jAPbSwv7ZbB+AUbHH8\n9autVxFmf5BNhtvUQKN04mzrMKEYwUGOsqYRMl0Wq25WS0wh+wmL4MMJ3sMectdz\noYOclqksURthLwBj1GYN3TNqeK6xZd1Hf/SZ4PSVnhTOhqsboDCBAyG/jyMX+NDv\ngEYI8SwI8tlxsMbvAzhRJ+qJCeUYg1AMIAuoe1WyRdVYXgDQ/DKREIWC3/UNTHQd\n0bVZZTrD3/mzVENgoCujvGzdmvKHWHH5MAB2JKjPtQKBgQD56b61l91EMYavaeFV\nQTTcxb6oiaD7gBfBV7ctkAkZFUv03PHtyW3C0wyTd7LNzlbVJJls/52Q5igmTR4p\nne6jfyZnhg9COt9/cja5tcqUzfsTiqMnZuNVJ9lGEcDd1F5yf0H11q0Ril2EmnKT\nMt6xUptiTyU2UOrnr+Jg+Oa+QwKBgQDs2vzxIbho1+a0umhr0Ai6UKJ+zrkWaI9Z\n0IjE/DiqEIkBCD2rB3Gku3nVWNlGO0CEjUpW9grF0v6j8lDtlfiBUoyqZ/M1mp/k\ngmJwdmQzxLqtnydQaPT/bkx/KnTNT7tnGf2P5b/JsrFWEB3oLX3xVt1DxFZUKi3W\nebiahmY6LQKBgFnpCF2Yp1hTYRtWwmTDstsCoZdM/Ie/C8zZW+OegEdv7AXKP5fG\n8iA3gbzEQaXdaEwCgNhAFlX9F9C/yew7D5Huushf6LlxKNtXIe0qRBnJCV18cTpJ\nv9vxHDAjTvn/34Ld2cMyWs2GtCJy1mmy0X+GMrTpuH+UGQ8FrjIpGgq1AoGAUt0K\nQRIbAhMGk5PjlFRjuUscjmCkQEK0ZCegscnLyTOfusy3Rm6EQ62TIiDDYt6346fK\nqkHJ4wu+Kn1L8tLU7emDbNqRK9+8sKUs60uAItxgsv1LM8aEcBiWiqa/1lReq+Nb\n4kvunRH3GLTqwZ+owBYzstGtoiRfhPlwrB75BMECgYEA3cMFn0brG8AZQ3bgGlL4\nqzfh9Bkf+Tf9qu+dB64Q8imMd/FYrsQhPtzCkKvEijf+vIoXz73XmtM6OYvfcFxx\nKEQVFXyLvUU7cr03xf7/H/uzFiV/RT8WlyMOMXvEXTKW3911brGufLTBAlYXItpN\nefyLNAPUM0zN7iO5xms7PMk=\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@micro-7f26b.iam.gserviceaccount.com",
    client_id: "112008845739031064206",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40micro-7f26b.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin inicializado correctamente');
} catch (error) {
  console.log('⚠️  Firebase no configurado. Usando modo de desarrollo con datos en memoria.');
  console.log('Error:', error.message);
  // Base de datos en memoria para desarrollo
  db = null;
}

// Datos en memoria para desarrollo (cuando Firebase no esté configurado)
let usuariosEnMemoria = [
  {
    id: '1',
    nombre: 'Admin Sistema',
    email: 'admin@universidad.com',
    contraseña: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV',
    rol: 'Admin'
  }
];

// Función para generar JWT
function generarToken(usuario) {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol 
    },
    process.env.JWT_SECRET || 'clave-secreta-desarrollo',
    { expiresIn: '24h' }
  );
}

// Middleware de autenticación
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-desarrollo', (err, usuario) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.usuario = usuario;
    next();
  });
}

// Rutas del microservicio de usuarios

// Registro de nuevo usuario
app.post('/registro', async (req, res) => {
  try {
    const { nombre, email, contraseña, rol = 'Alumno' } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !contraseña) {
      return res.status(400).json({ 
        error: 'Nombre, email y contraseña son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    let usuarioExistente;
    if (db) {
      const usuariosRef = db.collection('usuarios');
      const querySnapshot = await usuariosRef.where('email', '==', email).get();
      usuarioExistente = !querySnapshot.empty;
    } else {
      usuarioExistente = usuariosEnMemoria.find(u => u.email === email);
    }

    if (usuarioExistente) {
      return res.status(400).json({ 
        error: 'El usuario ya existe con este email' 
      });
    }

    // Encriptar contraseña
    const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);

    // Crear nuevo usuario
    const nuevoUsuario = {
      nombre,
      email,
      contraseña: contraseñaEncriptada,
      rol,
      fechaCreacion: new Date().toISOString()
    };

    let usuarioId;
    if (db) {
      // Guardar en Firebase
      const docRef = await db.collection('usuarios').add(nuevoUsuario);
      usuarioId = docRef.id;
    } else {
      // Guardar en memoria
      usuarioId = (usuariosEnMemoria.length + 1).toString();
      nuevoUsuario.id = usuarioId;
      usuariosEnMemoria.push(nuevoUsuario);
    }

    // Generar token JWT
    const token = generarToken({ id: usuarioId, email, rol });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: usuarioId,
        nombre,
        email,
        rol
      },
      token
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login de usuario
app.post('/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    if (!email || !contraseña) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    let usuario;
    if (db) {
      const usuariosRef = db.collection('usuarios');
      const querySnapshot = await usuariosRef.where('email', '==', email).get();
      
      if (querySnapshot.empty) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      const doc = querySnapshot.docs[0];
      usuario = { id: doc.id, ...doc.data() };
    } else {
      usuario = usuariosEnMemoria.find(u => u.email === email);
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
    }

    // Verificar contraseña
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = generarToken({ 
      id: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol 
    });

    res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener perfil de usuario (requiere autenticación)
app.get('/perfil/:id', autenticarToken, async (req, res) => {
  try {
    const { id } = req.params;

    let usuario;
    if (db) {
      const doc = await db.collection('usuarios').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      usuario = { id: doc.id, ...doc.data() };
    } else {
      usuario = usuariosEnMemoria.find(u => u.id === id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
    }

    // No devolver la contraseña
    delete usuario.contraseña;

    res.json({
      mensaje: 'Perfil obtenido exitosamente',
      usuario
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Validar existencia de usuario (para otros microservicios)
app.get('/validar/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let usuario;
    if (db) {
      const doc = await db.collection('usuarios').doc(id).get();
      usuario = doc.exists ? { id: doc.id, ...doc.data() } : null;
    } else {
      usuario = usuariosEnMemoria.find(u => u.id === id);
    }

    if (!usuario) {
      return res.status(404).json({ 
        existe: false, 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // No devolver la contraseña
    delete usuario.contraseña;

    res.json({
      existe: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error al validar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de salud del microservicio
app.get('/health', (req, res) => {
  res.json({
    mensaje: 'Microservicio de Usuarios funcionando',
    timestamp: new Date().toISOString(),
    puerto: PORT
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`👤 Microservicio de Usuarios ejecutándose en puerto ${PORT}`);
  console.log(`🔐 Endpoints disponibles:`);
  console.log(`   - POST /registro - Registro de usuario`);
  console.log(`   - POST /login - Autenticación`);
  console.log(`   - GET /perfil/:id - Obtener perfil`);
  console.log(`   - GET /validar/:id - Validar usuario`);
  console.log(`   - GET /health - Estado del servicio`);
});
