# Despliegue en Render - Microservicio de Usuarios

## Configuración para Render

Este microservicio está configurado para desplegarse en Render.com con las siguientes características:

### Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el dashboard de Render:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=tu-clave-secreta-jwt-aqui
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY=tu-private-key
FIREBASE_CLIENT_EMAIL=tu-client-email
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_CLIENT_X509_CERT_URL=tu-cert-url
```

### Endpoints Disponibles

- `GET /api/health` - Health check para Render
- `POST /api/registro` - Registro de usuarios
- `POST /api/login` - Login de usuarios
- `GET /api/perfil/:id` - Obtener perfil de usuario
- `GET /api/validar/:id` - Validar existencia de usuario

### Configuración de Render

1. Conecta tu repositorio de GitHub
2. Selecciona el directorio `microservicios/usuarios`
3. Usa las siguientes configuraciones:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### Notas Importantes

- El servidor se inicia automáticamente en el puerto asignado por Render
- Firebase se configura automáticamente si las variables de entorno están presentes
- Si Firebase no está configurado, el servicio funciona en modo memoria para desarrollo
- El health check está disponible en `/api/health` para monitoreo de Render
