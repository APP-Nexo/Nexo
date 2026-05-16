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
    ImageSourcePropType,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Game } from '../types/Game';
import { COLORS, SPACING, RADIUS, FONT } from '../constants';

type Props = {
    data: Game[];
    style?: ViewStyle;
    onPressItem?: (item: Game) => void;
};

const CARD_SPACING = SPACING.md;
const AUTO_SCROLL_INTERVAL = 7000;

function Carousel({ data, style, onPressItem }: Props) {
    const { width } = useWindowDimensions();

    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<Animated.FlatList<Game>>(null);
    const currentIndex = useRef(0);

    const CARD_WIDTH = useMemo(() => width * 0.68, [width]);
    const CARD_HEIGHT = useMemo(() => CARD_WIDTH * 1.3, [CARD_WIDTH]);
    const ITEM_SIZE = useMemo(
        () => CARD_WIDTH + CARD_SPACING,
        [CARD_WIDTH]
    );

    // animação de scroll
    const handleScroll = useMemo(
        () =>
            Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
            ),
        [scrollX]
    );

    // auto scroll
    useEffect(() => {
        if (!data?.length) return;

        const interval = setInterval(() => {
            currentIndex.current =
                currentIndex.current + 1 >= data.length
                    ? 0
                    : currentIndex.current + 1;

            flatListRef.current?.scrollToOffset({
                offset: currentIndex.current * ITEM_SIZE,
                animated: true,
            });
        }, AUTO_SCROLL_INTERVAL);

        return () => clearInterval(interval);
    }, [data.length, ITEM_SIZE]);

    const keyExtractor = useCallback(
        (item: Game, index: number) =>
            item.id ? item.id.toString() : index.toString(),
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

            const imageSource: ImageSourcePropType =
                typeof item.image === 'string'
                    ? { uri: item.image }
                    : item.image;

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
                        <ImageBackground
                            source={imageSource}
                            style={styles.image}
                            imageStyle={styles.imageRadius}
                        >
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

                                <Text style={styles.category}>
                                    {item.category}
                                </Text>

                                <Text
                                    style={styles.title}
                                    numberOfLines={2}
                                >
                                    {item.title}
                                </Text>
                            </View>
                        </ImageBackground>
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
                data={data}
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
    imageRadius: {
        borderRadius: RADIUS.xxl,
    } as const,
    gradient: {
        ...StyleSheet.absoluteFillObject,
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