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

export type Settings = {
  durationSec: number; // プレイ時間
  sound: boolean; // 効果音
  language: string; // "en" | "ja" | ...
  learningMode: boolean;
};

export type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
};

export default function SettingsDrawerChakra({
  open,
  onClose,
  settings,
  onChange,
}: SettingsDrawerProps) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

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
                <Field.Root>
                  <Field.Label>Learning Mode</Field.Label>
                  <Switch.Root
                    checked={settings.learningMode}
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
                    学習モードでは最初から日本語と英語のヒントを表示します（この間はComboは加算されません）。
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
