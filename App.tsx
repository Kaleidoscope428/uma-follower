import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { updateHomeScreenWidget } from './src/widgets/widget-service';
import { QoLTab } from './src/tabs/QoLTab';
import { AboutModal } from './src/components/AboutModal';
import { AvatarPickerModal, PRESET_AVATARS } from './src/components/AvatarPickerModal';

type Month = {
  year: number;
  month: number;
  total_fans?: number;
  monthly_gain?: number;
  active_days?: number;
  avg_daily?: number;
  avg_3d?: number;
  avg_7d?: number;
  avg_monthly?: number;
  rank?: number;
  circle_name?: string;
  club_rank?: number;
  club_rank_name?: string;
};

type Profile = {
  trainer?: {
    account_id?: string;
    name?: string;
    shame_score?: number;
    follower_num?: number;
    best_team_class?: number;
    team_class?: number;
    team_evaluation_point?: number;
    rank_score?: number;
    release_num_info?: Record<string, number> | string;
    trophy_num_info?: Record<string, number> | string;
    own_follow_num?: number;
    enable_circle_scout?: number | boolean;
    comment?: string;
  };
  circle?: {
    circle_id?: number;
    name?: string;
    member_count?: number;
    monthly_rank?: number;
    monthly_point?: number;
    last_month_rank?: number;
    last_month_point?: number;
    live_points?: number;
    live_rank?: number;
  } | null;
  circle_history?: {
    year: number;
    month: number;
    circle_name?: string;
    circle_rank?: number;
    circle_points?: number;
  }[];
  fan_history?: {
    monthly?: Month[];
    rolling?: {
      gain_3d?: number;
      gain_7d?: number;
      gain_30d?: number;
      rank_3d?: number;
      rank_7d?: number;
      rank_30d?: number;
    };
    alltime?: {
      total_fans?: number;
      active_days?: number;
      avg_day?: number;
      avg_week?: number;
      avg_month?: number;
      rank?: number;
      rank_total_fans?: number;
    };
  };
};

const SAMPLE_PROFILE: Profile = {
  trainer: {
    account_id: '859187447909',
    name: 'Uma Follower',
    shame_score: 42,
    follower_num: 12840,
    best_team_class: 6,
    team_class: 5,
    team_evaluation_point: 8421,
    rank_score: 184320,
    release_num_info: {
      card_num: 42,
      chara_story_num: 180,
      main_story_num: 28,
      voice_num: 520,
    },
    trophy_num_info: {
      g1: 24,
      g2: 38,
      g3: 45,
      ex: 12,
    },
    own_follow_num: 318,
    enable_circle_scout: 1,
    comment: 'Theo dõi hành trình và những con số đáng nhớ mỗi ngày.',
  },
  circle: {
    circle_id: 1,
    name: 'Dream Chasers',
    member_count: 27,
    monthly_rank: 12,
    monthly_point: 84260,
    last_month_rank: 18,
    last_month_point: 71940,
    live_points: 14820,
    live_rank: 9,
  },
  circle_history: [
    { year: 2026, month: 9, circle_name: 'Dream Chasers', circle_rank: 12, circle_points: 84260 },
    { year: 2026, month: 8, circle_name: 'Dream Chasers', circle_rank: 18, circle_points: 71940 },
    { year: 2026, month: 7, circle_name: 'Dream Chasers', circle_rank: 24, circle_points: 60420 },
  ],
  fan_history: {
    monthly: [
      {
        year: 2026,
        month: 9,
        total_fans: 12840,
        monthly_gain: 1260,
        active_days: 24,
        avg_daily: 52,
        avg_3d: 58,
        avg_7d: 61,
        avg_monthly: 52,
        rank: 38,
        circle_name: 'Dream Chasers',
        club_rank: 2,
        club_rank_name: 'A',
      },
      {
        year: 2026,
        month: 8,
        total_fans: 11580,
        monthly_gain: 980,
        active_days: 22,
        avg_daily: 45,
        avg_3d: 45,
        avg_7d: 48,
        avg_monthly: 45,
        rank: 51,
        circle_name: 'Dream Chasers',
        club_rank: 3,
        club_rank_name: 'A',
      },
      {
        year: 2026,
        month: 7,
        total_fans: 10600,
        monthly_gain: 740,
        active_days: 19,
        avg_daily: 39,
        avg_3d: 39,
        avg_7d: 42,
        avg_monthly: 39,
        rank: 68,
        circle_name: 'Dream Chasers',
        club_rank: 4,
        club_rank_name: 'B',
      },
    ],
    rolling: {
      gain_3d: 184,
      gain_7d: 412,
      gain_30d: 1260,
      rank_3d: 21,
      rank_7d: 27,
      rank_30d: 38,
    },
    alltime: {
      total_fans: 12840,
      active_days: 188,
      avg_day: 68,
      avg_week: 476,
      avg_month: 1260,
      rank: 38,
      rank_total_fans: 38,
    },
  },
};

const STORAGE_KEYS = {
  PLAYER_ID: '@uma_player_id',
  API_KEY: '@uma_api_key',
  LAST_REFRESH: '@uma_last_refresh',
  USER_AVATAR: '@uma_user_avatar',
};

const ENV_API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';
const COMMUNITY_API_KEY = 'uma_k_ZXqR3qvtctjVsU1SkZAvNaQ82BNbOTAZGLeqYa7i7mLlJF8h';
const profileUrl = (accountId: string) =>
  `https://uma.moe/api/v4/user/profile/${encodeURIComponent(accountId)}`;

// Safe number formatter
const num = (n?: number | string | null): string => {
  if (n === null || n === undefined) return '0';
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(val) ? '0' : val.toLocaleString('en-US');
};

// Safe initials extractor
const initials = (s?: string | null): string => {
  if (!s || typeof s !== 'string') return 'U';
  return (
    s
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0])
      .join('')
      .toUpperCase() || 'U'
  );
};

// Safe general value formatter
const formatInfo = (val: unknown): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return num(val);
  if (typeof val === 'string') return val.trim() || '—';
  if (typeof val === 'boolean') return val ? 'Đang bật' : 'Đang tắt';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return `${num(val.length)} mục`;
    }
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return '—';
    const numValues = entries.filter(([, v]) => typeof v === 'number');
    if (numValues.length > 0) {
      const sum = numValues.reduce((acc, [, v]) => acc + (v as number), 0);
      return `${num(sum)}`;
    }
    return `${num(entries.length)} mục`;
  }
  return String(val);
};

// Calculate milliseconds until next 12:00 or 00:00 (24:00)
const getNextRefreshInfo = (): { delay: number; targetTimeStr: string } => {
  const now = new Date();
  const next = new Date(now);
  const currentHour = now.getHours();

  if (currentHour < 12) {
    // Target is 12:00:00 today
    next.setHours(12, 0, 0, 0);
    return {
      delay: Math.max(1000, next.getTime() - now.getTime()),
      targetTimeStr: '12:00 hôm nay',
    };
  } else {
    // Target is 00:00:00 next day (midnight / 24h)
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return {
      delay: Math.max(1000, next.getTime() - now.getTime()),
      targetTimeStr: '00:00 (24h) đêm nay',
    };
  }
};

const formatTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${h}:${m}:${s} - ${d}/${mo}`;
};

// Circle Rank Assets & Mapper
const CIRCLE_RANK_ASSETS: Record<string, number> = {
  SS: require('./assets/circle_rank/cc-ss.png'),
  'S+': require('./assets/circle_rank/cc-splus.png'),
  S: require('./assets/circle_rank/cc-s.png'),
  'A+': require('./assets/circle_rank/cc-aplus.png'),
  A: require('./assets/circle_rank/cc-a.png'),
  'B+': require('./assets/circle_rank/cc-bplus.png'),
  B: require('./assets/circle_rank/cc-b.png'),
  'C+': require('./assets/circle_rank/cc-cplus.png'),
  C: require('./assets/circle_rank/cc-c.png'),
  'D+': require('./assets/circle_rank/cc-dplus.png'),
  D: require('./assets/circle_rank/cc-d.png'),
};

const getCircleRankInfo = (
  rank?: number | string | null
): { rankName: string; image: number } | null => {
  if (rank === null || rank === undefined) return null;
  const numRank = typeof rank === 'string' ? parseInt(rank, 10) : rank;
  if (isNaN(numRank) || numRank <= 0) return null;

  if (numRank <= 10) return { rankName: 'SS', image: CIRCLE_RANK_ASSETS.SS };
  if (numRank <= 30) return { rankName: 'S+', image: CIRCLE_RANK_ASSETS['S+'] };
  if (numRank <= 100) return { rankName: 'S', image: CIRCLE_RANK_ASSETS.S };
  if (numRank <= 500) return { rankName: 'A+', image: CIRCLE_RANK_ASSETS['A+'] };
  if (numRank <= 1000) return { rankName: 'A', image: CIRCLE_RANK_ASSETS.A };
  if (numRank <= 3000) return { rankName: 'B+', image: CIRCLE_RANK_ASSETS['B+'] };
  if (numRank <= 5000) return { rankName: 'B', image: CIRCLE_RANK_ASSETS.B };
  if (numRank <= 7000) return { rankName: 'C+', image: CIRCLE_RANK_ASSETS['C+'] };
  if (numRank <= 10000) return { rankName: 'C', image: CIRCLE_RANK_ASSETS.C };
  return { rankName: 'D+', image: CIRCLE_RANK_ASSETS['D+'] };
};

const renderAvatarImage = (avatar: string | null, initialsText: string, textStyle?: object) => {
  if (!avatar) {
    return <Text style={textStyle || styles.avatarText}>{initialsText}</Text>;
  }
  if (avatar.startsWith('preset:')) {
    const presetId = avatar.replace('preset:', '');
    const preset = PRESET_AVATARS.find((p) => p.id === presetId);
    if (preset) {
      return <Image source={preset.source} style={styles.avatarFullImg} resizeMode="cover" />;
    }
  }
  return <Image source={{ uri: avatar }} style={styles.avatarFullImg} resizeMode="cover" />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<Profile>(SAMPLE_PROFILE);
  const [playerId, setPlayerId] = useState('859187447909');
  const [apiKey, setApiKey] = useState(ENV_API_KEY);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Chưa đồng bộ');
  const [nextRefreshTarget, setNextRefreshTarget] = useState<string>('12:00 / 24:00');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pulse] = useState(() => new Animated.Value(0.45));

  const handleUpdateAvatar = useCallback(
    async (newAvatar: string | null) => {
      setUserAvatar(newAvatar);
      try {
        if (newAvatar) {
          await AsyncStorage.setItem(STORAGE_KEYS.USER_AVATAR, newAvatar);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.USER_AVATAR);
        }

        const latestMonth = data.fan_history?.monthly?.[0];
        void updateHomeScreenWidget({
          trainerName: data.trainer?.name ? String(data.trainer.name) : 'Uma Trainer',
          totalFans: num(data.trainer?.follower_num),
          monthlyGain: `+${num(latestMonth?.monthly_gain)}`,
          rank: `#${num(latestMonth?.rank ?? data.fan_history?.alltime?.rank)}`,
          lastUpdated: lastRefreshedAt.split(' - ')[0] || '--:--',
          avatarUri: newAvatar,
        });
      } catch {
        // Fallback
      }
    },
    [data, lastRefreshedAt]
  );

  // Pulse animation for LIVE badge
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [pulse]);

  const loadData = useCallback(
    async (targetId?: string, targetKey?: string) => {
      const activeId = (targetId ?? playerId).trim();
      const activeKey = (targetKey ?? apiKey).trim() || ENV_API_KEY;

      if (!activeId) {
        setError('Hãy nhập Player ID (UID) trước khi tải profile.');
        return;
      }

      if (!activeKey) {
        setError('Chưa cấu hình API Key — đang hiển thị dữ liệu mẫu.');
        setData(SAMPLE_PROFILE);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch(profileUrl(activeId), {
          headers: {
            'X-API-Key': activeKey,
          },
        });

        if (!res.ok) {
          throw new Error(`Không tìm thấy Player ID (${activeId}) hoặc API lỗi (${res.status}).`);
        }

        const json = (await res.json()) as Profile;
        if (!json || (!json.trainer && !json.fan_history)) {
          throw new Error('Dữ liệu trả về không đúng định dạng profile.');
        }

        setData(json);
        const nowStr = formatTime(new Date());
        setLastRefreshedAt(nowStr);
        void AsyncStorage.setItem(STORAGE_KEYS.LAST_REFRESH, nowStr);

        // Sync Home Screen Widget
        const latestMonth = json.fan_history?.monthly?.[0];
        void updateHomeScreenWidget({
          trainerName: json.trainer?.name ? String(json.trainer.name) : 'Uma Trainer',
          totalFans: num(json.trainer?.follower_num),
          monthlyGain: `+${num(latestMonth?.monthly_gain)}`,
          rank: `#${num(latestMonth?.rank ?? json.fan_history?.alltime?.rank)}`,
          lastUpdated: nowStr.split(' - ')[0],
          avatarUri: userAvatar,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu từ máy chủ.');
      } finally {
        setLoading(false);
      }
    },
    [playerId, apiKey, userAvatar]
  );

  // Schedule auto refresh at 12h and 24h (00h) local time
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const runSchedule = () => {
      if (timerId) clearTimeout(timerId);
      const { delay, targetTimeStr } = getNextRefreshInfo();
      setNextRefreshTarget(targetTimeStr);

      timerId = setTimeout(() => {
        void loadData();
        runSchedule();
      }, delay);
    };

    runSchedule();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runSchedule();
      }
    });

    return () => {
      if (timerId) clearTimeout(timerId);
      subscription.remove();
    };
  }, [loadData]);

  // Load stored settings on mount
  useEffect(() => {
    const restoreSettings = async () => {
      try {
        const [savedId, savedKey, savedLastRefresh, savedAvatar] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PLAYER_ID),
          AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_REFRESH),
          AsyncStorage.getItem(STORAGE_KEYS.USER_AVATAR),
        ]);

        const finalId = savedId || '859187447909';
        const finalKey = savedKey !== null ? savedKey : ENV_API_KEY;

        setPlayerId(finalId);
        setApiKey(finalKey);
        if (savedAvatar) setUserAvatar(savedAvatar);

        const latestMonth = data.fan_history?.monthly?.[0] || SAMPLE_PROFILE.fan_history?.monthly?.[0];
        void updateHomeScreenWidget({
          trainerName: data.trainer?.name ? String(data.trainer.name) : 'Uma Trainer',
          totalFans: num(data.trainer?.follower_num || SAMPLE_PROFILE.trainer?.follower_num),
          monthlyGain: `+${num(latestMonth?.monthly_gain)}`,
          rank: `#${num(latestMonth?.rank ?? data.fan_history?.alltime?.rank)}`,
          lastUpdated: savedLastRefresh ? savedLastRefresh.split(' - ')[0] : '--:--',
          avatarUri: savedAvatar,
        });

        if (finalKey) {
          void loadData(finalId, finalKey);
        }
      } catch {
        // Fallback
      }
    };

    void restoreSettings();
  }, [loadData]);

  const latest = data.fan_history?.monthly?.[0];
  const labels = ['Tổng quan', 'Tăng trưởng', 'Hồ sơ', 'Tiện ích', 'Cài đặt'];
  const hasActiveKey = Boolean((apiKey || ENV_API_KEY).trim());

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('./assets/riceicon.png')}
              style={styles.headerLogo}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.brand}>UMA FOLLOWER</Text>
              <Text style={styles.title}>{labels[tab]}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.apiStatusBadge, hasActiveKey ? styles.badgeActive : styles.badgeSample]}>
              <View style={[styles.statusDot, hasActiveKey ? styles.dotGreen : styles.dotYellow]} />
              <Text style={styles.statusText}>{hasActiveKey ? 'API Live' : 'Bản mẫu'}</Text>
            </View>
            <Pressable
              onPress={() => void loadData()}
              style={styles.refreshBtn}
              accessibilityLabel="Làm mới nhanh"
            >
              {loading ? (
                <ActivityIndicator color="#07171B" size="small" />
              ) : (
                <Text style={styles.refreshBtnText}>↻</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Error notification */}
        {error ? (
          <Pressable onPress={() => void loadData()} style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retry}>CHẠM ĐỂ THỬ LẠI HOẶC VÀO TAB ⚙ CÀI ĐẶT</Text>
          </Pressable>
        ) : null}

        {/* Loading Indicator */}
        {loading ? (
          <View style={styles.load}>
            <ActivityIndicator color="#7DF3C0" />
            <Text style={styles.loadText}>Đang đồng bộ dữ liệu profile...</Text>
          </View>
        ) : null}

        {/* Tab views */}
        {tab === 0 ? (
          <Overview
            data={data}
            item={latest}
            pulse={pulse}
            userAvatar={userAvatar}
            onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          />
        ) : null}
        {tab === 1 ? <Growth data={data} /> : null}
        {tab === 2 ? (
          <Details
            data={data}
            userAvatar={userAvatar}
            onOpenAvatarPicker={() => setShowAvatarPicker(true)}
          />
        ) : null}
        {tab === 3 ? <QoLTab /> : null}
        {tab === 4 ? (
          <SettingsTab
            key={`${playerId}_${apiKey}`}
            playerId={playerId}
            apiKey={apiKey}
            userAvatar={userAvatar}
            loading={loading}
            lastRefreshedAt={lastRefreshedAt}
            nextRefreshTarget={nextRefreshTarget}
            hasActiveKey={hasActiveKey}
            onOpenAvatarPicker={() => setShowAvatarPicker(true)}
            onSave={(newId, newKey) => {
              setPlayerId(newId);
              setApiKey(newKey);
              void AsyncStorage.setItem(STORAGE_KEYS.PLAYER_ID, newId);
              void AsyncStorage.setItem(STORAGE_KEYS.API_KEY, newKey);
              void loadData(newId, newKey);
            }}
            onRefresh={() => void loadData()}
          />
        ) : null}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={[styles.tabs, { paddingBottom: Math.max(10, insets.bottom + 6) }]}>
        {['⌂', '↗', '◎', '⏰', '⚙'].map((icon, i) => (
          <Pressable
            key={icon}
            onPress={() => setTab(i)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === i }}
          >
            <Text style={[styles.tabIcon, tab === i && styles.active]}>{icon}</Text>
            <Text style={[styles.tabLabel, tab === i && styles.active]}>{labels[i]}</Text>
          </Pressable>
        ))}
      </View>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatar={userAvatar}
        trainerName={data.trainer?.name ? String(data.trainer.name) : 'Huấn luyện viên'}
        onClose={() => setShowAvatarPicker(false)}
        onSelectAvatar={(uri) => void handleUpdateAvatar(uri)}
      />
    </SafeAreaView>
  );
}

