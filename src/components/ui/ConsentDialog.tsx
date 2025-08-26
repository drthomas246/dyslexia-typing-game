import { Button, Dialog, Portal } from "@chakra-ui/react";

export function ConsentDialog({
  onYes,
  onNo,
  open,
  onOpenChange,
}: {
  onYes: () => void;
  onNo: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="sm"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded="xl">
            <Dialog.Header>
              <Dialog.Title>ちゅうい</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              このサイトでは音が鳴ります。よろしいですか？
            </Dialog.Body>
            <Dialog.Footer gap="2">
              <Button colorScheme="teal" onClick={onYes}>
                はい
              </Button>
              <Button variant="outline" onClick={onNo}>
                いいえ
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
