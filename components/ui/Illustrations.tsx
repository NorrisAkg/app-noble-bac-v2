import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Rect,
  Line,
  Path,
  G,
  SvgProps,
  Text as SvgText,
} from 'react-native-svg';

type IllustrationProps = SvgProps & { size?: number };

const dims = (size?: number) => ({
  width: size ?? '100%',
  height: size ?? '100%',
});

/** Pile de livres + cahier — utilisée pour l'onboarding "ressources". */
export const IllustrationStack: React.FC<IllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Defs>
      <LinearGradient id="ill_bk1" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3DBE45" stopOpacity={0.1} />
        <Stop offset="1" stopColor="#3DBE45" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <Circle cx={140} cy={120} r={92} fill="url(#ill_bk1)" />
    <Rect x={78} y={138} width={124} height={14} rx={3} fill="#E8A090" />
    <Rect x={86} y={124} width={108} height={14} rx={3} fill="#3DBE45" />
    <Rect x={72} y={152} width={136} height={14} rx={3} fill="#1A2027" />
    <G transform="translate(118 60)">
      <Rect x={0} y={0} width={44} height={58} rx={3} fill="#fff" stroke="#1A2027" strokeWidth={2} />
      <Line x1={8} y1={14} x2={36} y2={14} stroke="#9AA3AC" strokeWidth={2} />
      <Line x1={8} y1={22} x2={36} y2={22} stroke="#9AA3AC" strokeWidth={2} />
      <Line x1={8} y1={30} x2={28} y2={30} stroke="#9AA3AC" strokeWidth={2} />
      <Circle cx={34} cy={46} r={6} fill="#E8A090" />
      <Path d="M30 50 L26 64 L34 60 L42 64 L38 50" fill="#E8A090" />
    </G>
    <Circle cx={92} cy={78} r={5} fill="#3DBE45" />
    <Circle cx={200} cy={92} r={3} fill="#E8A090" />
    <Circle cx={210} cy={170} r={4} fill="#3DBE45" />
  </Svg>
);

/** Smartphone + QCM avec bonne réponse — utilisée pour l'onboarding "quiz". */
export const IllustrationQuiz: React.FC<IllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Defs>
      <LinearGradient id="ill_bk2" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#E8A090" stopOpacity={0.18} />
        <Stop offset="1" stopColor="#E8A090" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <Circle cx={140} cy={118} r={92} fill="url(#ill_bk2)" />
    <Rect x={92} y={48} width={96} height={148} rx={14} fill="#1A2027" />
    <Rect x={98} y={56} width={84} height={124} rx={6} fill="#fff" />
    <Rect x={104} y={66} width={72} height={18} rx={4} fill="#EAF7EB" />
    <Rect x={104} y={88} width={72} height={18} rx={4} fill="#3DBE45" />
    <Rect x={104} y={110} width={72} height={18} rx={4} fill="#F5F5F5" />
    <Rect x={104} y={132} width={72} height={18} rx={4} fill="#F5F5F5" />
    <Path
      d="M110 97 l4 4 l8 -8"
      stroke="#fff"
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={62} cy={80} r={22} fill="#fff" stroke="#3DBE45" strokeWidth={2} />
    <SvgText
      x={62}
      y={86}
      textAnchor="middle"
      fontFamily="Poppins_700Bold"
      fontSize={16}
      fill="#3DBE45"
    >
      A
    </SvgText>
    <Circle cx={222} cy={160} r={18} fill="#E8A090" />
    <SvgText
      x={222}
      y={166}
      textAnchor="middle"
      fontFamily="Poppins_700Bold"
      fontSize={14}
      fill="#fff"
    >
      ?
    </SvgText>
  </Svg>
);

/** Robot tuteur Nobi — utilisée pour l'onboarding "tuteur IA". */
export const IllustrationAI: React.FC<IllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Defs>
      <LinearGradient id="ill_bk3" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#3DBE45" stopOpacity={0.1} />
        <Stop offset="1" stopColor="#E8A090" stopOpacity={0.1} />
      </LinearGradient>
    </Defs>
    <Circle cx={140} cy={118} r={92} fill="url(#ill_bk3)" />
    <G transform="translate(96 56)">
      <Line x1={44} y1={-6} x2={44} y2={6} stroke="#1A2027" strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={44} cy={-9} r={4} fill="#E8A090" />
      <Rect x={14} y={6} width={60} height={52} rx={14} fill="#fff" stroke="#1A2027" strokeWidth={2.5} />
      <Circle cx={32} cy={30} r={5} fill="#3DBE45" />
      <Circle cx={56} cy={30} r={5} fill="#3DBE45" />
      <Circle cx={33} cy={29} r={1.5} fill="#fff" />
      <Circle cx={57} cy={29} r={1.5} fill="#fff" />
      <Path d="M34 44 Q44 50 54 44" stroke="#1A2027" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Rect x={20} y={62} width={48} height={46} rx={10} fill="#3DBE45" />
      <Rect x={28} y={72} width={32} height={26} rx={4} fill="#fff" opacity={0.9} />
      <SvgText
        x={44}
        y={91}
        textAnchor="middle"
        fontFamily="Poppins_700Bold"
        fontSize={14}
        fill="#3DBE45"
      >
        IA
      </SvgText>
      <Rect x={2} y={68} width={14} height={8} rx={4} fill="#1A2027" />
      <Rect x={72} y={68} width={14} height={8} rx={4} fill="#1A2027" />
    </G>
    <G>
      <Rect x={36} y={60} width={58} height={22} rx={11} fill="#fff" stroke="#E6E8EB" strokeWidth={1.5} />
      <Circle cx={48} cy={71} r={2} fill="#9AA3AC" />
      <Circle cx={56} cy={71} r={2} fill="#9AA3AC" />
      <Circle cx={64} cy={71} r={2} fill="#9AA3AC" />
    </G>
    <G>
      <Rect x={190} y={148} width={62} height={24} rx={12} fill="#E8A090" />
      <SvgText
        x={221}
        y={164}
        textAnchor="middle"
        fontFamily="Poppins_600SemiBold"
        fontSize={11}
        fill="#fff"
      >
        Bonjour !
      </SvgText>
    </G>
    <Path d="M70 130 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" fill="#3DBE45" />
    <Path d="M212 70 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" fill="#E8A090" />
  </Svg>
);
