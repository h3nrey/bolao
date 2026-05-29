import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export type PredictionItemPayload = {
  type: string;
  value_int?: number | null;
  value_team_id?: string | null;
  value_player_id?: string | null;
};

function getEncryptionKey(): Buffer {
  const secret = process.env.PREDICTION_ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-only-key';
  return createHash('sha256').update(secret).digest();
}

export function encryptPredictionItem(payload: PredictionItemPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptPredictionItem(encryptedValue: string): PredictionItemPayload {
  const [ivBase64, tagBase64, dataBase64] = encryptedValue.split('.');

  if (!ivBase64 || !tagBase64 || !dataBase64) {
    throw new Error('Invalid encrypted prediction payload');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivBase64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataBase64, 'base64')),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8')) as PredictionItemPayload;
}

export function hydratePredictionItems(
  items: {
    type: string;
    encrypted_value?: string | null;
    value_int?: number | null;
    value_team_id?: string | null;
    value_player_id?: string | null;
  }[],
) {
  return items.map((item) => {
    if (item.encrypted_value) {
      const payload = decryptPredictionItem(item.encrypted_value);
      return {
        type: payload.type,
        value_int: payload.value_int ?? null,
        value_team_id: payload.value_team_id ?? null,
        value_player_id: payload.value_player_id ?? null,
      };
    }

    return {
      type: item.type,
      value_int: item.value_int ?? null,
      value_team_id: item.value_team_id ?? null,
      value_player_id: item.value_player_id ?? null,
    };
  });
}
