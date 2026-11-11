import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Conversation } from '../types';
import { colors, formatPrice } from '../theme/colors';
import { Header } from '../components/common/Header';
import { MessageCircle, Tag } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services';

export const MessagesScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      console.warn('Error loading conversations', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const hasOffer = !!item.activeOffer;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            productId: item.productId,
            conversation: item,
          })
        }
      >
        <Image
          source={{
            uri:
              item.product?.primaryImage ||
              'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200',
          }}
          style={styles.thumbnail}
        />

        <View style={styles.convDetails}>
          <View style={styles.topRow}>
            <Text style={styles.convTitle} numberOfLines={1}>
              {item.product?.title || 'Article'}
            </Text>
            <Text style={styles.convTime}>
              {item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleDateString() : ''}
            </Text>
          </View>

          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'Nouvelle conversation'}
          </Text>

          {hasOffer && (
            <View style={styles.offerBadge}>
              <Tag size={12} color={colors.primary} />
              <Text style={styles.offerText}>
                Offre : {formatPrice(item.activeOffer?.offeredPrice || 0)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Discussions & Offres" />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MessageCircle size={36} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aucune conversation en cours</Text>
          <Text style={styles.emptySubtitle}>
            Discutez avec les vendeurs et négociez vos articles avec le séquestre Garanti ReVibe.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  convDetails: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  convTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  lastMsg: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  offerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default MessagesScreen;
