from fastapi import FastAPI, File, UploadFile
from whisper_logic import transcribe_audio
import shutil
import os
import whisper
from pydub import AudioSegment
from pyAudioAnalysis import audioSegmentation as aS
import subprocess
from fastapi.middleware.cors import CORSMiddleware
# Configurar FastAPI
app = FastAPI()
# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto a la URL de tu aplicación Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Cargar el modelo Whisper
model = whisper.load_model("small")

def check_ffmpeg():
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True)
        print("FFmpeg version check output:")
        print(result.stdout)
    except Exception as e:
        print(f"Error checking FFmpeg: {e}")

check_ffmpeg()

def split_audio(audio_path, segment_length_ms=60000):
    audio = AudioSegment.from_file(audio_path)
    segments = []
    for start_time in range(0, len(audio), segment_length_ms):
        segment = audio[start_time:start_time + segment_length_ms]
        segment_path = f"{audio_path}_segment_{start_time // segment_length_ms}.mp3"
        segment.export(segment_path, format="mp3")
        segments.append(segment_path)
    return segments

def perform_diarization(audio_path):
    try:
        num_speakers = 2  # Ajusta según sea necesario
        segments = aS.speaker_diarization(audio_path, n_speakers=num_speakers)
        return [segment.tolist() for segment in segments]  # Convertir a listas
    except Exception as e:
        print(f"Error during speaker diarization: {e}")
        return None

def transcribe_audio(audio_path):
    print(f"Audio path: {audio_path}")

    if not os.path.isfile(audio_path):
        print("Error: El archivo no existe en la ruta especificada.")
        return None

    try:
        segments = split_audio(audio_path)
        full_transcription = ""

        for segment in segments:
            print(f"Transcribing segment: {segment}")
            result = model.transcribe(segment)
            full_transcription += result["text"] + " "

        # Realizar la diarización de hablantes
        diarization = perform_diarization(audio_path)

        return {
            "transcription": full_transcription.strip(),
            "diarization": diarization
        }
    except Exception as e:
        print(f"Error during transcription: {e}")
        return None

@app.post("/transcribe/")
async def transcribe(file: UploadFile = File(...)):
    file_location = f"./file/{file.filename}"

    os.makedirs(os.path.dirname(file_location), exist_ok=True)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Verificar si el archivo existe
    if not os.path.exists(file_location):
        return {"status": "Failed to save file", "file": file.filename}

    # Verificar si el archivo es accesible
    try:
        with open(file_location, "rb") as f:
            f.read()
    except Exception as e:
        return {"status": "Error reading file", "error": str(e)}

    # Procesar el archivo
    transcription = transcribe_audio(file_location)
    return {"status": "File successfully processed", "transcription": transcription}
