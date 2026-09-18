import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, GLOW } from '../../constants';
import PrimaryButton from '../../components/PrimaryButton';
import eldenRingBanner from '../../assets/images/Elden_Ring_capa.jpg';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { gamesApi } from '../../services/games';
import { reviewsApi } from '../../services/reviews';
import { libraryApi, type UserGameStatus } from '../../services/library';
import { ApiError } from '../../services/api';

type ProgressId = 'zerado' | 'ate-onde-parei' | 'so-experimentei';

const PROGRESS_TO_STATUS: Record<ProgressId, UserGameStatus> = {
  zerado: 'completed',
  'ate-onde-parei': 'playing',
  'so-experimentei': 'tried',
};

const STATUS_TO_PROGRESS: Partial<Record<UserGameStatus, ProgressId>> = {
  completed: 'zerado',
  playing: 'ate-onde-parei',
  abandoned: 'ate-onde-parei',
  tried: 'so-experimentei',
};

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
  const { id, title: titleParam } = useLocalSearchParams<{ id?: string; title?: string }>();
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();

  const [rating, setRating] = useState(4);
  const [progress, setProgress] = useState<ProgressId>('zerado');
  const [review, setReview] = useState('');
  const [title, setTitle] = useState(titleParam ?? '');
  const [bannerImage, setBannerImage] = useState<{ uri: string } | typeof eldenRingBanner>(
    eldenRingBanner,
  );
  const [existingReviewId, setExistingReviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const detail = await gamesApi.detail(id, token);
        if (cancelled) return;
        setTitle(detail.title);
        if (detail.cover) setBannerImage({ uri: detail.cover });
        if (detail.viewer?.review) {
          setRating(detail.viewer.review.rating);
          setReview(detail.viewer.review.text ?? '');
          setExistingReviewId(detail.viewer.review.id);
        }
        if (detail.viewer?.library?.status) {
          const mapped = STATUS_TO_PROGRESS[detail.viewer.library.status];
          if (mapped) setProgress(mapped);
        }
      } catch {
        showError('Não foi possível carregar os dados deste jogo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  async function handleSubmit() {
    if (!id || !token || submitting) return;
    setSubmitting(true);
    try {
      if (existingReviewId) {
        await reviewsApi.update(token, existingReviewId, { rating, text: review || null });
      } else {
        await reviewsApi.create(token, id, { rating, text: review || null });
      }
      await libraryApi.upsertGame(token, id, { status: PROGRESS_TO_STATUS[progress] });
      showSuccess('Avaliação publicada!');
      router.replace(`/games/${id}`);
    } catch (error) {
      showError(error instanceof ApiError ? error.message : 'Não foi possível publicar sua avaliação.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <View style={styles.header}>
        <Pressable
          onPress={() => (id ? router.replace(`/games/${id}`) : router.back())}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>AVALIAR</Text>
          <Text style={styles.headerSubtitle}>{title || '...'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.nexoBlue} />
        </View>
      ) : (
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
            source={bannerImage}
            style={styles.bannerImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>{title}</Text>
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

        <PrimaryButton
          title={submitting ? 'PUBLICANDO...' : 'PUBLICAR AVALIAÇÃO'}
          onPress={handleSubmit}
          style={{ opacity: submitting ? 0.6 : 1 }}
        />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...StyleSheet.absoluteFill,
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
