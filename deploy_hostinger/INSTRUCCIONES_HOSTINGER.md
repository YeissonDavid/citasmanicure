# 🚀 Guía de Despliegue en Hostinger - Sistema de Citas Manicure

Esta carpeta contiene todo lo necesario para desplegar tu aplicación en **Hostinger** con todos los protocolos de seguridad, optimización de velocidad y compatibilidad total con React y PHP.

---

## 📁 Archivos listos en esta carpeta (`deploy_hostinger`):
1. **`public_html_hostinger.zip`**: Archivo comprimido con la web y la API para subir directamente al Administrador de Archivos de Hostinger con un solo clic.
2. **`public_html/`**: La misma estructura descomprimida por si prefieres subir archivo por archivo vía FTP o File Manager.
3. **`database.sql`**: Script SQL para importar en phpMyAdmin de Hostinger (crea tablas, índices y el usuario administrador por defecto).

---

## 🛠️ Paso a Paso para Desplegar en Hostinger

### PASO 1: Crear la Base de Datos en Hostinger
1. Entra a tu panel de control de Hostinger (**hPanel**).
2. En la sección lateral izquierda, ve a **Bases de Datos** > **Bases de datos MySQL**.
3. Crea una nueva base de datos completando:
   - **Nombre de la base de datos:** (ej. `u123456789_citas`)
   - **Usuario MySQL:** (ej. `u123456789_admin`)
   - **Contraseña:** (Crea una contraseña segura y guárdala)
4. Haz clic en **Crear**.

---

### PASO 2: Importar las Tablas en phpMyAdmin
1. En la misma pantalla de bases de datos de Hostinger, haz clic en el botón **Entrar a phpMyAdmin** de la base de datos recién creada.
2. En el menú superior de phpMyAdmin, haz clic en la pestaña **Importar**.
3. Selecciona el archivo **`database.sql`** ubicado en esta carpeta `deploy_hostinger`.
4. Haz clic en el botón **Importar** (o **Continuar**) al final de la página.
5. ¡Listo! Se habrán creado las tablas `users`, `clients`, `appointments` y `settings` junto al usuario administrador.

---

### PASO 3: Subir los Archivos al Administrador de Archivos
1. En tu **hPanel** de Hostinger, ve a **Archivos** > **Administrador de Archivos**.
2. Entra a la carpeta raíz de tu dominio: **`public_html`**.
3. Haz clic en el icono de **Subir** (flecha hacia arriba en la esquina superior derecha).
4. Sube el archivo **`public_html_hostinger.zip`**.
5. Una vez subido, haz clic derecho sobre el archivo zip y selecciona **Extraer** (Extract) directamente en `public_html`.
   *(Asegúrate de que los archivos `index.html`, `favicon.svg`, `.htaccess`, carpeta `assets` y carpeta `api` queden directamente dentro de `public_html`)*.
6. Ya puedes eliminar el archivo `.zip` de Hostinger para ahorrar espacio.

---

### PASO 4: Configurar la Conexión a la Base de Datos
1. Dentro del Administrador de Archivos en `public_html/api/`, abre el archivo **`config.php`**.
2. Busca las líneas 17 a 20:
   ```php
   define('DB_HOST', 'localhost'); // En Hostinger siempre es localhost
   define('DB_USER', 'tu_usuario_creado_en_paso_1');
   define('DB_PASS', 'tu_contraseña_creada_en_paso_1');
   define('DB_NAME', 'tu_base_de_datos_creada_en_paso_1');
   ```
3. Reemplaza con los datos que creaste en el **PASO 1**.
4. Haz clic en **Guardar y cerrar**.

---

### PASO 5: Forzar SSL / HTTPS en Hostinger
1. En tu hPanel, ve a **Seguridad** > **SSL**.
2. Asegúrate de que el certificado SSL gratuito (Let's Encrypt) esté instalado y activo en tu dominio.
3. El archivo `.htaccess` configurado ya se encarga automáticamente de redirigir todo el tráfico no seguro `http://` hacia `https://`.

---

## 🛡️ Protocolos de Seguridad Implementados
El despliegue cuenta con las mejores prácticas de seguridad para hosting compartido:

- ✅ **Protección Anti-Clickjacking:** Cabecera `X-Frame-Options: SAMEORIGIN` previene ataques en iframes invisibles.
- ✅ **Protección Anti-Sniffing:** Cabecera `X-Content-Type-Options: nosniff` fuerza tipos MIME estrictos.
- ✅ **Prevención de Inyección SQL:** Todas las consultas usan sentencias preparadas nativas con PDO (`PDO::ATTR_EMULATE_PREPARES => false`).
- ✅ **Sanitización de Entradas:** Filtrado de entradas vía `htmlspecialchars` y tipado estricto contra inyecciones XSS.
- ✅ **Bloqueo de Archivos Confidenciales:** Reglas en `.htaccess` impiden el acceso HTTP a `config.php`, `database.sql`, archivos `.env`, `.git`, `.log` y archivos ocultos.
- ✅ **Desactivación de Listado de Directorios:** `Options -Indexes` bloquea la visualización pública de las carpetas.
- ✅ **Soporte Completo para React Router (SPA):** Redirección interna a `index.html` para que rutas como `/admin/dashboard` y `/admin/login` funcionen sin arrojar error 404 al recargar.
- ✅ **Preservación de Tokens JWT en LiteSpeed/Apache:** Regla `RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]` para evitar que Hostinger elimine las credenciales en peticiones AJAX.

---

## 🔑 Credenciales de Acceso Administrador por Defecto
- **URL Admin:** `https://tudominio.com/admin/login`
- **Usuario:** `admin`
- **Contraseña:** `admin123`
*(Recomendamos cambiar la contraseña una vez ingreses al sistema).*

---
¡Tu sistema de citas ya está 100% listo para producción! 💅✨
