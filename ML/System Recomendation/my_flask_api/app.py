from flask import Flask, jsonify, request
import sys
sys.path.append('/mnt/data')
import util  # Mengimpor file util.py yang telah di-upload

app = Flask(__name__)

# Route untuk endpoint GET
@app.route('/api/v1/hello', methods=['GET'])
def hello_world():
    return jsonify(message="Welcome!")

# Route untuk endpoint POST yang menggunakan fungsi dari util.py
@app.route('/api/v1/util', methods=['POST'])
def use_util():
    data = request.get_json()
    response = util.get_recommendations(data)  # Panggil fungsi dari util.py
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