// TAB 3: SETTINGS & REFRESH (Cài đặt & Làm mới)
function SettingsTab({
  playerId,
  apiKey,
  userAvatar,
  loading,
  lastRefreshedAt,
  nextRefreshTarget,
  hasActiveKey,
  onOpenAvatarPicker,
  onSave,
  onRefresh,
}: {
  playerId: string;
  apiKey: string;
  userAvatar: string | null;
  loading: boolean;
  lastRefreshedAt: string;
  nextRefreshTarget: string;
  hasActiveKey: boolean;
  onOpenAvatarPicker: () => void;
  onSave: (id: string, key: string) => void;
  onRefresh: () => void;
}) {
  const [inputUid, setInputUid] = useState(playerId);
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleSave = () => {
    const finalUid = inputUid.trim() || '859187447909';
    const finalKey = inputKey.trim();
    onSave(finalUid, finalKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <View style={styles.settingsContainer}>
      {/* Auto Refresh Scheduler Card */}
      <View style={styles.autoScheduleCard}>
        <View style={styles.autoScheduleHeader}>
          <Text style={styles.autoScheduleIcon}>⏱️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoScheduleTitle}>Tự động làm mới định kỳ</Text>
            <Text style={styles.autoScheduleSubtitle}>
              Tự động đồng bộ lúc 12:00 và 24:00 (00:00) theo giờ điện thoại
            </Text>
          </View>
        </View>

        <View style={styles.scheduleDivider} />

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Lần cập nhật trước:</Text>
          <Text style={styles.scheduleValue}>{lastRefreshedAt}</Text>
        </View>

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Lần cập nhật tiếp theo:</Text>
          <Text style={[styles.scheduleValue, { color: '#7DF3C0' }]}>{nextRefreshTarget}</Text>
        </View>

        {/* Manual Refresh Button */}
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          style={[styles.bigRefreshBtn, loading && { opacity: 0.7 }]}
        >
          {loading ? (
            <ActivityIndicator color="#07171B" size="small" />
          ) : (
            <>
              <Text style={styles.bigRefreshIcon}>↻</Text>
              <Text style={styles.bigRefreshText}>LÀM MỚI DỮ LIỆU NGAY</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Trainer Avatar Setting */}
      <Heading title="Ảnh đại diện Trainer" note="Avatar & Widget" />
      <Pressable style={styles.aboutMenuItem} onPress={onOpenAvatarPicker}>
        <View style={styles.aboutMenuIconWrapper}>
          {renderAvatarImage(userAvatar, 'U')}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutMenuTitle}>Tùy chỉnh ảnh đại diện</Text>
          <Text style={styles.aboutMenuSub}>
            {userAvatar ? 'Đang dùng ảnh tùy chỉnh' : 'Đang dùng mặc định'} • Chạm để đổi ảnh
          </Text>
        </View>
        <Text style={styles.aboutMenuArrow}>›</Text>
      </Pressable>

      {/* Account UID & API Key Configuration */}
      <Heading title="Cấu hình tài khoản" note="Trainer & Key" />
      <View style={styles.configCard}>
        {/* UID */}
        <Text style={styles.inputTitle}>PLAYER ID (UID)</Text>
        <TextInput
          value={inputUid}
          onChangeText={setInputUid}
          style={styles.textInput}
          placeholder="Nhập Player ID"
          placeholderTextColor="#5E7F7C"
          keyboardType="number-pad"
        />

        {/* API Key */}
        <View style={styles.inputHeaderRow}>
          <Text style={styles.inputTitle}>X-API-KEY</Text>
          <Pressable onPress={() => setShowKey(!showKey)}>
            <Text style={styles.toggleKeyBtn}>{showKey ? 'ẨN MẬT KHẨU' : 'HIỆN MẬT KHẨU'}</Text>
          </Pressable>
        </View>

        <TextInput
          value={inputKey}
          onChangeText={setInputKey}
          style={styles.textInput}
          placeholder="Nhập API Key hoặc để trống dùng mặc định"
          placeholderTextColor="#5E7F7C"
          secureTextEntry={!showKey}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          <Pressable style={styles.presetChip} onPress={() => setInputUid('859187447909')}>
            <Text style={styles.presetChipText}>ID Mẫu</Text>
          </Pressable>

          <Pressable
            style={[styles.presetChip, styles.communityKeyChip]}
            onPress={() => setInputKey(COMMUNITY_API_KEY)}
          >
            <Text style={[styles.presetChipText, styles.communityKeyText]}>🔑 API Cộng đồng</Text>
          </Pressable>

          <Pressable style={styles.presetChip} onPress={() => setInputKey('')}>
            <Text style={styles.presetChipText}>Xóa Key</Text>
          </Pressable>
        </View>

        {/* Save Button */}
        <Pressable onPress={handleSave} style={styles.saveConfigBtn}>
          <Text style={styles.saveConfigBtnText}>
            {savedSuccess ? '✓ ĐÃ LƯU VÀ ĐỒNG BỘ' : 'LƯU & ĐỒNG BỘ CẤU HÌNH'}
          </Text>
        </Pressable>
      </View>

      {/* Home Screen Widget Guide */}
      <Heading title="Widget màn hình chính" note="Android Widget" />
      <View style={styles.configCard}>
        <Text style={styles.widgetGuideTitle}>📱 Hướng dẫn thêm Widget:</Text>
        <Text style={styles.widgetGuideStep}>
          1. Ra màn hình chính điện thoại, <Text style={styles.highlightText}>nhấn giữ khoảng trống</Text>.
        </Text>
        <Text style={styles.widgetGuideStep}>
          2. Chọn mục <Text style={styles.highlightText}>Tiện ích (Widgets)</Text>.
        </Text>
        <Text style={styles.widgetGuideStep}>
          3. Tìm <Text style={styles.highlightText}>Uma Follower</Text> và kéo thả ra màn hình.
        </Text>
        <Text style={styles.widgetGuideNote}>
          * Widget sẽ tự động hiển thị Avatar Trainer, Tên Trainer, Số Fan tháng, Người theo dõi và tự cập nhật mỗi khi dữ liệu được làm mới.
        </Text>
      </View>

      {/* Information status */}
      <Heading title="Trạng thái kết nối" note="uma.moe" />
      <View style={styles.statusBox}>
        <View style={styles.statusBoxRow}>
          <Text style={styles.statusBoxLabel}>Máy chủ API:</Text>
          <Text style={styles.statusBoxVal}>https://uma.moe/api/v4</Text>
        </View>
        <View style={styles.statusBoxRow}>
          <Text style={styles.statusBoxLabel}>Chế độ hoạt động:</Text>
          <Text style={[styles.statusBoxVal, { color: hasActiveKey ? '#7DF3C0' : '#FFD08A' }]}>
            {hasActiveKey ? 'Live API (Trực tuyến)' : 'Dữ liệu mẫu (Demo)'}
          </Text>
        </View>
        <View style={styles.statusBoxRow}>
          <Text style={styles.statusBoxLabel}>UID đang theo dõi:</Text>
          <Text style={styles.statusBoxVal}>{playerId}</Text>
        </View>
      </View>

      {/* App Info & Author Menu Item */}
      <Heading title="Thông tin & Tác giả" note="About & Credits" />
      <Pressable style={styles.aboutMenuItem} onPress={() => setShowAbout(true)}>
        <View style={styles.aboutMenuIconWrapper}>
          <Image
            source={require('./assets/riceicon.png')}
            style={styles.aboutMenuIconImg}
            resizeMode="cover"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aboutMenuTitle}>Thông tin ứng dụng & Tác giả</Text>
          <Text style={styles.aboutMenuSub}>Lê "K4leido2scop8" Anh Tiến • Uma.moe API • v1.0.0</Text>
        </View>
        <Text style={styles.aboutMenuArrow}>›</Text>
      </Pressable>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </View>
  );
}

