<template>
    <div class="grid-item-content comic-bubble-wrapper" :style="wrapperStyle">
        <svg class="comic-bubble-svg" viewBox="0 0 300 200" preserveAspectRatio="none">
            <defs v-if="comicShadow">
                <filter id="comic-pop-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#111111" flood-opacity="0.9"/>
                </filter>
            </defs>

            <!-- Sombra sólida 3D tipo cómic -->
            <path v-if="comicShadow && shadowPath" :d="shadowPath" :fill="'#111111'" opacity="0.85" transform="translate(5, 5)"/>

            <!-- Burbujas de pensamiento adicionales si es tipo 'thought' -->
            <g v-if="bubbleType === 'thought' && thoughtBubbles.length">
                <circle v-for="(b, idx) in thoughtBubbles" :key="'tb-' + idx"
                        :cx="b.cx" :cy="b.cy" :r="b.r"
                        :fill="fillColor" :stroke="borderColor" :stroke-width="borderWidth" />
            </g>

            <!-- Cuerpo principal del bocadillo -->
            <path :d="bubblePath"
                  :fill="fillColor"
                  :stroke="borderColor"
                  :stroke-width="borderWidth"
                  :stroke-dasharray="bubbleType === 'whisper' ? '6,4' : 'none'"
                  stroke-linejoin="round"
                  stroke-linecap="round" />
        </svg>

        <!-- Contenedor del texto centrado dentro de la burbuja -->
        <div class="comic-bubble-text-container" :style="textContainerStyle">
            <div class="comic-bubble-text" :style="textStyle">
                {{ displayContent }}
            </div>
        </div>
    </div>
</template>

<script>
import { i18nService } from '../../../js/service/i18nService';

