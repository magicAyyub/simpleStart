import os
from flask import Flask, request, render_template, send_file
from data_processor import load_data_to_db
from sqlalchemy import create_engine
import dask.dataframe as dd
import pandas as pd

app = Flask(__name__)
engine = create_engine("mysql://user:password@localhost:3306/db")


@app.route("/", methods=["GET"])
def index():
    # Chaîne de connexion directe pour Dask
    connection_string = "mysql://user:password@localhost:3306/db"

    # Lire les 1000 première lignes de la  table en spécifiant "ID_CCU" comme index
    df = dd.read_sql_table("data", connection_string, index_col="id")

    # Convertir le Dask DataFrame en Pandas DataFrame
    df_pandas = df.compute()

    # Convertir l'index "ID_CCU" en une colonne normale
    df_pandas.reset_index(inplace=True)

    # Convertir le Pandas DataFrame en un dictionnaire
    data = df_pandas.to_dict("records")
    headers = df_pandas.columns.tolist()
    return render_template("index.html", data=data, headers=headers)

@app.route("/add", methods=["GET"])
def upload():
    return render_template("add.html")

# Route pour traiter l'upload
@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'csv_file' not in request.files:
        return 'No file part'
    file = request.files['csv_file']
    if file.filename == '':
        return 'No selected file'
    if file and file.filename.endswith('.csv'):
        # Charger le fichier CSV
        file_path = os.path.join("./uploads", file.filename)
        file.save(file_path)
        # Lire le fichier CSV dans un DataFrame
        input_df = pd.read_csv(file_path)
        # Obtenir la liste des colonnes spécifiées par l'utilisateur dans le CSV
        column_names = input_df.columns.tolist()
        # Construire une liste pour stocker les parties de la requête
        union_queries = []
        # Pour chaque ligne du fichier CSV, construire la partie de requête SQL dynamiquement
        for _, row in input_df.iterrows():
            # Construire la condition WHERE pour chaque colonne spécifiée
            conditions = [
                f"{col} = '{row[col]}'" for col in column_names
            ]
            # Joindre les conditions avec 'AND' pour cette ligne
            where_clause = " AND ".join(conditions)
            # Ajouter une partie de requête SQL pour cette ligne
            union_queries.append(f"SELECT * FROM data WHERE {where_clause}")
        # Joindre toutes les parties de la requête avec UNION ALL
        full_query = " UNION ALL ".join(union_queries)
        print(full_query)
        # Exécuter la requête complète pour obtenir tous les résultats en un seul appel
        final_df = pd.read_sql(full_query, engine)
        # Sauvegarder le DataFrame final dans un nouveau fichier CSV
        output_path = "./uploads/filtered_results.csv"
        final_df.to_csv(output_path, index=False)
        # Supprimer le fichier original après traitement
        os.remove(file_path)
        # Renvoyer le fichier CSV filtré
        return send_file(output_path, as_attachment=True, download_name="filled_data.csv")
    else:
        return 'Invalid file format'
        


# Route pour traiter l'upload
@app.route("/add", methods=["POST"])
def upload_file():
    if request.method == "POST":
        file = request.files["upload_file"]
        file_path = os.path.join("./uploads", file.filename)
        file.save(file_path)
        # Lancer le traitement et chargement en BDD
        load_data_to_db(file_path)
        # Supprimer le fichier après traitement
        os.remove(file_path)
        return "Fichier chargé et traité avec succès."

if __name__ == "__main__":
    app.run(debug=True)
