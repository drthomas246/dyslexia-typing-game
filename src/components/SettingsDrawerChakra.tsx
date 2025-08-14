// src/components/SettingsDrawerChakra.tsx
import {
  Button,
  CloseButton,
  Drawer,
  Field,
  NumberInput,
  Portal,
  Stack,
  Switch,
} from "@chakra-ui/react";

// エンジン連携の最小インターフェース（オプショナル）
type EngineLike = {
  state: { learningPhase: "study" | "recall" };
  setLearningPhase: (p: "study" | "recall") => void;
};

export type Settings = {
  durationSec: number; // プレイ時間
  sound: boolean; // 効果音
  language: string; // "en" | "ja" | ...
  learningMode: boolean; // 学習モード（常時ヒント・タイマー停止）
  learnThenRecall: boolean; // ★追加：学習→リコールの2段階を有効化
};

export type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
  engine?: EngineLike; // ★追加：現在フェーズ表示と手動切替に使用（任意）
};

export default function SettingsDrawerChakra({
  open,
  onClose,
  settings,
  onChange,
}: SettingsDrawerProps) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const learningMode = settings.learningMode;
  const learnThenRecall = settings.learnThenRecall;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
      size="md"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content roundedStart="l2">
            <Drawer.Header>
              <Drawer.Title>Settings</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="6">
                {/* プレイ時間 */}
                <Field.Root>
                  <Field.Label>Game Duration (sec)</Field.Label>
                  <NumberInput.Root
                    value={String(settings.durationSec)}
                    min={15}
                    max={600}
                    step={5}
                    onValueChange={(e) =>
                      set({
                        durationSec: Math.max(
                          15,
                          Math.min(600, Number(e.value) || 0)
                        ),
                      })
                    }
                    width="200px"
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                  <Field.HelperText>15〜600 の範囲</Field.HelperText>
                </Field.Root>

                {/* 効果音 */}
                <Field.Root>
                  <Field.Label>Sound</Field.Label>
                  <Switch.Root
                    checked={settings.sound}
                    onCheckedChange={(e) => set({ sound: e.checked })}
                    colorPalette="blue"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>Enable key/correct sounds</Switch.Label>
                  </Switch.Root>
                </Field.Root>

                {/* 学習モード */}
                <Field.Root>
                  <Field.Label>Learning Mode</Field.Label>
                  <Switch.Root
                    checked={learningMode}
                    onCheckedChange={(e) => set({ learningMode: e.checked })}
                    colorPalette="blue"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>
                      Show hints from start (combo disabled)
                    </Switch.Label>
                  </Switch.Root>
                  <Field.HelperText>
                    学習モードでは最初から日本語と英語のヒントを表示します（この間はComboは加算されません）。タイマーは停止します。
                  </Field.HelperText>
                </Field.Root>

                {/* 学習→リコール（2段階） */}
                <Field.Root>
                  <Field.Label>学習→リコール（2段階）</Field.Label>
                  <Switch.Root
                    checked={learnThenRecall}
                    onCheckedChange={(e) => set({ learnThenRecall: e.checked })}
                    colorPalette="blue"
                    disabled={!learningMode}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>
                      学習（ヒント表示・音声）後、ヒント無しで再入力
                    </Switch.Label>
                  </Switch.Root>
                  <Field.HelperText>
                    学習段階で正解すると、そのまま同じ問題をヒント無しで再入力（リコール）します。正解で次の問題へ進みます。
                  </Field.HelperText>
                </Field.Root>
              </Stack>
            </Drawer.Body>

            <Drawer.Footer>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button colorPalette="blue" onClick={onClose}>
                Save
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