export default {
    name: 'GridElementComicBubble',
    props: ['gridElement', 'metadata'],
    computed: {
        bubbleProps() {
            return (this.gridElement && this.gridElement.additionalProps && this.gridElement.additionalProps.comicBubble) || {};
        },
        bubbleType() {
            return this.bubbleProps.bubbleType || 'speech';
        },
        tailPosition() {
            return this.bubbleProps.tailPosition || 'bottom-left';
        },
        fontFamily() {
            return this.bubbleProps.fontFamily || '"Comic Neue", "Comic Sans MS", "Chalkboard SE", "Comic Relief", cursive, sans-serif';
        },
        fontSizePct() {
            if (this.gridElement && this.gridElement.fontSizePct != null) {
                return this.gridElement.fontSizePct;
            }
            return this.bubbleProps.fontSizePct || 100;
        },
        fontColor() {
            return (this.gridElement && this.gridElement.fontColor) || this.bubbleProps.fontColor || '#111111';
        },
        fontWeight() {
            return this.bubbleProps.fontWeight || 'bold';
        },
        fontStyle() {
            return this.bubbleProps.fontStyle || 'normal';
        },
        textAlign() {
            return this.bubbleProps.textAlign || 'center';
        },
        borderColor() {
            return this.bubbleProps.borderColor || '#111111';
        },
        borderWidth() {
            let w = this.bubbleProps.borderWidth;
            return w != null ? w : 3;
        },
        fillColor() {
            return this.bubbleProps.fillColor || '#ffffff';
        },
        cellBgColor() {
            return (this.gridElement && this.gridElement.backgroundColor) || this.bubbleProps.cellBgColor || 'transparent';
        },
        comicShadow() {
            return this.bubbleProps.comicShadow !== false;
        },
        displayContent() {
            if (!this.gridElement) return '';
            let label = this.gridElement.label;
            if (label) {
                let text = i18nService.getTranslation(label);
                if (text && typeof text === 'string' && text.trim()) {
                    return text;
                }
            }
            return this.bubbleProps.text || '';
        },
        wrapperStyle() {
            return {
                backgroundColor: this.cellBgColor,
                width: '100%',
                height: '100%',
                flex: '1 1 auto',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '8px'
            };
        },
        textContainerStyle() {
            let padTop = 10;
            let padBottom = 10;
            let padLeft = 10;
            let padRight = 10;

            if (this.tailPosition === 'bottom-left' || this.tailPosition === 'bottom-center' || this.tailPosition === 'bottom-right') {
                padBottom = 22;
                padTop = 8;
            } else if (this.tailPosition === 'top-left' || this.tailPosition === 'top-right') {
                padTop = 22;
                padBottom = 8;
            } else if (this.tailPosition === 'left') {
                padLeft = 20;
                padRight = 10;
            } else if (this.tailPosition === 'right') {
                padRight = 20;
                padLeft = 10;
            }

            if (this.bubbleType === 'shout') {
                padTop = 18;
                padBottom = 18;
                padLeft = 18;
                padRight = 18;
            } else if (this.bubbleType === 'thought') {
                padTop = 14;
                padBottom = 22;
                padLeft = 14;
                padRight = 14;
            } else if (this.bubbleType === 'box') {
                padTop = 10;
                padBottom = 10;
                padLeft = 10;
                padRight = 10;
            }

            return {
                position: 'absolute',
                top: padTop + '%',
                bottom: padBottom + '%',
                left: padLeft + '%',
                right: padRight + '%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 2,
                overflow: 'hidden',
                boxSizing: 'border-box'
            };
        },
        textStyle() {
            let baseSize = 1.15;
            let scaledSize = (baseSize * (this.fontSizePct / 100)).toFixed(2);
            return {
                fontFamily: this.fontFamily,
                fontSize: `clamp(0.7rem, ${scaledSize}rem, 2.5rem)`,
                color: this.fontColor,
                fontWeight: this.fontWeight,
                fontStyle: this.fontStyle,
                lineHeight: 1.25,
                textAlign: this.textAlign || 'center',
                width: '100%',
                wordBreak: 'break-word',
                whiteSpace: 'pre-line',
                display: 'block'
            };
        },
        thoughtBubbles() {
            if (this.bubbleType !== 'thought' || this.tailPosition === 'none') return [];
            switch (this.tailPosition) {
                case 'bottom-left':
                    return [{ cx: 50, cy: 172, r: 8 }, { cx: 35, cy: 188, r: 5 }];
                case 'bottom-center':
                    return [{ cx: 145, cy: 172, r: 8 }, { cx: 140, cy: 188, r: 5 }];
                case 'bottom-right':
                    return [{ cx: 250, cy: 172, r: 8 }, { cx: 265, cy: 188, r: 5 }];
                case 'top-left':
                    return [{ cx: 50, cy: 28, r: 8 }, { cx: 35, cy: 12, r: 5 }];
                case 'top-right':
                    return [{ cx: 250, cy: 28, r: 8 }, { cx: 265, cy: 12, r: 5 }];
                case 'left':
                    return [{ cx: 28, cy: 100, r: 8 }, { cx: 12, cy: 110, r: 5 }];
                case 'right':
                    return [{ cx: 272, cy: 100, r: 8 }, { cx: 288, cy: 110, r: 5 }];
                default:
                    return [];
            }
        },
        bubblePath() {
            const w = 300;
            const h = 200;

            if (this.bubbleType === 'box') {
                return `M 15 15 H 285 V 185 H 15 Z`;
            }

            if (this.bubbleType === 'shout') {
                // Polígono en estrella estilo explosión / estallido cómic
                return `M 25,95 L 8,60 L 50,55 L 40,15 L 85,32 L 115,8 L 145,30 L 185,10 L 205,35 L 255,20 L 250,58 L 292,65 L 268,100 L 292,135 L 250,142 L 255,180 L 205,165 L 185,190 L 145,170 L 115,192 L 85,168 L 40,185 L 50,145 L 8,140 Z`;
            }

            if (this.bubbleType === 'thought') {
                // Nube de pensamiento
                return `M 65 30 
                        C 50 15, 20 25, 25 55 
                        C 5 65, 5 105, 25 120 
                        C 10 140, 35 170, 65 160 
                        C 85 175, 125 175, 145 160 
                        C 165 175, 215 175, 235 160 
                        C 265 170, 290 140, 275 120 
                        C 295 105, 295 65, 275 55 
                        C 280 25, 250 15, 235 30 
                        C 215 15, 165 15, 145 30 
                        C 125 15, 85 15, 65 30 Z`;
            }

            // Diálogo estándar (Speech) o Susurro (Whisper)
            let rx = 24;
            let ry = 24;
            let top = 14;
            let left = 14;
            let right = 286;
            let bottom = 155;

            if (this.tailPosition === 'none') {
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-left') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 95
                        L 45 192
                        L 65 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-center') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 175
                        L 150 192
                        L 125 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'bottom-right') {
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H 235
                        L 255 192
                        L 205 ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'top-left') {
                top = 45;
                bottom = 186;
                return `M 65 ${top}
                        L 45 8
                        L 95 ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'top-right') {
                top = 45;
                bottom = 186;
                return `M 205 ${top}
                        L 255 8
                        L 235 ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'left') {
                left = 40;
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V 125
                        L 10 100
                        L ${left} 75
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            if (this.tailPosition === 'right') {
                right = 260;
                bottom = 186;
                return `M ${left + rx} ${top}
                        H ${right - rx} A ${rx} ${ry} 0 0 1 ${right} ${top + ry}
                        V 75
                        L 290 100
                        L ${right} 125
                        V ${bottom - ry} A ${rx} ${ry} 0 0 1 ${right - rx} ${bottom}
                        H ${left + rx} A ${rx} ${ry} 0 0 1 ${left} ${bottom - ry}
                        V ${top + ry} A ${rx} ${ry} 0 0 1 ${left + rx} ${top} Z`;
            }

            return `M 15 15 H 285 V 185 H 15 Z`;
        },
        shadowPath() {
            return this.bubblePath;
        }
    }
};
</script>

<style scoped>
.comic-bubble-wrapper {
    box-sizing: border-box;
}

.comic-bubble-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
}

.comic-bubble-text {
    user-select: none;
    -webkit-user-select: none;
    text-shadow: 0px 0px 1px rgba(255, 255, 255, 0.4);
}
</style>
