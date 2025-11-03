import React from 'react';
import Svg, { G, Path, Rect, Ellipse } from 'react-native-svg';
import { colors } from '../theme';

// Logo estilizada de tronco de madeira (Cerne)
// Props: size (largura), color overrides via props opcional
export default function LogoWood({ size = 220, tone = 'primary' }) {
  const stroke = colors.primaryDark;
  const fillMain = colors[tone] || colors.primary;
  const fillLight = colors.primaryLight;
  const fillShadow = '#3E2E28';
  const width = size;
  const height = Math.round(size * 0.8);

  // Dimensões base
  const trunkWidth = Math.round(width * 0.62);
  const trunkHeight = Math.round(height * 0.62);
  const trunkX = Math.round((width - trunkWidth) / 2);
  const trunkY = Math.round(height * 0.22);
  const radius = Math.round(trunkWidth / 2);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {/* sombra de fundo oval */}
        <Ellipse cx={width/2} cy={height*0.92} rx={trunkWidth*0.54} ry={height*0.06} fill={'rgba(0,0,0,0.08)'} />

        {/* topo do tronco (seção circular) */}
        <Ellipse cx={width/2} cy={trunkY} rx={radius} ry={Math.round(radius*0.32)} fill={fillLight} stroke={stroke} strokeWidth={2} />
        {/* anéis de crescimento */}
        <Ellipse cx={width/2} cy={trunkY} rx={radius*0.65} ry={Math.round(radius*0.21)} fill={'none'} stroke={stroke} strokeWidth={1.5} opacity={0.6} />
        <Ellipse cx={width/2} cy={trunkY} rx={radius*0.35} ry={Math.round(radius*0.12)} fill={'none'} stroke={stroke} strokeWidth={1.25} opacity={0.6} />

        {/* tronco principal */}
        <Rect x={trunkX} y={trunkY} width={trunkWidth} height={trunkHeight} rx={10} fill={fillMain} stroke={stroke} strokeWidth={2} />

        {/* fendas e veios (paths finos) */}
        <Path d={`M ${trunkX + trunkWidth*0.25} ${trunkY+12} v ${trunkHeight-24}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
        <Path d={`M ${trunkX + trunkWidth*0.52} ${trunkY+20} v ${trunkHeight-40}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />
        <Path d={`M ${trunkX + trunkWidth*0.78} ${trunkY+30} v ${trunkHeight-64}`} stroke={stroke} strokeWidth={2} strokeLinecap="round" opacity={0.45} />

        {/* reentrâncias laterais para dar volume */}
        <Path d={`M ${trunkX} ${trunkY+18} q -8 30 0 60`} fill="none" stroke={fillShadow} strokeWidth={2} opacity={0.3} />
        <Path d={`M ${trunkX+trunkWidth} ${trunkY+28} q 8 40 0 70`} fill="none" stroke={fillShadow} strokeWidth={2} opacity={0.25} />

        {/* galho lateral esquerdo */}
        <Path d={`M ${trunkX+trunkWidth*0.18} ${trunkY+trunkHeight*0.32} c -20 -8 -26 -8 -42 0`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        {/* broto com folhas */}
        <Path d={`M ${trunkX+trunkWidth*0.18} ${trunkY+trunkHeight*0.32} c -8 -18 -10 -26 -10 -40`} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        <Path d={`M ${trunkX-16} ${trunkY+trunkHeight*0.18} c 10 -12 24 -12 34 0 c -12 6 -22 6 -34 0 z`} fill={fillLight} stroke={stroke} strokeWidth={1.5} />
        <Path d={`M ${trunkX-8} ${trunkY+trunkHeight*0.08} c 10 -10 22 -10 30 0 c -10 5 -20 5 -30 0 z`} fill={fillLight} stroke={stroke} strokeWidth={1.5} />

        {/* brilho sutil no tronco */}
        <Path d={`M ${trunkX+8} ${trunkY+10} v ${trunkHeight-20}`} stroke={'rgba(255,255,255,0.18)'} strokeWidth={3} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
