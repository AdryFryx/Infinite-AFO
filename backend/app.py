from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection
import bcrypt
import pymysql.cursors
import random
import math

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------
#  HELPER: obtener conexión con cursor de diccionario
# ---------------------------------------------------
def get_dict_conn():
    conn = get_connection()
    # Muy importante: DictCursor para poder usar user["id"]
    return conn, conn.cursor(pymysql.cursors.DictCursor)


# ==========================
#   REGISTRO
# ==========================
@app.post("/api/register")
def register():
    data = request.json or {}
    nombre_usuario = data.get("nombre_usuario")
    correo = data.get("correo")
    contraseña = data.get("contraseña")

    nivel = "basico"

    if not nombre_usuario or not correo or not contraseña:
        return jsonify({"error": "Faltan datos (nombre_usuario, correo, contraseña)"}), 400

    hashed = bcrypt.hashpw(
        contraseña.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    conn, cursor = get_dict_conn()
    try:
        cursor.execute(
            """
            INSERT INTO usuario (nombre_usuario, correo, contrasena, nivel)
            VALUES (%s, %s, %s, %s)
            """,
            (nombre_usuario, correo, hashed, nivel)
        )
        conn.commit()
    except pymysql.err.IntegrityError as e:
        # 1062 = valor duplicado (correo o usuario)
        if e.args[0] == 1062:
            return jsonify({"error": "El correo o nombre de usuario ya está registrado"}), 400
        print("Error de integridad en register:", e)
        return jsonify({"error": "Error de integridad en el registro"}), 400
    except Exception as e:
        print("Error general en register:", e)
        return jsonify({"error": "Error al registrar el usuario en la base de datos"}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Usuario registrado correctamente"}), 201


# ==========================
#   LOGIN
# ==========================
@app.post("/api/login")
def login():
    data = request.json or {}

    identifier = data.get("username")   # puede ser nombre_usuario o correo
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Faltan datos (username, password)"}), 400

    conn, cursor = get_dict_conn()

    try:
        cursor.execute(
            """
            SELECT id, nombre_usuario, correo, contrasena, nivel
            FROM usuario
            WHERE nombre_usuario = %s OR correo = %s
            """,
            (identifier, identifier)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        stored_hash = user["contrasena"]

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
        cursor.close()
        conn.close()


# ==========================
#   HELPERS PARA NIVELES / EJERCICIOS
# ==========================
def obtener_id_nivel_por_modulo(modulo: str):
    """
    módulo puede venir como:
    - 'quadratic' / 'Funciones Cuadráticas'
    - 'trigonometric' / 'Funciones Trigonométricas'
    """
    conn, cursor = get_dict_conn()
    try:
        if modulo in ("quadratic", "Funciones Cuadráticas"):
            nombre_nivel = "Funciones Cuadráticas"
        elif modulo in ("trigonometric", "Funciones Trigonométricas"):
            nombre_nivel = "Funciones Trigonométricas"
        else:
            return None

        cursor.execute(
            "SELECT id_nivel FROM niveles WHERE nombre = %s LIMIT 1",
            (nombre_nivel,)
        )
        row = cursor.fetchone()
        return row["id_nivel"] if row else None
    finally:
        cursor.close()
        conn.close()


def obtener_id_ejercicio_por_codigo(codigo: str):
    """
    Busca en la tabla 'ejercicios' según el campo 'codigo' (quadratic/trigonometric).
    Si no lo encuentra, devuelve None (se guarda resultado sin ejercicio específico).
    """
    conn, cursor = get_dict_conn()
    try:
        cursor.execute(
            "SELECT id_ejercicio FROM ejercicios WHERE codigo = %s LIMIT 1",
            (codigo,)
        )
        row = cursor.fetchone()
        return row["id_ejercicio"] if row else None
    finally:
        cursor.close()
        conn.close()


# ==========================
#   GENERADOR DE EJERCICIOS
# ==========================
@app.get("/api/exercise")
def get_exercise():

    import random, math

    module = request.args.get("module", "quadratic")
    nivel = request.args.get("nivel", "basico")

    # ============================================================
    #                  FUNCIONES CUADRÁTICAS
    # ============================================================
    if module == "quadratic":

        # -------------------- NIVEL BÁSICO --------------------
        if nivel == "basico":
            a = round(random.uniform(3, 5), 2)
            b = round(random.uniform(10, 30), 2)

            t_vertex = round(b / (2 * a), 3)
            h_max = round(-(a * t_vertex ** 2) + b * t_vertex, 3)
            t_impact = round(b / a, 3)
            t_mid = round(t_impact / 2, 3)
            h_t1 = round(-(a * 1 ** 2) + b * 1, 3)
            h_mid = round(-(a * t_mid ** 2) + b * t_mid, 3)

            contexts = [
                "Un estudiante lanza una pelota verticalmente en el patio del colegio. La función que describe la altura es:",
                "En una clase de física, se realiza un experimento donde se lanza una pelota hacia arriba:",
                "Un niño suelta una pelota con un impulso inicial y la trayectoria queda modelada por:",
                "Un balón de básquet es lanzado verticalmente en un entrenamiento según la función:",
                "Una cápsula ligera es lanzada en un laboratorio escolar:",
            ]

            context = f"{random.choice(contexts)}  h(t) = -{a}t² + {b}t"

            return jsonify({
                "title": "Lanzamiento Vertical – Básico",
                "module": "Funciones Cuadráticas",
                "difficulty": "Básico",
                "context": context,
                "questions": [
                    {"text": "¿Cuál es la altura máxima?", "answer": h_max, "unit": "m"},
                    {"text": "¿Tiempo en el que alcanza la altura máxima?", "answer": t_vertex, "unit": "s"},
                    {"text": "¿Cuándo vuelve al suelo?", "answer": t_impact, "unit": "s"},
                    {"text": "¿Altura a los 1 segundo?", "answer": h_t1, "unit": "m"},
                    {"text": "¿Altura a la mitad del tiempo total?", "answer": h_mid, "unit": "m"},
                ]
            })


        # -------------------- NIVEL INTERMEDIO --------------------
        if nivel == "intermedio":
            a = round(random.uniform(4, 6), 2)
            b = round(random.uniform(30, 60), 2)

            t_vertex = round(b / (2 * a), 3)
            h_max = round(-(a * t_vertex ** 2) + b * t_vertex, 3)
            t_impact = round(b / a, 3)
            t_mid = round(t_impact / 2, 3)

            contexts = [
                "Durante un festival nocturno, un fuego artificial asciende siguiendo la trayectoria:",
                "Un cohete escolar en una feria científica es lanzado verticalmente. Su altura se describe por:",
                "Una señal de emergencia es disparada desde un barco siguiendo la función:",
                "Un dron inicia un ascenso rápido en trayectoria parabólica dada por:",
                "Una esfera metálica lanzada en un laboratorio sigue la ecuación:"
            ]

            context = f"{random.choice(contexts)} h(t) = -{a}t² + {b}t"

            return jsonify({
                "title": "Fuegos Artificiales – Intermedio",
                "module": "Funciones Cuadráticas",
                "difficulty": "Intermedio",
                "context": context,
                "questions": [
                    {"text": "¿Altura máxima?", "answer": h_max, "unit": "m"},
                    {"text": "¿Cuándo ocurre la altura máxima?", "answer": t_vertex, "unit": "s"},
                    {"text": "¿Cuándo toca el suelo?", "answer": t_impact, "unit": "s"},
                    {"text": "¿Altura a la mitad del vuelo?", "answer": round(-(a * t_mid ** 2) + b * t_mid, 3), "unit": "m"},
                    {"text": "¿Altura a los 1 segundo?", "answer": round(-(a * 1 ** 2) + b * 1, 3), "unit": "m"},
                ]
            })


        # -------------------- NIVEL AVANZADO --------------------
        if nivel == "avanzado":
            a = round(random.uniform(2, 5), 2)
            b = round(random.uniform(20, 60), 2)
            c = round(random.uniform(5, 20), 2)

            A = -a
            B = b
            C = c

            D = round(B ** 2 - 4 * A * C, 3)
            sqrtD = math.sqrt(abs(D))

            t1 = round((-B + sqrtD) / (2 * A), 3)
            t2 = round((-B - sqrtD) / (2 * A), 3)
            t_positive = max(t1, t2)

            t_vertex = round(-B / (2 * A), 3)
            h_max = round(A * t_vertex ** 2 + B * t_vertex + C, 3)

            contexts = [
                "Un ingeniero evalúa el arco parabólico de un túnel descrito por:",
                "El lanzamiento de una catapulta moderna sigue la trayectoria:",
                "Una antena parabólica de comunicaciones tiene la forma:",
                "La estructura de un puente incorpora una parábola modelada por:",
                "Un simulador balístico militar usa la función:"
            ]

            context = f"{random.choice(contexts)} h(t) = -{a}t² + {b}t + {c}"

            return jsonify({
                "title": "Parábola Aplicada – Avanzado",
                "module": "Funciones Cuadráticas",
                "difficulty": "Avanzado",
                "context": context,
                "questions": [
                    {"text": "¿Altura máxima?", "answer": h_max, "unit": "m"},
                    {"text": "¿Discriminante?", "answer": D, "unit": ""},
                    {"text": "¿Raíz positiva?", "answer": t_positive, "unit": "s"},
                    {"text": "¿Raíz negativa?", "answer": min(t1, t2), "unit": "s"},
                    {"text": "¿Altura inicial?", "answer": c, "unit": "m"},
                ]
            })

    # ============================================================
    #             FUNCIONES TRIGONOMÉTRICAS
    # ============================================================
    if module == "trigonometric":

        # -------------------- BÁSICO --------------------
        if nivel == "basico":
            A = random.randint(1, 3)
            w = random.choice([math.pi, 2 * math.pi])
            T = round(2 * math.pi / w, 3)

            contexts = [
                "Un péndulo pequeño oscila suavemente y su movimiento se describe con:",
                "La vibración de una cuerda de guitarra se modela mediante:",
                "Un resorte comprimido libera energía siguiendo:",
                "Una boya en el mar sube y baja según:",
                "Una brújula digital registra pequeñas oscilaciones descritas por:"
            ]

            context = f"{random.choice(contexts)} x(t) = {A}·sin({round(w,3)}t)"

            return jsonify({
                "title": "Oscilación Simple – Básico",
                "module": "Funciones Trigonométricas",
                "difficulty": "Básico",
                "context": context,
                "questions": [
                    {"text": "¿Amplitud?", "answer": A, "unit": "cm"},
                    {"text": "¿Periodo?", "answer": T, "unit": "s"},
                    {"text": "¿Posición en t = 0?", "answer": 0, "unit": "cm"},
                    {"text": "¿Posición en t = T/4?", "answer": round(A * math.sin(w * (T/4)), 3), "unit": "cm"},
                    {"text": "¿Posición en t = T/2?", "answer": round(A * math.sin(w * (T/2)), 3), "unit": "cm"},
                ]
            })

        # -------------------- INTERMEDIO --------------------
        if nivel == "intermedio":
            A = random.randint(1, 3)
            B = random.randint(1, 3)
            w = random.choice([math.pi, 2 * math.pi])
            t = round(random.uniform(0.3, 2), 2)
            T = round(2 * math.pi / w, 3)

            contexts = [
                "Una cuerda de violín vibra en un modo combinado dado por:",
                "Un oscilador mecánico industrial produce vibraciones descritas por:",
                "Un sensor mide vibraciones complejas siguiendo:",
                "Una onda de sonido armónica se modela mediante:",
                "Un reflector acústico genera una oscilación compuesta representada por:"
            ]

            context = f"{random.choice(contexts)} x(t) = {A}·sin({round(w,3)}t) + {B}·cos({round(w,3)}t)"

            val1 = round(A * math.sin(w*t) + B * math.cos(w*t), 3)
            val2 = round(A * math.sin(w*(t+0.5)) + B * math.cos(w*(t+0.5)), 3)

            return jsonify({
                "title": "Oscilación Compuesta – Intermedio",
                "module": "Funciones Trigonométricas",
                "difficulty": "Intermedio",
                "context": context,
                "questions": [
                    {"text": "¿Amplitud combinada?", "answer": round(math.sqrt(A**2 + B**2), 3), "unit": "cm"},
                    {"text": "¿Periodo?", "answer": T, "unit": "s"},
                    {"text": f"¿Posición en t = {t}?", "answer": val1, "unit": "cm"},
                    {"text": f"¿Posición en t = {t+0.5}?", "answer": val2, "unit": "cm"},
                    {"text": "¿Valor medio de la oscilación?", "answer": 0, "unit": "cm"},
                ]
            })

        # -------------------- AVANZADO --------------------
        if nivel == "avanzado":
            A = random.randint(1, 3)
            B = random.randint(0, 3)
            w = random.choice([math.pi, 2 * math.pi])
            phi = random.choice([0, math.pi/4, math.pi/2])
            t = round(random.uniform(0.3, 2), 2)

            T = round(2 * math.pi / w, 3)
            val = round(A * math.sin(w*t + phi) + B, 3)

            contexts = [
                "Un cardiólogo analiza una señal biomédica modelada mediante:",
                "Una estación meteorológica registra variaciones periódicas descritas por:",
                "Una señal eléctrica modulada con desfase se expresa como:",
                "Un robot industrial realiza movimientos oscilatorios según:",
                "Una onda de marea se modela matemáticamente mediante:"
            ]

            context = f"{random.choice(contexts)} x(t) = {A}·sin({round(w,3)}t + {round(phi,3)}) + {B}"

            return jsonify({
                "title": "Oscilación con Desfase – Avanzado",
                "module": "Funciones Trigonométricas",
                "difficulty": "Avanzado",
                "context": context,
                "questions": [
                    {"text": "¿Amplitud?", "answer": A, "unit": "cm"},
                    {"text": "¿Periodo?", "answer": T, "unit": "s"},
                    {"text": "¿Desfase?", "answer": round(phi, 3), "unit": "rad"},
                    {"text": f"¿Posición en t = {t}?", "answer": val, "unit": "cm"},
                    {"text": "¿Posición máxima posible?", "answer": A + B, "unit": "cm"},
                ]
            })

    # ---------------------------------
    #   FUNCIONES TRIGONOMÉTRICAS
    # ---------------------------------
    if module == "trigonometric":

        # ---------- BÁSICO ----------
        if nivel == "basico":
            A = random.randint(1, 3)
            w = random.choice([math.pi, 2*math.pi])

            T = round(2*math.pi / w, 3)

            return jsonify({
                "title": "Oscilación Simple - Básico",
                "module": "Funciones Trigonométricas",
                "difficulty": "Básico",
                "context": f"x(t) = {A}·sin({round(w,3)}t)",
                "questions": [
                    {"text": "Amplitud", "answer": A, "unit": "cm"},
                    {"text": "Periodo", "answer": T, "unit": "s"},
                    {"text": "Posición en t=0", "answer": 0, "unit": "cm"},
                    {"text": "Posición en t=T/4", "answer": round(A*math.sin(w*(T/4)),3), "unit": "cm"},
                    {"text": "Posición en t=T/2", "answer": round(A*math.sin(w*(T/2)),3), "unit": "cm"}
                ]
            })

        # ---------- INTERMEDIO ----------
        if nivel == "intermedio":
            A = random.randint(1, 3)
            B = random.randint(1, 3)
            w = random.choice([math.pi, 2*math.pi])
            t = round(random.uniform(0.3, 2), 2)

            T = round(2*math.pi/w, 3)
            val1 = round(A*math.sin(w*t) + B*math.cos(w*t), 3)
            val2 = round(A*math.sin(w*(t+0.5)) + B*math.cos(w*(t+0.5)), 3)

            return jsonify({
                "title": "Oscilación Compuesta - Intermedio",
                "module": "Funciones Trigonométricas",
                "difficulty": "Intermedio",
                "context": f"x(t) = {A}·sin({round(w,3)}t) + {B}·cos({round(w,3)}t)",
                "questions": [
                    {"text": "Amplitud combinada", "answer": round(math.sqrt(A**2+B**2),3), "unit": "cm"},
                    {"text": "Periodo", "answer": T, "unit": "s"},
                    {"text": f"Posición en t={t}", "answer": val1, "unit": "cm"},
                    {"text": f"Posición en t={t+0.5}", "answer": val2, "unit": "cm"},
                    {"text": "Valor medio", "answer": 0, "unit": "cm"}
                ]
            })

        # ---------- AVANZADO ----------
        if nivel == "avanzado":
            A = random.randint(1, 3)
            B = random.randint(0, 3)
            w = random.choice([math.pi, 2*math.pi])
            phi = random.choice([0, math.pi/4, math.pi/2])
            t = round(random.uniform(0.3, 2), 2)

            T = round(2*math.pi / w, 3)
            val = round(A*math.sin(w*t + phi) + B, 3)

            return jsonify({
                "title": "Oscilación con Desfase – Avanzado",
                "module": "Funciones Trigonométricas",
                "difficulty": "Avanzado",
                "context": f"x(t) = {A}·sin({round(w,3)}t + {round(phi,3)}) + {B}",
                "questions": [
                    {"text": "Amplitud", "answer": A, "unit": "cm"},
                    {"text": "Periodo", "answer": T, "unit": "s"},
                    {"text": "Desfase", "answer": round(phi,3), "unit": "rad"},
                    {"text": f"Posición en t={t}", "answer": val, "unit": "cm"},
                    {"text": "Valor máximo", "answer": A+B, "unit": "cm"}
                ]
            })

    return jsonify({"error": "Módulo o nivel inválido"}), 400

# ==========================
#   GUARDAR RESULTADO
# ==========================
@app.post("/api/exercise-result")
def save_exercise_result():
    """
    Espera JSON como:
    {
        "id_usuario": 1,
        "module": "quadratic" | "trigonometric",
        "puntaje": 80,
        "total_preguntas": 3
    }
    """
    data = request.json or {}

    id_usuario = data.get("id_usuario")
    module = data.get("module")           # 'quadratic' o 'trigonometric'
    puntaje = data.get("puntaje")
    total_preguntas = data.get("total_preguntas")

    if not id_usuario or not module or puntaje is None or not total_preguntas:
        return jsonify({"error": "Faltan datos para guardar el resultado"}), 400

    # id_nivel según módulo
    id_nivel = obtener_id_nivel_por_modulo(module)
    if not id_nivel:
        return jsonify({"error": "No se pudo determinar el nivel para este módulo"}), 400

    # id_ejercicio (opcional, si existe un ejercicio "plantilla" en la tabla ejercicios)
    id_ejercicio = obtener_id_ejercicio_por_codigo(module)  # puede ser None

    conn, cursor = get_dict_conn()
    try:
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
        cursor.close()
        conn.close()

    return jsonify({"message": "Resultado guardado correctamente"}), 201


# ==========================
#   RESULTADOS POR USUARIO (HISTORIAL + DASHBOARD)
# ==========================
@app.get("/api/user-results/<int:user_id>")
def get_user_results(user_id):
    conn, cursor = get_dict_conn()
    try:
        cursor.execute(
            """
            SELECT 
                r.id_resultado,
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
        return jsonify(results)
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
