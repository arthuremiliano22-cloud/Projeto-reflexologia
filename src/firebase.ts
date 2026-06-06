import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from the user
const firebaseConfig = {
  apiKey: "AIzaSyCWeiveLEof4Z51sqvjBw1FGS78u2Jj0H0",
  authDomain: "clinica-imt.firebaseapp.com",
  projectId: "clinica-imt",
  storageBucket: "clinica-imt.firebasestorage.app",
  messagingSenderId: "345950794900",
  appId: "1:345950794900:web:d6088d760c1bbadd877081",
  measurementId: "G-W100SJ9XBY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Graceful analytics initializer since it requires a browser context
export const initAnalytics = async () => {
  if (typeof window !== "undefined") {
    try {
      const { getAnalytics } = await import("firebase/analytics");
      return getAnalytics(app);
    } catch (err) {
      console.warn("Analytics initialization skipped.", err);
    }
  }
  return null;
};

// Operation types for detailed error diagnostic mapping
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Detailed Details: ", JSON.stringify(errInfo));
  
  // Only throw in write or action contexts to let try-catch handlers run.
  // For GET/LIST real-time listeners, throwing creates uncaught asynchronous crashes.
  if (operationType !== OperationType.GET && operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Connection test as requested by the Firebase Skill Guidelines
export async function testConnection() {
  try {
    const { doc, getDocFromServer } = await import("firebase/firestore");
    // Attempt a silent off-server check to see if offline or check credentials/security mapping
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or internet connectivity.");
    }
  }
}

// Trigger connection test lazily in client runtime
if (typeof window !== "undefined") {
  testConnection();
}