// Overview Tab
function Overview({
  data,
  item,
  pulse,
  userAvatar,
  onOpenAvatarPicker,
}: {
  data: Profile;
  item?: Month;
  pulse: Animated.Value;
  userAvatar: string | null;
  onOpenAvatarPicker: () => void;
}) {
  const [copiedUid, setCopiedUid] = useState(false);
  const trainer = data.trainer;
  const circle = data.circle;
  const fan_history = data.fan_history;

  const circleRankNum = circle?.live_rank ?? circle?.monthly_rank;
  const circleRankInfo = getCircleRankInfo(circleRankNum);

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.glow1} />
        <View style={styles.glow2} />
        <View style={styles.heroTop}>
          <View style={styles.live}>
            <Animated.View style={[styles.dot, { opacity: pulse }]} />
            <Text style={styles.liveText}>LIVE PROFILE</Text>
          </View>
          <Text style={styles.heroRank}>#{num(fan_history?.alltime?.rank)}</Text>
        </View>

        <View style={styles.heroTrainerRow}>
          <Pressable style={styles.heroAvatarWrapper} onPress={onOpenAvatarPicker}>
            {renderAvatarImage(userAvatar, initials(trainer?.name))}
            <View style={styles.heroAvatarEditBadge}>
              <Text style={styles.heroAvatarEditText}>✎</Text>
            </View>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{trainer?.name ? String(trainer.name) : 'Huấn luyện viên'}</Text>
            <View style={styles.idRow}>
              <Text style={styles.id}>ID · {trainer?.account_id ? String(trainer.account_id) : '—'}</Text>
              {trainer?.account_id ? (
                <Pressable
                  onPress={() => {
                    void Clipboard.setStringAsync(String(trainer.account_id));
                    setCopiedUid(true);
                    setTimeout(() => setCopiedUid(false), 2000);
                  }}
                  style={[styles.copyUidBtn, copiedUid && styles.copyUidBtnSuccess]}
                  accessibilityLabel="Sao chép Player ID"
                >
                  <Text style={[styles.copyUidText, copiedUid && styles.copyUidTextSuccess]}>
                    {copiedUid ? '✓ ĐÃ CHÉP' : 'SAO CHÉP'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.comment}>
          {typeof trainer?.comment === 'string' && trainer.comment ? trainer.comment : 'Chưa có lời giới thiệu.'}
        </Text>
        <View style={styles.heroFoot}>
          <View>
            <Text style={styles.overline}>NGƯỜI THEO DÕI</Text>
            <Text style={styles.fans}>{num(trainer?.follower_num)}</Text>
          </View>
          <View style={styles.class}>
            <Text style={styles.classTop}>TEAM</Text>
            <Text style={styles.classValue}>C{trainer?.team_class !== undefined ? String(trainer.team_class) : '-'}</Text>
          </View>
        </View>
      </View>

      <Heading title="Thống kê fan" note="Cập nhật mới nhất" />
      <View style={styles.grid}>
        <Metric icon="↗" value={`+${num(item?.monthly_gain)}`} label="Tháng này" color="#7DF3C0" />
        <Metric icon="7" value={`+${num(fan_history?.rolling?.gain_7d)}`} label="7 ngày" color="#91C8FF" />
        <Metric icon="3" value={`+${num(fan_history?.rolling?.gain_3d)}`} label="3 ngày" color="#E5B8FF" />
        <Metric icon="#" value={`#${num(item?.rank)}`} label="Hạng tháng" color="#FFD08A" />
      </View>

      <Heading
        title="Circle"
        note={
          circleRankInfo
            ? `Rank ${circleRankInfo.rankName} • Hạng #${num(circle?.live_rank ?? circle?.monthly_rank)}`
            : `Hạng #${num(circle?.live_rank ?? circle?.monthly_rank)}`
        }
      />
      <View style={styles.circle}>
        <View style={styles.mark}>
          {circleRankInfo ? (
            <Image
              source={circleRankInfo.image}
              style={styles.circleRankAvatar}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.markText}>{initials(circle?.name)}</Text>
          )}
        </View>
        <View style={styles.circleInfo}>
          <View style={styles.circleTitleRow}>
            <Text numberOfLines={1} style={styles.circleName}>
              {circle?.name ? String(circle.name) : 'Chưa tham gia Circle'}
            </Text>
            {circleRankInfo ? (
              <View style={styles.tierTag}>
                <Text style={styles.tierTagText}>{circleRankInfo.rankName}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.circleMeta}>
            {num(circle?.member_count)} thành viên · {num(circle?.live_points ?? circle?.monthly_point)} tổng fan
          </Text>
        </View>
        <View style={styles.circleRight}>
          <Text style={styles.circleRank}>#{circle?.monthly_rank !== undefined ? num(circle.monthly_rank) : '-'}</Text>
          <Text style={styles.rankLabel}>THÁNG</Text>
        </View>
      </View>

      <Heading title="Widget xem nhanh" note="Preview" />
      <Widget trainer={trainer} gain={item?.monthly_gain ?? 0} avatarUri={userAvatar} />
    </>
  );
}

