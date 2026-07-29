"use client";
import { getFrequencyCharacter, hzCondition, type FrequencyTypeId, type FrequencyVisualVariant } from "../lib/frequency-characters";
export function FrequencyCharacter({ typeId, variant, resultHz, animate = true, className = "" }: { typeId: FrequencyTypeId; variant: FrequencyVisualVariant; resultHz?: number; animate?: boolean; className?: string }) {
  const definition = getFrequencyCharacter(typeId); const condition = hzCondition(definition, resultHz); const compact = variant === "icon" || variant === "card";
  const pulse = animate ? `frequency-character--${definition.motionPreset}` : "";
  const path = definition.visualPreset.includes("bubble") || definition.visualPreset.includes("cloud") ? "M18 73 C34 42 48 92 66 61 S98 88 116 55 S150 78 174 48 S206 79 222 61" : definition.visualPreset.includes("pieces") || definition.visualPreset.includes("dots") ? "M18 68 C42 68 48 48 68 62 S96 83 116 60 S145 43 166 62 S197 76 222 55" : "M18 70 C34 70 42 48 58 58 S83 90 101 60 S125 37 143 62 S171 87 190 58 S207 66 222 56";
  return <svg className={`frequency-character frequency-character--${variant} ${pulse} ${className}`} viewBox="0 0 240 120" role={variant === "report" ? "img" : undefined} aria-label={variant === "report" ? `${definition.name} 캐릭터` : undefined} style={{ "--fc-primary": definition.palette.primary, "--fc-secondary": definition.palette.secondary, "--fc-accent": definition.palette.accent, "--fc-bg": definition.palette.background, "--fc-condition": String(condition) } as React.CSSProperties}>
    <defs><filter id={`blur-${definition.id}`}><feGaussianBlur stdDeviation="7" /></filter></defs>
    <ellipse cx="120" cy="72" rx={70 + condition * 4} ry="25" fill="var(--fc-secondary)" opacity=".25" filter={`url(#blur-${definition.id})`} />
    <path d={path} fill="none" stroke="var(--fc-secondary)" strokeWidth={compact ? 3 : 5} strokeLinecap="round" opacity=".52" transform="translate(0 8)" />
    <path d={path} fill="none" stroke="var(--fc-primary)" strokeWidth={compact ? 4 : 6} strokeLinecap="round" />
    {!compact ? <><circle cx="38" cy="35" r="4" fill="var(--fc-accent)" /><circle cx="200" cy="35" r="3" fill="var(--fc-secondary)" /><path d="M120 24 l3 7 7 3 -7 3 -3 7 -3-7-7-3 7-3z" fill="var(--fc-accent)" /></> : null}
  </svg>;
}
