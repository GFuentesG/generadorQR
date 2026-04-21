// ============================================================
// VALIDADOR GS1 PARA GENERACIÓN DE QR (Frontend)
// Valida y normaliza cada campo según el estándar GS1
// ============================================================

// ------------------------------------------------------------
// 1. DOMINIO (se normaliza quitando protocolo y www)
// ------------------------------------------------------------
export function validateDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, message: 'El dominio es obligatorio' };
  }
  let clean = domain.trim().toLowerCase();
  // Eliminar http://, https://, www.
  if (clean.startsWith('http://')) clean = clean.slice(7);
  if (clean.startsWith('https://')) clean = clean.slice(8);
  if (clean.startsWith('www.')) clean = clean.slice(4);
  // Dominio válido: letras, números, puntos y guiones, no espacios, no barras
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(clean)) {
    return { valid: false, message: 'Dominio no válido (ej: midominio.com)' };
  }
  if (clean.length > 253) return { valid: false, message: 'Dominio demasiado largo' };
  return { valid: true, normalized: clean };
}

// ------------------------------------------------------------
// 2. GTIN (AI 01) – validación según longitud original y normalización a 14 dígitos
// ------------------------------------------------------------

// Función para validar dígito de control de GTIN-13 (EAN-13)
function validateCheckDigitGTIN13(gtin13) {
  const digits = gtin13.slice(0, -1).split('').map(Number);
  const checkDigit = parseInt(gtin13.slice(-1), 10);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // Los pesos alternan: 1 para posición impar (índice 0), 3 para posición par (índice 1)
    sum += digits[i] * ((i % 2 === 0) ? 1 : 3);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return checkDigit === calculated;
}

// Función para validar dígito de control de GTIN-12 (UPC-A)
function validateCheckDigitGTIN12(gtin12) {
  const digits = gtin12.slice(0, -1).split('').map(Number);
  const checkDigit = parseInt(gtin12.slice(-1), 10);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // Los pesos alternan: 3 para posición impar (índice 0), 1 para posición par (índice 1)
    sum += digits[i] * ((i % 2 === 0) ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return checkDigit === calculated;
}

// Función para validar dígito de control de GTIN-8 (EAN-8)
function validateCheckDigitGTIN8(gtin8) {
  const digits = gtin8.slice(0, -1).split('').map(Number);
  const checkDigit = parseInt(gtin8.slice(-1), 10);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // Los pesos alternan: 3 para posición impar (índice 0), 1 para posición par (índice 1)
    sum += digits[i] * ((i % 2 === 0) ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return checkDigit === calculated;
}

// Función para validar dígito de control de GTIN-14 (ya normalizado)
function validateCheckDigitGTIN14(gtin14) {
  const digits = gtin14.slice(0, -1).split('').map(Number);
  const checkDigit = parseInt(gtin14.slice(-1), 10);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // Los pesos alternan: 3 para posición impar (índice 0), 1 para posición par (índice 1)
    sum += digits[i] * ((i % 2 === 0) ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return checkDigit === calculated;
}

// Normaliza cualquier GTIN (8,12,13,14) a 14 dígitos añadiendo ceros a la izquierda
function normalizeGTIN(value) {
  if (value.length === 14) return value;
  if (value.length === 13) return '0' + value;
  if (value.length === 12) return '00' + value;
  if (value.length === 8)  return '000000' + value;
  return value;
}

export function validateGTIN(gtin) {
  if (!gtin || typeof gtin !== 'string') {
    return { valid: false, message: 'El GTIN es obligatorio' };
  }
  const trimmed = gtin.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, message: 'El GTIN solo debe contener dígitos' };
  }
  const len = trimmed.length;
  let isValid = false;
  if (len === 13) {
    isValid = validateCheckDigitGTIN13(trimmed);
  } else if (len === 12) {
    isValid = validateCheckDigitGTIN12(trimmed);
  } else if (len === 8) {
    isValid = validateCheckDigitGTIN8(trimmed);
  } else if (len === 14) {
    isValid = validateCheckDigitGTIN14(trimmed);
  } else {
    return { valid: false, message: 'Longitud de GTIN no soportada (debe ser 8, 12, 13 o 14 dígitos)' };
  }
  if (!isValid) {
    return { valid: false, message: 'Dígito de control del GTIN inválido' };
  }
  // Normalizar a 14 dígitos para uso interno (el QR usará este valor)
  const normalized = normalizeGTIN(trimmed);
  return { valid: true, normalized };
}

// ------------------------------------------------------------
// 3. LOTE (AI 10)
// ------------------------------------------------------------
export function validateLot(lot) {
  if (!lot || typeof lot !== 'string') {
    return { valid: false, message: 'El lote es obligatorio' };
  }
  const trimmed = lot.trim();
  if (trimmed.length === 0) return { valid: false, message: 'El lote no puede estar vacío' };
  if (trimmed.length > 20) return { valid: false, message: 'El lote no puede exceder 20 caracteres' };
  if (!/^[\x21-\x7E]+$/.test(trimmed)) {
    return { valid: false, message: 'El lote contiene caracteres no permitidos' };
  }
  return { valid: true, normalized: trimmed };
}

// ------------------------------------------------------------
// 4. SERIE INICIAL (AI 21) – puede ser numérica o alfanumérica
// ------------------------------------------------------------
export function validateSerial(serial) {
  if (!serial || typeof serial !== 'string') {
    return { valid: false, message: 'El número de serie es obligatorio' };
  }
  const trimmed = serial.trim();
  if (trimmed.length === 0) return { valid: false, message: 'El número de serie no puede estar vacío' };
  if (trimmed.length > 20) return { valid: false, message: 'El número de serie no puede exceder 20 caracteres' };
  if (!/^[\x21-\x7E]+$/.test(trimmed)) {
    return { valid: false, message: 'El número de serie contiene caracteres no permitidos' };
  }
  return { valid: true, normalized: trimmed };
}

// ------------------------------------------------------------
// 5. CANTIDAD
// ------------------------------------------------------------
export function validateQuantity(qty) {
  if (qty === undefined || qty === null) {
    return { valid: false, message: 'La cantidad es obligatoria' };
  }
  const num = Number(qty);
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    return { valid: false, message: 'La cantidad debe ser un número entero positivo' };
  }
  if (num > 10000) return { valid: false, message: 'La cantidad no puede exceder 10,000' };
  return { valid: true, normalized: num };
}

// ------------------------------------------------------------
// 6. VALIDACIÓN COMPLETA (devuelve los valores normalizados)
// ------------------------------------------------------------
export function validateQRInputs(domain, gtin, lot, serial, quantity) {
  const d = validateDomain(domain);
  if (!d.valid) return d;
  const g = validateGTIN(gtin);
  if (!g.valid) return g;
  const l = validateLot(lot);
  if (!l.valid) return l;
  const s = validateSerial(serial);
  if (!s.valid) return s;
  const q = validateQuantity(quantity);
  if (!q.valid) return q;

  return {
    valid: true,
    normalized: {
      domain: d.normalized,
      gtin: g.normalized,
      lot: l.normalized,
      serial: s.normalized,
      quantity: q.normalized
    }
  };
}