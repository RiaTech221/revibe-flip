import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { formatImageUrl, getInitialAndGradient } from '../../utils/imageUrl';

interface ImageWithFallbackProps {
  uri?: string | null;
  label?: string | null;
  style?: StyleProp<ImageStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  fontSize?: number;
}

/**
 * Affiche une image distante optimisée (Cloudinary `f_auto,q_auto`) avec fallback
 * uniforme (initiale sur dégradé) pour les images absentes ou anciennes (`/uploads/`).
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  uri,
  label,
  style,
  fallbackStyle,
  fontSize = 20,
}) => {
  const [hasError, setHasError] = useState(false);
  const formattedUri = formatImageUrl(uri);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (!formattedUri || hasError) {
    const { initial, colors } = getInitialAndGradient(label);
    return (
      <View
        style={[
          styles.fallback,
          { backgroundColor: colors[0], borderColor: colors[1], borderWidth: 2 },
          style as StyleProp<ViewStyle>,
          fallbackStyle,
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: formattedUri }}
      style={style}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
