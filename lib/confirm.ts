import { Alert, Platform } from 'react-native';

async function runConfirmedAction(onConfirm: () => void | Promise<void>) {
  try {
    await onConfirm();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message);
      return;
    }
    Alert.alert('Error', message);
  }
}

export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>,
): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      void runConfirmedAction(onConfirm);
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        void runConfirmedAction(onConfirm);
      },
    },
  ]);
}
