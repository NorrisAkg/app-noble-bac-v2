import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  containerClassName?: string;
}

/**
 * Bascule entre deux ou trois choix exclusifs, rendue comme un rail gris dont
 * le segment actif remonte en blanc.
 *
 * Sert notamment au choix email / téléphone sur les écrans d'auth : l'onglet
 * n'est pas cosmétique, c'est lui qui décide si un sélecteur d'indicatif pays
 * s'affiche — sans lui, l'utilisateur devait taper `+227` à la main et un
 * numéro local sans préfixe repartait en 401 « identifiants invalides ».
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  containerClassName = '',
}: SegmentedControlProps<T>) {
  return (
    <View className={`flex-row p-1 bg-brand-muted rounded-[14px] ${containerClassName}`}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.8}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            className={`flex-1 h-10 items-center justify-center rounded-[11px] ${
              active ? 'bg-white' : ''
            }`}
          >
            <Text
              className={`text-[13.5px] ${
                active
                  ? 'font-poppins-semibold text-brand-ink'
                  : 'font-poppins text-brand-ink-medium'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
