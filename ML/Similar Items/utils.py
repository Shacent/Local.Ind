from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

# Initialize the Flask application
app = Flask(__name__)

# Read the data
df = pd.read_csv("https://raw.githubusercontent.com/Shacent/Local.Ind/main/ML/System%20Recomendation/Datasets%20Local%20IDN%20-%20Fix.csv")

# Combine relevant columns into a single string for each item
df['combined_features'] = (df['nama_item'] + ' ' + df['katagory'] + ' ' + df['Brand']).str.lower()

# Use TF-IDF Vectorizer for feature extraction
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['combined_features'])

# Calculate cosine similarity between items
cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

# Function to get recommendations
def get_recommendations_b(query, df=df, cosine_sim=cosine_sim, top_n=5):
    # Preprocess input query
    query = query.lower()

    # Include query as part of data for similarity calculation
    query_vec = tfidf.transform([query])

    # Calculate cosine similarity between query and all items in the data
    cosine_sim_query = linear_kernel(query_vec, tfidf_matrix).flatten()

    # Sort items based on similarity scores
    sim_scores = sorted(list(enumerate(cosine_sim_query)), key=lambda x: x[1], reverse=True)

    # Get item indices from similarity scores
    sim_scores = sim_scores[:top_n]  # Get top_n recommendations
    item_indices = [i[0] for i in sim_scores]
    scores = [i[1] for i in sim_scores]

    # Add item names and similarity scores from recommendations
    recommendations = []
    for i, item_idx in enumerate(item_indices):
        item = df.iloc[item_idx].to_dict()
        item['similarity'] = scores[i]
        recommendations.append(item)

    # Remove duplicates in recommendations
    recommendations = [dict(t) for t in {tuple(d.items()) for d in recommendations}]

    # Remove 'combined_features' column from recommendations
    for rec in recommendations:
        rec.pop('combined_features', None)

    # Sort recommendations based on similarity score from highest to lowest
    recommendations = sorted(recommendations, key=lambda x: x['similarity'], reverse=True)

    # Return only id_item from recommendations
    id_items = [rec['id_item'] for rec in recommendations]

    return id_items

# Define the API route
@app.route('/recommend', methods=['GET'])
def recommend():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    recommended_ids = get_recommendations_b(query)
    return jsonify(recommended_ids)

# Run the application
if __name__ == '__main__':
    app.run(debug=True)