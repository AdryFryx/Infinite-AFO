from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection
import bcrypt
import pymysql.cursors
import random
import math

app = Flask(__name__)
CORS(app)


# =========================================================
#  REGISTRO
# =========================================================
@app.post("/api/register")
def register():
    data = request.json or {}
    nombre_usuario = data.get("nombre_usuario")
    correo = data.get("correo")
    contraseña = data.get("contraseña")

    # Por defecto todos parten en nivel "basico"
    nivel = "basico"

    if not nombre_usuario or not correo or not contraseña:
        return jsonify({"error": "Faltan datos (nombre_usuario, correo, contraseña)"}), 400

    hashed = bcrypt.hashpw(
        contraseña.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO usuario (nombre_usuario, correo, contraseña, nivel)
                VALUES (%s, %s, %s, %s)
                """,
                (nombre_usuario, correo, hashed, nivel)
            )
        conn.commit()
    except Exception as e:
        print("Error en register:", e)
        return jsonify({"error": "No se pudo registrar. ¿Correo ya registrado?"}), 400
    finally:
        conn.close()

    return jsonify({"message": "Usuario registrado correctamente"}), 201


# =========================================================
#  LOGIN
# =========================================================
@app.post("/api/login")
def login():
    data = request.json or {}

    identifier = data.get("username")   # puede ser nombre_usuario o correo
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Faltan datos (username, password)"}), 400

    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, nombre_usuario, correo, contraseña, nivel
                FROM usuario
                WHERE nombre_usuario = %s OR correo = %s
                """,
                (identifier, identifier)
            )
            user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        stored_hash = user["contraseña"]

        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return jsonify({"error": "Contraseña incorrecta"}), 401

        return jsonify({
            "message": "Login exitoso",
            "user": {
                "id": user["id"],
                "nombre_usuario": user["nombre_usuario"],
                "correo": user["correo"],
                "nivel": user["nivel"]
            }
        }), 200

    finally:
        conn.close()


