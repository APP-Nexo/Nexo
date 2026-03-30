import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONT } from '../../constants';

type User = {
  username: string;
  bio: string;
  stats: {
    games: number;
    reviews: number;
    followers: number;
    following: number;
  };
};

export default function ProfileScreen() {
  const user: User = {
    username: '',
    bio: '',
    stats: {
      games: 0,
      reviews: 0,
      followers: 0,
      following: 0,
    },
  };

  const activities: any[] = [];
  const favorites: any[] = [];
  const logs: any[] = [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <View style={styles.avatar} />

          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="JOGOS" value={user.stats.games} />
          <Stat label="REVIEWS" value={user.stats.reviews} />
          <Stat label="SEGUIDORES" value={user.stats.followers} />
          <Stat label="SEGUINDO" value={user.stats.following} />
        </View>

        <Section title="JOGOS FAVORITOS" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {favorites.map((game, index) => (
            <GameCard key={index} data={game} />
          ))}
        </ScrollView>

        <Section title="ATIVIDADE RECENTE" />

        {activities.map((item, index) => (
          <ActivityCard key={index} data={item} />
        ))}

        <Section title="LOG DE JOGOS" />

        <View style={styles.grid}>
          {logs.map((game, index) => (
            <GameCard key={index} data={game} />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}





function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}





function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}





function GameCard({ data }: { data: any }) {
  return (
    <View style={styles.card}>
      <View style={styles.poster} />
      <Text style={styles.cardTitle}>{data?.title}</Text>
    </View>
  );
}





function ActivityCard({ data }: { data: any }) {
  return (
    <View style={styles.activity}>
      <View style={styles.thumb} />

      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{data?.title}</Text>
        <Text style={styles.activityText}>{data?.text}</Text>
      </View>
    </View>
  );
}





const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.text,
    fontSize: FONT.title,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: FONT.text,
  },

  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: 18,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  section: {
    color: COLORS.primary,
    fontSize: 12,
  },

  card: {
    width: 120,
    marginRight: 10,
  },
  poster: {
    height: 150,
    backgroundColor: '#111',
    borderRadius: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  activity: {
    flexDirection: 'row',
    gap: 10,
  },
  thumb: {
    width: 40,
    height: 60,
    backgroundColor: '#111',
  },
  activityTitle: {
    color: COLORS.text,
  },
  activityText: {
    color: COLORS.textSecondary,
  },
});