import React, {
    useRef,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import {
    View,
    Text,
    ImageBackground,
    Animated,
    StyleSheet,
    useWindowDimensions,
    ViewStyle,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Game } from '../types/Game';
import { COLORS, SPACING, RADIUS, FONT, NATIVE_DRIVER } from '../constants';

type Props = {
    data: Game[];
    style?: ViewStyle;
    onPressItem?: (item: Game) => void;
};

const CARD_SPACING = SPACING.md;
const AUTO_SCROLL_INTERVAL = 7000;
// The list is rendered as many looped copies of `data` so both manual swipes
// and autoplay can keep moving in one direction without ever hitting a real
// edge; FlatList virtualization keeps this cheap regardless of the multiplier.
const LOOP_COUNT = 50;

function Carousel({ data, style, onPressItem }: Props) {
    const { width } = useWindowDimensions();

    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<Animated.FlatList<Game>>(null);

    const CARD_WIDTH = useMemo(() => width * 0.68, [width]);
    const CARD_HEIGHT = useMemo(() => CARD_WIDTH * 1.3, [CARD_WIDTH]);
    const ITEM_SIZE = useMemo(
        () => CARD_WIDTH + CARD_SPACING,
        [CARD_WIDTH]
    );

    const loopedData = useMemo(
        () =>
            data.length
                ? Array.from({ length: data.length * LOOP_COUNT }, (_, i) => data[i % data.length])
                : [],
        [data]
    );
    const startIndex = useMemo(
        () => (data.length ? Math.floor(LOOP_COUNT / 2) * data.length : 0),
        [data.length]
    );
    const currentIndex = useRef(startIndex);

    useEffect(() => {
        currentIndex.current = startIndex;
    }, [startIndex]);

    // animação de scroll
    const handleScroll = useMemo(
        () =>
            Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: NATIVE_DRIVER }
            ),
        [scrollX]
    );

    // auto scroll (sempre avança; o loop de dados faz parecer infinito)
    useEffect(() => {
        if (!loopedData.length) return;

        const interval = setInterval(() => {
            currentIndex.current =
                currentIndex.current + 1 >= loopedData.length
                    ? startIndex
                    : currentIndex.current + 1;

            flatListRef.current?.scrollToOffset({
                offset: currentIndex.current * ITEM_SIZE,
                animated: true,
            });
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [loopedData.length, ITEM_SIZE, startIndex]);

    const keyExtractor = useCallback(
        (item: Game, index: number) => `${item.id ?? index}-${index}`,
        []
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: ITEM_SIZE,
            offset: ITEM_SIZE * index,
            index,
        }),
        [ITEM_SIZE]
    );

    const renderItem = useCallback(
        ({ item, index }: { item: Game; index: number }) => {
            const inputRange = [
                (index - 1) * ITEM_SIZE,
                index * ITEM_SIZE,
                (index + 1) * ITEM_SIZE,
            ];

            const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.95, 1, 0.95],
            extrapolate: 'clamp',
            });

            const overlayContent = (
                <>
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        style={styles.gradient}
                    />

                    <View style={styles.content}>
                        {item.isNew && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>NOVO</Text>
                            </View>
                        )}

                        <Text style={styles.category} numberOfLines={1}>
                            {item.category}
                        </Text>

                        <Text style={styles.title} numberOfLines={2}>
                            {item.title}
                        </Text>
                    </View>
                </>
            );

            return (
                <Animated.View
                    style={[
                        styles.card,
                        {
                            width: CARD_WIDTH,
                            height: CARD_HEIGHT,
                            marginRight: CARD_SPACING,
                            transform: [{ scale }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        activeOpacity={0.9}
                        style={{ flex: 1 }}
                        onPress={() => onPressItem?.(item)}
                    >
                        {item.cover ? (
                            <ImageBackground
                                source={{ uri: item.cover }}
                                style={styles.image}
                                imageStyle={styles.imageRadius}
                            >
                                {overlayContent}
                            </ImageBackground>
                        ) : (
                            <View style={[styles.image, styles.imagePlaceholder, styles.imageRadius]}>
                                <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
                                {overlayContent}
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            );
        },
        [CARD_WIDTH, CARD_HEIGHT, ITEM_SIZE, scrollX, onPressItem]
    );

    return (
        <View style={style}>
            <Animated.FlatList
                ref={flatListRef}
                data={loopedData}
                horizontal
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_SIZE}
                snapToAlignment="start"
                decelerationRate="normal"
                contentContainerStyle={{
                    paddingLeft: CARD_SPACING,
                    paddingRight: width - CARD_WIDTH - CARD_SPACING,
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                initialScrollIndex={startIndex}
                initialNumToRender={3}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews
            />
        </View>
    );
}

export default React.memo(Carousel);

const styles = StyleSheet.create({
    card: {
        borderRadius: RADIUS.xxl,
        overflow: 'hidden',
    } as const,
    image: {
        flex: 1,
        justifyContent: 'flex-end',
    } as const,
    imagePlaceholder: {
        backgroundColor: COLORS.surface3,
        alignItems: 'center',
        justifyContent: 'center',
    } as const,
    imageRadius: {
        borderRadius: RADIUS.xxl,
    } as const,
    gradient: {
        ...StyleSheet.absoluteFill,
        borderRadius: RADIUS.xxl,
    } as const,
    content: {
        padding: SPACING.lg,
    } as const,
    badge: {
        alignSelf: 'flex-start' as const,
        backgroundColor: COLORS.nexoBlue,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xxs,
        borderRadius: RADIUS.round,
        marginBottom: SPACING.xs,
    },
    badgeText: {
        color: COLORS.bodyBackground,
        fontSize: FONT.caption,
        fontWeight: '700' as const,
        fontFamily: FONT.family.bodyStrong,
    },
    category: {
        color: COLORS.nexoBlue,
        fontSize: FONT.small,
        marginBottom: SPACING.xs,
        fontFamily: FONT.family.body,
    },
    title: {
        color: COLORS.offWhite,
        fontSize: FONT.title,
        fontWeight: '700' as const,
        fontFamily: FONT.family.heading,
    },
});