# =========================================================
#  GENERADOR DE EJERCICIOS INFINITOS
# =========================================================
@app.get("/api/exercise")
def get_exercise():
    module = request.args.get("module", "quadratic")      # 'quadratic' o 'trigonometric'
    nivel = request.args.get("nivel", "intermedio")       # 'basico', 'intermedio', 'avanzado'
    nivel = nivel.lower()

    # ================================
    #    FUNCIONES CUADRÁTICAS
    # ================================
    if module == "quadratic":

        # ---------- NIVEL BÁSICO ----------
        if nivel == "basico":
            a = round(random.uniform(3, 5), 2)
            b = round(random.uniform(10, 30), 2)

            # h(t) = -a t² + b t
            t_vertex = round(-b / (2 * -a), 3)
            h_max = round(-(a * t_vertex ** 2) + b * t_vertex, 3)

            ejercicio = {
                "title": "Proyectil - Nivel Básico",
                "module": "Funciones Cuadráticas",
                "difficulty": "Básico",
                "description": "Analiza un proyectil que sigue una trayectoria parabólica simple.",
                "image": "./assets/images/parabolic-motion.png",
                "imageCaption": "Trayectoria parabólica del proyectil",
                "context": f"La altura del proyectil está dada por h(t) = -{a}t² + {b}t.",
                "questions": [
                    {
                        "text": "¿Cuál es la altura máxima que alcanza el proyectil?",
                        "answer": h_max,
                        "unit": "m",
                        "hint": "Usa la altura en el vértice de la parábola."
                    },
                    {
                        "text": "¿En qué tiempo alcanza la altura máxima?",
                        "answer": t_vertex,
                        "unit": "s",
                        "hint": "El tiempo del vértice es t = -b/(2a)."
                    }
                ]
            }
            return jsonify(ejercicio)

        # ---------- NIVEL INTERMEDIO ----------
        if nivel == "intermedio":
            a = round(random.uniform(4, 6), 2)
            b = round(random.uniform(20, 50), 2)

            # h(t) = -a t² + b t
            t_vertex = round(-b / (2 * -a), 3)
            h_max = round(-(a * t_vertex ** 2) + b * t_vertex, 3)
            # tiempo en que vuelve al suelo (t != 0) => h(t)=0 => t = b/a
            t_impact = round(b / a, 3)

            ejercicio = {
                "title": "Proyectil - Nivel Intermedio",
                "module": "Funciones Cuadráticas",
                "difficulty": "Intermedio",
                "description": "Analiza el vértice y el tiempo de vuelo completo del proyectil.",
                "image": "./assets/images/parabolic-motion.png",
                "imageCaption": "Movimiento parabólico",
                "context": f"La altura del proyectil está dada por h(t) = -{a}t² + {b}t.",
                "questions": [
                    {
                        "text": "¿Cuál es la altura máxima que alcanza el proyectil?",
                        "answer": h_max,
                        "unit": "m",
                        "hint": "Evalúa h(t) en el vértice."
                    },
                    {
                        "text": "¿En qué tiempo alcanza la altura máxima?",
                        "answer": t_vertex,
                        "unit": "s",
                        "hint": "Usa t = -b/(2a)."
                    },
                    {
                        "text": "¿En qué tiempo vuelve el proyectil al suelo (h(t)=0)?",
                        "answer": t_impact,
                        "unit": "s",
                        "hint": "Factoriza h(t) o usa la fórmula general."
                    }
                ]
            }
            return jsonify(ejercicio)

        # ---------- NIVEL AVANZADO ----------
        if nivel == "avanzado":
            a = round(random.uniform(3, 6), 2)
            b = round(random.uniform(20, 60), 2)
            c = round(random.uniform(5, 20), 2)

            # h(t) = -a t² + b t + c
            A = -a
            B = b
            C = c

            discriminante = B ** 2 - 4 * A * C  # B² - 4AC
            if discriminante < 0:
                discriminante = abs(discriminante)
            raiz = round((-B + math.sqrt(discriminante)) / (2 * A), 3)

            t_vertex = round(-B / (2 * A), 3)
            h_max = round(A * t_vertex ** 2 + B * t_vertex + C, 3)

            ejercicio = {
                "title": "Proyectil - Nivel Avanzado",
                "module": "Funciones Cuadráticas",
                "difficulty": "Avanzado",
                "description": "Ecuación cuadrática completa con altura inicial distinta de cero.",
                "image": "./assets/images/parabolic-motion.png",
                "imageCaption": "Trayectoria con altura inicial",
                "context": f"La altura del proyectil está dada por h(t) = -{a}t² + {b}t + {c}.",
                "questions": [
                    {
                        "text": "¿Cuál es la altura máxima que alcanza el proyectil?",
                        "answer": h_max,
                        "unit": "m",
                        "hint": "Calcula el vértice de la función cuadrática."
                    },
                    {
                        "text": "¿Cuál es uno de los tiempos donde h(t)=0?",
                        "answer": raiz,
                        "unit": "s",
                        "hint": "Aplica la fórmula general para ecuaciones cuadráticas."
                    },
                    {
                        "text": "¿Cuál es el discriminante de la ecuación?",
                        "answer": round(discriminante, 3),
                        "unit": "",
                        "hint": "b² - 4ac (considerando la forma estándar Ax²+Bx+C)."
                    }
                ]
            }
            return jsonify(ejercicio)

    # ================================
    #    FUNCIONES TRIGONOMÉTRICAS
    # ================================
    if module == "trigonometric":

        # ---------- NIVEL BÁSICO ----------
        if nivel == "basico":
            A = random.randint(1, 3)
            w = random.choice([math.pi, 2 * math.pi])

            ejercicio = {
                "title": "Oscilación Simple - Básico",
                "module": "Funciones Trigonométricas",
                "difficulty": "Básico",
                "description": "Movimiento armónico simple con función seno.",
                "image": "./assets/images/sine-wave.png",
                "imageCaption": "Onda senoidal simple",
                "context": f"La posición del sistema está dada por x(t) = {A}·sin({round(w, 3)}t).",
                "questions": [
                    {
                        "text": "¿Cuál es la amplitud del movimiento?",
                        "answer": A,
                        "unit": "cm",
                        "hint": "Observa el coeficiente delante del seno."
                    },
                    {
                        "text": "¿Cuál es el periodo de la oscilación?",
                        "answer": round(2 * math.pi / w, 3),
                        "unit": "s",
                        "hint": "Usa T = 2π / ω."
                    }
                ]
            }
            return jsonify(ejercicio)

        # ---------- NIVEL INTERMEDIO ----------
        if nivel == "intermedio":
            A = random.randint(1, 3)
            B = random.randint(1, 3)
            w = random.choice([math.pi, 2 * math.pi])
            t_eval = round(random.uniform(0.3, 2.0), 2)

            amplitude = round(math.sqrt(A ** 2 + B ** 2), 3)
            period = round(2 * math.pi / w, 3)
            value = round(A * math.sin(w * t_eval) + B * math.cos(w * t_eval), 3)

            ejercicio = {
                "title": "Oscilación Compuesta - Intermedio",
                "module": "Funciones Trigonométricas",
                "difficulty": "Intermedio",
                "description": "Combinación de seno y coseno con la misma frecuencia angular.",
                "image": "./assets/images/sine-wave.png",
                "imageCaption": "Onda compuesta",
                "context": f"x(t) = {A}·sin({round(w, 3)}t) + {B}·cos({round(w, 3)}t).",
                "questions": [
                    {
                        "text": "¿Cuál es la amplitud combinada del movimiento?",
                        "answer": amplitude,
                        "unit": "cm",
                        "hint": "Amplitud = √(A² + B²)."
                    },
                    {
                        "text": "¿Cuál es el periodo del movimiento?",
                        "answer": period,
                        "unit": "s",
                        "hint": "T = 2π / ω."
                    },
                    {
                        "text": f"¿Cuál es la posición en t = {t_eval} segundos?",
                        "answer": value,
                        "unit": "cm",
                        "hint": "Evalúa x(t) en ese instante."
                    }
                ]
            }
            return jsonify(ejercicio)

        # ---------- NIVEL AVANZADO ----------
        if nivel == "avanzado":
            A = random.randint(1, 3)
            B = random.randint(0, 3)
            w = random.choice([math.pi, 2 * math.pi])
            phi = random.choice([0, math.pi / 4, math.pi / 2])
            t_eval = round(random.uniform(0.3, 2.0), 2)

            amplitude = A
            period = round(2 * math.pi / w, 3)
            value = round(A * math.sin(w * t_eval + phi) + B, 3)

            ejercicio = {
                "title": "Oscilación con Desfase – Avanzado",
                "module": "Funciones Trigonométricas",
                "difficulty": "Avanzado",
                "description": "Movimiento armónico con desfase y traslación vertical.",
                "image": "./assets/images/sine-wave.png",
                "imageCaption": "Onda con desfase",
                "context": f"x(t) = {A}·sin({round(w, 3)}t + {round(phi, 3)}) + {B}.",
                "questions": [
                    {
                        "text": "¿Cuál es la amplitud del movimiento?",
                        "answer": amplitude,
                        "unit": "cm",
                        "hint": "La amplitud es el coeficiente A."
                    },
                    {
                        "text": "¿Cuál es el periodo?",
                        "answer": period,
                        "unit": "s",
                        "hint": "Depende solo de ω: T = 2π/ω."
                    },
                    {
                        "text": "¿Cuál es el desfase (fase inicial)?",
                        "answer": round(phi, 3),
                        "unit": "rad",
                        "hint": "El ángulo dentro del seno."
                    },
                    {
                        "text": f"¿Cuál es la posición en t = {t_eval} segundos?",
                        "answer": value,
                        "unit": "cm",
                        "hint": "Evalúa la función completa en ese instante."
                    }
                ]
            }
            return jsonify(ejercicio)

    return jsonify({"error": "Módulo o nivel no válido"}), 400


