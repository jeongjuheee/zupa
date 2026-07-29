export type ShareFormat = "report-card" | "diary-card";

import { getFrequencyCharacter, hzCondition } from "./frequency-characters";

export type ExportableReport = {
  date: string;
  typeName: string;
  hz: number;
  keywords: string[];
  summary: string;
  typeId?: number;
  photoUrls?: string[];
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Uses the exact same visual-preset rules as FrequencyCharacter in the report UI. */
function drawFrequencyCharacterWave(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  typeId: number,
  resultHz: number,
) {
  const definition = getFrequencyCharacter(typeId);
  const condition = hzCondition(definition, resultHz);
  const { primary, secondary, accent } = definition.palette;
  const isBubble = definition.visualPreset.includes("bubble") || definition.visualPreset.includes("cloud");
  const isPieces = definition.visualPreset.includes("pieces") || definition.visualPreset.includes("dots");

  context.save();
  context.translate(x, y);
  context.scale(width / 240, height / 120);
  context.lineCap = "round";

  context.save();
  context.globalAlpha = 0.25;
  context.fillStyle = secondary;
  context.shadowColor = secondary;
  context.shadowBlur = 16;
  context.beginPath();
  context.ellipse(120, 72, 70 + condition * 4, 25, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  const drawPath = (offsetY: number) => {
    context.beginPath();
    if (isBubble) {
      context.moveTo(18, 73 + offsetY);
      context.bezierCurveTo(34, 42 + offsetY, 48, 92 + offsetY, 66, 61 + offsetY);
      context.bezierCurveTo(82, 36 + offsetY, 98, 88 + offsetY, 116, 55 + offsetY);
      context.bezierCurveTo(132, 31 + offsetY, 150, 78 + offsetY, 174, 48 + offsetY);
      context.bezierCurveTo(191, 26 + offsetY, 206, 79 + offsetY, 222, 61 + offsetY);
    } else if (isPieces) {
      context.moveTo(18, 68 + offsetY);
      context.bezierCurveTo(42, 68 + offsetY, 48, 48 + offsetY, 68, 62 + offsetY);
      context.bezierCurveTo(82, 72 + offsetY, 96, 83 + offsetY, 116, 60 + offsetY);
      context.bezierCurveTo(136, 37 + offsetY, 145, 43 + offsetY, 166, 62 + offsetY);
      context.bezierCurveTo(185, 79 + offsetY, 197, 76 + offsetY, 222, 55 + offsetY);
    } else {
      context.moveTo(18, 70 + offsetY);
      context.bezierCurveTo(34, 70 + offsetY, 42, 48 + offsetY, 58, 58 + offsetY);
      context.bezierCurveTo(74, 68 + offsetY, 83, 90 + offsetY, 101, 60 + offsetY);
      context.bezierCurveTo(118, 32 + offsetY, 125, 37 + offsetY, 143, 62 + offsetY);
      context.bezierCurveTo(161, 87 + offsetY, 171, 87 + offsetY, 190, 58 + offsetY);
      context.bezierCurveTo(202, 51 + offsetY, 207, 66 + offsetY, 222, 56 + offsetY);
    }
  };

  context.strokeStyle = secondary;
  context.globalAlpha = 0.52;
  context.lineWidth = 5;
  drawPath(8);
  context.stroke();
  context.globalAlpha = 1;
  context.strokeStyle = primary;
  context.lineWidth = 6;
  drawPath(0);
  context.stroke();

  context.fillStyle = accent;
  context.beginPath();
  context.arc(38, 35, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = secondary;
  context.beginPath();
  context.arc(200, 35, 3, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = accent;
  context.beginPath();
  context.moveTo(120, 24);
  context.lineTo(123, 31);
  context.lineTo(130, 34);
  context.lineTo(123, 37);
  context.lineTo(120, 44);
  context.lineTo(117, 37);
  context.lineTo(110, 34);
  context.lineTo(117, 31);
  context.closePath();
  context.fill();
  context.restore();
}

/** Creates a standalone PNG. It deliberately draws only report content, never app chrome. */
export async function renderReportImage(
  report: ExportableReport,
  format: ShareFormat,
): Promise<File> {
  if (typeof document === "undefined") {
    throw new Error("이미지를 생성할 수 없는 환경이에요.");
  }
  const stamp = report.date.replaceAll(".", "-").replaceAll(" ", "");

  // The diary editor already exports the user's final composite. Reuse that
  // exact file instead of creating a report-card substitute.
  if (format === "diary-card" && report.photoUrls?.[0]) {
    const response = await fetch(report.photoUrls[0]);
    if (!response.ok) throw new Error("다꾸 이미지를 불러오지 못했어요. 다시 저장해 주세요.");
    const image = await response.blob();
    return new File([image], `zupa-diary-${stamp}.png`, {
      type: image.type.startsWith("image/") ? image.type : "image/png",
    });
  }

  await document.fonts?.ready;
  const scale = 2;
  const width = 720;
  const height = 1180;
  const frequency = getFrequencyCharacter(report.typeId ?? 14);
  const { primary, secondary, accent, background } = frequency.palette;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지 캔버스를 준비하지 못했어요.");
  context.scale(scale, scale);

  context.fillStyle = "#FFF9ED";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#203553";
  context.font = "900 30px Pretendard, Arial, sans-serif";
  context.fillText("오늘의 리포트", 54, 68);
  context.fillStyle = "#71809B";
  context.font = "700 16px Pretendard, Arial, sans-serif";
  context.fillText(report.date, 54, 98);

  roundedRect(context, 40, 132, width - 80, 350, 24);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = "#203553";
  context.stroke();

  context.fillStyle = background;
  context.beginPath();
  context.arc(94, 202, 32, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = primary;
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = primary;
  context.font = "900 28px Pretendard, Arial, sans-serif";
  context.fillText("〰", 76, 212);
  context.fillStyle = "#203553";
  context.font = "800 24px Pretendard, Arial, sans-serif";
  context.fillText(report.typeName, 146, 194);
  context.fillStyle = primary;
  context.font = "900 42px Pretendard, Arial, sans-serif";
  context.fillText(`${report.hz} Hz`, 146, 242);
  context.fillStyle = "#71809B";
  context.font = "600 16px Pretendard, Arial, sans-serif";
  context.fillText("기록 속 감정이 만든 오늘의 리듬", 146, 274);

  context.fillStyle = "#203553";
  context.font = "800 20px Pretendard, Arial, sans-serif";
  context.fillText("오늘의 메타센싱 파동", 76, 340);
  drawFrequencyCharacterWave(context, 82, 350, 556, 116, report.typeId ?? 14, report.hz);

  roundedRect(context, 40, 510, width - 80, 330, 24);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.strokeStyle = "#203553";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#203553";
  context.font = "800 20px Pretendard, Arial, sans-serif";
  context.fillText("오늘 마음의 신호", 76, 562);
  context.fillStyle = "#71809B";
  context.font = "500 20px Pretendard, Arial, sans-serif";
  const lines = wrapText(context, report.summary, width - 152).slice(0, 5);
  lines.forEach((line, index) => context.fillText(line, 76, 612 + index * 34));

  let chipX = 76;
  context.font = "700 18px Pretendard, Arial, sans-serif";
  report.keywords.slice(0, 3).forEach((keyword) => {
    const chipWidth = context.measureText(keyword).width + 36;
    roundedRect(context, chipX, 884, chipWidth, 42, 21);
    context.fillStyle = accent;
    context.fill();
    context.fillStyle = "#203553";
    context.fillText(keyword, chipX + 18, 912);
    chipX += chipWidth + 10;
  });

  context.fillStyle = "#71809B";
  context.font = "500 16px Pretendard, Arial, sans-serif";
  context.fillText("오늘의 마음을 주파수로 남겨요", 54, height - 54);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((image) => (image ? resolve(image) : reject(new Error("이미지 생성에 실패했어요."))), "image/png");
  });
  return new File([blob], `zupa-report-${stamp}.png`, { type: "image/png" });
}

export function downloadReportImage(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
