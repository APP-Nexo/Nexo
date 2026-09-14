import { useState, type ComponentProps } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '@/components/PrimaryButton';
import { COLORS, FONT, GLOW, RADIUS, SPACING } from '@/constants';
import { MOCK_USER } from '@/data/profileMocks';

const BIO_MAX_LENGTH = 150;

type AccountItem = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
};

const ACCOUNT_ITEMS: AccountItem[] = [
  {
    icon: 'lock-closed-outline',
    title: 'MUDAR SENHA',
    subtitle: 'Alterar sua senha de acesso',
  },
  {
    icon: 'notifications-outline',
    title: 'NOTIFICAÇÕES',
    subtitle: 'Gerenciar alertas e avisos',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'PRIVACIDADE',
    subtitle: 'Controle quem vê seu perfil',
  },
  {
    icon: 'language-outline',
    title: 'IDIOMA',
    subtitle: 'Português (BR)',
  },
];

function AccountCard({
  icon,
  title,
  subtitle,
  onPress,
}: AccountItem & { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.accountCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View style={styles.accountIcon}>
        <Ionicons name={icon} size={22} color={COLORS.nexoBlue} />
      </View>
      <View style={styles.accountText}>
        <Text style={styles.accountTitle}>{title}</Text>
        <Text style={styles.accountSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </Pressable>
  );
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [username, setUsername] = useState(MOCK_USER.username);
  const [bio, setBio] = useState(MOCK_USER.bio);

  function handleSave() {
    setUsername((value) => value.trim());
    Alert.alert('Perfil atualizado', 'As alterações foram salvas localmente.');
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bodyBackground} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>EDITAR PERFIL</Text>
            <Text style={styles.headerSubtitle}>INFORMAÇÕES PÚBLICAS</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fechar edição de perfil"
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.photoSection}>
          <View style={styles.avatarColumn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
            </View>
            <Text style={styles.photoLabel}>FOTO</Text>
          </View>

          <Pressable
            onPress={() => Alert.alert('Alterar foto', 'Upload de imagem disponível em breve.')}
            style={({ pressed }) => [styles.changePhoto, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
          >
            <Ionicons name="camera-outline" size={26} color={COLORS.nexoBlue} />
            <Text style={styles.changePhotoText}>ALTERAR FOTO</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NOME DE USUÁRIO</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholder="Seu nome de usuário"
              placeholderTextColor={COLORS.placeholder}
              selectionColor={COLORS.nexoBlue}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BIO</Text>
            <View style={styles.bioContainer}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                style={styles.bioInput}
                placeholder="Conte um pouco sobre você"
                placeholderTextColor={COLORS.placeholder}
                selectionColor={COLORS.nexoBlue}
                multiline
                maxLength={BIO_MAX_LENGTH}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {bio.length} / {BIO_MAX_LENGTH}
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="SALVAR ALTERAÇÕES"
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTA</Text>
          <View style={styles.accountList}>
            {ACCOUNT_ITEMS.map((item) => (
              <AccountCard
                key={item.title}
                {...item}
                onPress={() =>
                  item.title === 'MUDAR SENHA'
                    ? router.push('/profile/change-password')
                    : Alert.alert(item.title, 'Disponível em breve.')
                }
              />
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => Alert.alert('Apagar conta', 'Exclusão não disponível nesta etapa.')}
          style={({ pressed }) => [styles.deleteCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Apagar conta"
        >
          <View style={styles.deleteIcon}>
            <Ionicons name="trash-outline" size={22} color={COLORS.nexoPink} />
          </View>
          <Text style={styles.deleteText}>APAGAR CONTA</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.nexoPink} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bodyBackground,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.title,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: FONT.family.body,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 2,
    marginTop: SPACING.xxs,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.md,
  },
  avatarColumn: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.nexoBlue,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    ...GLOW.primary,
  },
  avatarText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.title,
    letterSpacing: 1,
  },
  photoLabel: {
    fontFamily: FONT.family.display,
    color: COLORS.textMuted,
    fontSize: FONT.micro,
    letterSpacing: 2,
  },
  changePhoto: {
    flex: 1,
    minHeight: 84,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  changePhotoText: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 1,
  },
  form: {
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 2,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: SPACING.md,
    color: COLORS.text,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
  },
  bioContainer: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
    padding: SPACING.md,
  },
  bioInput: {
    minHeight: 88,
    padding: 0,
    color: COLORS.text,
    fontFamily: FONT.family.body,
    fontSize: FONT.text,
    lineHeight: 21,
  },
  characterCount: {
    color: COLORS.textMuted,
    fontFamily: FONT.family.body,
    fontSize: FONT.caption,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  saveButton: {
    ...GLOW.primary,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.nexoBlue,
    fontSize: FONT.caption,
    letterSpacing: 2,
  },
  accountList: {
    gap: SPACING.xs,
  },
  accountCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    fontFamily: FONT.family.display,
    color: COLORS.text,
    fontSize: FONT.small,
    letterSpacing: 1,
  },
  accountSubtitle: {
    fontFamily: FONT.family.body,
    color: COLORS.textSecondary,
    fontSize: FONT.small,
  },
  deleteCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.nexoPink,
    backgroundColor: COLORS.surface,
  },
  deleteIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    flex: 1,
    fontFamily: FONT.family.display,
    color: COLORS.nexoPink,
    fontSize: FONT.small,
    letterSpacing: 1,
  },
});
