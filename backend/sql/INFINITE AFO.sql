CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    nivel VARCHAR(30) NOT NULL
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
    titulo VARCHAR(255) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    dificultad VARCHAR(50) NOT NULL,
    descripcion TEXT,
    imagen VARCHAR(255),
    imagen_caption VARCHAR(255),
    contexto TEXT
);

CREATE TABLE preguntas_ejercicio (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_ejercicio INT NOT NULL,
    enunciado TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'numeric',
    respuesta_correcta VARCHAR(100) NOT NULL,
    unidad VARCHAR(50),
    pista TEXT,
    FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio)
);

CREATE TABLE opciones (
    id_opcion INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT NOT NULL,
    texto_opcion VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) DEFAULT 0,
    FOREIGN KEY (id_pregunta) REFERENCES preguntas_ejercicio(id_pregunta)
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
    FOREIGN KEY (id_pregunta) REFERENCES preguntas_ejercicio(id_pregunta),
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
    codigo,
    titulo,
    modulo,
    dificultad,
    descripcion,
    imagen,
    imagen_caption,
    contexto
)
VALUES
(
    'quadratic', 
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
    'Ondas Senoidales - Muelle',
    'Funciones Trigonométricas',
    'Intermedio',
    'Analiza el movimiento armónico simple de un muelle.',
    './assets/images/sine-wave.png',
    'Movimiento oscilatorio del muelle',
    'Un muelle sigue x(t) = 2·sin(πt) + 3·cos(πt), donde x es la posición en cm.'
);

INSERT INTO preguntas_ejercicio 
(id_ejercicio, enunciado, tipo, respuesta_correcta, unidad, pista)
VALUES
(1, '¿Cuál es la altura máxima que alcanza el proyectil?', 'numeric', '62.5', 'metros', 'Usa la fórmula del vértice de la parábola'),
(1, '¿En qué tiempo alcanza la altura máxima?', 'numeric', '3.535', 'segundos', 'El tiempo en el vértice es t = -b/(2a)'),
(1, '¿A qué distancia cae el proyectil?', 'numeric', '125', 'metros', 'Encuentra cuando h(t) = 0 y calcula la distancia horizontal');

INSERT INTO preguntas_ejercicio 
(id_ejercicio, enunciado, tipo, respuesta_correcta, unidad, pista)
VALUES
(2, '¿Cuál es la amplitud máxima del movimiento?', 'numeric', '3.606', 'cm', 'Calcula √(A² + B²) para la amplitud'),
(2, '¿Cuál es el periodo de oscilación?', 'numeric', '2', 'segundos', 'Periodo = 2π/ω'),
(2, '¿En qué posición se encuentra en t = 0.5 segundos?', 'numeric', '3', 'cm', 'Sustituye t = 0.5 en la función');