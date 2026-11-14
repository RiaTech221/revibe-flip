/**
 * Page de Création d'Annonce (Vendre un Article) ReVibe FliP
 * 
 * Formulaire guidé étape par étape pour mettre en vente un article :
 *  * - Téléversement de photos avec prévisualisation
 *  * - Titre, description, catégorie, marque, taille et état de conservation
 *  * - Fixation du prix de vente en FCFA et options de livraison acceptées
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, categoryApi, uploadApi } from '../services/api';
import { Category, ProductCondition } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Upload,
  Plus,
  X,
  Sparkles,
  Camera,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const SellPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [originalPrice, setOriginalPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [condition, setCondition] = useState<ProductCondition>('VERY_GOOD');
  const [defects, setDefects] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [locationCity, setLocationCity] = useState('Dakar');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/sell');
      return;
    }
    categoryApi.getAll().then((res) => {
      if (res.data?.data) {
        setCategories(res.data.data);
        if (res.data.data.length > 0) setCategoryId(res.data.data[0].id);
      }
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadApi.uploadFile(file);
        if (res.data?.data) {
          setImageUrls((prev) => [...prev, res.data.data]);
        }
      }
    } catch (err) {
      alert("Erreur lors de l'envoi de l'image. Vous pouvez aussi renseigner une URL d'image.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (customImageUrl.trim()) {
      setImageUrls((prev) => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const numPrice = typeof price === 'number' ? price : 0;
  const platformCommission = Math.round(numPrice * 0.20);
  const sellerPayout = numPrice - platformCommission;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (imageUrls.length === 0) {
      setError('Veuillez ajouter au moins une photo pour présenter votre article.');
      return;
    }

    if (!price || price < 100) {
      setError('Le prix minimum de vente est de 100 FCFA.');
      return;
    }

    setLoading(true);
    try {
      const res = await productApi.create({
        title,
        description,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        categoryId: Number(categoryId),
        condition,
        defects: defects || undefined,
        measurements: measurements || undefined,
        brand: brand || undefined,
        size: size || undefined,
        color: color || undefined,
        locationCity,
        imageUrls,
      });

      navigate(`/product/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la publication de l'annonce.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
          Vendre un article
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Donnez une seconde vie à vos vêtements et gagnez de l'argent facilement au Sénégal
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* PHOTOS SECTION */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-600" />
                Photos de l'article (1 à 5 photos)
              </h3>
              <p className="text-xs text-gray-500">Ajoutez des photos nettes pour attirer les acheteurs.</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              {imageUrls.length} photo{imageUrls.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-purple-700 text-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Principale
                  </span>
                )}
              </div>
            ))}

            {/* Upload Button */}
            <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center">
              <Upload className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs font-bold text-purple-800">
                {uploading ? 'Envoi...' : 'Téléverser'}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick paste image URL fallback */}
          <div className="pt-3 border-t border-gray-50 flex gap-2">
            <input
              type="url"
              placeholder="URL d'image téléversée..."
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors"
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* BASIC INFORMATIONS */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Détails de l'article</h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Titre de l'annonce *</label>
            <input
              type="text"
              required
              placeholder="Ex: Robe courte en Wax véritable, Baskets Nike 42..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Catégorie *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">État de l'article *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="NEW_WITH_TAG">Neuf avec étiquette</option>
                <option value="VERY_GOOD">Très bon état</option>
                <option value="GOOD">Bon état</option>
                <option value="SATISFACTORY">État satisfaisant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Taille / Pointure</label>
              <input
                type="text"
                placeholder="Ex: S, M, L, 42, 43..."
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Marque</label>
              <input
                type="text"
                placeholder="Ex: Nike, Zara, Artisanal..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Couleur</label>
              <input
                type="text"
                placeholder="Ex: Bleu, Noir, Multicolore..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* DÉTAILS SECONDE MAIN (DÉFAUTS & MESURES) */}
          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                Précisions seconde main
              </span>
              <span className="text-[10px] text-purple-700 font-bold">
                💡 Plus l’état est détaillé, moins vous aurez de questions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Défauts éventuels (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Micro-déchirure bas, bouton manquant..."
                  value={defects}
                  onChange={(e) => setDefects(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Mesures (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Épaules 44cm, Longueur 72cm..."
                  value={measurements}
                  onChange={(e) => setMeasurements(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Localisation / Ville *</label>
            <input
              type="text"
              required
              placeholder="Dakar (Plateau, Almadies, Sacré-Cœur...), Thiès..."
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              placeholder="Donnez plus de précisions : matière, coupe, histoire de l'article, petits défauts éventuels..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* PRICING & COMMISSION BREAKDOWN */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Prix & Rémunération nette
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Prix de vente souhaité (FCFA) *</label>
              <input
                type="number"
                required
                min={100}
                placeholder="Ex: 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 text-base font-bold text-gray-900 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Prix d'origine (facultatif)</label>
              <input
                type="number"
                placeholder="Ex: 25000"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Fee transparency according to specs */}
          <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Prix affiché à l'acheteur :</span>
              <span className="font-bold text-gray-900">{numPrice ? numPrice.toLocaleString('fr-FR') + ' FCFA' : '0 FCFA'}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Commission ReVibe FliP (20%) :</span>
              <span className="font-semibold text-purple-700">- {platformCommission.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="pt-2 border-t border-purple-200/60 flex justify-between text-sm font-extrabold text-emerald-800">
              <span>Votre gain net (versé dès réception) :</span>
              <span>{sellerPayout.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-purple-200 transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Publication en cours...' : 'Publier mon annonce'}
        </button>
      </form>
    </div>
  );
};
