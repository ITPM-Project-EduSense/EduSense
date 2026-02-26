from google import genai

client = genai.Client(api_key="AIzaSyA2bfZ8kBAuceIkZItF0W-EfiNknM9WmYc")

def generate_embedding(text: str):
    try:
        response = client.models.embed_content(
            model="gemini-embedding-001",
            contents=text
        )
        print("Gemini Embedding Response:")    

        return response.embeddings[0].values

    except Exception as e:
        print("Gemini Embedding Error:", e)
        return None 