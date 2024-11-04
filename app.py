import os
from flask import Flask, request, render_template
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

    # Lire la table en spécifiant "ID_CCU" comme index
    df = dd.read_sql_table("data", connection_string, index_col="id")

    # Convertir le Dask DataFrame en Pandas DataFrame
    df_pandas = df.compute()

    # Convertir l'index "ID_CCU" en une colonne normale
    df_pandas.reset_index(inplace=True)

    # Convertir le Pandas DataFrame en un dictionnaire
    data = df_pandas.to_dict("records")
    headers = df_pandas.columns.tolist()
    return render_template("index.html", data=data, headers=headers)


@app.route('/upload_csv', methods=['POST'])
def upload_csv():
   if 'csv_file' not in request.files:
       return 'No file part'
   file = request.files['csv_file']
   if file.filename == '':
       return 'No selected file'
   if file and file.filename.endswith('.csv'):
       df = pd.read_csv(file)
       data = df.to_dict('records')
       headers = df.columns.tolist()
       return render_template('index.html', data=data, headers=headers)
   return 'Invalid file type'

if __name__ == "__main__":
    app.run(debug=True)
