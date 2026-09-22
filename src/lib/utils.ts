import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Clean and format Bangladeshi phone numbers to international standard (8801XXXXXXXXX)
 */
export function formatWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "";
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("880")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `88${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    return `880${digits}`;
  }
  return digits;
}

/**
 * Generate official Bengali WhatsApp message for student absent notification
 */
export function getWhatsAppAbsentNotice(
  studentName: string,
  batchName?: string,
  consecutiveAbsents: number = 1,
  dateStr?: string
): string {
  const batchText = batchName ? ` (${batchName})` : "";
  const countText =
    consecutiveAbsents > 1
      ? `বিগত ${consecutiveAbsents}টি ক্লাসে`
      : "আজকের ক্লাসে";

  return `আসসালামু আলাইকুম। ম্যাসিভ জাপান ল্যাঙ্গুয়েজ ইনস্টিটিউট (MJLI) থেকে জানানো যাচ্ছে যে, আপনার সন্তান/শিক্ষার্থী ${studentName}${batchText} ${countText} ক্লাসে অনুপস্থিত ছিলেন।

জাপানি ভাষা ও ভিসা প্রক্রিয়ার ধারাবাহিকতার জন্য ক্লাসে নিয়মিত উপস্থিত থাকা অত্যন্ত জরুরি। অনুগ্রহ করে নিয়মিত ক্লাসে অংশগ্রহণের বিষয়টি নিশ্চিত করুন।

ধন্যবাদান্তে,
ম্যাসিভ জাপান ল্যাঙ্গুয়েজ ইনস্টিটিউট (MJLI)`;
}

/**
 * Generate official Bengali WhatsApp message for general student follow-up
 */
export function getWhatsAppGeneralMsg(
  studentName: string,
  batchName?: string
): string {
  const batchText = batchName ? ` (${batchName})` : "";
  return `আসসালামু আলাইকুম। ম্যাসিভ জাপান ল্যাঙ্গুয়েজ ইনস্টিটিউট (MJLI) থেকে শিক্ষার্থী ${studentName}${batchText}-এর ক্লাসের অগ্রগতির বিষয়ে যোগাযোগ করা হচ্ছে।

প্রয়োজনে আমাদের সাথে কথা বলতে পারেন। ধন্যবাদ!
— MJLI Academic Team`;
}

/**
 * Open WhatsApp directly in a new browser tab with pre-filled message
 */
export function openWhatsApp(phone?: string | null, message?: string) {
  const formatted = formatWhatsAppNumber(phone);
  if (!formatted) {
    alert("সঠিক ফোন নম্বর পাওয়া যায়নি!");
    return;
  }
  const encodedMsg = message ? encodeURIComponent(message) : "";
  const url = `https://wa.me/${formatted}${encodedMsg ? `?text=${encodedMsg}` : ""}`;
  window.open(url, "_blank");
}

