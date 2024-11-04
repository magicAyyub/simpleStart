import pandas as pd
import re
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Union

# Connexion dynamique à MySQL via SQLAlchemy
engine = create_engine("mysql://user:password@localhost:3306/db")


def process_line(line: str) -> Union[List[str], None]:
    """
    Nettoie et structure une ligne de texte.
    """
    if re.match(r"^[\-\+| ]+$", line):  # Ignore les lignes de séparateurs
        return None
    line = re.sub(r"\s*\|\s*", ",", line.strip())  # Replace pipes with commas
    line = re.sub(r"\s+", " ", line)  # Reduce multiple spaces
    columns = [col.strip() for col in line.split(",")]
    return columns if any(columns) else None


def detect_columns(file_path: str) -> List[str]:
    """
    Détecte les colonnes du fichier en analysant la première ligne de données.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        # Lire la première ligne pour obtenir les en-têtes
        first_line = file.readline().strip()
        columns = process_line(first_line)
        return columns


def update_table_structure(table_name: str, columns: List[str]):
   """
   Vérifie et adapte la structure de la table en fonction des colonnes détectées,
   et place la colonne `id` en première position.
   """
   metadata = MetaData()
   metadata.reflect(bind=engine)  # Associer le moteur au moment de la réflexion
   if table_name in metadata.tables:
       table = metadata.tables[table_name]
       existing_columns = set(table.columns.keys())
       # Ajouter les nouvelles colonnes manquantes
       with engine.connect() as conn:
           for col in columns:
               if col not in existing_columns:
                   alter_query = f'ALTER TABLE {table_name} ADD COLUMN `{col}` VARCHAR(255)'
                   conn.execute(alter_query)
   else:
        # Créer la table avec une colonne id auto-incrémentée en première position si elle n'existe pas
        columns_definitions = [Column("id", Integer, primary_key=True, autoincrement=True)] + \
                             [Column(col, String(255)) for col in columns]
        table = Table(table_name, metadata, *columns_definitions)
        metadata.create_all(engine)

def load_data_to_db(file_path: str, table_name="data"):
    """
    Charge les données depuis un fichier .txt dans la base de données.
    """
    # Détecter les colonnes en utilisant la première ligne
    columns = detect_columns(file_path)
    update_table_structure(table_name, columns)
    # Lecture des données en chunks en ignorant la première ligne
    with open(file_path, "r", encoding="utf-8") as file:
        file.readline()  # Ignorer la première ligne qui contient les en-têtes
        for processed_lines in read_large_file(file):
            df = pd.DataFrame(processed_lines, columns=columns)
            df.to_sql(table_name, con=engine, if_exists="append", index=False)


def read_large_file(file, chunk_size: int = 1024 * 1024):
    """
    Lit un fichier en chunks pour économiser la mémoire.
    """
    while True:
        chunk = file.read(chunk_size)
        if not chunk:
            break
        lines = chunk.splitlines()
        processed_lines = [process_line(line) for line in lines if process_line(line)]
        yield processed_lines
