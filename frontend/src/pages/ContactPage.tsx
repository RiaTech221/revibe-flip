/**
 * Page de Contact et Support Client ReVibe FliP
 * 
 * Permet aux utilisateurs de joindre l'équipe de support et assistance :
 *  * - Formulaire de contact avec choix du motif (commande, paiement, litige, technique)
 *  * - Coordonnées directes (WhatsApp, email, téléphone) par pays supporté
 *  * - Horaires d'ouverture du service client
 */

import React, { useState, useEffect } from 'react';
import { contentApi } from '../services/api';
import { FooterConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<FooterConfig | null>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contentApi.getFooter()
      .then((res) => {
        if (res.data?.data) setConfig(res.data.data);
      })
      .catch(console.warn);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Veuillez renseigner au moins une adresse email ou un numéro de téléphone.');
      return;
    }
    if (!subject.trim()) {
      setError('Veuillez préciser le sujet de votre message.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Votre message doit contenir au moins 10 caractères.');
      return;
    }

    setLoading(true);
    try {
      await contentApi.submitContact({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setMessage('');
      setSubject('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Une erreur est survenue lors de l\'envoi de votre message. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const supportEmail = config?.supportEmail || 'contact@revibeflip.com';
  const supportPhone = config?.supportPhone || '+221 77 123 45 67';
  const supportAddress = config?.supportAddress || 'Dakar Plateau, Sénégal';
  const supportHours = config?.supportHours || 'Lundi - Samedi : 08h00 - 20h00';

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* HERO TITLE */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-purple-700" />
            <span>Support & Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Contactez notre équipe
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Une question sur une commande, un problème avec un vendeur ou une suggestion d'amélioration ? 
            Notre équipe locale basée à Dakar est à votre écoute pour vous accompagner.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLONNE GAUCHE : COORDONNÉES ET DISPONIBILITÉ */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-150 shadow-xs space-y-6">
              <h2 className="text-base font-black text-gray-900 pb-3 border-b border-gray-100">
                Nos Coordonnées
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Email direct</span>
                    <a href={`mailto:${supportEmail}`} className="text-purple-700 hover:underline">
                      {supportEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Téléphone / WhatsApp</span>
                    <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="text-purple-700 hover:underline">
                      {supportPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Localisation</span>
                    <span className="text-gray-600">{supportAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">Heures d'ouverture</span>
                    <span className="text-gray-600">{supportHours}</span>
                  </div>
                </div>
              </div>

              {/* RAPPEL DE SÉCURITÉ */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-black flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Sécurité ReVibe FliP
                </span>
                <p className="leading-tight">
                  Notre équipe ne vous demandera jamais votre code secret de paiement Wave ou Orange Money.
                </p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : FORMULAIRE DE CONTACT */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs space-y-6">
              <h2 className="text-base font-black text-gray-900">
                Envoyez-nous un message
              </h2>

              {success ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-black text-emerald-950">Message envoyé avec succès !</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Merci d'avoir contacté ReVibe FliP. Notre équipe a bien reçu votre demande et vous répondra sous 24h ouvrées.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Votre nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ex : Fatou Ndiaye"
                        className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+221 77 000 00 00"
                        className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="fatou@example.com"
                      className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600 text-xs"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Indiquez au moins votre email ou votre numéro pour que nous puissions vous répondre.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Sujet du message *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex : Question sur ma commande RF-2026-..."
                      className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Votre message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre demande avec le plus de précisions possible..."
                      className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:bg-white focus:border-purple-600 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Envoi en cours...' : 'Envoyer mon message au support'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
