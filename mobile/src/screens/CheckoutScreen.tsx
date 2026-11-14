/**
 * Écran Tunnel d'Achat et Séquestre (CheckoutScreen) ReVibe FliP Mobile
 * 
 * Processus de paiement sécurisé d'une commande :
 *  * - Récapitulatif financier complet (prix article, frais de séquestre 1%, frais de livraison)
 *  * - Sélection du mode de livraison (À domicile ou Point Relais)
 *  * - Choix du moyen de paiement Mobile Money (Wave, Orange Money, MTN MoMo, Moov)
 *  * - Carte de rappel de la garantie séquestre ReVibe Shield
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { Product, PaymentMethod } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import paymentService from '../services/paymentService';
import { isAllowedPayTechUrl } from '../utils/deepLink';
import {
  PaymentMethodSelector,
  EscrowGuaranteeCard,
  OrderSummaryBox,
} from '../components/checkout';
import { orderService } from '../services';
import { Lock, MapPin, Phone } from 'lucide-react-native';

export const CheckoutScreen = ({ route, navigation }: any) => {
  const { product, agreedPrice } = route.params;

  const itemPrice = agreedPrice || product.price;
  const deliveryFee = 1500;
  const buyerFee = Math.round(itemPrice * 0.05);
  const totalAmount = itemPrice + buyerFee + deliveryFee;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcessPayment = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Numéro requis', 'Veuillez renseigner votre numéro Wave ou Orange Money.');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Adresse requise', 'Veuillez préciser votre adresse ou quartier de livraison.');
      return;
    }

    setLoading(true);
    try {
      const order = await orderService.createOrder({
        productId: product.id,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: 'Dakar',
        paymentMethod,
        agreedPrice: itemPrice,
      });

      const init = await paymentService.initializePayment({
        orderId: order.id,
        paymentMethod,
        phoneNumber: phoneNumber.trim(),
      });

      if (!isAllowedPayTechUrl(init?.redirectUrl)) {
        throw new Error('URL de paiement PayTech invalide ou non autorisée.');
      }

      await Linking.openURL(init.redirectUrl);
      navigation.replace('OrderDetail', { orderId: order.id, order });
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || err.message || 'Le paiement a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack onBack={() => navigation.goBack()} title="Paiement Sécurisé Escrow" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Escrow Guarantee Banner */}
        <EscrowGuaranteeCard />

        {/* Order Summary */}
        <OrderSummaryBox
          product={product}
          agreedPrice={itemPrice}
          deliveryFee={deliveryFee}
        />

        {/* Delivery Details Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Coordonnées de livraison</Text>

          <View style={styles.inputWrapper}>
            <MapPin size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Adresse ou quartier (ex: Mermoz, Almadies...)"
              placeholderTextColor={colors.textSecondary}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Phone size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Numéro Mobile Money (ex: 77 123 45 67)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        {/* Payment Method Selector */}
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onSelect={setPaymentMethod}
        />

        {/* Submit Escrow Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.btnDisabled]}
          onPress={handleProcessPayment}
          disabled={loading}
        >
          <Lock size={18} color="#ffffff" />
          <Text style={styles.payButtonText}>
            {loading ? 'Redirection PayTech...' : `Payer ${formatPrice(totalAmount)} (conservé jusqu'à réception)`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  payButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CheckoutScreen;
