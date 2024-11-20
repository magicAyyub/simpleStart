import os
import re
import json
import pandas as pd
from flask import Flask, request, render_template, send_file, jsonify, Response
from sqlalchemy import create_engine
from werkzeug.utils import secure_filename
from typing import Union
from data_processor import process_file


app = Flask(__name__)
engine = create_engine("mysql://user:password@localhost:3306/db")
UPLOAD_FOLDER = "./tmp"
PROCESSED_CSV = "processed_data.csv"

# Ensure the tmp folder exists (^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.com$)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def clear_tmp_folder(tmp_folder: str) -> None:
    for filename in os.listdir(tmp_folder):
        file_path = os.path.join(tmp_folder, filename)
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)

@app.route("/", methods=["GET"])
def index() -> str:
    data = None
    headers = None
    clear_tmp_folder(UPLOAD_FOLDER)
    return render_template("index.html", data=data, headers=headers)

@app.route("/add", methods=["GET"])
def add() -> str:
    clear_tmp_folder(UPLOAD_FOLDER)
    return render_template("add.html")

# CSV search
@app.route('/fill_csv', methods=['POST'])
def fill_csv() -> Union[Response, Exception]:
    if 'csv_file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['csv_file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.endswith('.csv'):
        try:
            # Save search csv file
            file_path = os.path.join("./tmp", file.filename)
            file.save(file_path)
 
            # extract data search
            input_df = pd.read_csv(file_path)
            column_names = input_df.columns.tolist()
            union_queries = []
 
            for _, row in input_df.iterrows():
                conditions = [f"{col} = '{row[col]}'" for col in column_names]
                where_clause = " AND ".join(conditions)
                union_queries.append(f"SELECT * FROM data WHERE {where_clause}")
 
            full_query = " UNION ALL ".join(union_queries)
            final_df = pd.read_sql(full_query, engine)
            final_df = final_df.drop_duplicates(subset=[
             'EMAIL', 'BIRTH_DATE', 'ID_CCU'])
            output_path = "./tmp/filtered_results.csv"
            final_df.to_csv(output_path, index=False)
            os.remove(file_path)
 
            return send_file(output_path, as_attachment=True, download_name="filled_data.csv")
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Format de fichier non valide'}), 400
        

# Simple search
@app.route('/search', methods=['POST'])
def search() -> Union[Response, Exception]:
    form_data = request.json
    page = form_data.get("page", 1)
    limit = form_data.get("limit", 100)
 
    with open('static/jsons/db_search_columns.json') as json_file:
        db_columns = json.load(json_file)
    query_conditions = []
    like_checkbox = form_data.get("like", False)
    regex_pattern = form_data.get("regex")
    if 'regex' in form_data:
        del form_data['regex']
    if 'like' in form_data:
        del form_data['like']
    for key, value in form_data.items():
        if value:
            db_column = db_columns.get(key)
            if db_column:
                if like_checkbox or like_checkbox == "1":
                    query_conditions.append(f"{db_column} LIKE '%%{value}%%'")
                else:
                    query_conditions.append(f"{db_column} = '{value}'")
    if regex_pattern:
        try:
            re.compile(regex_pattern)
            mysql_compatible_pattern = regex_pattern.replace("%", "%%").replace("\\\\", "\\")
            query_conditions.append(f"EMAIL REGEXP '{mysql_compatible_pattern}'")
        except re.error:
            return jsonify({'error': 'Invalid regex pattern'}), 400
    if not query_conditions:
        return jsonify({'error': 'Au moins un champ de recherche doit être rempli.'}), 400
    where_clause = " AND ".join(query_conditions)
    offset = (page - 1) * limit
 
    # Query to get the total count of matching results
    count_query = f"SELECT COUNT(*) FROM data WHERE {where_clause}"
    total_count = pd.read_sql(count_query, engine).iloc[0, 0]
 
    # Query to get the paginated results
    query = f"SELECT * FROM data WHERE {where_clause} LIMIT {limit} OFFSET {offset}"
    try:
        results_df = pd.read_sql(query, engine)
        results = results_df.to_dict(orient='records')
        return jsonify({
    'results': results,
    'page': page,
    'limit': limit,
    'total_count': int(total_count)  # Convert to standard Python int
})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
        
 
@app.route('/process_file', methods=['POST'])
def process_file_endpoint() -> Response:
    if 'file' not in request.files:
        return jsonify({'error': 'Pas de champ \'file\' dans la requête'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Pas de fichier sélectionné'}), 400
    if file and file.filename.endswith('.txt'):
        file_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
        file.save(file_path)
 
        # Process the text file to CSV
        output_csv = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
        if process_file(file_path, output_csv):
            os.remove(file_path)  # Clean up the original text file
            return jsonify({'message': 'Fichier traité avec succès'})
        else:
            return jsonify({'error': 'Le traitement du fichier a échoué'}), 500
    else:
        return jsonify({'error': 'Format de fichier non valide'}), 400
 
@app.route('/download_csv', methods=['GET'])
def download_csv() -> Response:
    csv_path = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
    if os.path.exists(csv_path):
        return send_file(csv_path, as_attachment=True, download_name=PROCESSED_CSV)
    return jsonify({'error': 'CSV traité introuvable'}), 404
 
@app.route('/load_data', methods=['POST'])
def load_data() -> Union[Response, Exception]:
    # Extract the table name from the form data
    table_name = request.form.get('table_name')
    if not table_name:
        return jsonify({'error': 'Table name is required'}), 400
    
    # Get CSV File to load in db 
    csv_path = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
    if not os.path.exists(csv_path):
        return jsonify({'error': 'CSV traité introuvable'}), 404
 
    # Load data into the database
    try:
        for chunk in pd.read_csv(csv_path, chunksize=10000):
            chunk.to_sql(name=table_name, con=engine, if_exists='append', index=False)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
 
    return jsonify({'success': f'Data loaded into table {table_name} successfully.'}), 200
 
    

if __name__ == "__main__":
    app.run(debug=True)
