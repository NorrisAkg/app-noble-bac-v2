import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
  title?: string;
}

export const CustomBottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = ['50%', '75%'],
  title,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        // Only appear when sheet is open (index >= 0)
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        // Critical: don't block touches when the sheet is closed
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      // Start fully closed
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      // Prevent the closed sheet from intercepting any touch events
      enableOverDrag={false}
      handleIndicatorStyle={{ backgroundColor: '#D5DAE0', width: 40 }}
      backgroundStyle={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
    >
      <BottomSheetView style={{ flex: 1, paddingBottom: 32 }}>
        {title && (
          <Text className="px-6 pb-3 font-poppins-semibold text-[16px] text-brand-ink">
            {title}
          </Text>
        )}
        <View className="px-2">
          {children}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};
