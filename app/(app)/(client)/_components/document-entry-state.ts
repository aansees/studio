"use client";

let currentDocumentId: number | null = null;
let documentEntryPathname: string | null = null;

const HOME_ENTRY_OVERLAY_PLAYED_KEY = "home-entry-overlay-played-document-id";

function getCurrentDocumentId() {
  return window.performance.timeOrigin;
}

export function registerDocumentEntryPath(pathname: string) {
  if (typeof window === "undefined") {
    return;
  }

  const documentId = getCurrentDocumentId();
  if (currentDocumentId === documentId) {
    return;
  }

  currentDocumentId = documentId;
  documentEntryPathname = pathname;
}

export function shouldPlayHomeEntryOverlay(pathname: string) {
  if (typeof window === "undefined") {
    return true;
  }

  const documentId = getCurrentDocumentId();

  if (currentDocumentId !== documentId) {
    currentDocumentId = documentId;
    documentEntryPathname = pathname;
  }

  if (documentEntryPathname !== pathname) {
    return false;
  }

  return (
    window.sessionStorage.getItem(HOME_ENTRY_OVERLAY_PLAYED_KEY) !==
    String(documentId)
  );
}

export function markHomeEntryOverlayPlayed() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    HOME_ENTRY_OVERLAY_PLAYED_KEY,
    String(getCurrentDocumentId()),
  );
}
