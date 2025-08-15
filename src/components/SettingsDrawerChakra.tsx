// src/components/SettingsDrawerChakra.tsx
import type { Settings, SettingsDrawerProps } from "@/types/index";
import {
  Button,
  CloseButton,
  Drawer,
  Field,
  HStack,
  NumberInput,
  Portal,
  RadioGroup,
  Stack,
  Switch,
} from "@chakra-ui/react";

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
              <Drawer.Title>せっ定</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="6">
                {/* プレイ時間 */}
                <Field.Root>
                  <Field.Label>ゲームの時間 (秒)</Field.Label>
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
                  <Field.HelperText>15〜600 秒の間</Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>じゅん番</Field.Label>
                  <RadioGroup.Root
                    value={settings.orderMode}
                    onValueChange={(e) =>
                      set({ orderMode: e.value as "random" | "sequential" })
                    }
                  >
                    <HStack gap="6">
                      <RadioGroup.Item value="random">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>ばらばら</RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="sequential">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>ならびじゅん</RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </HStack>
                  </RadioGroup.Root>
                  <Field.HelperText>
                    ばらばらは じゅん番を入れかえます。ならびじゅんは
                    じゅん番通りです。
                  </Field.HelperText>
                </Field.Root>

                {/* 効果音 */}
                <Field.Root disabled>
                  <Field.Label>こうか音</Field.Label>
                  <Switch.Root
                    checked={settings.sound}
                    onCheckedChange={(e) => set({ sound: e.checked })}
                    colorPalette="blue"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>
                      ボタンをおしたり正かいしたときに音が出るようにする
                    </Switch.Label>
                  </Switch.Root>
                </Field.Root>

                {/* 学習モード */}
                <Field.Root>
                  <Field.Label>練習モード</Field.Label>
                  <Switch.Root
                    checked={learningMode}
                    onCheckedChange={(e) => set({ learningMode: e.checked })}
                    colorPalette="blue"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>練習モードにする</Switch.Label>
                  </Switch.Root>
                </Field.Root>

                {/* 学習→リコール（2段階） */}
                <Field.Root>
                  <Field.Label>練習→ふく習→次の問題（2だん階）</Field.Label>
                  <Switch.Root
                    checked={learnThenRecall}
                    onCheckedChange={(e) => set({ learnThenRecall: e.checked })}
                    colorPalette="blue"
                    disabled={!learningMode}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>
                      練習（スペル＋音声）の後、すぐにふく習（Tabキーヒントあり）をする
                    </Switch.Label>
                  </Switch.Root>
                </Field.Root>
              </Stack>
            </Drawer.Body>

            <Drawer.Footer>
              <Button variant="outline" onClick={onClose}>
                とじる
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
