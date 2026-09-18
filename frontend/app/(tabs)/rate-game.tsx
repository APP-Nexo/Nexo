import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, GLOW } from '../../constants';
import PrimaryButton from '../../components/PrimaryButton';
import eldenRingBanner from '../../assets/images/Elden_Ring_capa.jpg';

type ProgressId = 'zerado' | 'ate-onde-parei' | 'so-experimentei';

const RATING_LABELS: Record<number, string> = {
  1: 'TERRÍVEL',
  2: 'RUIM',
  3: 'REGULAR',
  4: 'BOM',
  5: 'INCRÍVEL',
};

interface ProgressOptionData {
  id: ProgressId;
  iconFamily: 'MaterialCommunityIcons' | 'Ionicons';
  icon: string;
  title: string;
  description: string;
}

const PROGRESS_OPTIONS: ProgressOptionData[] = [
  {
    id: 'zerado',
    iconFamily: 'MaterialCommunityIcons',
    icon: 'trophy',
    title: 'ZERADO',
    description: 'Finalizei o jogo completamente',
  },
  {
    id: 'ate-onde-parei',
    iconFamily: 'MaterialCommunityIcons',
    icon: 'bomb',
    title: 'ATÉ ONDE PAREI',
    description: 'Joguei por um tempo mas não terminei',
  },
  {
    id: 'so-experimentei',
    iconFamily: 'Ionicons',
    icon: 'eye-outline',
    title: 'SÓ EXPERIMENTEI',
    description: 'Joguei pouco, impressão inicial',
  },
];

function RatingStars({
  rating,
  onSelect,
}: {
  rating: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onSelect(star)} hitSlop={8}>
          <MaterialCommunityIcons
            name={star <= rating ? 'star' : 'star-outline'}
            size={36}
            color={star <= rating ? COLORS.nexoBlue : COLORS.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
});

function ProgressOption({
  option,
  selected,
  onSelect,
}: {
  option: ProgressOptionData;
  selected: boolean;
  onSelect: () => void;
}) {
  const IconComponent =
    option.iconFamily === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <Pressable
      onPress={onSelect}
      style={[progressStyles.card, selected && progressStyles.cardSelected]}
    >
      <View style={progressStyles.iconWrap}>
        <IconComponent
          name={option.icon as never}
          size={22}
          color={selected ? COLORS.nexoBlue : COLORS.textSecondary}
        />
      </View>

      <View style={progressStyles.textWrap}>
        <Text
          style={[progressStyles.title, selected && progressStyles.titleSelected]}
        >
          {option.title}
        </Text>
        <Text style={progressStyles.description}>{option.description}</Text>
      </View>

      <View
        style={[
          progressStyles.checkbox,
          selected && progressStyles.checkboxSelected,
        ]}
      >
        {selected && (
          <MaterialCommunityIcons
            name="check"
            size={14}
            color={COLORS.nexoBlue}
          />
        )}
      </View>
    </Pressable>
  );
}

const progressStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  cardSelected: {
    borderColor: COLORS.nexoBlue,
    ...GLOW.primary,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: FONT.family.display,
    fontSize: FONT.small,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  titleSelected: {
    color: COLORS.nexoBlue,
  },
  description: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.surface2,
  },
});

export default function RateGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [rating, setRating] = useState(4);
  const [progress, setProgress] = useState<ProgressId>('zerado');
  const [review, setReview] = useState('');

  function handleSubmit() {
    console.log({ rating, progress, review });
  }

  return (
    <View
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AVALIAR</Text>
          <Text style={styles.headerSubtitle}>ELDEN RING</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bannerContainer}>
          <Image
            source={eldenRingBanner}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>ELDEN RING</Text>
            <Text style={styles.bannerMeta}>FromSoftware • RPG • Open World</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUA NOTA</Text>
          <RatingStars rating={rating} onSelect={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMO VOCÊ JOGOU?</Text>
          {PROGRESS_OPTIONS.map((option) => (
            <ProgressOption
              key={option.id}
              option={option}
              selected={progress === option.id}
              onSelect={() => setProgress(option.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REVIEW (OPCIONAL)</Text>
          <View style={styles.reviewContainer}>
            <TextInput
              style={styles.reviewInput}
              placeholder="O que você achou do jogo? Seja direto."
              placeholderTextColor={COLORS.placeholder}
              multiline
              maxLength={250}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{review.length} / 250</Text>
          </View>
        </View>

        <PrimaryButton title="PUBLICAR AVALIAÇÃO" onPress={handleSubmit} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT.family.display,
    fontSize: FONT.subtitle,
    color: COLORS.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.xs,
    gap: SPACING.xl,
  },
  bannerContainer: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 160,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  bannerTitle: {
    fontFamily: FONT.family.display,
    fontSize: FONT.title,
    color: COLORS.text,
    letterSpacing: 2,
  },
  bannerMeta: {
    fontFamily: FONT.family.body,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.caption,
    color: COLORS.nexoBlue,
    letterSpacing: 2,
  },
  ratingLabel: {
    fontFamily: FONT.family.display,
    fontSize: FONT.small,
    color: COLORS.nexoBlue,
    letterSpacing: 2,
    marginTop: SPACING.xxs,
  },
  reviewContainer: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  reviewInput: {
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    color: COLORS.text,
    minHeight: 96,
  },
  charCount: {
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xxs,
  },
});
