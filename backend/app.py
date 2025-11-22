# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_connection

app = Flask(__name__)
CORS(app)  # permite llamadas desde GitHub Pages o localhost front


@app.post("/api/register")
def register():
    data = request.json or {}

    nombre_usuario = data.get("nombre_usuario")
    correo = data.get("correo")
    password = data.get("password")

    if not nombre_usuario or not correo or not password:
        return jsonify({"error": "Faltan datos (nombre_usuario, correo, password)"}), 400

    password_hash = generate_password_hash(password)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO usuario (nombre_usuario, correo, password_hash, nivel_global)
                VALUES (%s, %s, %s, %s)
                """,
                (nombre_usuario, correo, password_hash, 1)
            )
        conn.commit()
    except Exception as e:
        print("Error en register:", e)
        return jsonify({"error": "No se pudo registrar. ¿Correo ya registrado?"}), 400
    finally:
        conn.close()

    return jsonify({"message": "Usuario registrado correctamente"}), 201


@app.post("/api/login")
def login():
    data = request.json or {}

    correo = data.get("correo")
    password = data.get("password")

    if not correo or not password:
        return jsonify({"error": "Faltan datos (correo, password)"}), 400

    conn = get_connection()
    user = None
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM usuario WHERE correo = %s",
                (correo,)
            )
            user = cursor.fetchone()
    finally:
        conn.close()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Contraseña incorrecta"}), 401

    # Lo que se guarda en localStorage currentUser
    user_data = {
        "id": user["id"],
        "nombre_usuario": user["nombre_usuario"],
        "correo": user["correo"],
        "nivel_global": user.get("nivel_global", 1)
    }

    return jsonify({
        "message": "Login correcto",
        "user": user_data
    })


@app.get("/api/exercise")
def get_exercise():

    module_code = request.args.get("module", "quadratic")
    limit_questions = request.args.get("limit", default=3, type=int)

    conn = get_connection()
    exercise = None

    try:
        with conn.cursor() as cursor:

            # 1) Buscar ejercicio por código
            cursor.execute("""
                SELECT id_ejercicio, id_nivel, titulo, modulo, dificultad,
                       descripcion, imagen, imagen_caption, contexto
                FROM ejercicios
                WHERE codigo = %s
            """, (module_code,))
            row = cursor.fetchone()

            if not row:
                return jsonify({"error": "Ejercicio no encontrado"}), 404

            exercise = {
                "id_ejercicio": row["id_ejercicio"],
                "id_nivel": row["id_nivel"],
                "title": row["titulo"],
                "module": row["modulo"],
                "difficulty": row["dificultad"],
                "description": row["descripcion"],
                "image": row["imagen"],
                "imageCaption": row["imagen_caption"],
                "context": row["contexto"],
                "questions": []
            }

            # 2) Preguntas asociadas (ALEATORIAS)
            cursor.execute("""
                SELECT id_pregunta, enunciado, tipo, respuesta_correcta, unidad, pista
                FROM preguntas
                WHERE id_ejercicio = %s
                  AND activa = 1
                ORDER BY RAND()
                LIMIT %s
            """, (exercise["id_ejercicio"], limit_questions))

            for q in cursor.fetchall():
                exercise["questions"].append({
                    "id": q["id_pregunta"],
                    "text": q["enunciado"],
                    "type": q["tipo"],                  # 'abierta' o 'multi'
                    "answer": q["respuesta_correcta"],  # texto / número esperado
                    "unit": q["unidad"],
                    "hint": q["pista"]
                })

    finally:
        conn.close()

    return jsonify(exercise)

@app.post("/api/exercise-result")
def save_exercise_result():

    data = request.json or {}

    id_usuario = data.get("id_usuario")
    id_nivel = data.get("id_nivel")
    id_ejercicio = data.get("id_ejercicio")
    puntaje = data.get("puntaje")
    total_preguntas = data.get("total_preguntas")

    if not all([id_usuario, id_nivel, id_ejercicio, puntaje, total_preguntas]):
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


@app.get("/api/user-results/<int:user_id>")
def get_user_results(user_id):

    conn = get_connection()
    results = []

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT r.id_resultado, r.puntaje, r.total_preguntas, r.fecha,
                       n.nombre AS nombre_nivel,
                       e.titulo AS titulo_ejercicio
                FROM resultados r
                JOIN niveles n ON r.id_nivel = n.id_nivel
                JOIN ejercicios e ON r.id_ejercicio = e.id_ejercicio
                WHERE r.id_usuario = %s
                ORDER BY r.fecha DESC
            """, (user_id,))
            results = cursor.fetchall()
    finally:
        conn.close()

    return jsonify(results)


if __name__ == "__main__":
    # debug=True para desarrollo; en producción pon debug=False
    app.run(host="0.0.0.0", port=5000, debug=True)
