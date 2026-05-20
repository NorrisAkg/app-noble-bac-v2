import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
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
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // @gorhom/bottom-sheet v5 + Fabric (New Architecture) garde un container
  // plein écran qui intercepte les touches lorsque le sheet est fermé, même
  // avec index=-1 et enableOverDrag=false. Ne monter le composant que quand
  // isOpen=true évite le bug et garde l'animation slide-in propre.
  if (!isOpen) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
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
