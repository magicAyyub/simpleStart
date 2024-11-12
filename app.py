import os,shutil
import json
import pandas as pd
from flask import Flask, request, render_template, send_file, jsonify
from data_processor import process_file
from sqlalchemy import create_engine
from werkzeug.utils import secure_filename


app = Flask(__name__)
engine = create_engine("mysql://user:password@localhost:3306/db")
UPLOAD_FOLDER = "./tmp"
PROCESSED_CSV = "processed_data.csv"

# Ensure the tmp folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/", methods=["GET"])
def index():
    data = None
    headers = None
    # Clean tmp folder
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path) or os.path.islink(file_path):
            os.unlink(file_path)
    return render_template("index.html", data=data, headers=headers)

@app.route("/add", methods=["GET"])
def add():
    return render_template("add.html")

# CSV search
@app.route('/fill_csv', methods=['POST'])
def fill_csv():
    if 'csv_file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['csv_file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.endswith('.csv'):
        try:
            # Charger le fichier CSV
            file_path = os.path.join("./tmp", file.filename)
            file.save(file_path)
 
            # Lire le fichier CSV dans un DataFrame
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
            'FIRST_NAME', 'LAST_NAME', 'EMAIL', 'BIRTH_DATE', 'ID_CCU'])
            output_path = "./tmp/filtered_results.csv"
            final_df.to_csv(output_path, index=False)
            os.remove(file_path)
 
            return send_file(output_path, as_attachment=True, download_name="filled_data.csv")
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file format'}), 400
        

# Simple search
@app.route('/search', methods=['POST'])
def search():
    # Extract form data from the request
    form_data = request.json  # Assuming the frontend sends JSON data
 
    # Define the column names as per your database (these are placeholders)
    with open('static/jsons/db_search_columns.json') as json_file:
        db_columns = json.load(json_file)
 
        # Filter out empty fields, so only filled fields are included in the query
        query_conditions = []
        for key, value in form_data.items():
            if value:  # Only add to conditions if the field is not empty
                db_column = db_columns.get(key)
                if db_column:
                    query_conditions.append(f"{db_column} = '{value}'")
    
        # Ensure at least one field is filled
        if not query_conditions:
            return jsonify({'error': 'At least one search field must be filled in.'}), 400
    
        # Build the SQL query with dynamic WHERE clause
        where_clause = " AND ".join(query_conditions)
        query = f"SELECT * FROM data WHERE {where_clause}"
        try:
            # Execute the query and get the result in a DataFrame
            results_df = pd.read_sql(query, engine)

            results_df = results_df.drop_duplicates(subset=[
                'EMAIL', 'BIRTH_DATE', 'ID_CCU','UUID'])
            # Convert the DataFrame to a list of dictionaries for JSON response
            results = results_df.to_dict(orient='records')
            return jsonify({'results': results})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    


 
@app.route('/process_file', methods=['POST'])
def process_file_endpoint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and file.filename.endswith('.txt'):
        file_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
        file.save(file_path)
 
        # Process the text file to CSV
        output_csv = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
        if process_file(file_path, output_csv):
            os.remove(file_path)  # Clean up the original text file
            return jsonify({'message': 'File processed successfully'})
        else:
            return jsonify({'error': 'File processing failed'}), 500
    else:
        return jsonify({'error': 'Invalid file format'}), 400
 
@app.route('/download_csv', methods=['GET'])
def download_csv():
    csv_path = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
    if os.path.exists(csv_path):
        return send_file(csv_path, as_attachment=True, download_name=PROCESSED_CSV)
    return jsonify({'error': 'Processed CSV not found'}), 404
 
@app.route('/load_data', methods=['POST'])
def load_data():
    csv_path = os.path.join(UPLOAD_FOLDER, PROCESSED_CSV)
    if not os.path.exists(csv_path):
        return jsonify({'error': 'Processed CSV not found'}), 404
 
    try:
        # Define chunksize for reading and writing
        chunksize = 10000  # Load 10,000 rows at a time
        # Disable indexes temporarily for faster bulk insert, if supported
        with engine.begin() as connection:
            connection.execute("ALTER TABLE data DISABLE KEYS")  # MySQL syntax
 
            # Load CSV data in chunks to avoid memory issues
            for chunk in pd.read_csv(csv_path, chunksize=chunksize):
                chunk.to_sql('data', connection, if_exists='append', index=False, chunksize=chunksize)
 
            # Re-enable indexes after loading is complete
            connection.execute("ALTER TABLE data ENABLE KEYS")  # MySQL syntax
            # For PostgreSQL, use "ALTER TABLE data SET LOGGED"
 
        return jsonify({'message': 'Data loaded into the database successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
