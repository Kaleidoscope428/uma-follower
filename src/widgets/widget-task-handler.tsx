import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UmaWidget, UmaWidgetProps } from './UmaWidget';
import { STORAGE_KEY_WIDGET_DATA } from './widget-service';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;

  if (widgetInfo.widgetName === 'UmaWidget') {
    let widgetProps: UmaWidgetProps = {
      trainerName: 'Uma Trainer',
      totalFans: '0',
      monthlyGain: '+0',
      rank: '#--',
      lastUpdated: '--:--',
    };

    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_WIDGET_DATA);
      if (saved) {
        widgetProps = { ...widgetProps, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to default
    }

    renderWidget(<UmaWidget {...widgetProps} />);
  }
}
