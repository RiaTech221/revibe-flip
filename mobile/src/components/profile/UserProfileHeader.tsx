import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User } from '../../types';
import { colors } from '../../theme/colors';
import { ShieldCheck, UserCheck } from 'lucide-react-native';

interface UserProfileHeaderProps {
  user: User | null;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user }) => {
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user?.fullName || 'Utilisateur'}</Text>
          <ShieldCheck size={18} color={colors.primary} />
        </View>

        <Text style={styles.contact}>
          {user?.email || user?.phoneNumber || 'Compte vérifié'}
        </Text>

        <View style={styles.roleBadge}>
          <UserCheck size={12} color={colors.primary} />
          <Text style={styles.roleText}>
            {user?.role === 'ROLE_ADMIN' ? 'Administrateur' : 'Membre Sécurisé Escrow'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contact: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default UserProfileHeader;
