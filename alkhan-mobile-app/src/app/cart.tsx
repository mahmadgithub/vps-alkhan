import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { FloatingShadow, Radius } from '@/constants/layout';
import { resolveImageUrl } from '@/constants/config';
import { Fonts } from '@/constants/theme';
import * as selfOrderingService from '@/services/self-ordering-service';
import { cartGrandTotal, useCartStore, type CartItem } from '@/state/cart-store';
import { useAppTheme } from '@/state/theme-context';

const ORDER_TYPES = ['Takeaway', 'Delivery'];

export default function CartScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const [orderType, setOrderType] = useState('Takeaway');
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  useEffect(() => {
    selfOrderingService.getCapabilities().then((caps) => setDeliveryEnabled(!!caps.delivery_enabled));
  }, []);

  const grandTotal = cartGrandTotal(items);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.itemCode}-${item.comment}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="cart-outline" title="Your cart is empty" message="Add some dishes from the menu to get started." />
        }
        renderItem={({ item }) => <CartRow item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.orderTypeSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ORDER TYPE</Text>
              <View style={styles.orderTypeRow}>
                {ORDER_TYPES.map((type) => {
                  const disabled = type === 'Delivery' && !deliveryEnabled;
                  const selected = type === orderType;
                  return (
                    <Pressable
                      key={type}
                      disabled={disabled}
                      onPress={() => setOrderType(type)}
                      style={[
                        styles.orderTypeChip,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary : colors.surface,
                          opacity: disabled ? 0.4 : 1,
                        },
                      ]}>
                      <Text style={{ color: selected ? '#2A2007' : colors.text, fontWeight: '600', fontSize: 13.5 }}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null
        }
      />

      {items.length > 0 && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 16 },
            FloatingShadow,
          ]}>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 12.5 }}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>Rs {grandTotal.toFixed(0)}</Text>
          </View>
          <PrimaryButton
            label="Proceed to Checkout"
            onPress={() => router.push({ pathname: '/checkout', params: { orderType } })}
          />
        </View>
      )}
    </View>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const { colors } = useAppTheme();
  const imageUrl = resolveImageUrl(item.itemImage);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <Card style={styles.row}>
      <View style={[styles.rowImage, { backgroundColor: colors.imagePlaceholder }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: colors.text }]}>{item.itemName}</Text>
        {!!item.comment && <Text style={{ color: colors.textSecondary, fontSize: 11.5 }}>{item.comment}</Text>}
        <View style={styles.qtyRow}>
          <Pressable
            hitSlop={6}
            onPress={() => setQuantity(item.itemCode, item.comment, item.quantity - 1)}
            style={[styles.qtyButton, { borderColor: colors.border }]}>
            <Ionicons name="remove" size={14} color={colors.text} />
          </Pressable>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>
            {item.quantity}
          </Text>
          <Pressable
            hitSlop={6}
            onPress={() => setQuantity(item.itemCode, item.comment, item.quantity + 1)}
            style={[styles.qtyButton, { borderColor: colors.primary, backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={14} color="#2A2007" />
          </Pressable>
        </View>
      </View>
      <View style={styles.rowEnd}>
        <Pressable hitSlop={8} onPress={() => removeItem(item.itemCode, item.comment)}>
          <Ionicons name="trash-outline" size={17} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.rowPrice, { color: colors.text }]}>Rs {(item.rate * item.quantity).toFixed(0)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12 },
  rowImage: { width: 52, height: 52, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rowContent: { flex: 1, gap: 6 },
  rowName: { fontSize: 13.5, fontWeight: '700' },
  rowPrice: { fontSize: 13.5, fontWeight: '700' },
  rowEnd: { alignItems: 'flex-end', gap: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTypeSection: { marginTop: 20 },
  sectionLabel: { fontSize: 10.5, letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  orderTypeRow: { flexDirection: 'row', gap: 10 },
  orderTypeChip: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalValue: { fontSize: 18, fontWeight: '800', fontFamily: Fonts.displayBold },
});
