import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';

export interface UmaWidgetProps {
  trainerName?: string;
  totalFans?: string;
  monthlyGain?: string;
  rank?: string;
  lastUpdated?: string;
  avatarUri?: string | null;
}

export function UmaWidget({
  trainerName = 'Uma Trainer',
  totalFans = '0',
  monthlyGain = '+0',
  rank = '#--',
  lastUpdated = '--:--',
  avatarUri = null,
}: UmaWidgetProps) {
  const getAvatarSource = () => {
    if (!avatarUri) {
      return require('../../assets/example_avt/avt.jpg');
    }
    if (avatarUri === 'preset:rice_avt' || avatarUri === 'preset:rice_art' || avatarUri === 'preset:rice_icon') {
      return require('../../assets/example_avt/avt.jpg');
    }
    if (avatarUri === 'preset:almond_eye') {
      return require('../../assets/example_avt/Almond-eye.jpg');
    }
    if (avatarUri === 'preset:mejiro_bright') {
      return require('../../assets/example_avt/bright.jpg');
    }
    if (avatarUri === 'preset:big_wind') {
      return require('../../assets/example_avt/bigwind.jpg');
    }
    if (avatarUri.startsWith('http://') || avatarUri.startsWith('https://') || avatarUri.startsWith('data:image')) {
      return avatarUri;
    }
    return require('../../assets/example_avt/avt.jpg');
  };

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#07171B',
        borderRadius: 20,
        padding: 14,
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#10272B',
            borderRadius: 8,
            paddingHorizontal: 6,
            paddingVertical: 3,
          }}
        >
          <TextWidget
            text="UMA FOLLOWER"
            style={{
              fontSize: 9,
              color: '#78B9B0',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>

        <TextWidget
          text={monthlyGain}
          style={{
            fontSize: 12,
            color: '#7DF3C0',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* Center Trainer Name, Avatar & Rank */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 4,
        }}
      >
        <ImageWidget
          image={getAvatarSource()}
          imageWidth={36}
          imageHeight={36}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: 10,
          }}
        />
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget
            text={trainerName}
            style={{
              fontSize: 15,
              color: '#F4FAF8',
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={`Hạng tháng: ${rank}`}
            style={{
              fontSize: 10,
              color: '#8AAEA9',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Footer Fans Info */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTopWidth: 1,
          borderTopColor: '#173639',
          paddingTop: 6,
        }}
      >
        <FlexWidget>
          <TextWidget
            text="NGƯỜI THEO DÕI"
            style={{
              fontSize: 8,
              color: '#78B9B0',
              fontWeight: 'bold',
            }}
          />
          <TextWidget
            text={totalFans}
            style={{
              fontSize: 18,
              color: '#7DF3C0',
              fontWeight: 'bold',
            }}
          />
        </FlexWidget>

        <TextWidget
          text={lastUpdated}
          style={{
            fontSize: 8,
            color: '#5E7F7C',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
