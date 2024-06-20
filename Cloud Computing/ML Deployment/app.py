from flask import Flask, request, jsonify
from keras.models import load_model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pandas as pd

model = load_model("model_predict_next_words.h5")

df = pd.read_csv('https://raw.githubusercontent.com/Shacent/Local.Ind/main/ML/NextWords/API_DS.csv')

df_items = df['Fixedd'].tolist()  
tokenizer = Tokenizer()
tokenizer.fit_on_texts(df_items)
total_words = len(tokenizer.word_index) + 1

max_sequence_len = 10  

app = Flask(__name__)

def make_prediction(seed_text, next_words=1):
    output_text = seed_text
    for _ in range(next_words):
        token_list = tokenizer.texts_to_sequences([seed_text])[0]
        token_list = pad_sequences([token_list], maxlen=max_sequence_len-1, padding='pre')
        predicted = np.argmax(model.predict(token_list), axis=-1)
        output_word = ""
        for word, index in tokenizer.word_index.items():
            if index == predicted:
                output_word = word
                break
        seed_text += " " + output_word
        output_text += " " + output_word
    return output_text

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    seed_text = data['seed_text']
    next_words = data.get('next_words', 1)
    
    for _ in range(next_words):
        token_list = tokenizer.texts_to_sequences([seed_text])[0]
        token_list = pad_sequences([token_list], maxlen=max_sequence_len-1, padding='pre')
        predicted = np.argmax(model.predict(token_list), axis=-1)
        output_word = ""
        for word, index in tokenizer.word_index.items():
            if index == predicted:
                output_word = word
                break
        seed_text += " " + output_word
    
    return jsonify({'predicted_text': seed_text})
    
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)