// Growth Tab
function Growth({ data }: { data: Profile }) {
  const monthly = data.fan_history?.monthly || [];
  const rolling = data.fan_history?.rolling || {};
  const alltime = data.fan_history?.alltime || {};
  const circleHistory = data.circle_history || [];

  const maxGain = Math.max(...monthly.map((x) => x.monthly_gain || 0), 1);

  return (
    <>
      <View style={styles.total}>
        <Text style={styles.totalOver}>THÀNH TÍCH TÍCH LŨY</Text>
        <Text style={styles.totalValue}>{num(alltime.total_fans)}</Text>
        <Text style={styles.totalCaption}>fans · hạng tổng #{num(alltime.rank_total_fans)}</Text>
        <View style={styles.totalLine} />
        <View style={styles.totalStats}>
          <Stat label="TB / NGÀY" value={num(alltime.avg_day)} />
          <Stat label="NGÀY ACTIVE" value={num(alltime.active_days)} />
          <Stat label="TB / THÁNG" value={num(alltime.avg_month)} />
        </View>
      </View>

      <Heading title="Tăng theo tháng" note={`${monthly.length} kỳ gần nhất`} />
      <View style={styles.card}>
        {monthly.length > 0 ? (
          monthly.map((x, i) => (
            <View key={`${x.year}-${x.month}`} style={styles.growth}>
              <View style={styles.growthTop}>
                <Text style={styles.month}>
                  {String(x.month).padStart(2, '0')}/{x.year}
                </Text>
                <Text style={styles.gain}>+{num(x.monthly_gain)}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    i === 0 && styles.barActive,
                    { width: `${Math.max(8, ((x.monthly_gain || 0) / maxGain) * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.growthBottom}>
                <Text style={styles.sub}>
                  {num(x.total_fans)} fan · {x.active_days || 0} ngày active
                </Text>
                <Text style={styles.sub}>#{num(x.rank)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Chưa có lịch sử tháng.</Text>
        )}
      </View>

      <Heading title="Mốc theo dõi" note="Rolling" />
      <View style={styles.rolling}>
        {[
          [rolling.gain_3d, '3 ngày', rolling.rank_3d],
          [rolling.gain_7d, '7 ngày', rolling.rank_7d],
          [rolling.gain_30d, '30 ngày', rolling.rank_30d],
        ].map(([v, label, rank]) => (
          <View key={String(label)}>
            <Text style={styles.rollValue}>+{num(v as number)}</Text>
            <Text style={styles.rollLabel}>{String(label)}</Text>
            <Text style={styles.rollRank}>#{num(rank as number)}</Text>
          </View>
        ))}
      </View>

      <Heading title="Circle theo tháng" note={data.circle?.name || 'Lịch sử Circle'} />
      <View style={styles.card}>
        {circleHistory.length > 0 ? (
          circleHistory.slice(0, 4).map((x, i) => {
            const hRankInfo = getCircleRankInfo(x.circle_rank);
            return (
              <View key={`${x.year}-${x.month}`} style={styles.history}>
                <View style={[styles.accent, i === 0 && styles.accentActive]} />
                {hRankInfo ? (
                  <Image source={hRankInfo.image} style={styles.historyRankIcon} resizeMode="contain" />
                ) : null}
                <Text style={styles.historyMonth}>
                  {String(x.month).padStart(2, '0')}/{x.year}
                </Text>
                <Text numberOfLines={1} style={styles.historyName}>
                  {x.circle_name ? String(x.circle_name) : '—'}
                </Text>
                <Text style={styles.historyPoints}>{num(x.circle_points)}</Text>
                <Text style={styles.historyRank}>#{num(x.circle_rank)}</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>Không có dữ liệu Circle lịch sử.</Text>
        )}
      </View>
    </>
  );
}

// Details Tab (Hồ sơ)
function Details({
  data,
  userAvatar,
  onOpenAvatarPicker,
}: {
  data: Profile;
  userAvatar: string | null;
  onOpenAvatarPicker: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);
  const trainer = data.trainer;
  const circle = data.circle;

  const releaseInfo = trainer?.release_num_info;
  const trophyInfo = trainer?.trophy_num_info;

  return (
    <>
      <View style={styles.identity}>
        <Pressable style={styles.avatar} onPress={onOpenAvatarPicker}>
          {renderAvatarImage(userAvatar, initials(trainer?.name))}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditText}>ĐỔI ẢNH</Text>
          </View>
        </Pressable>
        <Text style={styles.identityName}>{trainer?.name ? String(trainer.name) : 'Huấn luyện viên'}</Text>
        <View style={styles.idRowCenter}>
          <Text style={styles.identityId}>TRAINER ID · {trainer?.account_id ? String(trainer.account_id) : '—'}</Text>
          {trainer?.account_id ? (
            <Pressable
              onPress={() => {
                void Clipboard.setStringAsync(String(trainer.account_id));
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
              }}
              style={[styles.copyUidBtn, copiedId && styles.copyUidBtnSuccess]}
              accessibilityLabel="Sao chép Trainer ID"
            >
              <Text style={[styles.copyUidText, copiedId && styles.copyUidTextSuccess]}>
                {copiedId ? '✓ ĐÃ CHÉP' : 'SAO CHÉP'}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.identityComment}>
          {typeof trainer?.comment === 'string' && trainer.comment ? trainer.comment : 'Chưa có lời giới thiệu.'}
        </Text>
      </View>

      <Heading title="Trainer" note="Thành tích" />
      <List
        rows={[
          ['Rank score', num(trainer?.rank_score)],
          ['Team evaluation', num(trainer?.team_evaluation_point)],
          ['Team class hiện tại', trainer?.team_class !== undefined && trainer?.team_class !== null ? `Class ${trainer.team_class}` : '—'],
          ['Best team class', trainer?.best_team_class !== undefined && trainer?.best_team_class !== null ? `Class ${trainer.best_team_class}` : '—'],
          ['Release (Mở khóa)', releaseInfo],
          ['Trophy (Cúp)', trophyInfo],
        ]}
      />

      {/* Breakdown detail badges if trophy/release are objects */}
      {typeof trophyInfo === 'object' && trophyInfo !== null && Object.keys(trophyInfo).length > 0 ? (
        <>
          <Heading title="Chi tiết Cúp" note="Trophy Collection" />
          <View style={styles.tagGrid}>
            {Object.entries(trophyInfo).map(([k, v]) => {
              const lower = k.toLowerCase().trim();
              let label = k.toUpperCase();
              if (lower === 'grade_1' || lower === 'g1') label = 'G1';
              else if (lower === 'grade_2' || lower === 'g2') label = 'G2';
              else if (lower === 'grade_3' || lower === 'g3') label = 'G3';
              else if (lower === 'grade_ex' || lower === 'ex') label = 'EX';

              return (
                <View key={k} style={styles.tagItem}>
                  <Text style={styles.tagLabel}>{label}</Text>
                  <Text style={styles.tagValue}>{num(v as number)}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {typeof releaseInfo === 'object' && releaseInfo !== null && Object.keys(releaseInfo).length > 0 ? (
        <>
          <Heading title="Chi tiết Mở khóa" note="Release Stats" />
          <View style={styles.tagGrid}>
            {Object.entries(releaseInfo).map(([k, v]) => (
              <View key={k} style={styles.tagItem}>
                <Text numberOfLines={1} style={styles.tagLabel}>
                  {k.replace(/_num$/, '').replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.tagValue}>{num(v as number)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Heading title="Theo dõi" note="Fan & Circle" />
      <List
        rows={[
          ['Tổng người theo dõi', num(trainer?.follower_num)],
          ['Đang theo dõi', num(trainer?.own_follow_num)],
          ['Circle', circle?.name ? String(circle.name) : 'Chưa tham gia'],
          ['Circle scout', trainer?.enable_circle_scout ? 'Đang bật' : 'Đang tắt'],
          ['Shame score', num(trainer?.shame_score)],
        ]}
      />
    </>
  );
}

// Helper Components
function Heading({ title, note }: { title: string; note: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.headingText}>{title}</Text>
      <Text style={styles.headingNote}>{note}</Text>
    </View>
  );
}

function Metric({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: color }]}>
        <Text style={styles.metricIconText}>{icon}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Widget({
  trainer,
  gain,
  avatarUri,
}: {
  trainer?: Profile['trainer'];
  gain: number;
  avatarUri?: string | null;
}) {
  const getAvatarSource = () => {
    if (!avatarUri) {
      return require('./assets/example_avt/avt.jpg');
    }
    if (avatarUri.startsWith('preset:')) {
      const presetId = avatarUri.replace('preset:', '');
      const preset = PRESET_AVATARS.find((p) => p.id === presetId);
      if (preset) return preset.source;
      return require('./assets/example_avt/avt.jpg');
    }
    return { uri: avatarUri };
  };

  return (
    <View style={styles.widget}>
      <View style={styles.widgetGlow} />
      <View style={styles.widgetTop}>
        <Text style={styles.widgetBrand}>UMA · FOLLOWER</Text>
        <Text style={styles.widgetArrow}>↗</Text>
      </View>
      <View style={styles.widgetCenterRow}>
        <Image source={getAvatarSource()} style={styles.widgetAvatarImg} resizeMode="cover" />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.widgetName}>
            {trainer?.name ? String(trainer.name) : 'Uma Trainer'}
          </Text>
          <Text style={styles.widgetId}>#{trainer?.account_id ? String(trainer.account_id) : '859187447909'}</Text>
        </View>
      </View>
      <View style={styles.widgetFoot}>
        <View>
          <Text style={styles.widgetLabel}>FAN THÁNG NÀY</Text>
          <Text style={styles.widgetGain}>+{num(gain)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.widgetLabel}>NGƯỜI THEO DÕI</Text>
          <Text style={styles.widgetTotalFans}>{num(trainer?.follower_num)}</Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalStatItem}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function List({ rows }: { rows: [string, unknown][] }) {
  return (
    <View style={styles.list}>
      {rows.map(([a, b]) => {
        const textValue = formatInfo(b);
        return (
          <View key={a} style={styles.row}>
            <Text style={styles.rowLabel}>{a}</Text>
            <Text numberOfLines={1} style={styles.rowValue}>
              {textValue}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#07171B',
  },
  content: {
    padding: 20,
    paddingBottom: 26,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#215357',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#F4FAF8',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 2,
  },
  refreshBtn: {
    alignItems: 'center',
    backgroundColor: '#7DF3C0',
    borderRadius: 14,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  refreshBtnText: {
    color: '#07171B',
    fontSize: 20,
    fontWeight: '800',
  },
  apiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: 'rgba(125, 243, 192, 0.15)',
  },
  badgeSample: {
    backgroundColor: 'rgba(255, 208, 138, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#7DF3C0',
  },
  dotYellow: {
    backgroundColor: '#FFD08A',
  },
  statusText: {
    color: '#D8EBE7',
    fontSize: 10,
    fontWeight: '800',
  },
  error: {
    backgroundColor: '#382323',
    borderColor: '#633232',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    padding: 13,
  },
  errorText: {
    color: '#FFD0C6',
    fontSize: 12,
    lineHeight: 17,
  },
  retry: {
    color: '#FFBD9F',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
  },
  load: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#0F2427',
    padding: 10,
    borderRadius: 10,
  },
  loadText: {
    color: '#88A5A4',
    fontSize: 12,
  },
  hero: {
    backgroundColor: '#123337',
    borderRadius: 26,
    marginBottom: 24,
    minHeight: 240,
    overflow: 'hidden',
    padding: 21,
    borderWidth: 1,
    borderColor: '#1D4549',
  },
  glow1: {
    backgroundColor: '#28716B',
    borderRadius: 120,
    height: 220,
    opacity: 0.52,
    position: 'absolute',
    right: -93,
    top: -92,
    width: 220,
  },
  glow2: {
    backgroundColor: '#75D19B',
    borderRadius: 90,
    bottom: -82,
    height: 170,
    opacity: 0.2,
    position: 'absolute',
    right: 26,
    width: 170,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  live: {
    alignItems: 'center',
    backgroundColor: '#0C272B',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  dot: {
    backgroundColor: '#7DF3C0',
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  liveText: {
    color: '#A4EAD0',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroRank: {
    color: '#B6E7DD',
    fontSize: 14,
    fontWeight: '800',
  },
  heroTrainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    marginBottom: 6,
  },
  heroAvatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#7DF3C0',
    backgroundColor: '#173639',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroAvatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 23, 27, 0.75)',
    alignItems: 'center',
    paddingVertical: 1,
  },
  heroAvatarEditText: {
    color: '#7DF3C0',
    fontSize: 9,
    fontWeight: '900',
  },
  avatarFullImg: {
    width: '100%',
    height: '100%',
  },
  name: {
    color: '#F4FAF8',
    fontSize: 22,
    fontWeight: '900',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  idRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
  },
  id: {
    color: '#9BB9B7',
    fontSize: 11,
    fontWeight: '700',
  },
  copyUidBtn: {
    backgroundColor: '#16383D',
    borderColor: '#245258',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  copyUidBtnSuccess: {
    backgroundColor: 'rgba(125, 243, 192, 0.2)',
    borderColor: '#7DF3C0',
  },
  copyUidText: {
    color: '#7DF3C0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyUidTextSuccess: {
    color: '#7DF3C0',
    fontWeight: '900',
  },
  comment: {
    color: '#D1E1DF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    maxWidth: '85%',
  },
  heroFoot: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  overline: {
    color: '#9BB9B7',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  fans: {
    color: '#7DF3C0',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },
  class: {
    alignItems: 'center',
    backgroundColor: '#F5C985',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  classTop: {
    color: '#4B3517',
    fontSize: 8,
    fontWeight: '900',
  },
  classValue: {
    color: '#34240D',
    fontSize: 20,
    fontWeight: '900',
  },
  heading: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headingText: {
    color: '#F4FAF8',
    fontSize: 18,
    fontWeight: '800',
  },
  headingNote: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metric: {
    backgroundColor: '#10272B',
    borderRadius: 18,
    minHeight: 110,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: '#173639',
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  metricIconText: {
    color: '#102124',
    fontSize: 11,
    fontWeight: '900',
  },
  metricValue: {
    color: '#F5FAF8',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
  },
  metricLabel: {
    color: '#87A5A4',
    fontSize: 11,
    marginTop: 3,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: '#10272B',
    borderColor: '#19454A',
    borderWidth: 1,
    borderRadius: 20,
    flexDirection: 'row',
    marginBottom: 24,
    padding: 14,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: '#16383D',
    borderColor: '#245258',
    borderWidth: 1,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52,
    overflow: 'hidden',
  },
  circleRankAvatar: {
    width: '100%',
    height: '100%',
  },
  markText: {
    color: '#7DF3C0',
    fontSize: 16,
    fontWeight: '900',
  },
  circleInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  circleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierTag: {
    backgroundColor: 'rgba(125, 243, 192, 0.15)',
    borderColor: '#7DF3C0',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tierTagText: {
    color: '#7DF3C0',
    fontSize: 10,
    fontWeight: '900',
  },
  circleName: {
    color: '#F4FAF8',
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },
  circleMeta: {
    color: '#84A5A2',
    fontSize: 11,
    marginTop: 4,
  },
  circleRight: {
    alignItems: 'flex-end',
  },
  circleRank: {
    color: '#7DF3C0',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  rankLabel: {
    color: '#78B9B0',
    fontSize: 8,
    fontWeight: '900',
  },
  historyRankIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  widget: {
    backgroundColor: '#5E4DA6',
    borderRadius: 22,
    marginBottom: 24,
    overflow: 'hidden',
    padding: 18,
  },
  widgetGlow: {
    backgroundColor: '#A292F4',
    borderRadius: 85,
    height: 170,
    opacity: 0.45,
    position: 'absolute',
    right: -34,
    top: -82,
    width: 170,
  },
  widgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  widgetBrand: {
    color: '#DAD5FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  widgetArrow: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
  widgetCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  widgetAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#B9FFDC',
  },
  widgetName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  widgetId: {
    color: '#DAD5FF',
    fontSize: 10,
    marginTop: 2,
  },
  widgetFoot: {
    alignItems: 'flex-end',
    borderTopColor: 'rgba(255,255,255,.25)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
  },
  widgetLabel: {
    color: '#DAD5FF',
    fontSize: 9,
    fontWeight: '900',
  },
  widgetGain: {
    color: '#B9FFDC',
    fontSize: 18,
    fontWeight: '900',
  },
  widgetTotalFans: {
    color: '#B9FFDC',
    fontSize: 15,
    fontWeight: '900',
  },
  total: {
    backgroundColor: '#172B52',
    borderRadius: 25,
    marginBottom: 24,
    padding: 21,
    borderWidth: 1,
    borderColor: '#24437B',
  },
  totalOver: {
    color: '#9FC7FF',
    fontSize: 10,
    fontWeight: '900',
  },
  totalValue: {
    color: '#F4FAFF',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 7,
  },
  totalCaption: {
    color: '#B6CCE6',
    fontSize: 12,
  },
  totalLine: {
    backgroundColor: '#36527A',
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },
  totalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  totalStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: '#F4FAFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: '#9AB4D1',
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#10272B',
    borderRadius: 20,
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#173639',
  },
  growth: {
    marginBottom: 17,
  },
  growthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  month: {
    color: '#EAF7F4',
    fontSize: 12,
    fontWeight: '800',
  },
  gain: {
    color: '#7DF3C0',
    fontSize: 13,
    fontWeight: '900',
  },
  track: {
    backgroundColor: '#1E4144',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: '#80AFB1',
    borderRadius: 4,
    height: 8,
  },
  barActive: {
    backgroundColor: '#7DF3C0',
  },
  growthBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sub: {
    color: '#789493',
    fontSize: 10,
  },
  rolling: {
    backgroundColor: '#10272B',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#173639',
  },
  rollValue: {
    color: '#F5FAF8',
    fontSize: 17,
    fontWeight: '900',
  },
  rollLabel: {
    color: '#86A6A3',
    fontSize: 10,
    marginTop: 4,
  },
  rollRank: {
    color: '#7DF3C0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
  },
  history: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 40,
  },
  accent: {
    backgroundColor: '#597C7C',
    borderRadius: 3,
    height: 20,
    marginRight: 8,
    width: 4,
  },
  accentActive: {
    backgroundColor: '#7DF3C0',
  },
  historyMonth: {
    color: '#D8EBE7',
    fontSize: 10,
    fontWeight: '800',
    width: 48,
  },
  historyName: {
    color: '#86A6A3',
    flex: 1,
    fontSize: 10,
  },
  historyPoints: {
    color: '#F4FAF8',
    fontSize: 10,
    fontWeight: '800',
    width: 55,
  },
  historyRank: {
    color: '#7DF3C0',
    fontSize: 10,
    textAlign: 'right',
    width: 27,
  },
  identity: {
    alignItems: 'center',
    backgroundColor: '#123337',
    borderRadius: 25,
    marginBottom: 24,
    padding: 23,
    borderWidth: 1,
    borderColor: '#1D4549',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#16383D',
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#7DF3C0',
    position: 'relative',
  },
  avatarText: {
    color: '#7DF3C0',
    fontSize: 28,
    fontWeight: '900',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7, 23, 27, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  avatarEditText: {
    color: '#7DF3C0',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  identityName: {
    color: '#F4FAF8',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 13,
  },
  identityId: {
    color: '#8EB9B3',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  identityComment: {
    color: '#CAE0DD',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
  list: {
    backgroundColor: '#10272B',
    borderRadius: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#173639',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#1B383C',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  rowLabel: {
    color: '#89A6A4',
    fontSize: 12,
  },
  rowValue: {
    color: '#F4FAF8',
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '55%',
    textAlign: 'right',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tagItem: {
    backgroundColor: '#10272B',
    borderColor: '#1E4246',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  tagLabel: {
    color: '#78B9B0',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 3,
  },
  tagValue: {
    color: '#F4FAF8',
    fontSize: 15,
    fontWeight: '900',
  },
  // SETTINGS TAB STYLES
  settingsContainer: {
    paddingBottom: 10,
  },
  autoScheduleCard: {
    backgroundColor: '#112F35',
    borderColor: '#1E494E',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
  },
  autoScheduleHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  autoScheduleIcon: {
    fontSize: 26,
  },
  autoScheduleTitle: {
    color: '#F4FAF8',
    fontSize: 16,
    fontWeight: '800',
  },
  autoScheduleSubtitle: {
    color: '#8DB2AE',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  scheduleDivider: {
    backgroundColor: '#1D454A',
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleLabel: {
    color: '#85A8A4',
    fontSize: 12,
  },
  scheduleValue: {
    color: '#F4FAF8',
    fontSize: 12,
    fontWeight: '800',
  },
  bigRefreshBtn: {
    backgroundColor: '#7DF3C0',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  bigRefreshIcon: {
    color: '#07171B',
    fontSize: 20,
    fontWeight: '900',
  },
  bigRefreshText: {
    color: '#07171B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  configCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  inputTitle: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  toggleKeyBtn: {
    color: '#91C8FF',
    fontSize: 10,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: '#07171A',
    borderColor: '#22474B',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F4FAF8',
    fontSize: 14,
    fontWeight: '600',
    height: 44,
    paddingHorizontal: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 18,
  },
  presetChip: {
    backgroundColor: '#16383D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipText: {
    color: '#B8E5DE',
    fontSize: 11,
    fontWeight: '700',
  },
  communityKeyChip: {
    backgroundColor: 'rgba(125, 243, 192, 0.15)',
    borderColor: '#7DF3C0',
    borderWidth: 1,
  },
  communityKeyText: {
    color: '#7DF3C0',
    fontWeight: '800',
  },
  saveConfigBtn: {
    backgroundColor: '#7DF3C0',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveConfigBtnText: {
    color: '#07171B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBox: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  statusBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBoxLabel: {
    color: '#84A5A2',
    fontSize: 12,
  },
  statusBoxVal: {
    color: '#F4FAF8',
    fontSize: 12,
    fontWeight: '800',
  },
  tabs: {
    backgroundColor: '#0B2024',
    borderTopColor: '#1C383C',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 10,
    paddingTop: 9,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabIcon: {
    color: '#6C8988',
    fontSize: 18,
    height: 22,
  },
  tabLabel: {
    color: '#6C8988',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 3,
  },
  active: {
    color: '#7DF3C0',
  },
  emptyText: {
    color: '#789493',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  widgetGuideTitle: {
    color: '#F4FAF8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  widgetGuideStep: {
    color: '#A0C2BE',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  highlightText: {
    color: '#7DF3C0',
    fontWeight: '800',
  },
  widgetGuideNote: {
    color: '#658B87',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // ABOUT SECTION STYLES
  aboutMenuItem: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  aboutMenuIconWrapper: {
    backgroundColor: '#173639',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#215357',
  },
  aboutMenuIconImg: {
    width: '100%',
    height: '100%',
  },
  aboutMenuIcon: {
    fontSize: 20,
  },
  aboutMenuTitle: {
    color: '#F4FAF8',
    fontSize: 14,
    fontWeight: '800',
  },
  aboutMenuSub: {
    color: '#78B9B0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  aboutMenuArrow: {
    color: '#7DF3C0',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 4,
  },
  aboutCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 28,
  },
  aboutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutBadgeIcon: {
    backgroundColor: '#173639',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutBadgeIconText: {
    fontSize: 22,
  },
  aboutAppName: {
    color: '#F4FAF8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aboutAppVersion: {
    color: '#78B9B0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  aboutDivider: {
    backgroundColor: '#173639',
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  aboutInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  aboutInfoLabel: {
    color: '#84A5A2',
    fontSize: 12,
  },
  aboutInfoValue: {
    color: '#F4FAF8',
    fontSize: 12,
    fontWeight: '800',
  },
  aboutDisclaimerBox: {
    backgroundColor: '#0A1C20',
    borderColor: '#153136',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  aboutDisclaimerText: {
    color: '#6E918D',
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 15,
  },
});
