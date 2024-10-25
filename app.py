import os
from flask import Flask, request, render_template
from data_processor import load_data_to_db
from sqlalchemy import create_engine
import dask.dataframe as dd
import pandas as pd

app = Flask(__name__)
engine = create_engine("mysql://user:password@localhost:3306/db")


# Route pour afficher le formulaire d'upload
@app.route("/upload", methods=["GET"])
def upload_form():
    return render_template("upload.html")


# Route pour traiter l'upload
@app.route("/upload", methods=["POST"])
def upload_file():
    if request.method == "POST":
        file = request.files["file"]
        file_path = os.path.join("./uploads", file.filename)
        file.save(file_path)
        # Lancer le traitement et chargement en BDD
        load_data_to_db(file_path)
        return "Fichier chargé et traité avec succès."


@app.route("/", methods=["GET"])
def show_data():
    # Chaîne de connexion directe pour Dask
    connection_string = "mysql://user:password@localhost:3306/db"
    # Lire la table en spécifiant "ID_CCU" comme index
    df = dd.read_sql_table("data", connection_string, index_col="id")
    return df.compute().to_html()


# Route pour la recherche par critères
@app.route("/search", methods=["GET"])
def search_data():
    first_name = request.args.get("first_name")
    last_name = request.args.get("last_name")
    email = request.args.get("email")
    query = "SELECT * FROM data WHERE 1=1"
    if first_name:
        query += f" AND FIRST_NAME LIKE '%{first_name}%'"
    if last_name:
        query += f" AND LAST_NAME LIKE '%{last_name}%'"
    if email:
        query += f" AND EMAIL LIKE '%{email}%'"
    df = pd.read_sql_query(query, engine)
    return df.to_html()


if __name__ == "__main__":
    app.run(debug=True)
