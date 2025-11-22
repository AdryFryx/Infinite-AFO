CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nivel_global INT DEFAULT 1,          
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE niveles (
    id_nivel INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL                    
);

CREATE TABLE ejercicios (
    id_ejercicio INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,     
    id_nivel INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    modulo VARCHAR(100) NOT NULL,          
    dificultad VARCHAR(50),
    descripcion TEXT,
    imagen VARCHAR(255),
    imagen_caption VARCHAR(255),
    contexto TEXT,
    FOREIGN KEY (id_nivel) REFERENCES niveles(id_nivel)
);

CREATE TABLE preguntas (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_nivel INT NOT NULL,
    id_ejercicio INT NULL,                  
    tipo VARCHAR(20) NOT NULL DEFAULT 'abierta', 
    respuesta_correcta VARCHAR(255) DEFAULT NULL,
    unidad VARCHAR(50) DEFAULT NULL,        
    pista TEXT,                            
    FOREIGN KEY (id_nivel) REFERENCES niveles(id_nivel),
    FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio)
);

CREATE TABLE opciones (
    id_opcion INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT NOT NULL,
    texto_opcion VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) DEFAULT 0,
    FOREIGN KEY (id_pregunta) REFERENCES preguntas(id_pregunta)
);

CREATE TABLE intentos (
    id_intento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_pregunta INT NOT NULL,
    id_opcion INT NULL,                     
    respuesta_usuario VARCHAR(255) NULL,    
    es_correcta TINYINT(1) NOT NULL,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    FOREIGN KEY (id_pregunta) REFERENCES preguntas(id_pregunta),
    FOREIGN KEY (id_opcion) REFERENCES opciones(id_opcion)
);

CREATE TABLE resultados (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_nivel INT NOT NULL,
    id_ejercicio INT NULL,
    puntaje INT NOT NULL,
    total_preguntas INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    FOREIGN KEY (id_nivel) REFERENCES niveles(id_nivel),
    FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio)
);

-- =========================================================
-- Obviamente las tablas van primero, luego los insert into
-- =========================================================

INSERT INTO niveles (nombre, descripcion, orden)
VALUES
("Funciones Cuadráticas", "Ejercicios basados en movimiento parabólico y vértices", 1),
("Funciones Trigonométricas", "Ejercicios basados en ondas senoidales y oscilaciones", 2);


INSERT INTO ejercicios (
    codigo, id_nivel, titulo, modulo, dificultad, descripcion,
    imagen, imagen_caption, contexto
)

VALUES
(
    'quadratic', 
    1, 
    'Movimiento Parabólico - Proyectil',
    'Funciones Cuadráticas',
    'Intermedio',
    'Analiza el movimiento de un proyectil lanzado desde el suelo.',
    './assets/images/parabolic-motion.png',
    'Trayectoria parabólica del proyectil',
    'Un proyectil es lanzado desde el suelo con una velocidad inicial de 50 m/s con un ángulo de 45°. La altura sigue: h(t) = -5t² + 35.35t.'
),
(
    'trigonometric',
    2,
    'Ondas Senoidales - Muelle',
    'Funciones Trigonométricas',
    'Intermedio',
    'Analiza el movimiento armónico simple de un muelle.',
    './assets/images/sine-wave.png',
    'Movimiento oscilatorio del muelle',
    'Un muelle sigue x(t) = 2·sin(πt) + 3·cos(πt), donde x es la posición en cm.'
);

INSERT INTO preguntas 
(id_nivel, id_ejercicio, enunciado, tipo, respuesta_correcta, unidad, pista)
VALUES
(1, 1,
 '¿Cuál es la altura máxima que alcanza el proyectil?',
 'abierta',
 '62.5',
 'metros',
 'Usa la fórmula del vértice de la parábola'),

(1, 1,
 '¿En qué tiempo alcanza la altura máxima?',
 'abierta',
 '3.535',
 'segundos',
 'El tiempo en el vértice es t = -b/(2a)'),

(1, 1,
 '¿A qué distancia cae el proyectil?',
 'abierta',
 '125',
 'metros',
 'Encuentra cuando h(t) = 0 y calcula la distancia horizontal');

INSERT INTO preguntas 
(id_nivel, id_ejercicio, enunciado, tipo, respuesta_correcta, unidad, pista)
VALUES
(2, 2,
 '¿Cuál es la amplitud máxima del movimiento?',
 'abierta',
 '3.606',
 'cm',
 'Calcula √(A² + B²)'),

(2, 2,
 '¿Cuál es el periodo de oscilación?',
 'abierta',
 '2',
 'segundos',
 'Periodo = 2π/ω'),

(2, 2,
 '¿En qué posición se encuentra en t = 0.5 segundos?',
 'abierta',
 '3',
 'cm',
 'Sustituye t=0.5 en la función');