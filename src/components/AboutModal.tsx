import React from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const openEmail = (email: string) => {
    void Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('[Uma Follower] Báo lỗi / Đóng góp ý kiến')}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.page} edges={['top', 'left', 'right', 'bottom']}>
        {/* Navigation Bar */}
        <View style={s.navbar}>
          <Pressable onPress={onClose} style={s.backBtn}>
            <Text style={s.backBtnText}>← Quay lại</Text>
          </Pressable>
          <Text style={s.navTitle}>Thông tin ứng dụng</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* App Brand Hero Card */}
          <View style={s.heroCard}>
            <View style={s.heroGlow} />
            <View style={s.appIconContainer}>
              <Image
                source={require('../../assets/riceicon.png')}
                style={s.appIconImage}
                resizeMode="cover"
              />
            </View>
            <Text style={s.appName}>UMA FOLLOWER</Text>
            <Text style={s.appSubtitle}>Trợ lý theo dõi & Tiện ích Uma Musume</Text>
            <View style={s.versionBadge}>
              <Text style={s.versionText}>Phiên bản 1.0.0 (Release Build)</Text>
            </View>
          </View>

          {/* AUTHOR SECTION */}
          <Text style={s.sectionHeader}>TÁC GIẢ PHÁT TRIỂN</Text>
          <View style={s.card}>
            <View style={s.authorHeader}>
              <View style={s.authorAvatarWrapper}>
                <Image
                  source={require('../../assets/author.jpg')}
                  style={s.authorAvatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>{'Lê "K4leido2scop8" Anh Tiến'}</Text>
                <Text style={s.authorRole}>Developer & Trainer</Text>
              </View>
            </View>

            <View style={s.divider} />

            {/* Facebook Link */}
            <Pressable
              style={s.linkRow}
              onPress={() => openUrl('https://www.facebook.com/k4leido2cop8')}
            >
              <View style={s.socialIconWrapper}>
                <Image
                  source={require('../../assets/facebook.png')}
                  style={s.socialLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.linkLabel}>Facebook Cá Nhân</Text>
                <Text style={s.linkValue} numberOfLines={1}>
                  facebook.com/k4leido2cop8
                </Text>
              </View>
              <Text style={s.arrowIcon}>↗</Text>
            </Pressable>

            {/* GitHub Link */}
            <Pressable
              style={s.linkRow}
              onPress={() => openUrl('https://github.com/Kaleidoscope428')}
            >
              <View style={s.socialIconWrapper}>
                <Image
                  source={require('../../assets/github.png')}
                  style={s.socialLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.linkLabel}>GitHub Profile</Text>
                <Text style={s.linkValue} numberOfLines={1}>
                  Kaleidoscope428 (Kaleidoscope Rhcene)
                </Text>
              </View>
              <Text style={s.arrowIcon}>↗</Text>
            </Pressable>
          </View>

          {/* BUG REPORT / CONTACT */}
          <Text style={s.sectionHeader}>BÁO LỖI & LIÊN HỆ</Text>
          <View style={s.card}>
            <Pressable
              style={s.linkRow}
              onPress={() => openEmail('anhtienle428@gmail.com')}
            >
              <View style={s.linkIconWrapper}>
                <Text style={s.linkIcon}>✉️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.linkLabel}>Gửi Email Báo Lỗi / Góp Ý</Text>
                <Text style={s.linkValue}>anhtienle428@gmail.com</Text>
              </View>
              <Text style={s.arrowIcon}>↗</Text>
            </Pressable>
          </View>

          {/* API SOURCE */}
          <Text style={s.sectionHeader}>NGUỒN DỮ LIỆU & API</Text>
          <View style={s.card}>
            <Pressable
              style={s.linkRow}
              onPress={() => openUrl('https://uma.moe')}
            >
              <View style={s.linkIconWrapper}>
                <Text style={s.linkIcon}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.linkLabel}>Uma.moe API v4</Text>
                <Text style={s.linkValue}>https://uma.moe</Text>
              </View>
              <Text style={s.arrowIcon}>↗</Text>
            </Pressable>
          </View>

          {/* DISCLAIMER / COPYRIGHT */}
          <View style={s.disclaimerCard}>
            <Text style={s.disclaimerTitle}>Tuyên bố bản quyền</Text>
            <Text style={s.disclaimerText}>
              Uma Musume Pretty Derby là tài sản trí tuệ và thương hiệu đã được đăng ký bởi Cygames, Inc.{'\n\n'}
              Ứng dụng này là phần mềm mã nguồn mở được phát triển hoàn toàn phi thương mại nhằm hỗ trợ cộng đồng huấn luyện viên theo dõi chỉ số và hỗ trợ trải nghiệm chơi game.
            </Text>
          </View>
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
    paddingHorizontal: 8,
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
  heroCard: {
    backgroundColor: '#0E282D',
    borderColor: '#19454A',
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 26,
    overflow: 'hidden',
  },
  heroGlow: {
    backgroundColor: '#27756F',
    borderRadius: 100,
    height: 200,
    opacity: 0.25,
    position: 'absolute',
    top: -60,
    width: 200,
  },
  appIconContainer: {
    backgroundColor: '#16383D',
    borderColor: '#245258',
    borderWidth: 1,
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    color: '#F4FAF8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: '#8CAFA9',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  versionBadge: {
    backgroundColor: 'rgba(125, 243, 192, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  versionText: {
    color: '#7DF3C0',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  authorAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#7DF3C0',
    overflow: 'hidden',
    backgroundColor: '#173639',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorName: {
    color: '#F4FAF8',
    fontSize: 15,
    fontWeight: '900',
  },
  authorRole: {
    color: '#78B9B0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    backgroundColor: '#173639',
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  socialIconWrapper: {
    backgroundColor: '#0A1E22',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  socialLogo: {
    width: 22,
    height: 22,
  },
  linkIconWrapper: {
    backgroundColor: '#0A1E22',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkIcon: {
    fontSize: 18,
  },
  linkLabel: {
    color: '#84A5A2',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  linkValue: {
    color: '#F4FAF8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  arrowIcon: {
    color: '#7DF3C0',
    fontSize: 18,
    fontWeight: '900',
  },
  disclaimerCard: {
    backgroundColor: '#091A1D',
    borderColor: '#143135',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  disclaimerTitle: {
    color: '#658B87',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  disclaimerText: {
    color: '#55726F',
    fontSize: 11,
    lineHeight: 17,
  },
});
