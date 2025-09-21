// src/components/SettingsDrawerChakra.tsx
import type { SettingsDrawerProps } from "@/types/index";
import {
  Button,
  CloseButton,
  Drawer,
  Field,
  HStack,
  Portal,
  RadioGroup,
  Stack,
  Switch,
} from "@chakra-ui/react";
import {
  useBattle,
  useSetBattle,
  useSetSort,
  useSetPracticeMode,
  useSort,
  usePracticeMode,
} from "@/contexts/PageContext";

export default function SettingsDrawerChakra({
  open,
  onClose,
}: SettingsDrawerProps) {
  const battle = useBattle();
  const sort = useSort(); // true=sequential, false=random
  const setBattle = useSetBattle();
  const setSort = useSetSort();
  const practiceMode = usePracticeMode();
  const setPracticeMode = useSetPracticeMode();

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
              <Drawer.Title>せってい</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap="6">
                {/* 学習モード */}
                <Field.Root>
                  <Field.Label>遊び方</Field.Label>
                  <RadioGroup.Root
                    value={!battle ? "learning" : "testing"}
                    onValueChange={(arg) => {
                      const v = typeof arg === "string" ? arg : arg?.value;
                      if (!v) return;
                      setBattle(v !== "learning");
                    }}
                  >
                    <HStack gap="6">
                      <RadioGroup.Item value="learning">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>練習</RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="testing">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>テスト</RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </HStack>
                  </RadioGroup.Root>
                  <Field.HelperText>
                    練習は答えがあるので、それを打ちます。テストは答えがないので自分で思い出して打ちます。
                  </Field.HelperText>
                </Field.Root>
                <Field.Root>
                  <Field.Label>じゅん番</Field.Label>
                  <RadioGroup.Root
                    value={sort ? "sequential" : "random"} // ★修正
                    onValueChange={(arg) => {
                      const v = typeof arg === "string" ? arg : arg?.value;
                      if (!v) return;
                      setSort(v === "sequential"); // ★修正：true=sequential
                    }}
                  >
                    <HStack gap="6">
                      <RadioGroup.Item value="sequential">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>ならびじゅん</RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="random">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>ばらばら</RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </HStack>
                  </RadioGroup.Root>
                  <Field.HelperText>
                    ばらばらは じゅん番を入れかえます。ならびじゅんは
                    じゅん番通りです。
                  </Field.HelperText>
                </Field.Root>

                {/* 学習→リコール（2段階） */}
                <Field.Root>
                  <Field.Label>練習→ふく習→次の問題（2だん階）</Field.Label>
                  <Switch.Root
                    checked={practiceMode}
                    onCheckedChange={(arg) => {
                      const checked =
                        typeof arg === "boolean" ? arg : !!arg?.checked;
                      setPracticeMode(checked);
                    }}
                    colorPalette="blue"
                    disabled={battle}
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
