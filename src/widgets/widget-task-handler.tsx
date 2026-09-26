import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UmaWidget, UmaWidgetProps } from './UmaWidget';
import { STORAGE_KEY_WIDGET_DATA } from './widget-service';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  let widgetProps: UmaWidgetProps = {
    trainerName: 'Uma Trainer',
    totalFans: '0',
    monthlyGain: '+0',
    rank: '#--',
    lastUpdated: '--:--',
    avatarUri: null,
  };

  try {
    const [savedData, savedAvatar] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_WIDGET_DATA),
      AsyncStorage.getItem('@uma_user_avatar'),
    ]);

    if (savedData) {
      widgetProps = { ...widgetProps, ...JSON.parse(savedData) };
    }
    if (!widgetProps.avatarUri && savedAvatar) {
      widgetProps.avatarUri = savedAvatar;
    }
  } catch {
    // Fallback to defaults
  }

  renderWidget(<UmaWidget {...widgetProps} />);
}
