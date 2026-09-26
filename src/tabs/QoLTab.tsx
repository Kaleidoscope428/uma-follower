import React, { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyTask {
  id: string;
  title: string;
  desc: string;
  icon: string;
  done: boolean;
}

const DEFAULT_TASKS: DailyTask[] = [
  { id: '1', title: 'Điểm danh hằng ngày', desc: 'Nhận đá Carat & quà Login bonus', icon: '🌟', done: false },
  { id: '2', title: 'Mượn ngựa kế thừa (3/3)', desc: 'Dùng hết 3 lượt mượn ngựa mỗi ngày', icon: '🏃', done: false },
  { id: '3', title: 'Team Stadium PVP', desc: 'Đấu hạng PVP nhận tiền & quà tuần', icon: '🏆', done: false },
  { id: '4', title: 'Cửa hàng Daily Shop', desc: 'Mua mảnh nhân vật & vé giảm giá', icon: '🎪', done: false },
  { id: '5', title: 'Quyên góp Circle', desc: 'Xin & tặng giày trong Circle lấy điểm', icon: '🎁', done: false },
];

const STORAGE_KEYS = {
  TASKS: '@uma_qol_tasks',
  TP_VALUE: '@uma_qol_tp',
  RP_VALUE: '@uma_qol_rp',
  MEMO: '@uma_qol_memo',
  TRAINING_TIMER: '@uma_qol_training_timer',
};

const DEFAULT_TRAINING_SECONDS = 50 * 60; // 50 phút

export function QoLTab() {
  const [tasks, setTasks] = useState<DailyTask[]>(DEFAULT_TASKS);
  const [currentTp, setCurrentTp] = useState<number>(40);
  const [currentRp, setCurrentRp] = useState<number>(2);
  const [memo, setMemo] = useState<string>('');
  const [memoSaved, setMemoSaved] = useState(false);

  // Independent Training Timer States
  const [trainingDuration, setTrainingDuration] = useState<number>(DEFAULT_TRAINING_SECONDS);
  const [trainingEndTime, setTrainingEndTime] = useState<number | null>(null);
  const [trainingRemaining, setTrainingRemaining] = useState<number>(DEFAULT_TRAINING_SECONDS);
  const [trainingIsRunning, setTrainingIsRunning] = useState<boolean>(false);
  const [trainingFinished, setTrainingFinished] = useState<boolean>(false);

  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved QoL data and Training Timer
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedTasks, savedTp, savedRp, savedMemo, savedTimer] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TASKS),
          AsyncStorage.getItem(STORAGE_KEYS.TP_VALUE),
          AsyncStorage.getItem(STORAGE_KEYS.RP_VALUE),
          AsyncStorage.getItem(STORAGE_KEYS.MEMO),
          AsyncStorage.getItem(STORAGE_KEYS.TRAINING_TIMER),
        ]);

        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
        if (savedTp !== null) {
          setCurrentTp(parseInt(savedTp, 10) || 0);
        }
        if (savedRp !== null) {
          setCurrentRp(parseInt(savedRp, 10) || 0);
        }
        if (savedMemo !== null) {
          setMemo(savedMemo);
        }

        if (savedTimer) {
          const timerData = JSON.parse(savedTimer) as {
            duration: number;
            endTime: number | null;
            remaining: number;
            isRunning: boolean;
          };

          setTrainingDuration(timerData.duration || DEFAULT_TRAINING_SECONDS);

          if (timerData.isRunning && timerData.endTime) {
            const now = Date.now();
            if (now >= timerData.endTime) {
              setTrainingRemaining(0);
              setTrainingIsRunning(false);
              setTrainingEndTime(null);
              setTrainingFinished(true);
            } else {
              setTrainingEndTime(timerData.endTime);
              setTrainingRemaining(Math.ceil((timerData.endTime - now) / 1000));
              setTrainingIsRunning(true);
            }
          } else {
            setTrainingRemaining(timerData.remaining || DEFAULT_TRAINING_SECONDS);
            setTrainingIsRunning(false);
          }
        }
      } catch {
        // Fallback to default
      }
    };

    void loadSavedData();
  }, []);

  // Interval for 1-minute Clock updates (TP / RP)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Interval for Second-by-Second Training Countdown
  useEffect(() => {
    if (trainingIsRunning && trainingEndTime) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const diffSeconds = Math.ceil((trainingEndTime - now) / 1000);

        if (diffSeconds <= 0) {
          setTrainingRemaining(0);
          setTrainingIsRunning(false);
          setTrainingEndTime(null);
          setTrainingFinished(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

          void AsyncStorage.setItem(
            STORAGE_KEYS.TRAINING_TIMER,
            JSON.stringify({
              duration: trainingDuration,
              endTime: null,
              remaining: 0,
              isRunning: false,
            })
          );
        } else {
          setTrainingRemaining(diffSeconds);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [trainingIsRunning, trainingEndTime, trainingDuration]);

  // Start / Resume Timer
  const startTrainingTimer = (durationSeconds = trainingRemaining) => {
    const now = Date.now();
    const end = now + durationSeconds * 1000;
    setTrainingEndTime(end);
    setTrainingRemaining(durationSeconds);
    setTrainingIsRunning(true);
    setTrainingFinished(false);

    void AsyncStorage.setItem(
      STORAGE_KEYS.TRAINING_TIMER,
      JSON.stringify({
        duration: trainingDuration,
        endTime: end,
        remaining: durationSeconds,
        isRunning: true,
      })
    );
  };

  // Pause Timer
  const pauseTrainingTimer = () => {
    setTrainingIsRunning(false);
    setTrainingEndTime(null);

    void AsyncStorage.setItem(
      STORAGE_KEYS.TRAINING_TIMER,
      JSON.stringify({
        duration: trainingDuration,
        endTime: null,
        remaining: trainingRemaining,
        isRunning: false,
      })
    );
  };

  // Reset Timer
  const resetTrainingTimer = (newDuration = trainingDuration) => {
    setTrainingIsRunning(false);
    setTrainingEndTime(null);
    setTrainingRemaining(newDuration);
    setTrainingDuration(newDuration);
    setTrainingFinished(false);

    void AsyncStorage.setItem(
      STORAGE_KEYS.TRAINING_TIMER,
      JSON.stringify({
        duration: newDuration,
        endTime: null,
        remaining: newDuration,
        isRunning: false,
      })
    );
  };

  // Switch Preset Duration (50m, 30m, 60m)
  const selectPresetDuration = (minutes: number) => {
    const seconds = minutes * 60;
    resetTrainingTimer(seconds);
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(updated);
    void AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  };

  const resetAllTasks = () => {
    const reset = tasks.map((t) => ({ ...t, done: false }));
    setTasks(reset);
    void AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(reset));
  };

  const handleTpChange = (delta: number) => {
    const next = Math.min(100, Math.max(0, currentTp + delta));
    setCurrentTp(next);
    void AsyncStorage.setItem(STORAGE_KEYS.TP_VALUE, String(next));
  };

  const handleRpChange = (delta: number) => {
    const next = Math.min(5, Math.max(0, currentRp + delta));
    setCurrentRp(next);
    void AsyncStorage.setItem(STORAGE_KEYS.RP_VALUE, String(next));
  };

  const saveMemo = () => {
    void AsyncStorage.setItem(STORAGE_KEYS.MEMO, memo);
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 2000);
  };

  // Formatting helper for MM:SS
  const formatTimerDigits = (totalSec: number): string => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate full stamina time (1 TP = 10 mins)
  const tpNeeded = Math.max(0, 100 - currentTp);
  const tpMinutesRemaining = tpNeeded * 10;
  const tpFullTime = new Date(currentTime + tpMinutesRemaining * 60 * 1000);
  const tpFullTimeStr = `${String(tpFullTime.getHours()).padStart(2, '0')}:${String(tpFullTime.getMinutes()).padStart(2, '0')}`;

  // Calculate full RP time (1 RP = 120 mins)
  const rpNeeded = Math.max(0, 5 - currentRp);
  const rpMinutesRemaining = rpNeeded * 120;
  const rpFullTime = new Date(currentTime + rpMinutesRemaining * 60 * 1000);
  const rpFullTimeStr = `${String(rpFullTime.getHours()).padStart(2, '0')}:${String(rpFullTime.getMinutes()).padStart(2, '0')}`;

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  // Training progress %
  const trainingProgressPercent = Math.min(
    100,
    Math.max(0, Math.round(((trainingDuration - trainingRemaining) / trainingDuration) * 100))
  );

  const trainingEndTimeFormatted = trainingEndTime
    ? (() => {
        const d = new Date(trainingEndTime);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })()
    : null;

  return (
    <View style={s.container}>
      {/* Hero Header */}
      <View style={s.heroCard}>
        <View style={s.heroGlow} />
        <View style={s.heroTop}>
          <Text style={s.heroOver}>TIỆN ÍCH CHO TRAINER</Text>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>QoL TOOLKIT</Text>
          </View>
        </View>
        <Text style={s.heroTitle}>Trợ lý Uma Musume</Text>
        <Text style={s.heroDesc}>
          Bộ đếm Independent Training 50 phút, tính hồi thể lực và danh sách việc cần làm hằng ngày.
        </Text>
      </View>

      {/* INDEPENDENT TRAINING TIMER (50 PHÚT) */}
      <View style={s.headingRow}>
        <Text style={s.headingTitle}>Independent Training</Text>
        <Text style={s.headingNote}>Bộ đếm 50 phút</Text>
      </View>

      <View style={s.timerCard}>
        <View style={s.timerHeader}>
          <View style={s.timerStatusPill}>
            <View
              style={[
                s.timerDot,
                trainingIsRunning
                  ? s.dotRunning
                  : trainingFinished
                    ? s.dotFinished
                    : s.dotIdle,
              ]}
            />
            <Text style={s.timerStatusText}>
              {trainingIsRunning
                ? 'ĐANG LUYỆN TẬP'
                : trainingFinished
                  ? 'HOÀN TẤT LUYỆN TẬP'
                  : 'SẴN SÀNG'}
            </Text>
          </View>

          {trainingEndTimeFormatted ? (
            <Text style={s.targetFinishText}>Xong lúc: {trainingEndTimeFormatted}</Text>
          ) : null}
        </View>

        {/* Digital Clock Display */}
        <View style={s.clockWrapper}>
          <Text style={s.digitalTimer}>{formatTimerDigits(trainingRemaining)}</Text>
          <Text style={s.digitalTimerSub}>
            {trainingFinished
              ? '🎉 50 phút luyện tập độc lập đã kết thúc!'
              : `${Math.round(trainingDuration / 60)} phút phiên huấn luyện`}
          </Text>
        </View>

        {/* Linear Progress Bar */}
        <View style={s.timerTrack}>
          <View style={[s.timerProgress, { width: `${trainingProgressPercent}%` }]} />
        </View>

        {/* Quick Presets */}
        <View style={s.timerPresetRow}>
          {[
            [50, '50 phút (Chuẩn)'],
            [30, '30 phút'],
            [60, '60 phút'],
          ].map(([mins, label]) => {
            const isSelected = trainingDuration === (mins as number) * 60;
            return (
              <Pressable
                key={String(label)}
                onPress={() => selectPresetDuration(mins as number)}
                style={[s.timerPresetBtn, isSelected && s.timerPresetBtnActive]}
              >
                <Text style={[s.timerPresetText, isSelected && s.timerPresetTextActive]}>
                  {String(label)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Timer Control Buttons */}
        <View style={s.timerControlsRow}>
          {trainingIsRunning ? (
            <Pressable onPress={pauseTrainingTimer} style={s.timerPauseBtn}>
              <Text style={s.timerPauseBtnText}>⏸ TẠM DỪNG</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => startTrainingTimer(trainingRemaining > 0 ? trainingRemaining : trainingDuration)}
              style={s.timerStartBtn}
            >
              <Text style={s.timerStartBtnText}>
                {trainingRemaining < trainingDuration && trainingRemaining > 0 ? '▶ TIẾP TỤC' : '▶ BẮT ĐẦU 50 PHÚT'}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={() => resetTrainingTimer()} style={s.timerResetBtn}>
            <Text style={s.timerResetBtnText}>↺ ĐẶT LẠI</Text>
          </Pressable>
        </View>
      </View>

      {/* STAMINA & ENERGY CALCULATOR */}
      <View style={s.headingRow}>
        <Text style={s.headingTitle}>Bộ tính hồi Thể lực</Text>
        <Text style={s.headingNote}>TP & RP Timer</Text>
      </View>

      <View style={s.energyGrid}>
        {/* TP Card */}
        <View style={s.energyCard}>
          <View style={s.energyCardHeader}>
            <Text style={s.energyTypeLabel}>THỂ LỰC (TP)</Text>
            <Text style={s.energyRatio}>{currentTp}/100</Text>
          </View>

          <View style={s.counterRow}>
            <Pressable style={s.counterBtn} onPress={() => handleTpChange(-10)}>
              <Text style={s.counterBtnText}>-10</Text>
            </Pressable>
            <Pressable style={s.counterBtnSmall} onPress={() => handleTpChange(-1)}>
              <Text style={s.counterBtnText}>-1</Text>
            </Pressable>
            <Text style={s.counterValue}>{currentTp}</Text>
            <Pressable style={s.counterBtnSmall} onPress={() => handleTpChange(1)}>
              <Text style={s.counterBtnText}>+1</Text>
            </Pressable>
            <Pressable style={s.counterBtn} onPress={() => handleTpChange(10)}>
              <Text style={s.counterBtnText}>+10</Text>
            </Pressable>
          </View>

          <View style={s.energyDivider} />

          <View style={s.energyMetaRow}>
            <Text style={s.energyMetaLabel}>Đầy lúc:</Text>
            <Text style={s.energyMetaValue}>
              {currentTp >= 100 ? 'Đã đầy!' : `${tpFullTimeStr} (${Math.floor(tpMinutesRemaining / 60)}h ${tpMinutesRemaining % 60}p)`}
            </Text>
          </View>
        </View>

        {/* RP Card */}
        <View style={s.energyCard}>
          <View style={s.energyCardHeader}>
            <Text style={s.energyTypeLabel}>VÉ PVP (RP)</Text>
            <Text style={s.energyRatio}>{currentRp}/5</Text>
          </View>

          <View style={s.counterRow}>
            <Pressable style={s.counterBtnSmall} onPress={() => handleRpChange(-1)}>
              <Text style={s.counterBtnText}>-1</Text>
            </Pressable>
            <Text style={s.counterValue}>{currentRp}</Text>
            <Pressable style={s.counterBtnSmall} onPress={() => handleRpChange(1)}>
              <Text style={s.counterBtnText}>+1</Text>
            </Pressable>
          </View>

          <View style={s.energyDivider} />

          <View style={s.energyMetaRow}>
            <Text style={s.energyMetaLabel}>Đầy lúc:</Text>
            <Text style={s.energyMetaValue}>
              {currentRp >= 5 ? 'Đã đầy!' : `${rpFullTimeStr} (${Math.floor(rpMinutesRemaining / 60)}h)`}
            </Text>
          </View>
        </View>
      </View>

      {/* DAILY CHECKLIST */}
      <View style={s.headingRow}>
        <View>
          <Text style={s.headingTitle}>Nhiệm vụ hằng ngày</Text>
          <Text style={s.headingSubtitle}>
            {completedCount}/{tasks.length} mục đã hoàn tất ({progressPercent}%)
          </Text>
        </View>
        <Pressable onPress={resetAllTasks} style={s.resetChip}>
          <Text style={s.resetChipText}>Làm mới</Text>
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressBar, { width: `${progressPercent}%` }]} />
      </View>

      {/* Task List */}
      <View style={s.taskListCard}>
        {tasks.map((task) => (
          <Pressable
            key={task.id}
            onPress={() => toggleTask(task.id)}
            style={[s.taskItem, task.done && s.taskItemDone]}
          >
            <View style={[s.checkbox, task.done && s.checkboxActive]}>
              {task.done ? <Text style={s.checkmark}>✓</Text> : null}
            </View>

            <Text style={s.taskIcon}>{task.icon}</Text>

            <View style={s.taskContent}>
              <Text style={[s.taskTitle, task.done && s.taskTitleDone]}>
                {task.title}
              </Text>
              <Text style={s.taskDesc}>{task.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* TRAINER NOTE / MEMO */}
      <View style={s.headingRow}>
        <Text style={s.headingTitle}>Ghi chú Trainer</Text>
        <Text style={s.headingNote}>Quick Notes</Text>
      </View>

      <View style={s.memoCard}>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="Ghi chép nhanh mục tiêu huấn luyện, mẹo kế thừa, lưu ý kỹ năng..."
          placeholderTextColor="#5E7F7C"
          multiline
          numberOfLines={4}
          style={s.memoInput}
        />
        <Pressable onPress={saveMemo} style={s.memoSaveBtn}>
          <Text style={s.memoSaveBtnText}>
            {memoSaved ? '✓ ĐÃ LƯU GHI CHÚ' : 'LƯU GHI CHÚ'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  heroCard: {
    backgroundColor: '#0F2F34',
    borderColor: '#1C4A50',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroGlow: {
    backgroundColor: '#27756F',
    borderRadius: 80,
    height: 160,
    opacity: 0.35,
    position: 'absolute',
    right: -40,
    top: -50,
    width: 160,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroOver: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroBadge: {
    backgroundColor: 'rgba(125, 243, 192, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#7DF3C0',
    fontSize: 9,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#F4FAF8',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroDesc: {
    color: '#9DBEB9',
    fontSize: 12,
    lineHeight: 18,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  headingTitle: {
    color: '#F4FAF8',
    fontSize: 18,
    fontWeight: '800',
  },
  headingSubtitle: {
    color: '#78B9B0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  headingNote: {
    color: '#78B9B0',
    fontSize: 10,
    fontWeight: '800',
  },
  // INDEPENDENT TRAINING TIMER STYLES
  timerCard: {
    backgroundColor: '#10272B',
    borderColor: '#1C4A50',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#091A1D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotRunning: {
    backgroundColor: '#7DF3C0',
  },
  dotFinished: {
    backgroundColor: '#FFD08A',
  },
  dotIdle: {
    backgroundColor: '#6C8988',
  },
  timerStatusText: {
    color: '#D8EBE7',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetFinishText: {
    color: '#7DF3C0',
    fontSize: 11,
    fontWeight: '800',
  },
  clockWrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  digitalTimer: {
    color: '#F4FAF8',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  digitalTimerSub: {
    color: '#84A7A3',
    fontSize: 11,
    marginTop: 4,
  },
  timerTrack: {
    backgroundColor: '#132B2F',
    borderRadius: 4,
    height: 7,
    marginVertical: 14,
    overflow: 'hidden',
  },
  timerProgress: {
    backgroundColor: '#7DF3C0',
    height: 7,
    borderRadius: 4,
  },
  timerPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timerPresetBtn: {
    flex: 1,
    backgroundColor: '#0A1E22',
    borderColor: '#183D42',
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
  },
  timerPresetBtnActive: {
    backgroundColor: '#183D42',
    borderColor: '#7DF3C0',
  },
  timerPresetText: {
    color: '#7C9E9A',
    fontSize: 10,
    fontWeight: '700',
  },
  timerPresetTextActive: {
    color: '#7DF3C0',
    fontWeight: '800',
  },
  timerControlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timerStartBtn: {
    flex: 2,
    backgroundColor: '#7DF3C0',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerStartBtnText: {
    color: '#07171B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerPauseBtn: {
    flex: 2,
    backgroundColor: '#FFD08A',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPauseBtnText: {
    color: '#34240D',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerResetBtn: {
    flex: 1,
    backgroundColor: '#16383D',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerResetBtnText: {
    color: '#B8E5DE',
    fontSize: 11,
    fontWeight: '800',
  },
  resetChip: {
    backgroundColor: '#16383D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resetChipText: {
    color: '#B8E5DE',
    fontSize: 11,
    fontWeight: '800',
  },
  energyGrid: {
    gap: 12,
    marginBottom: 24,
  },
  energyCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  energyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  energyTypeLabel: {
    color: '#78B9B0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  energyRatio: {
    color: '#7DF3C0',
    fontSize: 13,
    fontWeight: '900',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  counterBtn: {
    backgroundColor: '#18393E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  counterBtnSmall: {
    backgroundColor: '#18393E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  counterBtnText: {
    color: '#B8E5DE',
    fontSize: 12,
    fontWeight: '900',
  },
  counterValue: {
    color: '#F4FAF8',
    fontSize: 24,
    fontWeight: '900',
    minWidth: 50,
    textAlign: 'center',
  },
  energyDivider: {
    backgroundColor: '#173639',
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  energyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  energyMetaLabel: {
    color: '#84A5A2',
    fontSize: 12,
  },
  energyMetaValue: {
    color: '#7DF3C0',
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: '#132B2F',
    borderRadius: 4,
    height: 6,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressBar: {
    backgroundColor: '#7DF3C0',
    height: 6,
    borderRadius: 4,
  },
  taskListCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    marginBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  taskItemDone: {
    backgroundColor: 'rgba(125, 243, 192, 0.05)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderColor: '#315C5E',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#7DF3C0',
    borderColor: '#7DF3C0',
  },
  checkmark: {
    color: '#07171B',
    fontSize: 13,
    fontWeight: '900',
  },
  taskIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: '#F4FAF8',
    fontSize: 13,
    fontWeight: '800',
  },
  taskTitleDone: {
    color: '#6F918E',
    textDecorationLine: 'line-through',
  },
  taskDesc: {
    color: '#7B9B97',
    fontSize: 10,
    marginTop: 2,
  },
  memoCard: {
    backgroundColor: '#10272B',
    borderColor: '#183B3E',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  memoInput: {
    backgroundColor: '#07171A',
    borderColor: '#1D4549',
    borderWidth: 1,
    borderRadius: 12,
    color: '#F4FAF8',
    fontSize: 13,
    lineHeight: 18,
    padding: 12,
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  memoSaveBtn: {
    backgroundColor: '#7DF3C0',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoSaveBtnText: {
    color: '#07171B',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
