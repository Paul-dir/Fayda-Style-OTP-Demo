export type EthiopianPhoneInfo = {
  valid: boolean;
  formatted: string;
  msisdn: string;
  carrier: 'Ethio Telecom' | 'Safaricom Ethiopia' | 'International' | 'Unknown';
  masked: string;
};

export function parseEthiopianNumber(phone: string): EthiopianPhoneInfo {
  if (!phone) {
    return { valid: false, formatted: '', msisdn: '', carrier: 'Unknown', masked: '' };
  }

  // Strip whitespace, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('09')) {
    cleaned = '+2519' + cleaned.slice(2);
  } else if (cleaned.startsWith('07')) {
    cleaned = '+2517' + cleaned.slice(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '+251' + cleaned;
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '+251' + cleaned;
  } else if (cleaned.startsWith('251')) {
    cleaned = '+' + cleaned;
  }

  const ethioTelecomRegex = /^\+2519\d{8}$/;
  const safaricomRegex = /^\+2517\d{8}$/;

  let carrier: 'Ethio Telecom' | 'Safaricom Ethiopia' | 'International' | 'Unknown' = 'Unknown';
  let valid = false;

  if (ethioTelecomRegex.test(cleaned)) {
    carrier = 'Ethio Telecom';
    valid = true;
  } else if (safaricomRegex.test(cleaned)) {
    carrier = 'Safaricom Ethiopia';
    valid = true;
  } else {
    const generalRegex = /^\+\d{10,15}$/;
    valid = generalRegex.test(cleaned);
    carrier = cleaned.startsWith('+251') ? 'Unknown' : 'International';
  }

  // Generate masked version (e.g. +251 91 ••• ••34)
  let masked = cleaned;
  if (cleaned.length >= 8) {
    const start = cleaned.slice(0, 6);
    const end = cleaned.slice(-2);
    masked = `${start} ••• ••${end}`;
  }

  const msisdn = cleaned.replace(/^\+/, '');

  return {
    valid,
    formatted: cleaned,
    msisdn,
    carrier,
    masked,
  };
}

export type SendSmsResult = {
  success: boolean;
  provider: string;
  deliveredTo?: string;
  carrier?: string;
  error?: string;
  providerResponse?: unknown;
};

export async function sendRealSmsOtp(params: {
  phone: string;
  otp: string;
  idNumber?: string;
}): Promise<SendSmsResult> {
  const phoneInfo = parseEthiopianNumber(params.phone);
  if (!phoneInfo.valid) {
    return {
      success: false,
      provider: 'smsethiopia',
      error: `Invalid Ethiopian phone number: "${params.phone}". Use 09... (Ethio Telecom) or 07... (Safaricom).`,
    };
  }

  const apiKey =
    process.env['SMSETHIOPIA_API_KEY'] ||
    'A00S9LBMTZTAWGPD177GQ3NIYKRQL61WL36KNVBW';
  const senderId = process.env['SMSETHIOPIA_SENDER_ID'] || 'Default';

  const messageText = `[Fayda Verification] Your one-time login OTP is: ${params.otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  try {
    console.log(`[SMSEthiopia] Dispatching real OTP to ${phoneInfo.msisdn} (${phoneInfo.carrier})...`);

    const response = await fetch('https://smsethiopia.com/api/sms/send', {
      method: 'POST',
      headers: {
        KEY: apiKey,
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        msisdn: phoneInfo.msisdn,
        text: messageText,
        sender_id: senderId,
      }),
    });

    const rawText = await response.text();
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { raw: rawText };
    }

    console.log('[SMSEthiopia] HTTP Response:', response.status, result);

    const isSuccess =
      response.ok &&
      (result['status'] === 'success' ||
        result['success'] === true ||
        result['acknowledge'] === 'success' ||
        result['status'] === 200);

    if (isSuccess) {
      return {
        success: true,
        provider: 'smsethiopia',
        deliveredTo: phoneInfo.formatted,
        carrier: phoneInfo.carrier,
        providerResponse: result,
      };
    } else {
      const rawErr =
        (result['error_message'] as string) ||
        (result['message'] as string) ||
        (result['error'] as string) ||
        (result['raw'] as string) ||
        `HTTP ${response.status} from SMSEthiopia`;

      let errorMsg = rawErr;
      if (typeof rawErr === 'string' && rawErr.includes('DEFAULT_CAMPAIGN_RECIPIENT_NOT_WHITELISTED')) {
        errorMsg = `SMSEthiopia Starter Notice: Recipient ${phoneInfo.formatted} must be registered in your smsethiopia.com campaign phonebook.`;
      }

      return {
        success: false,
        provider: 'smsethiopia',
        deliveredTo: phoneInfo.formatted,
        carrier: phoneInfo.carrier,
        error: errorMsg,
        providerResponse: result,
      };
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[SMSEthiopia] Network error:', error);
    return {
      success: false,
      provider: 'smsethiopia',
      error: `SMSEthiopia connection failed: ${error}`,
    };
  }
}
