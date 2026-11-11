import React, { useState, useEffect } from 'react';
import {
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Message, ChatOffer } from '../types';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  ChatMessageBubble,
  ChatOfferCard,
  ChatInputBar,
  MakeOfferModal,
} from '../components/chat';
import { chatService } from '../services';
import { useAuth } from '../context/AuthContext';

export const ChatScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { conversationId, productId, sellerId } = route.params;

  const [activeConvId, setActiveConvId] = useState<number | null>(conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeOffer, setActiveOffer] = useState<ChatOffer | null>(null);
  const [inputText, setInputText] = useState('');
  const [offerPriceInput, setOfferPriceInput] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingOffer, setSendingOffer] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        let currentId = activeConvId;
        if (!currentId && productId) {
          const conv = await chatService.getOrCreateConversation(productId);
          if (conv?.id) {
            currentId = conv.id;
            setActiveConvId(currentId);
          }
        }

        if (currentId) {
          const [fetchedMessages, fetchedOffers] = await Promise.all([
            chatService.getMessages(currentId),
            chatService.getOffers(currentId),
          ]);
          setMessages(fetchedMessages);
          if (fetchedOffers.length > 0) {
            setActiveOffer(fetchedOffers[fetchedOffers.length - 1]);
          }
        }
      } catch (err) {
        console.warn('Error loading chat session', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [conversationId, productId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConvId) return;
    const content = inputText.trim();
    setInputText('');

    try {
      const newMsg = await chatService.sendMessage(activeConvId, content);
      if (newMsg) setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('Error sending message', err);
    }
  };

  const handleCreateOffer = async () => {
    const price = parseFloat(offerPriceInput);
    if (!price || price <= 0 || !activeConvId || !productId) {
      Alert.alert('Prix invalide', 'Veuillez saisir un montant valide en FCFA.');
      return;
    }

    setSendingOffer(true);
    try {
      const offer = await chatService.createOffer({
        conversationId: activeConvId,
        productId,
        agreedPrice: price,
      });
      setActiveOffer(offer);
      setShowOfferModal(false);
      setOfferPriceInput('');
      Alert.alert('Succès', 'Votre offre a été soumise au vendeur.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || "Impossible d'envoyer l'offre.");
    } finally {
      setSendingOffer(false);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    try {
      const accepted = await chatService.acceptOffer(offerId);
      setActiveOffer(accepted);
      Alert.alert('Offre acceptée !', 'L acheteur peut maintenant finaliser avec le séquestre garanti.');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || "Impossible d'accepter l'offre.");
    }
  };

  const handleRejectOffer = async (offerId: number) => {
    try {
      const declined = await chatService.rejectOffer(offerId);
      setActiveOffer(declined);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || "Impossible de refuser l'offre.");
    }
  };

  const isSeller = user?.id === sellerId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        onBack={() => navigation.goBack()}
        title="Discussion & Négociation"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {activeOffer && (
          <ChatOfferCard
            offer={activeOffer}
            isSeller={isSeller}
            onAccept={handleAcceptOffer}
            onReject={handleRejectOffer}
            onPayEscrow={(price) =>
              navigation.navigate('Checkout', {
                productId,
                agreedPrice: price,
              })
            }
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ChatMessageBubble
                message={item}
                isMyMessage={item.senderId === user?.id}
              />
            )}
            contentContainerStyle={styles.messageList}
          />
        )}

        <ChatInputBar
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSendMessage}
          onOpenOfferModal={() => setShowOfferModal(true)}
          canMakeOffer={!isSeller && !!productId}
        />

        <MakeOfferModal
          visible={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          priceInput={offerPriceInput}
          onChangePrice={setOfferPriceInput}
          onSubmit={handleCreateOffer}
          loading={sendingOffer}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default ChatScreen;
