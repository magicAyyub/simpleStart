import re
import pandas as pd
from typing import Generator, TextIO, Union

def read_by_chunk(
    file_object: TextIO,  # le type de retour de open()
    chunk_size: int = 4096,
) -> Generator[str, None, None]:
    """
    Lit le fichier par morceaux pour éviter la surcharge mémoire.
    """
    while True:
        chunk = file_object.read(chunk_size)
        if not chunk:
            break
        yield chunk


def clean_line(line: str) -> Union[list[str], None]:
    """
    Nettoie une ligne de texte en :
    - Remplaçant les espaces autour des pipes par des virgules pour conserver les séparateurs.
    - Réduisant les espaces multiples en un seul espace.
    - Ignorant les lignes composées uniquement de séparateurs ou de caractères vides.
    Retourne une liste des valeurs si la ligne est valide, sinon None.
    """
    line = re.sub(r"\s*\|\s*", ",", line.strip())
    line = re.sub(r"\s{2,}", " ", line)
    line = re.sub(r"\s+", " ", line)
    if not line or re.fullmatch(r"[,\s]*", line):
        return None
    return line.split(",")


def process_file(file_path: str, output_csv: str, chunk_size: int = 4096) -> bool:
    """
    Lit un gros fichier texte, nettoie les lignes, les charge dans un DataFrame et les écrit dans un CSV.
    """
    data = []  # Liste pour accumuler les données temporairement
    batch_size = 10000  # Taille du lot pour limiter l'utilisation de la mémoire

    try:
        with open(file_path, "r", encoding="utf-8") as file_object:
            for chunk in read_by_chunk(file_object, chunk_size):
                lines = chunk.splitlines()
                for line in lines:
                    cleaned_line = clean_line(line)
                    if cleaned_line is not None:
                        data.append(cleaned_line)
                    # Écrire par lots pour ne pas surcharger la mémoire
                    if len(data) >= batch_size:
                        df = pd.DataFrame(data)
                        df.to_csv(output_csv, mode="a", index=False, header=False)
                        data.clear()  # Vider le batch une fois écrit
            # Écrire les lignes restantes après la dernière itération
            if data:
                df = pd.DataFrame(data)
                df.to_csv(output_csv, mode="a", index=False, header=False)
    except FileNotFoundError:
        return False
    return True