# =========================================================
#  GUARDAR RESULTADO DE UN EJERCICIO
# =========================================================
@app.post("/api/exercise-result")
def save_exercise_result():
    data = request.json or {}

    id_usuario = data.get("id_usuario")
    id_nivel = data.get("id_nivel")           # 1: cuadrática, 2: trigonométrica
    id_ejercicio = data.get("id_ejercicio")   # puede ser None
    puntaje = data.get("puntaje")
    total_preguntas = data.get("total_preguntas")

    if not all([id_usuario, id_nivel, puntaje, total_preguntas]):
        return jsonify({"error": "Faltan datos para guardar el resultado"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO resultados (id_usuario, id_nivel, id_ejercicio, puntaje, total_preguntas)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (id_usuario, id_nivel, id_ejercicio, puntaje, total_preguntas)
            )
        conn.commit()
    except Exception as e:
        print("Error guardando resultado:", e)
        return jsonify({"error": "No se pudo guardar el resultado"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Resultado guardado correctamente"}), 201


# =========================================================
#  RESULTADOS POR USUARIO (DASHBOARD / HISTORIAL)
# =========================================================
@app.get("/api/user-results/<int:user_id>")
def get_user_results(user_id):
    conn = get_connection()
    results = []

    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(
                """
                SELECT r.id_resultado,
                       r.puntaje,
                       r.total_preguntas,
                       r.fecha,
                       n.nombre AS nombre_nivel,
                       e.titulo AS titulo_ejercicio
                FROM resultados r
                JOIN niveles n ON r.id_nivel = n.id_nivel
                LEFT JOIN ejercicios e ON r.id_ejercicio = e.id_ejercicio
                WHERE r.id_usuario = %s
                ORDER BY r.fecha DESC
                """,
                (user_id,)
            )
            results = cursor.fetchall()
    finally:
        conn.close()

    return jsonify(results)


if __name__ == "__main__":
    # host 0.0.0.0 para que la app sea visible en la red local si quieres
    app.run(host="0.0.0.0", port=5000, debug=True)
