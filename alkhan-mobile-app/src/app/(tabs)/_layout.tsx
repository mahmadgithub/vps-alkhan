import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppTheme } from '@/state/theme-context';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.primary}
      disableTransparentOnScrollEdge>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Menu</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="orders">
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bag" md="receipt_long" />
      </NativeTabs.Trigger>

      {/* "Reserve" tab removed — reservations aren't offered as a
          persistent bottom-tab destination anymore. */}

      {/* "Offers" moved out of the tab bar to app/offers.tsx (a regular
          Stack screen) — as a NativeTabs route it had no way back when
          opened from the Menu banner or Account's "Offers" row (tapping
          into a tab switches tabs; it doesn't push onto a back-able
          stack). It's still reached the same way, via router.push('/offers'). */}

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
