import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UmaWidget, UmaWidgetProps } from './UmaWidget';

export const STORAGE_KEY_WIDGET_DATA = '@uma_widget_data';

export async function updateHomeScreenWidget(props: UmaWidgetProps) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_WIDGET_DATA, JSON.stringify(props));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requestWidgetUpdate } = require('react-native-android-widget');
    await requestWidgetUpdate({
      widgetName: 'UmaWidget',
      renderWidget: () => <UmaWidget {...props} />,
    });
  } catch {
    // Non-fatal if running inside Expo Go or non-android
  }
}
