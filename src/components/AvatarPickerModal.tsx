import React from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export const PRESET_AVATARS = [
  {
    id: 'rice_avt',
    label: 'Rice Shower',
    source: require('../../assets/example_avt/avt.jpg'),
  },
  {
    id: 'almond_eye',
    label: 'Almond Eye',
    source: require('../../assets/example_avt/Almond-eye.jpg'),
  },
  {
    id: 'mejiro_bright',
    label: 'Mejiro Bright',
    source: require('../../assets/example_avt/bright.jpg'),
  },
  {
    id: 'big_wind',
    label: 'Big Wind',
    source: require('../../assets/example_avt/bigwind.jpg'),
  },
];

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatar: string | null;
  trainerName: string;
  onClose: () => void;
  onSelectAvatar: (avatarUri: string | null) => void;
}

export function AvatarPickerModal({
  visible,
  currentAvatar,
  trainerName,
  onClose,
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const pickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Quyền truy cập thư viện',
          'Vui lòng cấp quyền truy cập hình ảnh trong Cài đặt thiết bị để chọn ảnh đại diện.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        onSelectAvatar(uri);
        onClose();
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const handleSelectPreset = (presetId: string) => {
    onSelectAvatar(`preset:${presetId}`);
    onClose();
  };

  const handleResetDefault = () => {
    onSelectAvatar(null);
    onClose();
  };

  const renderCurrentPreview = () => {
    if (!currentAvatar) {
      return (
        <View style={s.defaultAvatar}>
          <Text style={s.defaultAvatarText}>
            {trainerName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase() || 'U'}
          </Text>
        </View>
      );
    }

    if (currentAvatar.startsWith('preset:')) {
      const presetId = currentAvatar.replace('preset:', '');
      const preset = PRESET_AVATARS.find((p) => p.id === presetId);
      if (preset) {
        return <Image source={preset.source} style={s.avatarImg} resizeMode="cover" />;
      }
    }

    return <Image source={{ uri: currentAvatar }} style={s.avatarImg} resizeMode="cover" />;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.page} edges={['top', 'left', 'right', 'bottom']}>
        {/* Navigation Bar */}
        <View style={s.navbar}>
          <Pressable onPress={onClose} style={s.backBtn}>
            <Text style={s.backBtnText}>✕ Đóng</Text>
          </Pressable>
          <Text style={s.navTitle}>Đổi ảnh đại diện Trainer</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Active Preview */}
          <View style={s.previewCard}>
            <View style={s.avatarFrame}>{renderCurrentPreview()}</View>
            <Text style={s.previewName}>{trainerName || 'Huấn luyện viên'}</Text>
            <Text style={s.previewSub}>Ảnh đại diện sẽ xuất hiện trên Hồ sơ & Widget ngoài màn hình</Text>
          </View>

          {/* Option 1: Gallery Upload */}
          <Text style={s.sectionHeader}>TẢI ẢNH TỪ THIẾT BỊ</Text>
          <Pressable style={s.actionCard} onPress={() => void pickFromGallery()}>
            <View style={s.actionIconWrapper}>
              <Text style={s.actionIcon}>🖼️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionTitle}>Chọn ảnh từ Thư viện</Text>
              <Text style={s.actionSubtitle}>Hỗ trợ cắt vuông 1:1, dung lượng tối ưu</Text>
            </View>
            <Text style={s.actionArrow}>›</Text>
          </Pressable>

          {/* Option 2: Presets */}
          <Text style={s.sectionHeader}>BỘ SƯU TẬP MẪU</Text>
          <View style={s.presetsGrid}>
            {PRESET_AVATARS.map((p) => {
              const isSelected = currentAvatar === `preset:${p.id}`;
              return (
                <Pressable
                  key={p.id}
                  style={[s.presetItem, isSelected && s.presetItemSelected]}
                  onPress={() => handleSelectPreset(p.id)}
                >
                  <Image source={p.source} style={s.presetImg} resizeMode="cover" />
                  {isSelected ? (
                    <View style={s.selectedBadge}>
                      <Text style={s.selectedBadgeText}>✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {/* Option 3: Reset */}
          <Text style={s.sectionHeader}>TÙY CHỌN KHÁC</Text>
          <Pressable style={s.resetBtn} onPress={handleResetDefault}>
            <Text style={s.resetBtnText}>↺ Đặt lại chữ cái mặc định</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#07171B',
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#173639',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#10272B',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#7DF3C0',
    fontSize: 12,
    fontWeight: '800',
  },
  navTitle: {
    color: '#F4FAF8',
    fontSize: 15,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  previewCard: {
    backgroundColor: '#0E282D',
    borderColor: '#19454A',
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarFrame: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#7DF3C0',
    overflow: 'hidden',
    backgroundColor: '#173639',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  defaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E7773',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#E5F6F0',
    fontSize: 32,
    fontWeight: '900',
  },
  previewName: {
    color: '#F4FAF8',
    fontSize: 18,
    fontWeight: '900',
  },
  previewSub: {
    color: '#78B9B0',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '85%',
  },
  sectionHeader: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 6,
    marginLeft: 4,
  },
  actionCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  actionIconWrapper: {
    backgroundColor: '#173639',
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionTitle: {
    color: '#F4FAF8',
    fontSize: 14,
    fontWeight: '800',
  },
  actionSubtitle: {
    color: '#78B9B0',
    fontSize: 11,
    marginTop: 2,
  },
  actionArrow: {
    color: '#7DF3C0',
    fontSize: 22,
    fontWeight: '700',
  },
  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  presetItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 2,
    borderRadius: 18,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presetItemSelected: {
    borderColor: '#7DF3C0',
    backgroundColor: '#123337',
  },
  presetImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  selectedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#7DF3C0',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#07171B',
  },
  selectedBadgeText: {
    color: '#07171B',
    fontSize: 11,
    fontWeight: '900',
  },
  resetBtn: {
    backgroundColor: '#0F2427',
    borderColor: '#183A3E',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#84A5A2',
    fontSize: 12,
    fontWeight: '800',
  },
});
