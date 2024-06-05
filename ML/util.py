import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import textwrap
import os

image_dir = "C:\Kuliah\Bangkit\CAPSTONE\Local.Ind\ML\IMAGES_FIX"
path = "C:\Kuliah\Bangkit\CAPSTONE\Local.Ind\ML\DATASETS LOCAL.IDN FIX.csv"

def get_dataframe(path):
    df = pd.read_csv(path)
    # Gabungkan kolom-kolom yang relevan menjadi satu string untuk setiap item
    df['combined_features'] = (df['nama_item'] + ' ' + df['katagory'] + ' ' + df['Brand']).str.lower()
    return df

def get_similarity(dataframe): 
    # Menggunakan TF-IDF Vectorizer untuk ekstraksi fitur
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(dataframe['combined_features'])
    # Menghitung kesamaan kosinus antar item
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
    return tfidf,tfidf_matrix,cosine_sim

# Fungsi untuk mendapatkan rekomendasi
def get_recommendations(query, df,tfidf, tfidf_matrix, cosine_sim, top_n):
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

    # Mengembalikan hanya top_n rekomendasi
    return pd.DataFrame(recommendations).head(top_n)

# Fungsi untuk menampilkan gambar rekomendasi
def display_recommended_images(recommendations, image_dir):
    # Set ukuran plot
    plt.figure(figsize=(20, 10))

    for i, row in enumerate(recommendations.itertuples(), 1):
        img_path = os.path.join(image_dir, f"{row.id_item}.jpg")

        # Load gambar jika ada
        if os.path.exists(img_path):
            img = mpimg.imread(img_path)
            plt.subplot(1, len(recommendations), i)
            plt.imshow(img)

            # Membuat teks judul lebih rapi
            title = f"{row.nama_item}\nRating: {row.rating}, Price: {row.harga}"
            wrapped_title = "\n".join(textwrap.wrap(title, width=20))
            plt.title(wrapped_title, fontsize=12)
            plt.axis('off')
        else:
            print(f"Gambar {row.id_item}.jpg tidak ditemukan.")

    plt.tight_layout()
    plt.show()

def main(path, image_dir):
    df = get_dataframe(path)
    n_gambar = 5
    tfidf, tfidf_matrix, cosine_sim = get_similarity(df)
    query = input("Cari apa nih: ")
    recommendations = pd.DataFrame(get_recommendations(
        query,df,tfidf, tfidf_matrix, cosine_sim,n_gambar))
    print(recommendations)
    # Panggil fungsi untuk menampilkan gambar
    display_recommended_images(recommendations, image_dir)

main(path, image_dir)

