import argon2 from "argon2"

import {
  fetchCustomerOtpByEmail,
  incrementCustomerOtpAttempts,
  markCustomerOtpConsumed,
  upsertCustomerOtpRecord,
} from "../lib/pg"

const OTP_LENGTH = 6
const OTP_TTL_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5

const normalizeEmail = (value?: string | null) =>
  (value || "").trim().toLowerCase()

const buildOtpCode = () =>
  String(Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)))

const toIsoString = (value: Date) => value.toISOString()

export const generateCustomerOtp = async (email: string) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error("Valid email is required to generate an OTP.")
  }

  const otp = buildOtpCode()
  const codeHash = await argon2.hash(otp)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await upsertCustomerOtpRecord(
    normalizedEmail,
    codeHash,
    toIsoString(expiresAt)
  )

  return otp
}

export const verifyCustomerOtp = async (
  email: string,
  otp: string
): Promise<boolean> => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !otp || otp.trim().length === 0) {
    return false
  }

  const record = await fetchCustomerOtpByEmail(normalizedEmail)
  if (!record) {
    return false
  }

  if (record.consumed_at) {
    return false
  }

  const expiresAt = new Date(record.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() < Date.now()) {
    return false
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    return false
  }

  let isValid = false
  try {
    isValid = await argon2.verify(record.code_hash, otp)
  } catch {
    isValid = false
  }

  if (isValid) {
    await markCustomerOtpConsumed(record.id)
    return true
  }

  await incrementCustomerOtpAttempts(record.id)
  return false
}
