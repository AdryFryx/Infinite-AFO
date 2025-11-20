CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ususario varchar(50) not null,
    correo varchar(100) not null unique,
    contraseña varchar(255) not null,
    nivel varchar(30) not null
);

CREATE TABLE niveles(
    id_nivel INT AUTO_INCREMENT PRIMARY KEY,
    nombre varchar(50) NOT NULL,
    descripcion TEXT,
    orden INT NOT NULL
);

CREATE TABLE preguntas (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    id_nivel INT NOT NULL,
    enunciado TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'multi',
    activa TINYINT(1) DEFAULT 1,
    FOREIGN KEY (id_nivel) REFERENCES niveles(id_nivel)
);

CREATE TABLE opciones(
    id_opcion INT AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT NOT NULL,
    texto_opcion VARCHAR(255) NOT NULL,
    es_correcta TINYINT(1) DEFAULT 0,
    FOREIGN KEY (id_pregunta) REFERENCES preguntas(id_pregunta)
);

CREATE TABLE intentos(
    id_inteto INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_pregunta INT NOT NULL,
    id_opcion INT NOT NULL,
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
    puntaje INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id),
    FOREIGN KEY (id_nivel) REFERENCES niveles(id_nivel)
);

