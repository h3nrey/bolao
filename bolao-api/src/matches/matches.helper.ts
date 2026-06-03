import { Prediction, PredictionItem } from '@prisma/client';
import { hydratePredictionItems } from '../predictions/prediction-item.crypto';

export type PredictionWithItems = Prediction & {
  items: PredictionItem[];
};

export function calculateCommunityTrends(predictions: PredictionWithItems[]) {
  const predictionsCount = predictions.length;

  let winA = 0;
  let winB = 0;
  let draw = 0;
  let validCount = 0;

  if (predictionsCount > 0) {
    for (const pred of predictions) {
      const items = hydratePredictionItems(pred.items);
      const scoreA = items.find((i) => i.type === 'score_a')?.value_int;
      const scoreB = items.find((i) => i.type === 'score_b')?.value_int;

      if (typeof scoreA === 'number' && typeof scoreB === 'number') {
        validCount++;
        if (scoreA > scoreB) {
          winA++;
        } else if (scoreA < scoreB) {
          winB++;
        } else {
          draw++;
        }
      }
    }
  }

  let aPercent = 0;
  let drawPercent = 0;
  let bPercent = 0;

  if (validCount > 0) {
    aPercent = Math.round((winA / validCount) * 100);
    drawPercent = Math.round((draw / validCount) * 100);
    bPercent = 100 - aPercent - drawPercent;

    if (bPercent < 0) {
      bPercent = 0;
      const diff = 100 - (aPercent + drawPercent);
      if (aPercent > drawPercent) {
        aPercent += diff;
      } else {
        drawPercent += diff;
      }
    }
  }

  return {
    a: aPercent,
    draw: drawPercent,
    b: bPercent,
  };
}
