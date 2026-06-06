// Global TypeScript type contracts for the Mental Health application

export interface WearableStats {
  heartRate: number;      // BPM
  hrv: number;            // ms
  bloodOxygen: number;    // %
  deviceType: "Fitbit Charge 6" | "Apple Watch Ultra" | "Garmin Venu 3" | "None (Manual)";
  isConnected: boolean;
  isSimulating: boolean;
}

export interface MoodLog {
  id: string;
  userId: string;
  moodScore: number;       // 1 - 10
  stressLevel: number;     // 1 - 10
  heartRate: number;
  hrv: number;
  bloodOxygen: number;
  primaryStressors: string[];
  encryptedNotes: string;  // AES-GCM ciphertext
  createdAt: string;       // Date string
  isLocalOnly?: boolean;  // Flags offline logs waiting for sync
}

export interface JournalEntryType {
  id: string;
  userId: string;
  encryptedTitle: string;
  encryptedBody: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
  // Decrypted virtual fields for client display only
  decryptedTitle?: string;
  decryptedBody?: string;
  isLocalOnly?: boolean;  // Flags offline drafts waiting for sync
}

export interface ForumPostType {
  id: string;
  userId: string;
  authorAlias: string;
  avatarSeed: string;
  content: string;
  category: "Encouragement" | "Breathing" | "Stress-Management" | "General";
  likesCount: number;
  likedBy: string[];      // Array of UIDs who liked the post
  createdAt: string;
}

export interface AIMeditationResponse {
  title: string;
  quote: string;
  techniques: string[];
  sensoryFocus: string;
  durationMinutes: number;
  targetBPMReduction: number;
  isFallback: boolean;
}
