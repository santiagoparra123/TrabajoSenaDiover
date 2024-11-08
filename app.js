const express = require('express'); // Importa el módulo express para crear el servidor  
const path = require('path'); // Importa el módulo path para manejar rutas de archivos  
const colors = require('colors'); // Dependencia para colorear mensajes en la consola  
const session = require('express-session'); // Dependencia para gestionar sesiones  
const mysql = require('mysql2'); // Dependencia para la conexión a la base de datos MySQL  
const bodyParser = require('body-parser'); // Dependencia para procesar los datos enviados desde formularios  
const bcrypt = require('bcrypt');  

const app = express(); // Crea una instancia de la aplicación Express  

// Configuración de EJS como motor de plantillas  
app.set('view engine', 'ejs'); // Define EJS como el motor de vistas  
app.set('views', path.join(__dirname, 'views')); // Define la carpeta de vistas  

// Archivos estáticos (CSS, imágenes, etc.)  
app.use(express.static(path.join(__dirname, 'public'))); // Define la carpeta para archivos estáticos  

// Configuración de bodyParser para manejar datos de formularios  
app.use(bodyParser.urlencoded({ extended: false })); // Habilita el procesamiento de datos del formulario  

// Configuración de sesiones  
app.use(session({  
    secret: '20070603', // Cambia esto a un valor seguro  
    resave: false,  
    saveUninitialized: true,  
    cookie: { secure: false } // Cambia a true si usas HTTPS  
}));  

// Conexión a la base de datos MySQL  
const connection = mysql.createConnection({  
    host: 'localhost',       // Dirección del servidor de la base de datos  
    user: 'root',            // Usuario de la base de datos  
    password: 'santiago',      // Contraseña del usuario  
    database: 'trabajoSena' // Nombre de la base de datos  
});  

// Conectar a la base de datos y manejar errores de conexión  
connection.connect((err) => {  
    if (err) throw err;  
    console.log('Conectado a la base de datos'.magenta); // Mensaje en la consola si la conexión es exitosa  
});  

// Ruta para redirigir a /login al acceder a la raíz  
app.get('/', (req, res) => res.redirect('/login')); // Redirige la raíz al login  

// Ruta para el login (muestra el formulario de login)  
app.get('/login', (req, res) => {  
    console.log("Accediendo a la página de login".green); // Mensaje en verde en la consola  
    res.render('login'); // Renderiza la vista de login  
});  
let nombre 
let data
app.post('/login', (req, res) => {  
    const firstName = req.body.name;  
    const password = req.body.password;  


    // Verificar las credenciales del usuario en la base de datos  
    connection.query(`SELECT * FROM usuarios WHERE primer_nombre = ?`, [firstName], (err, results) => {  
        if (err) throw err;  

        if (results.length > 0) {  
            const user = results[0];  

            // Comparar la contraseña  
            bcrypt.compare(password, user.contraseña, (err, match) => {  
                if (err) throw err;  

                if (match) { 
                    data = user 
                    nombre = user.primer_nombre; // Guardar el primer nombre en la sesión  
                    console.log(nombre)
                    return res.redirect('/bienvenido'); // Redirigir a la página de bienvenida  
                } else {  
                    res.status(401).send('Contraseña incorrecta');  
                }  
            });  
        } else {  
            res.status(404).send('Usuario no encontrado');  
        }  
    });  
});  

// Ruta para el registro (muestra el formulario de registro)  
app.get('/formulario', (req, res) => {  
    console.log("Accediendo a la página de registro".yellow); // Mensaje en amarillo en la consola  
    res.render('formulario'); // Renderiza la vista de registro  
});  

// Ruta para procesar el registro de un nuevo usuario  
app.post('/formulario', (req, res) => {  
    // Procesa los datos recibidos del formulario de registro  
    const { firstName, secondName, firstLastName, secondLastName, phone, dob, rh, address, email, city, id, occupation, password } = req.body; // Añade `password` aquí  

    // Hash de la contraseña  
    bcrypt.hash(password, 10, (err, hash) => {  
        if (err) throw err;  

        // Inserción de datos en la base de datos  
        const newUser = {  
            primer_nombre: firstName,  
            segundo_nombre: secondName,  
            primer_apellido: firstLastName,  
            segundo_apellido: secondLastName,  
            telefono: phone,  
            fecha_nacimiento: dob,  
            rh: rh,  
            direccion: address,  
            correo: email,  
            ciudad: city,  
            identificacion: id,  
            ocupacion: occupation,  
            contraseña: hash // Almacena el hash en la base de datos  
        };  

        // Inserta el nuevo usuario en la base de datos  
        connection.query('INSERT INTO usuarios SET ?', newUser, (err, results) => {  
            if (err) throw err; // Maneja errores de inserción  
            console.log("Nuevo usuario registrado: ", newUser); // Mensaje en la consola con los datos del nuevo usuario  
            res.redirect('/login'); // Redirige al usuario a la página de login después de registrarse  
        });  
    });  
});  

app.get('/bienvenido', (req, res) => {  
    // Asigna el nombre de usuario desde la sesión o usa 'Usuario' como valor por defecto  
    const user = { firstName: data.primer_nombre || 'usuario' };  

    // Muestra un mensaje en la consola indicando el acceso a la página de bienvenida  
    console.log(`Accediendo a la página de bienvenida para ${user.firstName}`.cyan); // Mensaje en cian en la consola  
    
    // Renderiza la vista 'welcome' pasando el nombre del usuario a la vista  
    res.render('bienvenido', { userName: user.firstName });  
});  

// Ruta para la página de datos personales  
app.get('/profile', (req, res) => {  

    // Suponemos que los datos del usuario vienen en req.body o req.query  
    const {   
        firstName,   
        secondName,   
        firstLastName,   
        secondLastName,   
        phone,   
        dob,   
        rh,   
        address,   
        email,   
        city,   
        id,   
        occupation   
    } = req.body; // o req.query dependiendo de cómo estés enviando los datos  

    const user = {  
        primer_nombre: firstName,  
        segundo_nombre: secondName,  
        primer_apellido: firstLastName,  
        segundo_apellido: secondLastName,  
        telefono: phone,  
        fecha_nacimiento: dob,  
        rh: rh,  
        direccion: address,  
        correo: email,  
        ciudad: city,  
        identificacion: id,  
        ocupacion: occupation  
    };  

    // Definición de la consulta con formato de fecha en birth_date
    const query = `SELECT *, DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') AS birth FROM usuarios WHERE fecha_nacimiento = ?`;

    // Ejecutar la consulta para obtener los datos del usuario
    connection.query(query, [data.fecha_nacimiento], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            data = results[0]; // Actualizamos `data` con los resultados de la consulta
        }

        // Renderiza la vista del perfil con los datos actualizados
        res.render('profile', { user: data });
    });
});



// Inicialización del servidor  
app.listen(3000, () => console.log('Server running on http://localhost:3000'.blue)); // Inicia el servidor en el puerto 3000 y muestra un mensaje en azul en la consola