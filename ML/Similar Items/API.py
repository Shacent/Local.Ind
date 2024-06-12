import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

# Read the data
df = pd.read_csv("https://raw.githubusercontent.com/Shacent/Local.Ind/main/ML/System%20Recomendation/Datasets%20Local%20IDN%20-%20Fix.csv")

# Gabungkan kolom-kolom yang relevan menjadi satu string untuk setiap item
df['combined_features'] = (df['nama_item'] + ' ' + df['katagory'] + ' ' + df['Brand']).str.lower()

# Menggunakan TF-IDF Vectorizer untuk ekstraksi fitur
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(df['combined_features'])

# Menghitung kesamaan kosinus antar item
cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)

# Fungsi untuk mendapatkan rekomendasi
def get_recommendations_b(query, df=df, cosine_sim=cosine_sim, top_n=5):
    # Preprocessing input query
    query = query.lower()

    # Menyertakan query sebagai bagian dari data untuk perhitungan kesamaan
    query_vec = tfidf.transform([query])

    # Menghitung kesamaan kosinus antara query dan semua item dalam data
    cosine_sim_query = linear_kernel(query_vec, tfidf_matrix).flatten()

    # Mengurutkan item berdasarkan skor kesamaan
    sim_scores = sorted(list(enumerate(cosine_sim_query)), key=lambda x: x[1], reverse=True)

    # Mendapatkan indeks item dari skor kesamaan
    sim_scores = sim_scores[:top_n]  # Mengambil top_n rekomendasi teratas
    item_indices = [i[0] for i in sim_scores]
    scores = [i[1] for i in sim_scores]

    # Menambahkan nama item dan skor kesamaan dari hasil rekomendasi
    recommendations = []
    for i, item_idx in enumerate(item_indices):
        item = df.iloc[item_idx].to_dict()
        item['similarity'] = scores[i]
        recommendations.append(item)

    # Menghilangkan duplikasi dalam rekomendasi
    recommendations = [dict(t) for t in {tuple(d.items()) for d in recommendations}]

    # Menghapus kolom 'combined_features' dari hasil rekomendasi
    for rec in recommendations:
        rec.pop('combined_features', None)

    # Mengurutkan rekomendasi berdasarkan nilai kesamaan dari besar ke kecil
    recommendations = sorted(recommendations, key=lambda x: x['similarity'], reverse=True)

    # Mengembalikan hanya id_item dari hasil rekomendasi
    id_items = [rec['id_item'] for rec in recommendations]

    return id_items

query = input("Cari apa nih: ")
recommended_ids = get_recommendations_b(query)
print(recommended_ids)